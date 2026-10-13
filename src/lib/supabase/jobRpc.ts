import { createBrowserClient } from './client.ts';
import { isSupabaseConfigured } from '../supabaseClient.ts';

export interface ClaimJobRequestInput {
  jobId: string;
  providerId: string;
  claimTimeoutSeconds?: number;
}

export interface ClaimJobResult {
  success: boolean;
  code?: string;
  message?: string;
  jobId?: string;
  providerId?: string;
  status?: string;
  claimedAt?: string;
}

export interface ExpireJobsResult {
  expiredCount: number;
  refundedCount: number;
}

interface GenericRpcCaller {
  rpc: (
    fn: string,
    params?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
}

// Local mock state for tests / development when Supabase credentials are unset
interface MockJobState {
  id: string;
  status: 'OPEN' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  claimedByProviderId?: string;
  claimedAt?: string;
  expiresAt: string;
  orderId?: string;
  residentId?: string;
  totalResidentPrice?: number;
  jobNumber?: string;
}

const mockJobsStore = new Map<string, MockJobState>();

export function seedMockJob(job: MockJobState): void {
  mockJobsStore.set(job.id, { ...job });
}

export function clearMockJobs(): void {
  mockJobsStore.clear();
}

/**
 * Claims a broadcast job request using Supabase RPC or local atomic simulator.
 */
export async function claimJobRequest(input: ClaimJobRequestInput): Promise<ClaimJobResult> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createBrowserClient();
      const rpcCaller = supabase as unknown as GenericRpcCaller;
      const { data, error } = await rpcCaller.rpc('claim_job_request', {
        p_job_id: input.jobId,
        p_provider_id: input.providerId,
        p_claim_timeout_seconds: input.claimTimeoutSeconds ?? 120,
      });

      if (error) {
        return {
          success: false,
          code: 'RPC_ERROR',
          message: error.message,
        };
      }

      return data as ClaimJobResult;
    } catch (err: unknown) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  // Local Atomic First-Writer-Wins Simulator
  const job = mockJobsStore.get(input.jobId);
  if (!job) {
    return {
      success: false,
      code: 'JOB_NOT_FOUND',
      message: 'Job request does not exist',
    };
  }

  if (job.status !== 'OPEN') {
    return {
      success: false,
      code: 'ALREADY_CLAIMED',
      message: 'Job has already been claimed by another provider',
    };
  }

  const now = new Date();
  const expiresAt = new Date(job.expiresAt);
  if (expiresAt <= now) {
    job.status = 'EXPIRED';
    return {
      success: false,
      code: 'JOB_EXPIRED',
      message: 'Job request broadcasting window has expired',
    };
  }

  // Atomically claim
  job.status = 'CLAIMED';
  job.claimedByProviderId = input.providerId;
  job.claimedAt = now.toISOString();

  return {
    success: true,
    jobId: input.jobId,
    providerId: input.providerId,
    status: 'CLAIMED',
    claimedAt: job.claimedAt,
  };
}

/**
 * Sweeps unclaimed expired jobs and triggers resident wallet credit refunds.
 */
export async function expireUnclaimedJobs(): Promise<ExpireJobsResult> {
  if (isSupabaseConfigured()) {
    const supabase = createBrowserClient();
    const rpcCaller = supabase as unknown as GenericRpcCaller;
    const { data } = await rpcCaller.rpc('expire_unclaimed_jobs');
    const records = data as Array<{ expired_count?: number; refunded_count?: number }> | null;
    if (records && Array.isArray(records) && records.length > 0) {
      return {
        expiredCount: records[0].expired_count ?? 0,
        refundedCount: records[0].refunded_count ?? 0,
      };
    }
    return { expiredCount: 0, refundedCount: 0 };
  }

  // Local Mock Sweeper
  let expiredCount = 0;
  let refundedCount = 0;
  const now = new Date();

  for (const job of mockJobsStore.values()) {
    if (job.status === 'OPEN' && new Date(job.expiresAt) <= now) {
      job.status = 'EXPIRED';
      expiredCount++;
      if (job.orderId && (job.totalResidentPrice ?? 0) > 0) {
        refundedCount++;
      }
    }
  }

  return { expiredCount, refundedCount };
}
