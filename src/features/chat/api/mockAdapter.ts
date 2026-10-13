import type { IChatApi, ChatMessage, SendMessageResult } from './port.ts';
import { filterContactDetails } from '../../../lib/retentionUtils.ts';

export class MockChatAdapter implements IChatApi {
  private messages = new Map<string, ChatMessage[]>();

  async getMessages(orderId: string): Promise<ChatMessage[]> {
    return (
      this.messages.get(orderId) || [
        {
          id: 'msg-1',
          orderId,
          senderId: 'sys-1',
          senderRole: 'system',
          content: 'Chat opened. Off-platform bypass and personal contact sharing are prohibited.',
          filtered: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]
    );
  }

  async sendMessage(
    orderId: string,
    senderId: string,
    senderRole: 'resident' | 'provider',
    text: string,
  ): Promise<SendMessageResult> {
    const filter = filterContactDetails(text);
    if (filter.blocked) {
      return {
        success: false,
        blocked: true,
        blockedReason: filter.reason,
      };
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      orderId,
      senderId,
      senderRole,
      content: text,
      filtered: false,
      createdAt: new Date().toISOString(),
    };

    const thread = this.messages.get(orderId) || [];
    this.messages.set(orderId, [...thread, message]);

    return {
      success: true,
      message,
    };
  }
}
