
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const queueNames = {
  shopifyOrders: "shopify-orders",
  outboundCalls: "outbound-calls"
} as const;

export type ShopifyOrderJobPayload = {
  webhookReceiptId: string;
};

export type OutboundCallJobPayload = {
  orderId: string;
  closerId: string | null;
  phoneNumber: string;
};

export const shopifyOrdersQueue = new Queue<ShopifyOrderJobPayload>(queueNames.shopifyOrders, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 1000,
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5_000
    }
  }
});

export const outboundCallsQueue = new Queue<OutboundCallJobPayload>(queueNames.outboundCalls, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 1000,
    attempts: 4,
    backoff: {
      type: "exponential",
      delay: 10_000
    }
  }
});
