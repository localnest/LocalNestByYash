import crypto from 'node:crypto';

export interface CreateOrderParams {
  amountInRupees: number;
  orderNumber: string;
  customerId: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number; // in paise
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  notes?: Record<string, string>;
  createdAt: number;
}

export interface PaymentVerificationParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret: string;
}

export interface WebhookEventPayload {
  entity: string;
  account_id: string;
  event: 'payment.captured' | 'payment.failed' | 'refund.processed';
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        notes?: Record<string, string>;
      };
    };
  };
  created_at: number;
}

/**
 * Creates server-side Razorpay order payload.
 * Converts amount in Rupees to paise (1 INR = 100 paise).
 */
export function buildRazorpayOrderPayload(params: CreateOrderParams): {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
} {
  if (params.amountInRupees <= 0) {
    throw new Error('Order amount must be greater than zero');
  }

  const amountInPaise = Math.round(params.amountInRupees * 100);

  return {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `rcpt_${params.orderNumber}`,
    notes: {
      customerId: params.customerId,
      orderNumber: params.orderNumber,
      ...(params.notes || {}),
    },
  };
}

/**
 * Validates Razorpay checkout signature using HMAC SHA256.
 * Expected formula: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
 */
export function verifyRazorpaySignature(params: PaymentVerificationParams): boolean {
  if (
    !params.razorpayOrderId ||
    !params.razorpayPaymentId ||
    !params.razorpaySignature ||
    !params.secret
  ) {
    return false;
  }

  const payload = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', params.secret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return (
    generatedSignature.length === params.razorpaySignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf-8'),
      Buffer.from(params.razorpaySignature, 'utf-8'),
    )
  );
}

/**
 * Validates Razorpay webhook signature.
 */
export function verifyWebhookSignature(
  rawBody: string,
  receivedSignature: string,
  webhookSecret: string,
): boolean {
  if (!rawBody || !receivedSignature || !webhookSecret) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return (
    generatedSignature.length === receivedSignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf-8'),
      Buffer.from(receivedSignature, 'utf-8'),
    )
  );
}

/**
 * In-memory idempotency store for webhook events to prevent duplicate processing.
 */
const processedWebhookEventIds = new Set<string>();

export function isWebhookEventProcessed(eventId: string): boolean {
  return processedWebhookEventIds.has(eventId);
}

export function markWebhookEventProcessed(eventId: string): void {
  processedWebhookEventIds.add(eventId);
}

export function clearWebhookIdempotencyCache(): void {
  processedWebhookEventIds.clear();
}
