import { prisma } from "@/lib/database/prisma";
import type { User, Role } from "@prisma/client";

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserByUsername(
  username: string
): Promise<User | null> {
  return prisma.user.findUnique({ where: { username } });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role?: Role;
}): Promise<User> {
  return prisma.user.create({ data });
}

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}
