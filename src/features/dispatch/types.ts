export type DispatchJobStatus =
  'BROADCASTING' | 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface DispatchNotification {
  id: string;
  providerId: string;
  jobRequestId: string;
  status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'TIMEOUT';
  sentAt: string;
  respondedAt?: string;
}

export interface DispatchCommitment {
  providerId: string;
  date: string;
  slot: string;
  durationMinutes: number;
}
