
import { env } from "@/lib/env";

export function isValidCronSecret(request: Request) {
  const value = request.headers.get("x-cron-secret");
  return value === env.CRON_SECRET;
}
