import { test, expect, type Page } from '@playwright/test';

/**
 * Contact/vehicle enquiry, anonymous reservation guidance, and the
 * transactional reserve action (PUB-13, PUB-14, PUB-15, PUB-16, PUB-23,
 * RULE-05, RULE-08, RULE-10, D01-P06-T005). These tests use the running
 * mock HTTP service end to end via the generated services — never local
 * component state alone — and a fresh page load after each mutation proves
 * the result is retrievable through the service boundary, not merely held
 * in memory.
 *
 * Vehicle fixtures used (`apps/mock-api/src/store.ts` seed, all `Available`
 * unless noted): veh-1 (2021 Toyota Corolla Axio), veh-3 (2022 Nissan
 * X-Trail), veh-4 (2019 Subaru Forester), veh-5 (2021 Honda Fit Hybrid),
 * veh-6 (2018 Mitsubishi Fuso Canter), veh-7 (2023 Lexus RX450h),
 * veh-sold (2019 Mazda CX-5, `Sold`).
 */

const AVAILABLE_VEHICLE = { slug: '2021-toyota-corolla-axio-veh-1', label: '2021 Toyota Corolla Axio' };
const LIMIT_TEST_VEHICLES = [
  '2022-nissan-x-trail-veh-3',
  '2019-subaru-forester-veh-4',
  '2021-honda-fit-hybrid-veh-5',
];
const LIMIT_TEST_ATTEMPT_VEHICLE = '2018-mitsubishi-fuso-canter-veh-6';
const CONFLICT_VEHICLE = { slug: '2023-lexus-rx450h-veh-7', label: '2023 Lexus RX450h' };
const SOLD_VEHICLE = { slug: '2019-mazda-cx-5-veh-sold', label: '2019 Mazda CX-5' };

/** On phone/tablet the header's nav lives inside the collapsed hamburger drawer, mirroring tests/e2e/home-showroom.spec.ts. */
async function openMobileMenuIfNeeded(page: Page): Promise<void> {
  const mobileMenu = page.locator('.mobile-menu-toggle');
  if (await mobileMenu.isVisible()) {
    await mobileMenu.click();
  }
}

/**
 * Crafts a token in the mock's own unsigned demo-JWT format
 * (`packages/domain/src/auth.ts`'s `createDemoJwtToken`) without importing
 * server-side code into this Node-side test script. This is the only way an
 * automated test can exercise a `Salesperson`/other-customer identity: the
 * public `POST /api/v1/auth/demo-session` endpoint deliberately mints a
 * `CustomerBuyer` identity only and never a caller-supplied role
 * (`D01-P06-T003`, so the public UI itself can never self-elevate). No
 * product code takes this path — it only exercises the already-implemented,
 * server-authoritative `hasPermission` gate from outside.
 */
function craftDemoToken(role: string, sub: string, email: string): string {
  const claims = { sub, email, role, permissions: [], exp: Math.floor(Date.now() / 1000) + 3600 };
  const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64');
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.demo-signature`;
}

async function signInViaUi(page: Page, returnToSlug?: string): Promise<void> {
  const returnTo = returnToSlug ? `?returnTo=${encodeURIComponent(`/vehicles/${returnToSlug}`)}` : '';
  await page.goto(`/account${returnTo}`);
  await Promise.all([
    returnToSlug ? page.waitForURL(new RegExp(`/vehicles/${returnToSlug}$`)) : page.waitForURL((url) => url.pathname === '/'),
    page.getByRole('button', { name: 'Continue with Demo Customer Account' }).click(),
  ]);
}

test.describe('Contact and vehicle enquiry journeys', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    // Deterministic reset (RULE-08): every test starts from clean enquiry/reservation/session state.
    await request.post(`${baseURL}/api/v1/__reset`);
  });

  test('a visitor can send a general contact enquiry and see a confirmation', async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel('Name').fill('Amina Kato');
    await page.getByLabel('Email').fill('amina@example.com');
    await page.getByLabel('Phone number').fill('+256700222333');
    await page.getByLabel('Message').fill('I am interested in your current stock.');
    await page.getByLabel('I agree to be contacted by CarChief about this enquiry.').check();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/enquiries') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send enquiry' }).click(),
    ]);
    expect(response.status()).toBe(201);
    await expect(page.getByRole('status').filter({ hasText: 'Your enquiry was received' })).toBeVisible();
  });

  test('a visitor can start a vehicle-specific enquiry from the vehicle detail page, and it is visible via the staff/salesperson service boundary', async ({
    page,
    request,
    baseURL,
  }) => {
    await page.goto(`/vehicles/${AVAILABLE_VEHICLE.slug}`);
    await page.getByRole('link', { name: 'General Enquiry' }).click();
    await expect(page).toHaveURL(new RegExp(`/contact\\?vehicle=${AVAILABLE_VEHICLE.slug}&enquiryType=vehicle`));

    await page.getByLabel('Name').fill('Brian Ochieng');
    await page.getByLabel('Email').fill('brian@example.com');
    await page.getByLabel('Phone number').fill('+256700333444');
    await page.getByLabel('Message').fill('Please share more photos of this vehicle.');
    await page.getByLabel('I agree to be contacted by CarChief about this enquiry.').check();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/enquiries') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send enquiry' }).click(),
    ]);
    expect(response.status()).toBe(201);
    await expect(page.getByRole('status').filter({ hasText: 'Your enquiry was received' })).toBeVisible();

    // PUB-16: this must never fail silently — prove it is durably retrievable
    // through the staff-facing lead boundary (`GET /api/v1/enquiries`), the
    // future Salesperson service boundary this Public Website hands off to
    // (no Salesperson screen is built here — explicitly excluded).
    const staffToken = craftDemoToken('Salesperson', 'staff-1', 'staff@carchief.example');
    const leadsResponse = await request.get(`${baseURL}/api/v1/enquiries`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    expect(leadsResponse.status()).toBe(200);
    const leads = (await leadsResponse.json()).items as Array<{ email: string; vehicleSlug?: string }>;
    expect(leads.some((lead) => lead.email === 'brian@example.com' && lead.vehicleSlug === AVAILABLE_VEHICLE.slug)).toBe(true);
  });
});

test.describe('Anonymous reservation guidance on the vehicle detail page', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await request.post(`${baseURL}/api/v1/__reset`);
  });

  test('an anonymous visitor trying to reserve a vehicle is told clearly what to do next, not a silent failure (PUB-23)', async ({
    page,
  }) => {
    await page.goto(`/vehicles/${AVAILABLE_VEHICLE.slug}`);
    const guidance = page.getByRole('status').filter({ hasText: 'Sign in to reserve this vehicle' });
    await expect(guidance).toBeVisible();
    await expect(guidance.getByText('Nothing has been reserved yet', { exact: false })).toBeVisible();
    await expect(guidance.getByRole('link', { name: 'Sign In to Reserve' })).toHaveAttribute(
      'href',
      `/account?returnTo=%2Fvehicles%2F${AVAILABLE_VEHICLE.slug}`
    );
  });

  test('a vehicle that is not reservable shows an honest unavailable state, never a Reserve action that would fail (RULE-09)', async ({
    page,
  }) => {
    await page.goto(`/vehicles/${SOLD_VEHICLE.slug}`);
    const notice = page.getByRole('status').filter({ hasText: 'Reservation not available' });
    await expect(notice).toBeVisible();
    await expect(notice.getByText('status: Sold', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reserve This Vehicle' })).toHaveCount(0);
  });
});

test.describe('Signed-in reservation eligibility, success, expiry and conflict feedback', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await request.post(`${baseURL}/api/v1/__reset`);
  });

  test('a signed-in visitor can reserve an available vehicle, and the hold persists after a reload through the service boundary', async ({
    page,
  }) => {
    await signInViaUi(page, AVAILABLE_VEHICLE.slug);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/reservations') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Reserve This Vehicle' }).click(),
    ]);
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.status).toBe('active');
    expect(body.holdHours).toBe(48);

    const success = page.getByRole('status').filter({ hasText: `${AVAILABLE_VEHICLE.label} is on hold for you` });
    await expect(success).toBeVisible();
    const successText = await success.innerText();
    expect(successText.toLowerCase()).not.toContain('automatically released');

    // Fresh load: local component state alone would forget this — the
    // active-hold state must come back from `GET /api/v1/reservations/:id`.
    await page.reload();
    await expect(page.getByRole('status').filter({ hasText: `${AVAILABLE_VEHICLE.label} is on hold for you` })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reserve This Vehicle' })).toHaveCount(0);
  });

  test('reserving a vehicle already on hold for a different customer surfaces a conflict, not a silent failure', async ({
    page,
    request,
    baseURL,
  }) => {
    const otherCustomerToken = craftDemoToken('CustomerBuyer', 'user-other', 'other@carchief.example');
    const holdResponse = await request.post(`${baseURL}/api/v1/reservations`, {
      headers: { Authorization: `Bearer ${otherCustomerToken}`, 'Content-Type': 'application/json' },
      data: { vehicleSlug: CONFLICT_VEHICLE.slug },
    });
    expect(holdResponse.status()).toBe(201);

    await signInViaUi(page, CONFLICT_VEHICLE.slug);
    await page.getByRole('button', { name: 'Reserve This Vehicle' }).click();

    await expect(
      page.getByRole('alert').filter({ hasText: 'already on hold for another customer' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reserve This Vehicle' })).toBeVisible();
  });

  test('attempting to reserve the same vehicle a second time (no local record of the first) surfaces a duplicate message', async ({
    page,
  }) => {
    await signInViaUi(page, AVAILABLE_VEHICLE.slug);
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/reservations') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Reserve This Vehicle' }).click(),
    ]);
    await expect(page.getByRole('status').filter({ hasText: 'is on hold for you' })).toBeVisible();

    // Simulate a second device/browser with no local pointer to the
    // reservation this same customer already holds server-side.
    await page.evaluate(() => window.localStorage.removeItem('carchief.reservationLinks.v1'));
    await page.reload();
    await expect(page.getByRole('button', { name: 'Reserve This Vehicle' })).toBeVisible();
    await page.getByRole('button', { name: 'Reserve This Vehicle' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'already have an active reservation' })).toBeVisible();
  });

  test('reaching the per-customer reservation ceiling surfaces a limit message, not a silent failure', async ({
    page,
    request,
    baseURL,
  }) => {
    const demoResponse = await request.post(`${baseURL}/api/v1/auth/demo-session`);
    const { token } = await demoResponse.json();
    for (const vehicleSlug of LIMIT_TEST_VEHICLES) {
      const holdResponse = await request.post(`${baseURL}/api/v1/reservations`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { vehicleSlug },
      });
      expect(holdResponse.status()).toBe(201);
    }

    await signInViaUi(page, LIMIT_TEST_ATTEMPT_VEHICLE);
    await page.getByRole('button', { name: 'Reserve This Vehicle' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'the maximum allowed at once' })).toBeVisible();
  });
});
