import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1536, height: 960 } });
  const page = await context.newPage();

  console.log('Navigating to root...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });

  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'prabodha@carchief.com');
    await page.fill('input[type="password"]', 'Password@1234');
    await page.click('button[type="submit"]');
  }

  await page.waitForSelector('.cc-dash-page', { timeout: 15000 });
  await page.waitForTimeout(500);

  // 1. Overview Desk (Daylight)
  console.log('Capturing Enterprise Overview Desk...');
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/enterprise_overview_desk.png' });

  // 2. Sourced Vehicles
  console.log('Capturing Enterprise Sourced Vehicles...');
  await page.click('a[href="/vehicles"]');
  await page.waitForSelector('[data-testid="customer-fleet-page"]', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/enterprise_vehicles.png' });

  // 3. Billed Invoices
  console.log('Capturing Enterprise Billed Invoices...');
  await page.click('a[href="/invoices"]');
  await page.waitForSelector('[data-testid="customer-invoices-page"]', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/enterprise_invoices.png' });

  // 4. Wire Remittance
  console.log('Capturing Enterprise Wire Remittance...');
  await page.click('a[href="/payments"]');
  await page.waitForSelector('[data-testid="customer-payments-page"]', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/enterprise_payments.png' });

  // 5. Bulletins
  console.log('Capturing Enterprise Bulletins...');
  await page.click('a[href="/notifications"]');
  await page.waitForSelector('.cc-notifs-page', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/enterprise_bulletins.png' });

  // 6. Client Profile
  console.log('Capturing Enterprise Client Profile...');
  await page.click('a[href="/profile"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/enterprise_profile.png' });

  console.log('All enterprise screenshots captured successfully!');
  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
