import type { IChatApi, ChatMessage, SendMessageResult } from './port.ts';
import { getSupabaseConfig } from '../../../lib/supabaseClient.ts';
import { filterContactDetails } from '../../../lib/retentionUtils.ts';

export class SupabaseChatAdapter implements IChatApi {
  private config = getSupabaseConfig();

  async getMessages(orderId: string): Promise<ChatMessage[]> {
    if (!this.config.isLive) return [];
    try {
      const res = await fetch(
        `${this.config.url}/rest/v1/chat_messages?order_id=eq.${orderId}&order=created_at.asc`,
        {
          headers: {
            apikey: this.config.anonKey,
            Authorization: `Bearer ${this.config.anonKey}`,
          },
        },
      );
      if (!res.ok) return [];
      const rows = await res.json();
      return rows.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        orderId: String(r.order_id),
        senderId: String(r.sender_id),
        senderRole: r.sender_role as ChatMessage['senderRole'],
        content: String(r.content),
        filtered: Boolean(r.filtered),
        createdAt: String(r.created_at),
      }));
    } catch {
      return [];
    }
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

    if (!this.config.isLive) {
      return {
        success: true,
        message: {
          id: `msg-${Date.now()}`,
          orderId,
          senderId,
          senderRole,
          content: text,
          filtered: false,
          createdAt: new Date().toISOString(),
        },
      };
    }

    try {
      const res = await fetch(`${this.config.url}/rest/v1/chat_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.config.anonKey,
          Authorization: `Bearer ${this.config.anonKey}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          order_id: orderId,
          sender_id: senderId,
          sender_role: senderRole,
          content: text,
          filtered: false,
        }),
      });

      if (!res.ok) return { success: false, blockedReason: 'Database insert failed' };
      const rows = await res.json();
      return { success: true, message: rows[0] };
    } catch {
      return { success: false, blockedReason: 'Network error sending message' };
    }
  }
}
