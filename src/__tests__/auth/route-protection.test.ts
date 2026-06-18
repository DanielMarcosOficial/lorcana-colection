import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  validateSession: vi.fn(),
  createSession: vi.fn().mockResolvedValue("new-session-token"),
  deleteSession: vi.fn(),
  generateToken: vi.fn().mockReturnValue("a".repeat(64)),
  hashToken: vi.fn().mockReturnValue("b".repeat(64)),
  deleteAllUserSessions: vi.fn(),
}));

import {
  getCurrentUser,
  requireUser,
  requireAdmin,
  startSession,
  endSession,
} from "@/lib/auth/auth";
import * as sessionModule from "@/lib/auth/session";

const sessionBase = {
  id: "session-1",
  tokenHash: "b".repeat(64),
  expiresAt: new Date(Date.now() + 86400000),
  createdAt: new Date(),
  lastUsedAt: new Date(),
};

const adminUser = {
  id: "1",
  name: "Admin User",
  username: "admin",
  email: "admin@example.com",
  role: "ADMIN" as const,
  avatarUrl: null,
  passwordHash: "hash",
  country: null,
  profilePublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const normalUser = {
  ...adminUser,
  id: "2",
  username: "user",
  email: "user@example.com",
  role: "USER" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCookieStore.get.mockReturnValue({ value: "test-token" });
});

describe("getCurrentUser", () => {
  it("returns user data when session is valid", async () => {
    vi.mocked(sessionModule.validateSession).mockResolvedValue({
      ...sessionBase,
      userId: adminUser.id,
      user: adminUser,
    });

    const user = await getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.email).toBe("admin@example.com");
    expect(user?.role).toBe("ADMIN");
  });

  it("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("returns null when session is expired or invalid", async () => {
    vi.mocked(sessionModule.validateSession).mockResolvedValue(null);
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});

describe("requireUser", () => {
  it("returns the user when authenticated", async () => {
    vi.mocked(sessionModule.validateSession).mockResolvedValue({
      ...sessionBase,
      userId: adminUser.id,
      user: adminUser,
    });

    const user = await requireUser();
    expect(user.email).toBe("admin@example.com");
  });

  it("redirects to /entrar when not authenticated", async () => {
    vi.mocked(sessionModule.validateSession).mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/entrar");
  });
});

describe("requireAdmin", () => {
  it("returns the user when role is ADMIN", async () => {
    vi.mocked(sessionModule.validateSession).mockResolvedValue({
      ...sessionBase,
      userId: adminUser.id,
      user: adminUser,
    });

    const user = await requireAdmin();
    expect(user.role).toBe("ADMIN");
  });

  it("redirects to /acesso-negado when role is USER", async () => {
    vi.mocked(sessionModule.validateSession).mockResolvedValue({
      ...sessionBase,
      userId: normalUser.id,
      user: normalUser,
    });

    await expect(requireAdmin()).rejects.toThrow(
      "NEXT_REDIRECT:/acesso-negado"
    );
  });

  it("redirects to /entrar when not authenticated at all", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/entrar");
  });
});

describe("startSession", () => {
  it("creates a session and sets the cookie", async () => {
    await startSession("user-id-1");
    expect(sessionModule.createSession).toHaveBeenCalledWith("user-id-1");
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      expect.any(String),
      "new-session-token",
      expect.objectContaining({ httpOnly: true, sameSite: "lax" })
    );
  });
});

describe("endSession", () => {
  it("deletes the session and clears the cookie", async () => {
    await endSession();
    expect(sessionModule.deleteSession).toHaveBeenCalledWith("test-token");
    expect(mockCookieStore.delete).toHaveBeenCalled();
  });

  it("clears the cookie even when no token is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await endSession();
    expect(sessionModule.deleteSession).not.toHaveBeenCalled();
    expect(mockCookieStore.delete).toHaveBeenCalled();
  });
});
