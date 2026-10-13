import { NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
} from '@/lib/payments/razorpay';
import { getEnv } from '@/lib/env';

interface PaymentEntity {
  id?: string;
  order_id?: string;
}

interface WebhookPayload {
  id?: string;
  event?: string;
  payload?: {
    payment?: {
      entity?: PaymentEntity;
    };
  };
}

function processPaymentEvent(event: WebhookPayload): NextResponse {
  const payment = event.payload?.payment?.entity;

  if (event.event === 'payment.captured') {
    return NextResponse.json({
      received: true,
      status: 'captured',
      orderId: payment?.order_id,
      paymentId: payment?.id,
    });
  }

  if (event.event === 'payment.failed') {
    return NextResponse.json({
      received: true,
      status: 'failed',
      orderId: payment?.order_id,
      paymentId: payment?.id,
    });
  }

  return NextResponse.json({ received: true, event: event.event });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const env = getEnv();
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const event: WebhookPayload = JSON.parse(rawBody);
    const eventId = event.payload?.payment?.entity?.id || event.id || `evt_${Date.now()}`;

    // Idempotency check: prevent duplicate event processing
    if (isWebhookEventProcessed(eventId)) {
      return NextResponse.json({ message: 'Event already processed (idempotent)' });
    }

    markWebhookEventProcessed(eventId);
    return processPaymentEvent(event);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
