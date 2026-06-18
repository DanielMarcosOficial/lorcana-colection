"use server";

import { redirect } from "next/navigation";
import { registerUser, authenticateUser } from "@/modules/users/user.service";
import { startSession, endSession } from "@/lib/auth/auth";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import { AppError } from "@/lib/errors";
import { checkRateLimit, clearRateLimit } from "@/lib/security/rate-limit";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function extractFieldErrors(
  issues: { path: PropertyKey[]; message: string }[]
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "root";
    const existing = errors[key];
    if (existing) {
      existing.push(issue.message);
    } else {
      errors[key] = [issue.message];
    }
  }
  return errors;
}

export async function register(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const input = {
    name: formData.get("name") as string,
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: extractFieldErrors(parsed.error.issues) };
  }

  try {
    const user = await registerUser(parsed.data);
    await startSession(user.id);
  } catch (err) {
    if (err instanceof AppError) return { message: err.message };
    return { message: "Erro ao criar conta" };
  }

  redirect("/dashboard");
}

export async function login(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const input = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: extractFieldErrors(parsed.error.issues) };
  }

  // Rate limit: 10 attempts per 15 minutes per email
  const rlKey = `login:${parsed.data.email.toLowerCase()}`;
  const rl = checkRateLimit(rlKey, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return {
      message:
        "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
    };
  }

  try {
    const user = await authenticateUser(parsed.data);
    clearRateLimit(rlKey);
    await startSession(user.id);
  } catch (err) {
    // Generic message — don't reveal whether email exists or not
    if (err instanceof AppError) return { message: "Credenciais inválidas" };
    return { message: "Credenciais inválidas" };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/entrar");
}
