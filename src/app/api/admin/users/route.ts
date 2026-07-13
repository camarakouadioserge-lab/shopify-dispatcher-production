import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminApiUser } from "@/lib/guards";
import { hashPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const role = String(formData.get("role") ?? UserRole.CLOSER) as UserRole;
  const maxDailyOrders = Number(formData.get("maxDailyOrders") ?? 20);
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  await prisma.user.create({
    data: {
      name,
      email,
      phone,
      role,
      active: true,
      maxDailyOrders,
      passwordHash: hashPassword(password)
    }
  });

  revalidatePath("/dashboard/closers");
  return NextResponse.redirect(new URL("/dashboard/closers", request.url), 303);
}
