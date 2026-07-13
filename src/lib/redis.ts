
import IORedis from "ioredis";
import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __dispatcherRedis__: IORedis | undefined;
}

export const redis =
  global.__dispatcherRedis__ ??
  new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });

if (process.env.NODE_ENV !== "production") {
  global.__dispatcherRedis__ = redis;
}
