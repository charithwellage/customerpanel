import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3001/login...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

  console.log('Logging in as r.a.rimazmoulana@gmail.com...');
  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'CarChief#Fixture2026');

  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/v1/auth/login')),
    page.click('button[type="submit"]'),
  ]);

  await page.waitForTimeout(1000);

  // Navigate to /invoices
  console.log('Navigating to /invoices...');
  const invoicesNav = page.locator('nav a:has-text("Billed Invoices"), a[href*="invoices"], button:has-text("Invoices")').first();
  if (await invoicesNav.count() > 0) {
    await invoicesNav.click();
  } else {
    await page.goto('http://localhost:3001/invoices');
  }

  await page.waitForTimeout(1500);

  const artifactDir = '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9';

  // 1. Capture Invoices Table
  console.log('Capturing Invoices Table...');
  await page.screenshot({ path: path.join(artifactDir, 'customer_invoices_table.png'), fullPage: true });

  // 2. Click LEDGER > button on row with P-85492 or first ledger button
  console.log('Clicking LEDGER button...');
  const ledgerBtn = page.locator('button:has-text("LEDGER")').first();
  await ledgerBtn.click();
  await page.waitForTimeout(1000);

  // 3. Capture Modal Top
  console.log('Capturing Modal Top...');
  await page.screenshot({ path: path.join(artifactDir, 'customer_invoice_ledger_modal_top.png'), fullPage: false });

  // 4. Scroll inside modal dialog to capture bottom summary & remittance
  const modalDialog = page.locator('.cc-ledger-modal-dialog');
  if (await modalDialog.count() > 0) {
    await modalDialog.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(600);
    console.log('Capturing Modal Bottom...');
    await page.screenshot({ path: path.join(artifactDir, 'customer_invoice_ledger_modal_bottom.png'), fullPage: false });
  }

  console.log('Verification screenshots captured successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
