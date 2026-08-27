import { chromium } from '../node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to root...');
  await page.goto('http://127.0.0.1:3001/', { waitUntil: 'networkidle' });

  console.log('Filling credentials...');
  await page.fill('input[type="email"]', 'r.a.rimazmoulana@gmail.com');
  await page.fill('input[type="password"]', 'Password@1234');

  console.log('Submitting login...');
  await page.click('button[type="submit"]');

  console.log('Waiting for shell navigation...');
  await page.waitForSelector('.cc-cust-shell-layout', { timeout: 10000 });

  console.log('Clicking Sourced Vehicles sidebar link...');
  await page.click('a[href="/vehicles"]');

  console.log('Waiting for vehicles fleet grid...');
  await page.waitForSelector('.cc-cust-fleet-grid', { timeout: 10000 });
  await page.waitForTimeout(1000);

  console.log('Clicking TRACK SHIPMENT button on the first vehicle card...');
  const trackBtn = await page.waitForSelector('.cc-cust-fleet-card__track-btn', { timeout: 5000 });
  await trackBtn.click();

  console.log('Waiting for VehicleTrackingModal...');
  await page.waitForSelector('[data-testid="vehicle-tracking-modal"]', { timeout: 5000 });
  await page.waitForTimeout(500);

  console.log('Capturing Vehicle Tracking Modal Screenshot...');
  await page.screenshot({
    path: '/Users/rimaz/.gemini/antigravity-ide/brain/70666dde-7e00-4268-9465-f88bc49562c9/customer_tracking_modal_verified.png',
  });

  console.log('Vehicle tracking modal verification completed successfully.');
  await browser.close();
}

main().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
