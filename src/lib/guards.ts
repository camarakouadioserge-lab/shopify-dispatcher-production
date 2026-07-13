import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";

export async function requireApiUser(roles?: UserRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }

  if (roles && !roles.includes(user.role)) {
    return { user: null, response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }

  return { user, response: null };
}

export async function requireAdminApiUser() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }

  if (!isAdminRole(user.role)) {
    return { user: null, response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }

  return { user, response: null };
}
