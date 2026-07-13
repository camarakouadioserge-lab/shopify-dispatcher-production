
import { DeliveryStatus, Prisma, WebhookStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { assignCloserForOrder } from "@/lib/assignment";
import { extractCustomerName, toPaymentStatus } from "@/lib/shopify";
import type { ShopifyWebhookOrder } from "@/lib/types";

export async function upsertStore(shopifyDomain: string, currency: string) {
  return prisma.store.upsert({
    where: { shopifyDomain },
    update: { currency, active: true },
    create: {
      name: shopifyDomain.replace(".myshopify.com", ""),
      shopifyDomain,
      currency
    }
  });
}

export async function upsertProductFromLineItem(storeId: string, item: ShopifyWebhookOrder["line_items"][number]) {
  if (!item.product_id) {
    return null;
  }

  return prisma.product.upsert({
    where: {
      storeId_shopifyProductId_shopifyVariantId: {
        storeId,
        shopifyProductId: String(item.product_id),
        shopifyVariantId: item.variant_id ? String(item.variant_id) : null
      }
    },
    update: {
      title: item.title,
      sku: item.sku ?? undefined,
      active: true
    },
    create: {
      storeId,
      shopifyProductId: String(item.product_id),
      shopifyVariantId: item.variant_id ? String(item.variant_id) : null,
      title: item.title,
      sku: item.sku ?? undefined,
      active: true
    }
  });
}

export async function createWebhookReceipt(input: {
  source: string;
  topic: string;
  externalId: string;
  shopDomain?: string | null;
  payload: unknown;
  rawBody?: string;
}) {
  return prisma.webhookReceipt.upsert({
    where: {
      source_externalId: {
        source: input.source,
        externalId: input.externalId
      }
    },
    update: {},
    create: {
      source: input.source,
      topic: input.topic,
      externalId: input.externalId,
      shopDomain: input.shopDomain ?? null,
      payloadJson: input.payload as Prisma.InputJsonValue,
      rawBody: input.rawBody,
      status: WebhookStatus.RECEIVED
    }
  });
}

export async function markWebhookQueued(webhookReceiptId: string) {
  return prisma.webhookReceipt.update({
    where: { id: webhookReceiptId },
    data: {
      status: WebhookStatus.QUEUED,
      queuedAt: new Date()
    }
  });
}

export async function processWebhookReceipt(webhookReceiptId: string) {
  const receipt = await prisma.webhookReceipt.findUnique({
    where: { id: webhookReceiptId }
  });

  if (!receipt) {
    throw new Error("Webhook receipt not found");
  }

  if (receipt.status === WebhookStatus.PROCESSED || receipt.status === WebhookStatus.DUPLICATE) {
    return receipt;
  }

  const payload = receipt.payloadJson as unknown as ShopifyWebhookOrder;

  try {
    const result = await createOrUpdateOrderFromShopifyWebhook({
      shopifyDomain: receipt.shopDomain ?? "unknown.myshopify.com",
      webhookId: receipt.externalId,
      payload
    });

    await prisma.webhookReceipt.update({
      where: { id: receipt.id },
      data: {
        status: result.duplicated ? WebhookStatus.DUPLICATE : WebhookStatus.PROCESSED,
        processedAt: new Date(),
        orderId: result.orderId ?? null,
        errorMessage: null
      }
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";

    await prisma.webhookReceipt.update({
      where: { id: receipt.id },
      data: {
        status: WebhookStatus.FAILED,
        errorMessage: message
      }
    });

    throw error;
  }
}

export async function createOrUpdateOrderFromShopifyWebhook(params: {
  shopifyDomain: string;
  webhookId: string;
  payload: ShopifyWebhookOrder;
}) {
  const { payload, shopifyDomain, webhookId } = params;

  const store = await upsertStore(shopifyDomain, payload.currency);

  const existingEvent = await prisma.orderEvent.findUnique({
    where: {
      source_sourceEventId: {
        source: "shopify",
        sourceEventId: webhookId
      }
    }
  });

  if (existingEvent) {
    return { duplicated: true, orderId: existingEvent.orderId };
  }

  const productMap = new Map<string, string | null>();
  for (const item of payload.line_items) {
    const product = await upsertProductFromLineItem(store.id, item);
    const key = `${String(item.product_id ?? "none")}:${String(item.variant_id ?? "none")}`;
    productMap.set(key, product?.id ?? null);
  }

  const data: Prisma.OrderUncheckedCreateInput = {
    storeId: store.id,
    shopifyOrderId: String(payload.id),
    orderNumber: payload.name || String(payload.order_number ?? payload.id),
    customerName: extractCustomerName(payload),
    phone: payload.phone ?? payload.shipping_address?.phone ?? payload.customer?.phone ?? null,
    email: payload.email ?? payload.customer?.email ?? null,
    country: payload.shipping_address?.country_code ?? null,
    totalAmount: payload.total_price,
    currency: payload.currency,
    paymentStatus: toPaymentStatus(payload.financial_status),
    fulfillmentStatus: payload.fulfillment_status ?? null,
    deliveryStatus: DeliveryStatus.PENDING
  };

  const order = await prisma.order.upsert({
    where: {
      storeId_shopifyOrderId: {
        storeId: store.id,
        shopifyOrderId: String(payload.id)
      }
    },
    update: {
      orderNumber: data.orderNumber,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      country: data.country,
      totalAmount: data.totalAmount,
      currency: data.currency,
      paymentStatus: data.paymentStatus,
      fulfillmentStatus: data.fulfillmentStatus
    },
    create: data
  });

  await prisma.orderItem.deleteMany({
    where: { orderId: order.id }
  });

  if (payload.line_items.length > 0) {
    await prisma.orderItem.createMany({
      data: payload.line_items.map((item) => {
        const key = `${String(item.product_id ?? "none")}:${String(item.variant_id ?? "none")}`;
        return {
          orderId: order.id,
          productId: productMap.get(key) ?? null,
          title: item.title,
          sku: item.sku ?? null,
          quantity: item.quantity,
          unitPrice: item.price
        };
      })
    });
  }

  const assignedCloserId = await assignCloserForOrder(order.id);

  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      eventType: "shopify.orders_create",
      source: "shopify",
      sourceEventId: webhookId,
      payloadJson: payload as Prisma.InputJsonValue
    }
  });

  await createAuditLog({
    action: assignedCloserId ? "order.imported_and_assigned" : "order.imported_unassigned",
    entityType: "Order",
    entityId: order.id,
    orderId: order.id,
    metadata: {
      shopifyOrderId: String(payload.id),
      webhookId,
      assignedCloserId
    }
  });

  return {
    duplicated: false,
    orderId: order.id,
    assignedCloserId
  };
}
