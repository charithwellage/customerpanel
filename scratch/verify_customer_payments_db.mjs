import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'CarChief#Fixture2026');
  await page.click('button[type="submit"]');

  await page.waitForSelector('nav, a[href*="payments"], button:has-text("Overview")', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('Navigating to /payments...');
  await page.goto('http://localhost:3001/payments');
  await page.waitForSelector('.cc-remit-table, [data-testid="customer-payments-page"]', { timeout: 15000 });
  await page.waitForTimeout(1500);

  const artifactDir = '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9';

  console.log('Capturing Payments Page Screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'customer_payments_db_table.png'), fullPage: false });

  console.log('Opening Submit Payment Proof modal...');
  await page.click('[data-testid="btn-submit-payment-proof"]');
  await page.waitForSelector('.cc-remit-modal-card', { timeout: 5000 });
  await page.waitForTimeout(500);

  console.log('Capturing Submit Modal Screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'customer_payments_modal.png'), fullPage: false });

  console.log('Payments page verification complete.');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
