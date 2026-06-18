import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, validateSession, deleteSession } from "./session";
import type { User } from "@prisma/client";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "lorcana_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export type SessionUser = Pick<
  User,
  "id" | "name" | "username" | "email" | "role" | "avatarUrl"
>;

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const session = await validateSession(token);
  if (!session) return null;

  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

export async function startSession(userId: string): Promise<void> {
  const token = await createSession(userId);
  await setSessionCookie(token);
}

export async function endSession(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await deleteSession(token);
  }
  await clearSessionCookie();
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/entrar");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/acesso-negado");
  }
  return user;
}
