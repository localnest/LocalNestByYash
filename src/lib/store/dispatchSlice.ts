import { useState } from 'react';
import type { JobRequest } from '../types.ts';

export function useDispatchSlice(initialJobRequests: JobRequest[] = []) {
  const [jobRequests, setJobRequests] = useState<JobRequest[]>(initialJobRequests);

  const addJobRequest = (job: JobRequest) => {
    setJobRequests((prev) => [job, ...prev]);
  };

  const updateJobRequest = (id: string, updates: Partial<JobRequest>) => {
    setJobRequests((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j,
      ),
    );
  };

  return {
    jobRequests,
    setJobRequests,
    addJobRequest,
    updateJobRequest,
  };
}
