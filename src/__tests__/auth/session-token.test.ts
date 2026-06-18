import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/database/prisma", () => ({
  prisma: {
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { generateToken, hashToken } from "@/lib/auth/session";

describe("generateToken", () => {
  it("generates a 64-char hex string (32 bytes)", () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("generates unique tokens each time", () => {
    const tokens = Array.from({ length: 10 }, () => generateToken());
    const unique = new Set(tokens);
    expect(unique.size).toBe(10);
  });
});

describe("hashToken", () => {
  it("produces a consistent hash for the same input", () => {
    const hash1 = hashToken("some-token");
    const hash2 = hashToken("some-token");
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different inputs", () => {
    const hash1 = hashToken("token-a");
    const hash2 = hashToken("token-b");
    expect(hash1).not.toBe(hash2);
  });

  it("hash is different from the original token (never stored plain)", () => {
    const token = "my-secret-token";
    const hash = hashToken(token);
    expect(hash).not.toBe(token);
    expect(hash.length).toBe(64);
  });
});
