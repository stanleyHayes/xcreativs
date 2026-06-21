import { test, expect } from "@playwright/test";

// Smoke tests over the portal app shell — resilient to the API being offline
// (these routes render their chrome before/independent of data fetches).

test("portal landing renders brand + sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Portal/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
});

test("login shows credential form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
  await expect(page.getByPlaceholder(/you@organisation\.com/i)).toBeVisible();
  await expect(page.getByPlaceholder(/Enter your password/i)).toBeVisible();
});
