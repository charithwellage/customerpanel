import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';
import path from 'path';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'Password@1234');
  await page.click('button[type="submit"]');

  await page.waitForSelector('nav, a[href*="payments"], button:has-text("Overview")', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('Navigating to /payments...');
  await page.goto('http://localhost:3001/payments');
  await page.waitForSelector('.cc-remit-table, [data-testid="customer-payments-page"]', { timeout: 15000 });
  await page.waitForTimeout(1500);

  const artifactDir = '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9';

  console.log('Opening Submit Payment Proof modal...');
  await page.click('[data-testid="btn-submit-payment-proof"]');
  await page.waitForSelector('.cc-remit-modal-card', { timeout: 5000 });
  await page.waitForTimeout(500);

  // Check currency options
  const currencyOptions = await page.$$eval('#remit-currency-select option', (opts) =>
    opts.map((o) => ({ value: o.value, text: o.textContent.trim() }))
  );
  console.log('Available Currency Options:', currencyOptions);

  // Select JPY Yen
  await page.selectOption('#remit-currency-select', 'JPY');
  await page.fill('input[placeholder*="TT-984021"]', 'TT-2026-TOKYO-YEN-09');
  await page.fill('input[placeholder*="Barclays Bank"]', 'Bank of Tokyo-Mitsubishi UFJ (JPY)');
  await page.fill('#remit-amount-input', '3500000');
  await page.fill('textarea[placeholder*="Wire transfer deposit"]', 'Japanese Yen TT wire remittance for export stock clearance');

  // Create a mock proof file
  const testProofPath = path.join(artifactDir, 'scratch', 'test_remittance_proof.pdf');
  fs.writeFileSync(testProofPath, '%PDF-1.4 Mock Remittance TT Proof Document');
  await page.setInputFiles('#remit-proof-input', testProofPath);

  console.log('Capturing Filled Modal with JPY Screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'multicurrency_modal_filled.png'), fullPage: false });

  console.log('Submitting TT form...');
  await page.click('button:has-text("SUBMIT TT FOR FINANCE APPROVAL")');
  await page.waitForSelector('.cc-remit-alert--success, .cc-remit-modal-card:has-text("submitted successfully")', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('Capturing Updated Table with JPY Remittance Screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'multicurrency_table_updated.png'), fullPage: false });

  console.log('Multi-currency verification complete.');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
