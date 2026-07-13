
import twilio from "twilio";
import { CallStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createAuditLog } from "@/lib/audit";
import type { OutboundCallJobPayload } from "@/lib/queues";

type StartOutgoingCallParams = OutboundCallJobPayload;

export async function queueOutgoingCallRecord(params: StartOutgoingCallParams) {
  return prisma.call.create({
    data: {
      orderId: params.orderId,
      closerId: params.closerId,
      phoneNumber: params.phoneNumber,
      callStatus: "PENDING"
    }
  });
}

export async function runOutboundCallJob(params: StartOutgoingCallParams) {
  const callRecord = await prisma.call.create({
    data: {
      orderId: params.orderId,
      closerId: params.closerId,
      phoneNumber: params.phoneNumber,
      callStatus: "PENDING"
    }
  });

  if (!params.phoneNumber) {
    return prisma.call.update({
      where: { id: callRecord.id },
      data: {
        callStatus: "FAILED"
      }
    });
  }

  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    return prisma.call.update({
      where: { id: callRecord.id },
      data: {
        callStatus: "FAILED"
      }
    });
  }

  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  const call = await client.calls.create({
    to: params.phoneNumber,
    from: env.TWILIO_FROM_NUMBER,
    url: `${env.APP_BASE_URL}/api/twilio/voice?orderId=${params.orderId}`,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    statusCallback: `${env.APP_BASE_URL}/api/twilio/status?callId=${callRecord.id}`
  });

  const updated = await prisma.call.update({
    where: { id: callRecord.id },
    data: {
      providerCallId: call.sid,
      callStatus: "RINGING",
      startedAt: new Date()
    }
  });

  await createAuditLog({
    action: "call.started",
    entityType: "Call",
    entityId: updated.id,
    orderId: params.orderId,
    metadata: {
      providerCallId: call.sid,
      phoneNumber: params.phoneNumber
    }
  });

  return updated;
}

export async function startOutgoingCall(params: StartOutgoingCallParams) {
  return runOutboundCallJob(params);
}

export function mapTwilioStatus(value: string) {
  const statusMap: Record<string, CallStatus> = {
    initiated: CallStatus.PENDING,
    ringing: CallStatus.RINGING,
    in_progress: CallStatus.ANSWERED,
    answered: CallStatus.ANSWERED,
    completed: CallStatus.COMPLETED,
    busy: CallStatus.BUSY,
    failed: CallStatus.FAILED,
    no_answer: CallStatus.NO_ANSWER
  };

  return statusMap[value.toLowerCase()] ?? CallStatus.FAILED;
}
