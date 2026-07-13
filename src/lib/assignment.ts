import { startOfDay } from "@/lib/time";
import { prisma } from "@/lib/db";

type Candidate = {
  closerId: string;
  priority: number;
  currentLoad: number;
};

export async function assignCloserForOrder(orderId: string): Promise<string | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: true
    }
  });

  if (!order || order.orderItems.length === 0) {
    return null;
  }

  const productIds = order.orderItems
    .map((item) => item.productId)
    .filter((value): value is string => Boolean(value));

  if (productIds.length === 0) {
    return null;
  }

  const assignments = await prisma.closerProductAssignment.findMany({
    where: {
      active: true,
      productId: { in: productIds },
      closer: { active: true }
    },
    include: {
      closer: true
    }
  });

  const today = startOfDay(new Date());
  const candidates = new Map<string, Candidate>();

  for (const assignment of assignments) {
    if (assignment.countryCode && order.country && assignment.countryCode !== order.country) {
      continue;
    }

    const currentLoad = await prisma.order.count({
      where: {
        assignedCloserId: assignment.closerId,
        createdAt: { gte: today }
      }
    });

    if (currentLoad >= assignment.closer.maxDailyOrders) {
      continue;
    }

    const existing = candidates.get(assignment.closerId);
    const nextCandidate: Candidate = {
      closerId: assignment.closerId,
      priority: Math.min(existing?.priority ?? Number.MAX_SAFE_INTEGER, assignment.priority),
      currentLoad
    };

    candidates.set(assignment.closerId, nextCandidate);
  }

  const chosen = [...candidates.values()].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.currentLoad - right.currentLoad;
  })[0];

  if (!chosen) {
    return null;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { assignedCloserId: chosen.closerId }
  });

  return chosen.closerId;
}
