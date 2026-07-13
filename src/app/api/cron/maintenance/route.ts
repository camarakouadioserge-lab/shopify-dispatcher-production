
import { NextResponse } from "next/server";
import { WebhookStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isValidCronSecret } from "@/lib/cron";
import { shopifyOrdersQueue } from "@/lib/queues";

export async function POST(request: Request) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const [expiredSessions, staleReceipts] = await Promise.all([
    prisma.session.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    }),
    prisma.webhookReceipt.findMany({
      where: {
        status: WebhookStatus.FAILED,
        receivedAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) }
      },
      take: 100
    })
  ]);

  for (const receipt of staleReceipts) {
    await shopifyOrdersQueue.add("reprocess-shopify-order", { webhookReceiptId: receipt.id });
  }

  return NextResponse.json({
    ok: true,
    deletedSessions: expiredSessions.count,
    requeuedWebhooks: staleReceipts.length
  });
}
