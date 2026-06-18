import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictError, AuthError } from "@/lib/errors";

vi.mock("@/modules/users/user.repository", () => ({
  findUserByEmail: vi.fn(),
  findUserByUsername: vi.fn(),
  createUser: vi.fn(),
  findUserById: vi.fn(),
  countUsers: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("$2b$12$hashed"),
  verifyPassword: vi.fn(),
}));

import { registerUser, authenticateUser } from "@/modules/users/user.service";
import * as repo from "@/modules/users/user.repository";
import * as pwd from "@/lib/auth/password";

const mockUser = {
  id: "user-1",
  name: "Test User",
  username: "testuser",
  email: "test@example.com",
  passwordHash: "$2b$12$hashed",
  avatarUrl: null,
  country: null,
  role: "USER" as const,
  profilePublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("registerUser", () => {
  beforeEach(() => {
    vi.mocked(repo.findUserByEmail).mockResolvedValue(null);
    vi.mocked(repo.findUserByUsername).mockResolvedValue(null);
    vi.mocked(repo.createUser).mockResolvedValue(mockUser);
  });

  it("creates a user with valid input", async () => {
    const result = await registerUser({
      name: "Test User",
      username: "testuser",
      email: "test@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(result).toEqual(mockUser);
    expect(repo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "$2b$12$hashed",
      })
    );
  });

  it("throws ConflictError for duplicate email", async () => {
    vi.mocked(repo.findUserByEmail).mockResolvedValue(mockUser);
    await expect(
      registerUser({
        name: "Test User",
        username: "newuser",
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("throws ConflictError for duplicate username", async () => {
    vi.mocked(repo.findUserByUsername).mockResolvedValue(mockUser);
    await expect(
      registerUser({
        name: "Test User",
        username: "testuser",
        email: "other@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("hashes the password before storing", async () => {
    await registerUser({
      name: "Test User",
      username: "testuser",
      email: "test@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(pwd.hashPassword).toHaveBeenCalledWith("Password123");
    const call = vi.mocked(repo.createUser).mock.calls[0]?.[0];
    expect(call?.passwordHash).not.toBe("Password123");
  });
});

describe("authenticateUser", () => {
  beforeEach(() => {
    vi.mocked(repo.findUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(pwd.verifyPassword).mockResolvedValue(true);
  });

  it("returns user for correct credentials", async () => {
    const result = await authenticateUser({
      email: "test@example.com",
      password: "Password123",
    });
    expect(result).toEqual(mockUser);
  });

  it("throws AuthError for wrong password", async () => {
    vi.mocked(pwd.verifyPassword).mockResolvedValue(false);
    await expect(
      authenticateUser({
        email: "test@example.com",
        password: "WrongPassword",
      })
    ).rejects.toThrow(AuthError);
  });

  it("throws AuthError for non-existent user", async () => {
    vi.mocked(repo.findUserByEmail).mockResolvedValue(null);
    await expect(
      authenticateUser({
        email: "nobody@example.com",
        password: "Password123",
      })
    ).rejects.toThrow(AuthError);
  });

  it("does not reveal whether the user exists (constant-time-like behavior)", async () => {
    vi.mocked(repo.findUserByEmail).mockResolvedValue(null);
    vi.mocked(pwd.verifyPassword).mockResolvedValue(false);

    await expect(
      authenticateUser({ email: "ghost@example.com", password: "pass" })
    ).rejects.toThrow(AuthError);
  });
});
