
import { Worker } from "bullmq";
import { queueNames } from "@/lib/queues";
import { redis } from "@/lib/redis";
import { processWebhookReceipt } from "@/lib/orders";
import { runOutboundCallJob } from "@/lib/twilio";
import { prisma } from "@/lib/db";

async function main() {
  const workers = [
    new Worker(
      queueNames.shopifyOrders,
      async (job) => {
        await processWebhookReceipt(job.data.webhookReceiptId);
      },
      { connection: redis, concurrency: 10 }
    ),
    new Worker(
      queueNames.outboundCalls,
      async (job) => {
        await runOutboundCallJob(job.data);
      },
      { connection: redis, concurrency: 5 }
    )
  ];

  for (const worker of workers) {
    worker.on("failed", (job, error) => {
      console.error(`[worker] job failed ${job?.name ?? "unknown"}`, error);
    });

    worker.on("completed", (job) => {
      console.info(`[worker] job completed ${job.id}`);
    });
  }

  const shutdown = async () => {
    await Promise.all(workers.map((worker) => worker.close()));
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(async (error) => {
  console.error("[worker] fatal error", error);
  await prisma.$disconnect();
  await redis.quit();
  process.exit(1);
});
