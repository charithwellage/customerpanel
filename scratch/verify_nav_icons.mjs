import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to root...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });

  // If already logged in or needs login
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('Filling credentials...');
    await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
    await page.fill('input[type="password"]', 'CarChief#Fixture2026');

    console.log('Submitting login...');
    await page.click('button[type="submit"]');
  }

  console.log('Waiting for sidebar navigation...');
  await page.waitForSelector('.cc-cust-shell-sidebar', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('Capturing sidebar navigation with new vector icons...');
  const sidebar = await page.waitForSelector('.cc-cust-shell-sidebar');
  await sidebar.screenshot({
    path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_sidebar_vector_icons_verified.png',
  });

  await page.screenshot({
    path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_portal_vector_icons_full.png',
  });

  console.log('Sidebar vector icons verification completed successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
