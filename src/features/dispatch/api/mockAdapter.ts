import type { IDispatchApi, ClaimResult } from './port.ts';
import type { JobRequest } from '../../../lib/types.ts';

export class MockDispatchAdapter implements IDispatchApi {
  private jobs: JobRequest[] = [];

  constructor(initialJobs: JobRequest[] = []) {
    this.jobs = [...initialJobs];
  }

  async getOpenJobs(societyName?: string): Promise<JobRequest[]> {
    if (!societyName) return this.jobs.filter((j) => j.status === 'OPEN');
    return this.jobs.filter((j) => j.status === 'OPEN' && j.societyName === societyName);
  }

  async claimJob(jobId: string, providerId: string): Promise<ClaimResult> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) {
      return {
        success: false,
        jobId,
        providerId,
        claimedAt: new Date().toISOString(),
        errorCode: 'NOT_FOUND',
        errorMessage: 'Job not found',
      };
    }
    if (job.status === 'CLAIMED') {
      return {
        success: false,
        jobId,
        providerId,
        claimedAt: new Date().toISOString(),
        errorCode: 'ALREADY_CLAIMED',
        errorMessage: 'Job already claimed',
      };
    }
    job.status = 'CLAIMED';
    job.claimedByProviderId = providerId;
    return {
      success: true,
      jobId,
      providerId,
      claimedAt: new Date().toISOString(),
    };
  }

  async verifyOtp(
    jobId: string,
    otp: string,
    _type: 'START' | 'COMPLETE',
  ): Promise<{ success: boolean; error?: string }> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found' };
    if (job.doorOtp && job.doorOtp !== otp) {
      return { success: false, error: 'Invalid OTP' };
    }
    return { success: true };
  }

  async cancelJob(jobId: string, _actorId: string, _reason: string): Promise<{ success: boolean }> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) job.status = 'CANCELLED';
    return { success: true };
  }
}
