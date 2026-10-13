export type ChatSenderRole = 'resident' | 'provider' | 'system' | 'admin';

export interface ChatThreadSummary {
  id: string;
  orderId: string;
  residentId: string;
  providerId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}
