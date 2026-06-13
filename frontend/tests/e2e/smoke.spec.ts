import { test, expect } from "@playwright/test";

// Smoke tests over the static app shell — resilient to the API being offline
// (these routes render their chrome before/independent of data fetches).

test("home renders brand + nav", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/XCreativs/i);
  await expect(page.getByRole("link", { name: /XCreativs/i }).first()).toBeVisible();
});

test("login shows form + SSO options", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Google/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Microsoft/i })).toBeVisible();
});

test("careers talent-network form is reachable", async ({ page }) => {
  await page.goto("/careers/talent-network");
  await expect(page.getByRole("heading", { name: /Talent Network/i })).toBeVisible();
});

test("tools index lists interactive utilities", async ({ page }) => {
  await page.goto("/tools");
  await expect(page.getByRole("heading").first()).toBeVisible();
});
