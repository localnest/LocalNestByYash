import type { JobRequest, Provider } from '../../../lib/types.ts';

export interface ClaimResult {
  success: boolean;
  jobId: string;
  providerId: string;
  claimedAt: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface IDispatchApi {
  getOpenJobs(societyName?: string): Promise<JobRequest[]>;
  claimJob(jobId: string, providerId: string): Promise<ClaimResult>;
  verifyOtp(
    jobId: string,
    otp: string,
    type: 'START' | 'COMPLETE',
  ): Promise<{ success: boolean; error?: string }>;
  cancelJob(jobId: string, actorId: string, reason: string): Promise<{ success: boolean }>;
}
