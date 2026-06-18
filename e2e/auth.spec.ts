import { test, expect } from "@playwright/test";
import { registerUser, loginUser } from "./helpers";

test.describe("Autenticação", () => {
  test("cadastrar usuário", async ({ page }) => {
    const { email, password } = await registerUser(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("h1")).toContainText("Dashboard");
    // Store for re-use
    test.info().annotations.push({ type: "email", description: email });
    test.info().annotations.push({ type: "password", description: password });
  });

  test("fazer login com credenciais válidas", async ({ page }) => {
    // Register first
    const { email, password } = await registerUser(page);
    // Logout by navigating to login
    await page.goto("/entrar");
    await loginUser(page, email, password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("rejeitar credenciais inválidas", async ({ page }) => {
    await page.goto("/entrar");
    await page.fill('[name="email"]', "naoexiste@test.local");
    await page.fill('[name="password"]', "senhaerrada");
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]')).toContainText("Credenciais inválidas");
  });

  test("redirecionar usuário não autenticado para /entrar", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/entrar/);
  });
});
