import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("hashPassword", () => {
  it("returns a hash different from the original password", async () => {
    const hash = await hashPassword("MyPassword123");
    expect(hash).not.toBe("MyPassword123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("produces different hashes for the same password (salt)", async () => {
    const hash1 = await hashPassword("MyPassword123");
    const hash2 = await hashPassword("MyPassword123");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for the correct password", async () => {
    const hash = await hashPassword("MyPassword123");
    const valid = await verifyPassword("MyPassword123", hash);
    expect(valid).toBe(true);
  });

  it("returns false for an incorrect password", async () => {
    const hash = await hashPassword("MyPassword123");
    const valid = await verifyPassword("WrongPassword", hash);
    expect(valid).toBe(false);
  });
});
