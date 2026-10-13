import type { IChatApi } from './port.ts';
import { MockChatAdapter } from './mockAdapter.ts';
import { SupabaseChatAdapter } from './supabaseAdapter.ts';
import { isSupabaseConfigured } from '../../../lib/supabaseClient.ts';

export type * from './port.ts';
export * from './mockAdapter.ts';
export * from './supabaseAdapter.ts';

let chatApiInstance: IChatApi | null = null;

export function getChatApi(): IChatApi {
  if (!chatApiInstance) {
    if (isSupabaseConfigured()) {
      chatApiInstance = new SupabaseChatAdapter();
    } else {
      chatApiInstance = new MockChatAdapter();
    }
  }
  return chatApiInstance;
}

export function setChatApi(adapter: IChatApi): void {
  chatApiInstance = adapter;
}
