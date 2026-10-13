import type { IDispatchApi, ClaimResult } from './port.ts';
import type { JobRequest } from '../../../lib/types.ts';
import { getSupabaseConfig } from '../../../lib/supabaseClient.ts';

export class SupabaseDispatchAdapter implements IDispatchApi {
  private config = getSupabaseConfig();

  async getOpenJobs(societyName?: string): Promise<JobRequest[]> {
    if (!this.config.isLive) {
      return [];
    }
    try {
      const url = new URL(`${this.config.url}/rest/v1/job_requests`);
      url.searchParams.set('status', 'eq.BROADCASTING');
      if (societyName) url.searchParams.set('society_name', `eq.${societyName}`);

      const res = await fetch(url.toString(), {
        headers: {
          apikey: this.config.anonKey,
          Authorization: `Bearer ${this.config.anonKey}`,
        },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  async claimJob(jobId: string, providerId: string): Promise<ClaimResult> {
    if (!this.config.isLive) {
      return {
        success: false,
        jobId,
        providerId,
        claimedAt: new Date().toISOString(),
        errorCode: 'SUPABASE_NOT_CONFIGURED',
        errorMessage: 'Supabase credentials not configured in environment',
      };
    }
    try {
      const res = await fetch(`${this.config.url}/rest/v1/rpc/claim_job_request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.config.anonKey,
          Authorization: `Bearer ${this.config.anonKey}`,
        },
        body: JSON.stringify({
          p_job_id: jobId,
          p_provider_id: providerId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          jobId,
          providerId,
          claimedAt: new Date().toISOString(),
          errorCode: errJson.code || 'CLAIM_FAILED',
          errorMessage: errJson.message || 'Failed to claim job',
        };
      }

      return {
        success: true,
        jobId,
        providerId,
        claimedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        jobId,
        providerId,
        claimedAt: new Date().toISOString(),
        errorCode: 'NETWORK_ERROR',
        errorMessage: err instanceof Error ? err.message : 'Network error during claim',
      };
    }
  }

  async verifyOtp(
    jobId: string,
    otp: string,
    type: 'START' | 'COMPLETE',
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.config.isLive) return { success: false, error: 'Supabase not configured' };
    try {
      const res = await fetch(`${this.config.url}/rest/v1/rpc/verify_job_otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.config.anonKey,
          Authorization: `Bearer ${this.config.anonKey}`,
        },
        body: JSON.stringify({
          p_job_id: jobId,
          p_otp_type: type,
          p_otp_code: otp,
        }),
      });
      if (!res.ok) return { success: false, error: 'OTP verification failed' };
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to verify OTP' };
    }
  }

  async cancelJob(jobId: string, actorId: string, reason: string): Promise<{ success: boolean }> {
    if (!this.config.isLive) return { success: false };
    try {
      const res = await fetch(`${this.config.url}/rest/v1/rpc/cancel_booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.config.anonKey,
          Authorization: `Bearer ${this.config.anonKey}`,
        },
        body: JSON.stringify({
          p_booking_id: jobId,
          p_actor_id: actorId,
          p_reason: reason,
        }),
      });
      return { success: res.ok };
    } catch {
      return { success: false };
    }
  }
}
