
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { mapTwilioStatus } from "@/lib/twilio";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const callId = url.searchParams.get("callId");
  const formData = await request.formData();
  const callStatus = String(formData.get("CallStatus") ?? "").toLowerCase();
  const providerCallId = String(formData.get("CallSid") ?? "");

  if (callId) {
    const nextStatus = mapTwilioStatus(callStatus);
    const updated = await prisma.call.update({
      where: { id: callId },
      data: {
        providerCallId: providerCallId || undefined,
        callStatus: nextStatus,
        endedAt: callStatus === "completed" ? new Date() : undefined
      }
    });

    await createAuditLog({
      action: "call.status_updated",
      entityType: "Call",
      entityId: updated.id,
      orderId: updated.orderId,
      metadata: {
        callStatus,
        providerCallId: providerCallId || null
      }
    });
  }

  return new Response("ok");
}
