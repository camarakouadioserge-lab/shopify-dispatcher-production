import { NextResponse } from "next/server";
import { getRevenueByCountry } from "@/lib/kpis";
import { requireAdminApiUser } from "@/lib/guards";

export async function GET() {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const data = await getRevenueByCountry();
  return NextResponse.json(data);
}
