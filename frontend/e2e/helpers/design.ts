import { type Page, expect } from "@playwright/test";

export const DESIGN_TOKENS = {
  bgPrimary: "rgb(8, 8, 15)",
  bgSecondary: "rgb(17, 17, 25)",
  textPrimary: "rgb(240, 240, 245)",
  textSecondary: "rgb(157, 157, 171)",
  accent1: "rgb(0, 229, 160)",
  accent2: "rgb(255, 61, 113)",
  accent3: "rgb(123, 97, 255)",
  fontDisplay: "Syne",
  fontBody: "Outfit",
} as const;

export async function expectBgColor(
  page: Page,
  selector: string,
  expectedRgb: string,
): Promise<void> {
  const actual = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).backgroundColor : null;
  }, selector);
  expect(actual).toBe(expectedRgb);
}

export async function expectFontFamily(
  page: Page,
  selector: string,
  expectedFamily: string,
): Promise<void> {
  const actual = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).fontFamily : null;
  }, selector);
  expect(actual).not.toBeNull();
  expect(actual!.toLowerCase()).toContain(expectedFamily.toLowerCase());
}

export async function expectTextColor(
  page: Page,
  selector: string,
  expectedRgb: string,
): Promise<void> {
  const actual = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).color : null;
  }, selector);
  expect(actual).toBe(expectedRgb);
}
