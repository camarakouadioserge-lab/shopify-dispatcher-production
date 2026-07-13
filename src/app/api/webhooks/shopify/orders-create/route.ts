
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyShopifyWebhookHmac } from "@/lib/shopify";
import { createWebhookReceipt, markWebhookQueued } from "@/lib/orders";
import { shopifyOrdersQueue } from "@/lib/queues";
import type { ShopifyWebhookOrder } from "@/lib/types";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const webhookId = request.headers.get("x-shopify-webhook-id");
  const shopDomain = request.headers.get("x-shopify-shop-domain");
  const topic = request.headers.get("x-shopify-topic") ?? "orders/create";

  if (!verifyShopifyWebhookHmac(rawBody, hmacHeader, env.SHOPIFY_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid Shopify HMAC" }, { status: 401 });
  }

  if (!webhookId || !shopDomain) {
    return NextResponse.json({ error: "Missing Shopify headers" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as ShopifyWebhookOrder;
  const receipt = await createWebhookReceipt({
    source: "shopify",
    topic,
    externalId: webhookId,
    shopDomain,
    payload,
    rawBody
  });

  await markWebhookQueued(receipt.id);

  await shopifyOrdersQueue.add(
    "process-shopify-order",
    { webhookReceiptId: receipt.id },
    { jobId: receipt.id }
  );

  return NextResponse.json({ ok: true, queued: true, webhookReceiptId: receipt.id }, { status: 202 });
}
