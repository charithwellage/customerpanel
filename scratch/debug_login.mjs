import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
  console.log('Current URL:', page.url());
  await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/debug_page.png' });
  
  const emailInput = await page.$('input[type="email"]');
  console.log('Has email input:', !!emailInput);
  if (emailInput) {
    await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
    await page.fill('input[type="password"]', 'Password@1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('After submit URL:', page.url());
    await page.screenshot({ path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/debug_after_login.png' });
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
