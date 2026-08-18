import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('PAGE ERROR:', err));
  page.on('response', (res) => console.log('RESPONSE:', res.status(), res.url()));

  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'CarChief#Fixture2026');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  console.log('Current URL after submit:', page.url());
  await browser.close();
}

main().catch(console.error);
