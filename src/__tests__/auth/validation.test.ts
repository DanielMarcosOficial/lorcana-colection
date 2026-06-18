import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validations/auth";

describe("registerSchema", () => {
  const validInput = {
    name: "Test User",
    username: "testuser",
    email: "test@example.com",
    password: "Password123",
    confirmPassword: "Password123",
  };

  it("validates correct input", () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...validInput, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: "123",
      confirmPassword: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      confirmPassword: "DifferentPass",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const hasConfirmError = result.error.issues.some(
        (i) => i.path[0] === "confirmPassword"
      );
      expect(hasConfirmError).toBe(true);
    }
  });

  it("lowercases username", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      username: "TestUser",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("testuser");
    }
  });

  it("lowercases email", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      email: "TEST@EXAMPLE.COM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects username with spaces or special characters", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      username: "test user!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username shorter than 3 characters", () => {
    const result = registerSchema.safeParse({ ...validInput, username: "ab" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("validates correct input", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-email",
      password: "password",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
