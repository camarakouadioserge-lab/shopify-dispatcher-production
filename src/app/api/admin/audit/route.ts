
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApiUser } from "@/lib/guards";

export async function GET() {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const auditLogs = await prisma.auditLog.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: {
      actorUser: true
    }
  });

  return NextResponse.json(auditLogs);
}
