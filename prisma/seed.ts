import { DeliveryStatus, ExpenseCategory, PaymentStatus, UserRole } from "@prisma/client";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const adminPasswordHash = hashPassword("Admin123!");
  const closerPasswordHash = hashPassword("Closer123!");

  const store = await prisma.store.upsert({
    where: { shopifyDomain: "demo-store.myshopify.com" },
    update: {},
    create: {
      name: "Demo Store",
      shopifyDomain: "demo-store.myshopify.com",
      currency: "USD"
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash: adminPasswordHash, role: UserRole.ADMIN, active: true },
    create: {
      name: "Admin Principal",
      email: "admin@example.com",
      phone: "+2250102030405",
      role: UserRole.ADMIN,
      active: true,
      maxDailyOrders: 100,
      passwordHash: adminPasswordHash
    }
  });

  const closerA = await prisma.user.upsert({
    where: { email: "closer1@example.com" },
    update: { passwordHash: closerPasswordHash, role: UserRole.CLOSER, active: true },
    create: {
      name: "Closer A",
      email: "closer1@example.com",
      phone: "+2250708091011",
      role: UserRole.CLOSER,
      active: true,
      maxDailyOrders: 20,
      passwordHash: closerPasswordHash
    }
  });

  const closerB = await prisma.user.upsert({
    where: { email: "closer2@example.com" },
    update: { passwordHash: closerPasswordHash, role: UserRole.CLOSER, active: true },
    create: {
      name: "Closer B",
      email: "closer2@example.com",
      phone: "+2251213141516",
      role: UserRole.CLOSER,
      active: true,
      maxDailyOrders: 20,
      passwordHash: closerPasswordHash
    }
  });

  const serum = await prisma.product.upsert({
    where: {
      storeId_shopifyProductId_shopifyVariantId: {
        storeId: store.id,
        shopifyProductId: "1001",
        shopifyVariantId: "2001"
      }
    },
    update: {},
    create: {
      storeId: store.id,
      shopifyProductId: "1001",
      shopifyVariantId: "2001",
      title: "Sérum Premium",
      sku: "SERUM-001"
    }
  });

  const creme = await prisma.product.upsert({
    where: {
      storeId_shopifyProductId_shopifyVariantId: {
        storeId: store.id,
        shopifyProductId: "1002",
        shopifyVariantId: "2002"
      }
    },
    update: {},
    create: {
      storeId: store.id,
      shopifyProductId: "1002",
      shopifyVariantId: "2002",
      title: "Crème Nuit",
      sku: "CREME-002"
    }
  });

  await prisma.closerProductAssignment.upsert({
    where: {
      closerId_productId_countryCode: {
        closerId: closerA.id,
        productId: serum.id,
        countryCode: "CI"
      }
    },
    update: { priority: 1, active: true },
    create: {
      closerId: closerA.id,
      productId: serum.id,
      countryCode: "CI",
      priority: 1,
      active: true
    }
  });

  await prisma.closerProductAssignment.upsert({
    where: {
      closerId_productId_countryCode: {
        closerId: closerB.id,
        productId: creme.id,
        countryCode: "SN"
      }
    },
    update: { priority: 1, active: true },
    create: {
      closerId: closerB.id,
      productId: creme.id,
      countryCode: "SN",
      priority: 1,
      active: true
    }
  });

  const order = await prisma.order.upsert({
    where: {
      storeId_shopifyOrderId: {
        storeId: store.id,
        shopifyOrderId: "5001"
      }
    },
    update: {},
    create: {
      storeId: store.id,
      shopifyOrderId: "5001",
      orderNumber: "#1001",
      customerName: "Awa Koné",
      phone: "+2250555666777",
      email: "awa@example.com",
      country: "CI",
      totalAmount: 55,
      currency: "USD",
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.CONFIRMED,
      assignedCloserId: closerA.id,
      orderItems: {
        create: [
          {
            productId: serum.id,
            title: serum.title,
            sku: serum.sku,
            quantity: 1,
            unitPrice: 55
          }
        ]
      }
    }
  });

  await prisma.expense.create({
    data: {
      storeId: store.id,
      country: "CI",
      category: ExpenseCategory.ADS,
      label: "Facebook Ads",
      amount: 12.5,
      expenseDate: new Date(),
      notes: "Budget test"
    }
  });

  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      eventType: "seed.created",
      source: "seed",
      sourceEventId: `seed-${order.id}`,
      payloadJson: { seededBy: admin.email }
    }
  });

  console.log("Seed terminé.");
  console.log("Admin: admin@example.com / Admin123!");
  console.log("Closer: closer1@example.com / Closer123!");
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
