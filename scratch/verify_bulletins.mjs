import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`HTTP ${resp.status()} for ${resp.url()}`);
    }
  });

  console.log('Navigating to root...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });

  console.log('Filling credentials...');
  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'CarChief#Fixture2026');

  console.log('Submitting login...');
  await page.click('button[type="submit"]');

  console.log('Waiting for shell navigation...');
  await page.waitForSelector('nav, .cc-cust-shell, button:has-text("Bulletins"), a[href*="/notifications"]', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('Clicking Bulletins sidebar link...');
  const bulletinsBtn = page.locator('button:has-text("Bulletins"), a:has-text("Bulletins"), a[href*="/notifications"]').first();
  await bulletinsBtn.click();

  console.log('Waiting for Bulletins page list...');
  await page.waitForSelector('.cc-notifs-list', { timeout: 15000 });
  await page.waitForTimeout(1500);

  const artifactDir = '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9';

  console.log('Capturing Initial Bulletins Screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'customer_bulletins_verified.png'), fullPage: false });

  // Test searching in notifications
  console.log('Searching for INV-31644...');
  await page.fill('#bulletins-search', 'INV-31644');
  await page.waitForTimeout(1000);

  console.log('Capturing Bulletins Search Screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'customer_bulletins_search.png'), fullPage: false });

  // Clear search
  await page.fill('#bulletins-search', '');
  await page.waitForTimeout(1000);

  // Test clicking READ on the first unread notification
  const readBtn = page.locator('.cc-notif-read-btn').first();
  if (await readBtn.count() > 0) {
    console.log('Clicking READ button on unread notification...');
    await readBtn.click();
    await page.waitForTimeout(1500);

    console.log('Capturing Bulletins after Mark Read Screenshot...');
    await page.screenshot({ path: path.join(artifactDir, 'customer_bulletins_marked_read.png'), fullPage: false });
  }

  console.log('Bulletins verification completed successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
