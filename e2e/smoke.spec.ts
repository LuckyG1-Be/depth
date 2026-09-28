import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Depth");
});

test("public home and login render without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await expect(page.getByRole("heading", { name: /Ontmoet iemand/i })).toBeVisible();
  await page.getByRole("link", { name: "Ik heb al een account" }).click();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("demo user can log in and reach discover", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("E-mailadres").fill("gilles+1@depth.local");
  await page.getByPlaceholder("Wachtwoord").fill("DepthTest123!");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page).toHaveURL(/\/discover/);
  await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
});

test("discover remains usable on a mobile viewport", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("E-mailadres").fill("gilles+1@depth.local");
  await page.getByPlaceholder("Wachtwoord").fill("DepthTest123!");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page).toHaveURL(/\/discover/);
  await expect(page.getByText("Datingvoorkeuren").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("profile preview and safety information render", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("E-mailadres").fill("gilles+1@depth.local");
  await page.getByPlaceholder("Wachtwoord").fill("DepthTest123!");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.goto("/profile/preview");
  await expect(page.getByRole("heading", { name: "Profielpreview" })).toBeVisible();
  await page.goto("/safety");
  await expect(page.getByRole("heading", { name: "Jij houdt de controle." })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Duidelijk over je gegevens." })).toBeVisible();
});

test("Plus page stays safe when billing is not configured", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("E-mailadres").fill("gilles+1@depth.local");
  await page.getByPlaceholder("Wachtwoord").fill("DepthTest123!");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.goto("/plus");
  await expect(page.getByRole("heading", { name: "Meer controle over wie je ontmoet." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Depth Plus" })).toBeVisible();
});
