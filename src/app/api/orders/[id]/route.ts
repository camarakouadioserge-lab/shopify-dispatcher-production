
import { DeliveryStatus, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/guards";
import { isAdminRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const guard = await requireApiUser();
  if (guard.response || !guard.user) {
    return guard.response;
  }

  const user = guard.user;
  const { id } = await context.params;
  const formData = await request.formData();
  const method = String(formData.get("_method") ?? "").toLowerCase();

  if (method !== "patch") {
    return NextResponse.json({ error: "Méthode non supportée" }, { status: 405 });
  }

  const order = await prisma.order.findUnique({
    where: { id }
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (!isAdminRole(user.role) && order.assignedCloserId !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const assignedCloserIdRaw = String(formData.get("assignedCloserId") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? order.paymentStatus) as PaymentStatus;
  const deliveryStatus = String(formData.get("deliveryStatus") ?? order.deliveryStatus) as DeliveryStatus;

  const updated = await prisma.order.update({
    where: { id },
    data: {
      assignedCloserId: assignedCloserIdRaw || order.assignedCloserId,
      paymentStatus,
      deliveryStatus
    }
  });

  await createAuditLog({
    actorType: "USER",
    actorUserId: user.id,
    action: "order.updated",
    entityType: "Order",
    entityId: updated.id,
    orderId: updated.id,
    metadata: {
      previousAssignedCloserId: order.assignedCloserId,
      nextAssignedCloserId: updated.assignedCloserId,
      previousPaymentStatus: order.paymentStatus,
      nextPaymentStatus: updated.paymentStatus,
      previousDeliveryStatus: order.deliveryStatus,
      nextDeliveryStatus: updated.deliveryStatus
    }
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/workspace");
  revalidatePath("/dashboard");
  return NextResponse.redirect(new URL(isAdminRole(user.role) ? "/dashboard/orders" : "/workspace", request.url), 303);
}
