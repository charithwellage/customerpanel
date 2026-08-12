import { NextResponse, type NextRequest } from 'next/server';

const LEGACY_REDIRECTS: Record<string, string> = {
  '/index.php': '/',
  '/stock.php': '/vehicles',
  '/stock_list.php': '/vehicles',
  '/search.php': '/vehicles',
  '/stock_detail.php': '/vehicles',
  '/shipping.php': '/shipping-schedule',
  '/schedule.php': '/shipping-schedule',
  '/auction.php': '/auction',
  '/auctions.php': '/auction',
  '/company.php': '/about',
  '/about.php': '/about',
  '/about_us.php': '/about',
  '/contact.php': '/contact',
  '/enquiry.php': '/contact',
  '/inquiry.php': '/contact',
  '/services.php': '/services',
  '/how_to_buy.php': '/how-to-buy',
  '/buying_guide.php': '/how-to-buy',
  '/privacy.php': '/privacy',
  '/privacy_policy.php': '/privacy',
  '/faq.php': '/faq',
  '/testimonials.php': '/testimonials',
  '/branch.php': '/branches',
  '/branches.php': '/branches',
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.toLowerCase();
  const destination = LEGACY_REDIRECTS[pathname];

  if (destination) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/(.*\\.php)',
  ],
};
