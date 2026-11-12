import { expect, test, type Page } from "@playwright/test";

/**
 * Requiere Supabase local con el seed ficticio y `E2E=1`.
 *   supabase start && supabase db reset
 *   E2E=1 pnpm -C app e2e
 */
test.describe("flujo principal", () => {
test.skip(process.env.E2E !== "1", "Define E2E=1 con Supabase local y seed ficticio.");

async function ingresar(page: Page, rol: string) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(`${rol}@demo.local`);
  await page.getByLabel("Contraseña").fill("demo1234");
  await page.getByRole("button", { name: "Ingresar" }).click();
  // El bombero demo parte sin consentimiento.
  const consentimiento = page.getByRole("button", { name: "Aceptar y continuar" });
  if (await consentimiento.isVisible().catch(() => false)) {
    await page.getByRole("checkbox").check();
    await consentimiento.click();
  }
  await expect(page.getByRole("heading", { name: /Hola,/ })).toBeVisible();
}

test("el director entra y ve las secciones de su rol", async ({ page }) => {
  await ingresar(page, "director");
  await expect(page.getByRole("link", { name: "Tesorería" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Personal" }).first()).toBeVisible();
});

test("el bombero no ve Tesorería ni Administración", async ({ page }) => {
  await ingresar(page, "bombero");
  await expect(page.getByRole("link", { name: "Tesorería" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Administración" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Mi hoja de vida" }).first()).toBeVisible();
});

test("pase de lista sin conexión y sincronización", async ({ page, context }) => {
  await ingresar(page, "ayudante");
  await page.goto("/asistencia/40");
  await expect(page.getByRole("heading", { name: /Lista N° 40/ })).toBeVisible();

  await context.setOffline(true);
  await expect(page.getByText("Sin conexión")).toBeVisible();
  await page.getByRole("button", { name: /^Marcar A a / }).first().click();
  await expect(page.getByText("Sin conexión")).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByText("Sin conexión")).toHaveCount(0, { timeout: 15_000 });
});
});
