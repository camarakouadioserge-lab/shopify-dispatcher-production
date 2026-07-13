
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();

    return NextResponse.json({
      ok: true,
      service: "shopify-dispatcher-production",
      checks: {
        database: "ok",
        redis: "ok"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "shopify-dispatcher-production",
        error: error instanceof Error ? error.message : "healthcheck_failed"
      },
      { status: 500 }
    );
  }
}
