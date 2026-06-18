import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ConflictError, AuthError } from "@/lib/errors";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import {
  findUserByEmail,
  findUserByUsername,
  createUser,
} from "./user.repository";
import type { RegisterInput, LoginInput } from "@/lib/validations/auth";
import type { User } from "@prisma/client";

export async function registerUser(input: RegisterInput): Promise<User> {
  const validated = registerSchema.parse(input);

  const [emailExists, usernameExists] = await Promise.all([
    findUserByEmail(validated.email),
    findUserByUsername(validated.username),
  ]);

  if (emailExists) throw new ConflictError("Email já cadastrado");
  if (usernameExists) throw new ConflictError("Username já em uso");

  const passwordHash = await hashPassword(validated.password);

  return createUser({
    name: validated.name,
    username: validated.username,
    email: validated.email,
    passwordHash,
  });
}

export async function authenticateUser(input: LoginInput): Promise<User> {
  const validated = loginSchema.parse(input);

  const user = await findUserByEmail(validated.email.toLowerCase());

  const isValid = user
    ? await verifyPassword(validated.password, user.passwordHash)
    : false;

  if (!user || !isValid) {
    throw new AuthError("Email ou senha inválidos");
  }

  return user;
}
