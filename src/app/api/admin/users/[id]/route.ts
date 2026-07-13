import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminApiUser } from "@/lib/guards";
import { NextResponse } from "next/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const method = String(formData.get("_method") ?? "").toLowerCase();

  if (method !== "patch") {
    return NextResponse.json({ error: "Méthode non supportée" }, { status: 405 });
  }

  const active = String(formData.get("active") ?? "true") === "true";

  await prisma.user.update({
    where: { id },
    data: { active }
  });

  revalidatePath("/dashboard/closers");
  return NextResponse.redirect(new URL("/dashboard/closers", request.url), 303);
}
