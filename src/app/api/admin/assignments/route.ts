import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminApiUser } from "@/lib/guards";

export async function POST(request: Request) {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const formData = await request.formData();
  const closerId = String(formData.get("closerId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const countryCodeRaw = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const priority = Number(formData.get("priority") ?? 100);

  if (!closerId || !productId) {
    return NextResponse.json({ error: "closerId et productId requis" }, { status: 400 });
  }

  await prisma.closerProductAssignment.upsert({
    where: {
      closerId_productId_countryCode: {
        closerId,
        productId,
        countryCode: countryCodeRaw || null
      }
    },
    update: {
      priority,
      active: true
    },
    create: {
      closerId,
      productId,
      countryCode: countryCodeRaw || null,
      priority,
      active: true
    }
  });

  revalidatePath("/dashboard/assignments");
  return NextResponse.redirect(new URL("/dashboard/assignments", request.url), 303);
}
