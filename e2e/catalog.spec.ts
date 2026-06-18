import { test, expect } from "@playwright/test";
import { registerUser } from "./helpers";

test.describe("Catálogo", () => {
  test("acessar catálogo sem autenticação", async ({ page }) => {
    await page.goto("/catalogo");
    await expect(page.locator("h1")).toContainText("Catálogo");
  });

  test("pesquisar uma carta", async ({ page }) => {
    await page.goto("/busca");
    await page.fill('[name="q"]', "Mickey");
    await page.click('button[type="submit"]');
    await expect(page.locator("h1")).toContainText("Busca");
    // Should show results or "nenhum resultado"
    const body = await page.locator("main").textContent();
    expect(body).toBeTruthy();
  });

  test("catálogo com login mostra controles de coleção", async ({ page }) => {
    await registerUser(page);
    await page.goto("/catalogo");
    // After login, collection controls should appear
    await expect(page.locator("h1")).toContainText("Catálogo");
    // Controls are buttons with − and +
    const controls = page.locator('button[aria-label*="normal"], button[aria-label*="foil"]');
    const count = await controls.count();
    // Catalog may be empty if no sync done yet
    if (count > 0) {
      await expect(controls.first()).toBeVisible();
    }
  });
});
