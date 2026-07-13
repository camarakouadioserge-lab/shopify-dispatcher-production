import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminApiUser } from "@/lib/guards";
import { hashPassword } from "@/lib/auth/password";
import { z } from "zod";

const createCloserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  maxDailyOrders: z.number().int().positive().default(50),
  password: z.string().min(8).default("Closer123!")
});

export async function GET() {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const closers = await prisma.user.findMany({
    where: { role: UserRole.CLOSER },
    include: {
      assignments: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(closers);
}

export async function POST(request: Request) {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const payload = createCloserSchema.parse(await request.json());

  const closer = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      phone: payload.phone ?? null,
      role: UserRole.CLOSER,
      maxDailyOrders: payload.maxDailyOrders,
      passwordHash: hashPassword(payload.password)
    }
  });

  return NextResponse.json(closer, { status: 201 });
}
