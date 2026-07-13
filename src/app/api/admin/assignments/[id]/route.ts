import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminApiUser } from "@/lib/guards";

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

  if (method !== "delete") {
    return NextResponse.json({ error: "Méthode non supportée" }, { status: 405 });
  }

  await prisma.closerProductAssignment.delete({
    where: { id }
  });

  revalidatePath("/dashboard/assignments");
  return NextResponse.redirect(new URL("/dashboard/assignments", request.url), 303);
}
