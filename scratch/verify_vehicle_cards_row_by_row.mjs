import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'Password@1234');
  await page.click('button[type="submit"]');

  await page.waitForSelector('nav, a[href*="vehicles"], button:has-text("Overview")', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('Navigating to /vehicles (Invoiced tab)...');
  await page.goto('http://localhost:3001/vehicles');
  await page.waitForSelector('.cc-cust-fleet-card', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Click on "Invoiced Vehicles" tab if needed or verify active tab
  const invoicedTab = page.locator('button:has-text("Invoiced Vehicles"), [role="tab"]:has-text("Invoiced")');
  if (await invoicedTab.count() > 0) {
    await invoicedTab.first().click();
    await page.waitForTimeout(1000);
  }

  const artifactDir = '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9';

  console.log('Capturing Vehicle Grid Screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'customer_vehicles_row_by_row_grid.png'), fullPage: false });

  // Take a clean element screenshot of the first vehicle card
  const firstCard = page.locator('.cc-cust-fleet-card').first();
  if (await firstCard.count() > 0) {
    console.log('Capturing First Card Close-up Screenshot...');
    await firstCard.screenshot({ path: path.join(artifactDir, 'customer_vehicles_card_closeup.png') });
  }

  console.log('Verification completed successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
