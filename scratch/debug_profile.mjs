import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to login...');
  await page.goto('http://localhost:3001/login');
  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'Password@1234');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  console.log('Current URL after login:', page.url());

  console.log('Clicking Client Profile nav link...');
  const profileLink = page.locator('a[href*="/profile"], button:has-text("Client Profile")');
  if (await profileLink.count() > 0) {
    await profileLink.first().click();
  } else {
    await page.goto('http://localhost:3001/profile');
  }

  await page.waitForTimeout(3000);
  console.log('Current URL after profile navigation:', page.url());

  const artifactDir = '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9';
  await page.screenshot({ path: path.join(artifactDir, 'debug_profile_view.png') });

  const html = await page.content();
  console.log('Page body classes/content snippet:', html.slice(0, 500));

  await browser.close();
}

main().catch(console.error);
