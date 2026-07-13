
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/guards";
import { isAdminRole } from "@/lib/auth";
import { outboundCallsQueue } from "@/lib/queues";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const guard = await requireApiUser();
  if (guard.response || !guard.user) {
    return guard.response;
  }

  const user = guard.user;
  const contentType = request.headers.get("content-type") ?? "";
  const orderId = contentType.includes("application/json")
    ? String((await request.json()).orderId ?? "")
    : String((await request.formData()).get("orderId") ?? "");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { assignedCloser: true }
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (!isAdminRole(user.role) && order.assignedCloserId !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await outboundCallsQueue.add("start-outbound-call", {
    orderId: order.id,
    closerId: order.assignedCloserId ?? null,
    phoneNumber: order.phone ?? ""
  });

  await createAuditLog({
    actorType: "USER",
    actorUserId: user.id,
    action: "call.queued",
    entityType: "Order",
    entityId: order.id,
    orderId: order.id,
    metadata: {
      phoneNumber: order.phone ?? null
    }
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/workspace");

  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true, queued: true }, { status: 202 });
  }

  return NextResponse.redirect(new URL(isAdminRole(user.role) ? "/dashboard/orders" : "/workspace", request.url), 303);
}
