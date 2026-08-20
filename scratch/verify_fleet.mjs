import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  console.log('Filling login form with CarChief#Fixture2026...');
  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'CarChief#Fixture2026');

  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/v1/auth/login')),
    page.click('button[type="submit"]'),
  ]);

  await page.waitForTimeout(1000);

  // Click on "Sourced Vehicles"
  const vehiclesNav = page.locator('nav a:has-text("Vehicles"), a[href*="vehicles"], button:has-text("Vehicles"), a:has-text("Sourced Vehicles")').first();
  if (await vehiclesNav.count() > 0) {
    await vehiclesNav.click();
  }

  await page.waitForTimeout(1500);

  const artifactDir = '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9';

  // 1. Tab: Reserved (5)
  console.log('Clicking Tab 1: Reserved (5)...');
  const tabReserved = page.locator('button:has-text("RESERVED (5)")').first();
  await tabReserved.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'customer_vehicles_tab_reserved_5.png'), fullPage: true });

  // 2. Tab: With PI (6)
  console.log('Clicking Tab 2: With PI (6)...');
  const tabWithPI = page.locator('button:has-text("WITH PI (6)")').first();
  await tabWithPI.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'customer_vehicles_tab_with_pi_6.png'), fullPage: true });

  // 3. Tab: Invoiced (16)
  console.log('Clicking Tab 3: Invoiced (16)...');
  const tabInvoiced = page.locator('button:has-text("INVOICED (16)")').first();
  await tabInvoiced.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'customer_vehicles_tab_invoiced_16.png'), fullPage: true });

  console.log('All tab screenshots captured successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
