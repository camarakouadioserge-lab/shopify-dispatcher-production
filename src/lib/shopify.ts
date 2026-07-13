import crypto from "node:crypto";
import { PaymentStatus } from "@prisma/client";
import type { ShopifyWebhookOrder } from "@/lib/types";

export function verifyShopifyWebhookHmac(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(hmacHeader, "utf8");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function toPaymentStatus(status?: string | null): PaymentStatus {
  switch ((status ?? "").toLowerCase()) {
    case "paid":
      return PaymentStatus.PAID;
    case "partially_paid":
      return PaymentStatus.PARTIALLY_PAID;
    case "refunded":
      return PaymentStatus.REFUNDED;
    case "voided":
      return PaymentStatus.VOIDED;
    default:
      return PaymentStatus.PENDING;
  }
}

export function extractCustomerName(order: ShopifyWebhookOrder): string {
  const fullName = [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(" ").trim();
  return fullName || order.shipping_address?.name || "Client inconnu";
}
