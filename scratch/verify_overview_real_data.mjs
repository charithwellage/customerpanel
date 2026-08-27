import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to root...');
  await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });

  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    console.log('Filling credentials...');
    await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
    await page.fill('input[type="password"]', 'Password@1234');

    console.log('Submitting login...');
    await page.click('button[type="submit"]');
  }

  console.log('Waiting for Overview Desk layout...');
  await page.waitForSelector('.cc-dash-page', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('Capturing Overview Desk with real database API data...');
  await page.screenshot({
    path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_overview_real_data_verified.png',
  });

  console.log('Clicking on first vehicle in Active Shipment Tracking list...');
  const firstShipment = await page.waitForSelector('.cc-dash-shipment-item', { timeout: 5000 });
  await firstShipment.click();

  console.log('Waiting for VehicleTrackingModal...');
  await page.waitForSelector('[data-testid="vehicle-tracking-modal"]', { timeout: 5000 });
  await page.waitForTimeout(500);

  console.log('Capturing Overview Tracking Modal popup screenshot...');
  await page.screenshot({
    path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_overview_tracking_modal_opened.png',
  });

  console.log('Overview Desk verification completed successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
