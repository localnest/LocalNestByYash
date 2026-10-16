export interface SafetyAlertPayload {
  complaintId: string;
  orderId: string;
  societyName: string;
  residentFlat: string;
  category: string;
  severity: 'CRITICAL_SAFETY' | 'HIGH' | 'MEDIUM';
  description: string;
  timestamp: string;
}

/**
 * Formats a Telegram Bot markdown alert for on-call ops escalation (Rule N07.2).
 */
export function formatTelegramSafetyAlert(alert: SafetyAlertPayload): string {
  const icon =
    alert.severity === 'CRITICAL_SAFETY'
      ? '🚨 [CRITICAL SAFETY ALERT]'
      : '⚠️ [HIGH PRIORITY ALERT]';
  return [
    `*${icon}*`,
    `*Society:* ${alert.societyName} | *Flat:* ${alert.residentFlat}`,
    `*Order ID:* \`${alert.orderId}\``,
    `*Category:* ${alert.category}`,
    `*Time:* ${alert.timestamp}`,
    ``,
    `*Description:*`,
    `_${alert.description}_`,
    ``,
    `👉 Immediate action required within 15-minute SLA. Open LocalNest Admin Dispute Desk.`,
  ].join('\n');
}

/**
 * Simulates dispatching the safety alert to the configured Telegram on-call webhook.
 */
export async function sendTelegramSafetyNotification(
  alert: SafetyAlertPayload,
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  chatId = process.env.TELEGRAM_OPS_CHAT_ID,
): Promise<{ success: boolean; simulated: boolean; messageId?: string }> {
  const formatted = formatTelegramSafetyAlert(alert);

  if (!botToken || !chatId) {
    // In dev / unconfigured test mode, gracefully log simulation
    return {
      success: true,
      simulated: true,
      messageId: `sim-msg-${Date.now()}`,
    };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatted,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json();
    return {
      success: Boolean(data.ok),
      simulated: false,
      messageId: data.result?.message_id?.toString(),
    };
  } catch {
    return { success: false, simulated: false };
  }
}
