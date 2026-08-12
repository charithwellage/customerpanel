import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

const LEGACY_MAP: Record<string, string> = {
  'index.php': '/',
  'stock.php': '/vehicles',
  'stock_list.php': '/vehicles',
  'search.php': '/vehicles',
  'stock_detail.php': '/vehicles',
  'shipping.php': '/shipping-schedule',
  'schedule.php': '/shipping-schedule',
  'auction.php': '/auction',
  'auctions.php': '/auction',
  'company.php': '/about',
  'about.php': '/about',
  'about_us.php': '/about',
  'contact.php': '/contact',
  'enquiry.php': '/contact',
  'inquiry.php': '/contact',
  'services.php': '/services',
  'how_to_buy.php': '/how-to-buy',
  'buying_guide.php': '/how-to-buy',
  'privacy.php': '/privacy',
  'privacy_policy.php': '/privacy',
  'faq.php': '/faq',
  'testimonials.php': '/testimonials',
  'branch.php': '/branches',
  'branches.php': '/branches',
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ legacyFile?: string }> }
) {
  const { legacyFile } = await context.params;
  const fileName = legacyFile ? `${legacyFile}.php`.toLowerCase() : 'index.php';
  const target = LEGACY_MAP[fileName] ?? '/';
  redirect(target);
}
