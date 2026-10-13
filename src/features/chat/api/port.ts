export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: 'resident' | 'provider' | 'system';
  content: string;
  filtered: boolean;
  createdAt: string;
}

export interface SendMessageResult {
  success: boolean;
  message?: ChatMessage;
  blocked?: boolean;
  blockedReason?: string;
}

export interface IChatApi {
  getMessages(orderId: string): Promise<ChatMessage[]>;
  sendMessage(
    orderId: string,
    senderId: string,
    senderRole: 'resident' | 'provider',
    text: string,
  ): Promise<SendMessageResult>;
}
