import { ExpenseCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminApiUser } from "@/lib/guards";

export async function GET() {
  const expenses = await prisma.expense.findMany({
    include: { store: true },
    orderBy: { expenseDate: "desc" }
  });

  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = await request.json();

    const expense = await prisma.expense.create({
      data: {
        storeId: payload.storeId ?? null,
        country: payload.country ?? null,
        category: payload.category as ExpenseCategory,
        label: payload.label,
        amount: payload.amount,
        expenseDate: new Date(payload.expenseDate),
        notes: payload.notes ?? null
      }
    });

    return NextResponse.json(expense, { status: 201 });
  }

  const formData = await request.formData();
  await prisma.expense.create({
    data: {
      storeId: String(formData.get("storeId") ?? "").trim() || null,
      country: String(formData.get("country") ?? "").trim().toUpperCase() || null,
      category: String(formData.get("category") ?? ExpenseCategory.OTHER) as ExpenseCategory,
      label: String(formData.get("label") ?? "").trim(),
      amount: Number(formData.get("amount") ?? 0),
      expenseDate: new Date(String(formData.get("expenseDate") ?? new Date().toISOString())),
      notes: String(formData.get("notes") ?? "").trim() || null
    }
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  return NextResponse.redirect(new URL("/dashboard/expenses", request.url), 303);
}
