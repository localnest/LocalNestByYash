import { NextResponse } from 'next/server';
import { buildRazorpayOrderPayload } from '@/lib/payments/razorpay';
import { getEnv } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amountInRupees, orderNumber, customerId, notes } = body;

    if (!amountInRupees || !orderNumber || !customerId) {
      return NextResponse.json(
        { error: 'Missing required parameters: amountInRupees, orderNumber, customerId' },
        { status: 400 },
      );
    }

    const payload = buildRazorpayOrderPayload({
      amountInRupees: Number(amountInRupees),
      orderNumber: String(orderNumber),
      customerId: String(customerId),
      notes,
    });

    const env = getEnv();
    const isMock = !env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET;

    if (isMock) {
      // Test simulator response
      const mockOrderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      return NextResponse.json({
        id: mockOrderId,
        amount: payload.amount,
        currency: payload.currency,
        receipt: payload.receipt,
        status: 'created',
        notes: payload.notes,
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    // Call Razorpay API
    const authHeader = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString(
      'base64',
    );
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: err.error?.description || 'Failed to create Razorpay order' },
        { status: response.status },
      );
    }

    const orderData = await response.json();
    return NextResponse.json(orderData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
