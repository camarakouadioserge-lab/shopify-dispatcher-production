import { NextResponse } from "next/server";
import { DeliveryStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { listOrders } from "@/lib/orders";
import { assignCloserForOrder } from "@/lib/assignment";
import { requireAdminApiUser } from "@/lib/guards";
import { z } from "zod";

const createOrderSchema = z.object({
  storeId: z.string(),
  shopifyOrderId: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  country: z.string().nullable().optional(),
  totalAmount: z.number().positive(),
  currency: z.string().min(3),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
  fulfillmentStatus: z.string().nullable().optional(),
  deliveryStatus: z.nativeEnum(DeliveryStatus).default(DeliveryStatus.PENDING),
  items: z.array(
    z.object({
      title: z.string(),
      sku: z.string().nullable().optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      productId: z.string().nullable().optional()
    })
  )
});

export async function GET() {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const orders = await listOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const payload = createOrderSchema.parse(await request.json());

  const order = await prisma.order.create({
    data: {
      storeId: payload.storeId,
      shopifyOrderId: payload.shopifyOrderId,
      orderNumber: payload.orderNumber,
      customerName: payload.customerName,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      country: payload.country ?? null,
      totalAmount: payload.totalAmount,
      currency: payload.currency,
      paymentStatus: payload.paymentStatus,
      fulfillmentStatus: payload.fulfillmentStatus ?? null,
      deliveryStatus: payload.deliveryStatus,
      orderItems: {
        create: payload.items.map((item) => ({
          productId: item.productId ?? null,
          title: item.title,
          sku: item.sku ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      }
    }
  });

  const assignedCloserId = await assignCloserForOrder(order.id);

  return NextResponse.json({ orderId: order.id, assignedCloserId }, { status: 201 });
}
