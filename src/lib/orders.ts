// src/lib/orders.ts
import { Prisma, DeliveryStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ListOrdersInput = {
  page?: number;
  pageSize?: number;
  query?: string;
  assignedCloserId?: string;
  deliveryStatus?: DeliveryStatus;
  paymentStatus?: PaymentStatus;
};

export async function listOrders(input: ListOrdersInput = {}) {
  const page = input.page && input.page > 0 ? input.page : 1;
  const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.OrderWhereInput = {
    ...(input.assignedCloserId ? { assignedCloserId: input.assignedCloserId } : {}),
    ...(input.deliveryStatus ? { deliveryStatus: input.deliveryStatus } : {}),
    ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
    ...(input.query
      ? {
          OR: [
            { orderNumber: { contains: input.query, mode: "insensitive" } },
            { customerName: { contains: input.query, mode: "insensitive" } },
            { phone: { contains: input.query, mode: "insensitive" } },
            { country: { contains: input.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        assignedCloser: true,
        items: true,
        store: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}