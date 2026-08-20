import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to root...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });

  console.log('Filling credentials...');
  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'CarChief#Fixture2026');

  console.log('Submitting login...');
  await page.click('button[type="submit"]');

  console.log('Waiting for shell navigation...');
  await page.waitForSelector('nav, button:has-text("Client Profile"), a[href*="/profile"]', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('Clicking Client Profile link...');
  const profileBtn = page.locator('button:has-text("Client Profile"), a:has-text("Client Profile"), a[href*="/profile"]').first();
  await profileBtn.click();

  console.log('Waiting for Profile Grid...');
  await page.waitForSelector('.cc-profile-grid', { timeout: 15000 });
  await page.waitForTimeout(1500);

  const artifactDir = '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9';

  console.log('Capturing Initial Profile Page Screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'customer_profile_verified.png'), fullPage: false });

  // Test updating company name, phone and address
  console.log('Updating profile details...');
  const companyInput = page.locator('#profile-company-input');
  const phoneInput = page.locator('#profile-phone-input');
  const addressInput = page.locator('#profile-address-input');

  await companyInput.fill('Charith Enterprise Logistics Ltd.');
  await phoneInput.fill('+94715991619');
  await addressInput.fill('No. 128 High Level Road, Colombo 05, Sri Lanka');

  console.log('Clicking Commit Modifications...');
  await page.click('button:has-text("COMMIT MODIFICATIONS")');
  await page.waitForTimeout(1500);

  console.log('Capturing Saved Profile Page Screenshot...');
  await page.screenshot({ path: path.join(artifactDir, 'customer_profile_saved.png'), fullPage: false });

  console.log('Verification completed successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
