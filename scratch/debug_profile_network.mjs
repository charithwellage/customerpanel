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
  await page.fill('input[type="password"]', 'Password@1234');

  console.log('Submitting login...');
  await page.click('button[type="submit"]');

  console.log('Waiting for shell navigation...');
  await page.waitForSelector('nav, .cc-cust-shell, button:has-text("Client Profile"), a[href*="/profile"]', { timeout: 15000 });
  await page.waitForTimeout(1500);

  const artifactDir = '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9';
  await page.screenshot({ path: path.join(artifactDir, 'debug_shell_after_login.png') });

  console.log('Clicking Client Profile link...');
  const profileBtn = page.locator('button:has-text("Client Profile"), a:has-text("Client Profile"), a[href*="/profile"]').first();
  await profileBtn.click();
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(artifactDir, 'debug_after_profile_click.png') });

  const html = await page.content();
  console.log('HTML after profile click (len):', html.length);
  console.log('HTML snippet:', html.slice(0, 1500));

  await browser.close();
}

main().catch(console.error);
