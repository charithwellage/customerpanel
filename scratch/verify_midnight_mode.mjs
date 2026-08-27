import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to root...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });

  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('Logging in...');
    await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
    await page.fill('input[type="password"]', 'Password@1234');
    await page.click('button[type="submit"]');
  }

  await page.waitForSelector('.cc-dash-page', { timeout: 15000 });
  await page.waitForTimeout(500);

  // Capture Daylight Mode first
  console.log('Capturing DAYLIGHT Overview...');
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_daylight_mode_overview.png' });

  // Enable Midnight Mode
  console.log('Enabling Midnight Mode...');
  const midnightBtn = await page.waitForSelector('button[title="Switch to Midnight Mode"]', { timeout: 5000 });
  await midnightBtn.click();
  await page.waitForTimeout(600);

  // Capture Overview in Midnight Mode
  console.log('Capturing MIDNIGHT Overview...');
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_midnight_mode_overview.png' });

  // Vehicles
  console.log('Navigating to Sourced Vehicles...');
  await page.click('a[href="/vehicles"]');
  await page.waitForSelector('[data-testid="customer-fleet-page"]', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_midnight_mode_vehicles.png' });

  // Invoices
  console.log('Navigating to Billed Invoices...');
  await page.click('a[href="/invoices"]');
  await page.waitForSelector('[data-testid="customer-invoices-page"]', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_midnight_mode_invoices.png' });

  // Payments
  console.log('Navigating to Wire Remittance...');
  await page.click('a[href="/payments"]');
  await page.waitForSelector('[data-testid="customer-payments-page"]', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_midnight_mode_payments.png' });

  // Bulletins
  console.log('Navigating to Bulletins...');
  await page.click('a[href="/notifications"]');
  await page.waitForSelector('.cc-notifs-page', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_midnight_mode_bulletins.png' });

  // Documents
  console.log('Navigating to Secure Vault...');
  await page.click('a[href="/documents"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_midnight_mode_documents.png' });

  // Switch back to Daylight
  console.log('Switching back to Daylight Mode...');
  const daylightBtn = await page.waitForSelector('button[title="Switch to Daylight Mode"]', { timeout: 5000 });
  await daylightBtn.click();
  await page.waitForTimeout(600);

  await page.click('a[href="/dashboard"]');
  await page.waitForSelector('.cc-dash-page', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_daylight_mode_return.png' });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
