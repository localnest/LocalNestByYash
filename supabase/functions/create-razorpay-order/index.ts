// Supabase Edge Function: create-razorpay-order
// Follows Deno standard runtime for Supabase Functions
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error -- Deno-only import; not available in Node/Next.js type graph
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amountInRupees, orderNumber, customerId, notes } = await req.json();

    if (!amountInRupees || !orderNumber || !customerId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: amountInRupees, orderNumber, customerId',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    const amountInPaise = Math.round(Number(amountInRupees) * 100);
    const orderPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${orderNumber}`,
      notes: {
        customerId: String(customerId),
        orderNumber: String(orderNumber),
        ...(notes || {}),
      },
    };

    if (!keyId || !keySecret) {
      // Mock simulator response if credentials not set in environment
      const mockOrder = {
        id: `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        receipt: orderPayload.receipt,
        status: 'created',
        notes: orderPayload.notes,
        created_at: Math.floor(Date.now() / 1000),
      };
      return new Response(JSON.stringify(mockOrder), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const basicAuth = btoa(`${keyId}:${keySecret}`);
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Edge Function error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
