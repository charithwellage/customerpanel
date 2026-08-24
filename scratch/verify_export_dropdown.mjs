import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });

  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'Password@1234');
  await page.click('button[type="submit"]');

  await page.waitForSelector('nav, a[href*="invoices"], button:has-text("Overview")', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('Navigating to /invoices...');
  await page.goto('http://localhost:3001/invoices');
  await page.waitForSelector('.cc-inv-table, button:has-text("LEDGER")', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('Clicking LEDGER button on row 1...');
  const ledgerBtn = page.locator('button:has-text("LEDGER")').first();
  await ledgerBtn.click();
  await page.waitForSelector('[data-testid="invoice-ledger-modal"]', { timeout: 10000 });
  await page.waitForTimeout(600);

  console.log('Clicking Download Action Button...');
  const downloadBtn = page.locator('[data-testid="ledger-download-btn"]');
  await downloadBtn.click();
  await page.waitForSelector('[data-testid="ledger-export-dropdown"]', { timeout: 5000 });
  await page.waitForTimeout(400);

  const artifactDir = '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9';

  console.log('Capturing Export Dropdown Screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'customer_ledger_export_dropdown.png'), fullPage: false });

  // Test clicking CSV download
  console.log('Testing CSV download click...');
  const [downloadCsv] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="export-format-csv"]'),
  ]);
  console.log('CSV downloaded:', await downloadCsv.suggestedFilename());

  // Re-open menu to test JSON
  await downloadBtn.click();
  await page.waitForSelector('[data-testid="ledger-export-dropdown"]');
  const [downloadJson] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="export-format-json"]'),
  ]);
  console.log('JSON downloaded:', await downloadJson.suggestedFilename());

  // Re-open menu to test TXT
  await downloadBtn.click();
  await page.waitForSelector('[data-testid="ledger-export-dropdown"]');
  const [downloadTxt] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="export-format-txt"]'),
  ]);
  console.log('TXT downloaded:', await downloadTxt.suggestedFilename());

  console.log('All downloads tested successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
