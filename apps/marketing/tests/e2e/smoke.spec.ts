import { test, expect } from "@playwright/test";

// Smoke tests over the static app shell — resilient to the API being offline
// (these routes render their chrome before/independent of data fetches).

test("home renders brand + nav", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/XCreativs/i);
  await expect(page.getByRole("link", { name: /XCreativs/i }).first()).toBeVisible();
});

test("login redirects to the portal app", async ({ request }) => {
  // Auth lives in the separate portal app; marketing /login forwards there.
  // Assert the redirect without following it (the portal isn't up in this job).
  const res = await request.get("/login", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()["location"]).toContain("/login");
});

test("careers talent-network form is reachable", async ({ page }) => {
  await page.goto("/careers/talent-network");
  await expect(page.getByRole("heading", { name: /Talent Network/i })).toBeVisible();
});

test("tools index lists interactive utilities", async ({ page }) => {
  await page.goto("/tools");
  await expect(page.getByRole("heading").first()).toBeVisible();
});
