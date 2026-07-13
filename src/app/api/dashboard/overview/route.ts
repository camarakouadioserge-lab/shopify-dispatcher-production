import { NextResponse } from "next/server";
import { getOverviewKpis } from "@/lib/kpis";
import { requireAdminApiUser } from "@/lib/guards";

export async function GET() {
  const guard = await requireAdminApiUser();
  if (guard.response) {
    return guard.response;
  }

  const data = await getOverviewKpis();
  return NextResponse.json(data);
}
