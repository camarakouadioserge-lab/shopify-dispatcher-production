
import { AuditActorType } from "@prisma/client";
import { prisma } from "@/lib/db";

type AuditInput = {
  actorType?: AuditActorType | `${AuditActorType}`;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  orderId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function createAuditLog(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorType: (input.actorType ?? AuditActorType.SYSTEM) as AuditActorType,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      orderId: input.orderId ?? null,
      metadataJson: input.metadata ?? {}
    }
  });
}
