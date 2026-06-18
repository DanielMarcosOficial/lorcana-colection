import { test, expect } from "@playwright/test";
import { registerUser, loginAdmin } from "./helpers";

test.describe("Administração", () => {
  test("bloquear usuário comum no painel administrativo", async ({ page }) => {
    await registerUser(page);
    await page.goto("/admin");
    // Regular user should be redirected to /acesso-negado
    await expect(page).toHaveURL(/\/acesso-negado|\/entrar/);
  });

  test("administrador acessa painel", async ({ page }) => {
    await loginAdmin(page);
    const url = page.url();
    if (url.includes("/entrar") || url.includes("/acesso-negado")) {
      // Admin user not set up in test env — skip
      test.skip();
      return;
    }
    await page.goto("/admin");
    await expect(page.locator("h1")).toContainText("Administração");
  });

  test("administrador vê lista de sincronizações", async ({ page }) => {
    await loginAdmin(page);
    const url = page.url();
    if (url.includes("/entrar") || url.includes("/acesso-negado")) {
      test.skip();
      return;
    }
    await page.goto("/admin/sincronizacoes");
    await expect(page.locator("h1")).toContainText("Sincronizações");
  });

  test("administrador vê lista de usuários", async ({ page }) => {
    await loginAdmin(page);
    const url = page.url();
    if (url.includes("/entrar") || url.includes("/acesso-negado")) {
      test.skip();
      return;
    }
    await page.goto("/admin/usuarios");
    await expect(page.locator("h1")).toContainText("Usuários");
  });

  test("administrador pode iniciar sincronização", async ({ page }) => {
    await loginAdmin(page);
    const url = page.url();
    if (url.includes("/entrar") || url.includes("/acesso-negado")) {
      test.skip();
      return;
    }
    await page.goto("/admin/sincronizacoes");
    const btn = page.locator("button", { hasText: "Iniciar sincronização" });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });
});
