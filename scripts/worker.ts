// scripts/worker.ts
import { Worker } from "bullmq";
import { env } from "@/lib/env";
import { queueNames } from "@/lib/queues";
import { processWebhookReceipt } from "@/lib/orders";
import { processOutboundCallJob } from "@/lib/twilio";

function getBullMqConnection() {
  const url = new URL(env.REDIS_URL);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    ...(url.protocol === "rediss:" ? { tls: {} } : {})
  };
}

async function main() {
  const connection = getBullMqConnection();

  const workers = [
    new Worker(
      queueNames.shopifyOrders,
      async (job) => {
        await processWebhookReceipt(job.data.webhookReceiptId);
      },
      { connection, concurrency: 10 }
    ),
    new Worker(
      queueNames.outboundCalls,
      async (job) => {
        await processOutboundCallJob(job.data.callId);
      },
      { connection, concurrency: 5 }
    )
  ];

  const shutdown = async () => {
    await Promise.all(workers.map((worker) => worker.close()));
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("Worker started");
}

main().catch((error) => {
  console.error("Worker failed to start", error);
  process.exit(1);
});