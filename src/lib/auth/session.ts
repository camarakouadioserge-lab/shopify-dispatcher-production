
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const SESSION_COOKIE_NAME = "shopify_dispatcher_session";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getSessionExpiry() {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * env.SESSION_TTL_DAYS);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = sha256(token);
  const expiresAt = getSessionExpiry();

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: sha256(token) }
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export type AuthenticatedUser = Pick<User, "id" | "name" | "email" | "phone" | "role" | "active" | "maxDailyOrders">;

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = sha256(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date() || !session.user.active) {
    await prisma.session.deleteMany({ where: { tokenHash } });
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const nextExpiry = getSessionExpiry();

  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt: nextExpiry }
  });

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: nextExpiry
  });

  return session.user;
}

export async function requireUser(roles?: UserRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (roles && !roles.includes(user.role)) {
    redirect(user.role === "CLOSER" ? "/workspace" : "/dashboard");
  }

  return user;
}
