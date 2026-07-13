import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser, requireUser } from "@/lib/auth/session";

export { createSession, destroySession, getCurrentUser, requireUser };

export async function loginWithPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (!user || !user.passwordHash || !user.active) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  await createSession(user.id);
  return user;
}

export function isAdminRole(role: UserRole) {
  return role === UserRole.ADMIN || role === UserRole.MANAGER;
}
