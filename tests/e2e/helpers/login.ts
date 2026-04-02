import { Page } from "@playwright/test";

export async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "kyouhayuki");
  await page.click('button[type="submit"]:has-text("ログイン")');
  await page.waitForURL("**/dashboard");
}

export async function adminLogin(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@test.com");
  await page.fill('input[name="password"]', "admintarou");
  await page.click('button[type="submit"]:has-text("ログイン")');
  await page.waitForURL("**/dashboard");
}
