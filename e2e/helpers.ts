import { type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export async function registerUser(
  page: Page,
  opts: {
    name?: string;
    username?: string;
    email?: string;
    password?: string;
  } = {}
) {
  const name = opts.name ?? "Teste E2E";
  const username = opts.username ?? `e2e_${Date.now()}`;
  const email = opts.email ?? `e2e_${Date.now()}@test.local`;
  const password = opts.password ?? "senha123456";

  await page.goto(`${BASE_URL}/cadastro`);
  await page.fill('[name="name"]', name);
  await page.fill('[name="username"]', username);
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.fill('[name="confirmPassword"]', password);
  await page.click('button[type="submit"]');

  return { name, username, email, password };
}

export async function loginUser(
  page: Page,
  email: string,
  password: string
) {
  await page.goto(`${BASE_URL}/entrar`);
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
}

export async function loginAdmin(page: Page) {
  const email = process.env.E2E_ADMIN_EMAIL ?? "admin@test.local";
  const password = process.env.E2E_ADMIN_PASSWORD ?? "adminpassword";
  await loginUser(page, email, password);
}
