import { createBrowserClient } from './client.ts';
import { isSupabaseConfigured } from '../supabaseClient.ts';

export type UnsubscribeFn = () => void;

/**
 * Subscribes to live order updates via Supabase Realtime.
 */
export function subscribeToOrder(
  orderId: string,
  onUpdate: (payload: Record<string, unknown>) => void,
): UnsubscribeFn {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const supabase = createBrowserClient();
  const channel = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        onUpdate(payload.new as Record<string, unknown>);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}

/**
 * Subscribes to society dispatch broadcasts for providers.
 */
export function subscribeToSocietyDispatch(
  societyId: string,
  onNewJob: (job: Record<string, unknown>) => void,
): UnsubscribeFn {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const supabase = createBrowserClient();
  const channel = supabase
    .channel(`dispatch-${societyId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'job_requests',
        filter: `society_id=eq.${societyId}`,
      },
      (payload) => {
        onNewJob(payload.new as Record<string, unknown>);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}

/**
 * Subscribes to real-time chat messages for an order.
 */
export function subscribeToOrderChat(
  orderId: string,
  onNewMessage: (message: Record<string, unknown>) => void,
): UnsubscribeFn {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const supabase = createBrowserClient();
  const channel = supabase
    .channel(`chat-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `order_id=eq.${orderId}`,
      },
      (payload) => {
        onNewMessage(payload.new as Record<string, unknown>);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}
