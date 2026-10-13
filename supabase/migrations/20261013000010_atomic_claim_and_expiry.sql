-- ==============================================================================
-- Migration: 20261013000010_atomic_claim_and_expiry.sql
-- Description: S09.1 Atomic claim RPC (first-writer-wins) and S09.3 Job expiry
--              with auto-refund to resident wallet credits.
-- ==============================================================================

-- 1. Atomic Job Claim RPC (First-writer-wins)
CREATE OR REPLACE FUNCTION claim_job_request(
  p_job_id UUID,
  p_provider_id UUID,
  p_claim_timeout_seconds INT DEFAULT 120
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job RECORD;
  v_provider RECORD;
BEGIN
  -- Verify provider status
  SELECT id, status, is_vacation_mode INTO v_provider
  FROM providers
  WHERE id = p_provider_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PROVIDER_NOT_FOUND',
      'message', 'Provider record does not exist'
    );
  END IF;

  IF v_provider.status != 'VERIFIED' OR v_provider.is_vacation_mode = true THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PROVIDER_UNAVAILABLE',
      'message', 'Provider is not active or is currently on vacation'
    );
  END IF;

  -- Lock the job request row atomically to prevent race conditions
  SELECT * INTO v_job
  FROM job_requests
  WHERE id = p_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'JOB_NOT_FOUND',
      'message', 'Job request does not exist'
    );
  END IF;

  -- Verify current status
  IF v_job.status != 'OPEN' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_CLAIMED',
      'message', 'Job has already been claimed by another provider'
    );
  END IF;

  -- Verify expiration
  IF v_job.expires_at <= NOW() THEN
    UPDATE job_requests
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE id = p_job_id;

    RETURN jsonb_build_object(
      'success', false,
      'code', 'JOB_EXPIRED',
      'message', 'Job request broadcasting window has expired'
    );
  END IF;

  -- Atomic claim update
  UPDATE job_requests
  SET
    status = 'CLAIMED',
    claimed_by_provider_id = p_provider_id,
    claimed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_job_id;

  -- Mark notification as claimed for this provider and expired for others
  UPDATE provider_dispatch_notifications
  SET status = 'CLAIMED'
  WHERE job_request_id = p_job_id AND provider_id = p_provider_id;

  UPDATE provider_dispatch_notifications
  SET status = 'EXPIRED'
  WHERE job_request_id = p_job_id AND provider_id != p_provider_id;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', p_job_id,
    'provider_id', p_provider_id,
    'status', 'CLAIMED',
    'claimed_at', NOW()
  );
END;
$$;

-- 2. Job Expiry & Resident Refund to Wallet Credits
CREATE OR REPLACE FUNCTION expire_unclaimed_jobs()
RETURNS TABLE (
  expired_count INT,
  refunded_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired INT := 0;
  v_refunded INT := 0;
  v_rec RECORD;
BEGIN
  -- Iterate through open jobs that have passed their expiration timestamp
  FOR v_rec IN
    SELECT j.id, j.order_id, j.resident_id, j.total_resident_price, j.job_number
    FROM job_requests j
    WHERE j.status = 'OPEN' AND j.expires_at <= NOW()
    FOR UPDATE OF j
  LOOP
    -- Mark job as EXPIRED
    UPDATE job_requests
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE id = v_rec.id;
    v_expired := v_expired + 1;

    -- If there was an associated order with escrow payment, refund to resident wallet
    IF v_rec.order_id IS NOT NULL AND v_rec.total_resident_price > 0 THEN
      -- Cancel order
      UPDATE orders
      SET status = 'CANCELLED', cancellation_reason = 'Broadcast expired with no provider claim', updated_at = NOW()
      WHERE id = v_rec.order_id;

      -- Credit wallet balance
      INSERT INTO wallet_transactions (
        user_id,
        amount,
        transaction_type,
        category,
        description,
        order_id,
        created_at
      ) VALUES (
        v_rec.resident_id,
        v_rec.total_resident_price,
        'CREDIT',
        'REFUND',
        'Auto-refund for expired job request #' || v_rec.job_number,
        v_rec.order_id,
        NOW()
      );

      v_refunded := v_refunded + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_expired, v_refunded;
END;
$$;

-- Grant execution permissions to authenticated users for RPC claim
GRANT EXECUTE ON FUNCTION claim_job_request(UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_unclaimed_jobs() TO service_role;
