import React from 'react';
import { RegistrationPageClient } from './RegistrationPageClient';

/**
 * `/register` route (CUST-26, D02-P12-T003). Reached from the header's
 * Register action. Renders live country/registration data, so this page is
 * dynamic like `/account` rather than statically prerendered.
 */
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return <RegistrationPageClient />;
}
