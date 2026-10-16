export interface PurgeResult {
  ordersPurgedCount: number;
  photosRedactedCount: number;
  chatsAnonymizedCount: number;
  purgedOrderIds: string[];
  executionTimestamp: string;
}

export interface SanitizedOrderRecord {
  id: string;
  status: string;
  completedAt: string;
  flatNumber: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  chatMessages?: Array<{ sender: string; text: string }>;
}

export const RETENTION_DAYS_THRESHOLD = 30;

/**
 * Checks if a completed order has exceeded the 30-day privacy retention threshold (Rule N08.5).
 */
export function isOrderExpiredForRetention(
  completedAtIso: string,
  nowIso = new Date().toISOString(),
  thresholdDays = RETENTION_DAYS_THRESHOLD,
): boolean {
  if (!completedAtIso) return false;
  const completedMs = new Date(completedAtIso).getTime();
  const nowMs = new Date(nowIso).getTime();
  const diffDays = (nowMs - completedMs) / (1000 * 60 * 60 * 24);
  return diffDays >= thresholdDays;
}

/**
 * Executes the DPDP Act compliance data retention sanitization on order records.
 * Purges:
 * - Exact resident flat number (replaces with masked tower level e.g. "Tower B - Redacted")
 * - Before & After completion photos
 * - Historical chat messages
 */
export function sanitizeOrdersForRetention(
  orders: SanitizedOrderRecord[],
  nowIso = new Date().toISOString(),
): { sanitizedOrders: SanitizedOrderRecord[]; result: PurgeResult } {
  let ordersPurged = 0;
  let photosRedacted = 0;
  let chatsAnonymized = 0;
  const purgedIds: string[] = [];

  const sanitizedOrders = orders.map((order) => {
    // Only purge orders that are completed or cancelled and older than threshold
    if (
      (order.status === 'COMPLETED' || order.status === 'CANCELLED') &&
      isOrderExpiredForRetention(order.completedAt, nowIso)
    ) {
      ordersPurged++;
      purgedIds.push(order.id);

      if (order.beforePhotoUrl || order.afterPhotoUrl) {
        photosRedacted += (order.beforePhotoUrl ? 1 : 0) + (order.afterPhotoUrl ? 1 : 0);
      }

      if (order.chatMessages && order.chatMessages.length > 0) {
        chatsAnonymized += order.chatMessages.length;
      }

      return {
        ...order,
        flatNumber: '[REDACTED_BY_RETENTION_POLICY]',
        beforePhotoUrl: undefined,
        afterPhotoUrl: undefined,
        chatMessages: [],
      };
    }

    return order;
  });

  return {
    sanitizedOrders,
    result: {
      ordersPurgedCount: ordersPurged,
      photosRedactedCount: photosRedacted,
      chatsAnonymizedCount: chatsAnonymized,
      purgedOrderIds: purgedIds,
      executionTimestamp: nowIso,
    },
  };
}
