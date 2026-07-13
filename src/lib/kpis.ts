import { prisma } from "@/lib/db";

export async function getOverviewKpis() {
  const [orders, delivered, cancelled, expenses] = await Promise.all([
    prisma.order.findMany({
      include: { orderItems: true }
    }),
    prisma.order.count({ where: { deliveryStatus: "DELIVERED" } }),
    prisma.order.count({ where: { deliveryStatus: "CANCELLED" } }),
    prisma.expense.findMany()
  ]);

  const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const margin = revenue - totalExpenses;

  return {
    totalOrders: orders.length,
    deliveredOrders: delivered,
    cancelledOrders: cancelled,
    revenue,
    totalExpenses,
    margin
  };
}

export async function getRevenueByCountry() {
  const rows = await prisma.order.groupBy({
    by: ["country"],
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  return rows.map((row) => ({
    country: row.country ?? "N/A",
    orders: row._count.id,
    revenue: Number(row._sum.totalAmount ?? 0)
  }));
}

export async function getRevenueByCloser() {
  const rows = await prisma.order.groupBy({
    by: ["assignedCloserId"],
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  const closers = await prisma.user.findMany({
    where: {
      id: { in: rows.map((row) => row.assignedCloserId).filter((value): value is string => Boolean(value)) }
    }
  });

  return rows.map((row) => ({
    closerId: row.assignedCloserId,
    closerName: closers.find((closer) => closer.id === row.assignedCloserId)?.name ?? "Non assigné",
    orders: row._count.id,
    revenue: Number(row._sum.totalAmount ?? 0)
  }));
}

export async function getRevenueByProduct() {
  const items = await prisma.orderItem.findMany({
    include: {
      product: true
    }
  });

  const map = new Map<string, { product: string; quantity: number; revenue: number }>();

  for (const item of items) {
    const key = item.productId ?? item.title;
    const revenue = Number(item.unitPrice) * item.quantity;
    const current = map.get(key) ?? {
      product: item.product?.title ?? item.title,
      quantity: 0,
      revenue: 0
    };

    current.quantity += item.quantity;
    current.revenue += revenue;
    map.set(key, current);
  }

  return [...map.values()].sort((left, right) => right.revenue - left.revenue);
}
