/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@carchief/api-client', '@carchief/domain', '@carchief/pwa', '@carchief/theme',
    '@carchief/ui', '@carchief/validation', '@carchief/vehicle-detail', '@carchief/vehicle-search',
  ],
  async redirects() {
    return [
      { source: '/index.php', destination: '/', permanent: true },
      { source: '/stock.php', destination: '/vehicles', permanent: true },
      { source: '/stock_list.php', destination: '/vehicles', permanent: true },
      { source: '/search.php', destination: '/vehicles', permanent: true },
      { source: '/stock_detail.php', destination: '/vehicles', permanent: true },
      { source: '/shipping.php', destination: '/shipping-schedule', permanent: true },
      { source: '/schedule.php', destination: '/shipping-schedule', permanent: true },
      { source: '/auction.php', destination: '/auction', permanent: true },
      { source: '/auctions.php', destination: '/auction', permanent: true },
      { source: '/company.php', destination: '/about', permanent: true },
      { source: '/about.php', destination: '/about', permanent: true },
      { source: '/about_us.php', destination: '/about', permanent: true },
      { source: '/contact.php', destination: '/contact', permanent: true },
      { source: '/enquiry.php', destination: '/contact', permanent: true },
      { source: '/inquiry.php', destination: '/contact', permanent: true },
      { source: '/services.php', destination: '/services', permanent: true },
      { source: '/how_to_buy.php', destination: '/how-to-buy', permanent: true },
      { source: '/buying_guide.php', destination: '/how-to-buy', permanent: true },
      { source: '/privacy.php', destination: '/privacy', permanent: true },
      { source: '/privacy_policy.php', destination: '/privacy', permanent: true },
      { source: '/faq.php', destination: '/faq', permanent: true },
      { source: '/testimonials.php', destination: '/testimonials', permanent: true },
      { source: '/branch.php', destination: '/branches', permanent: true },
      { source: '/branches.php', destination: '/branches', permanent: true },
    ];
  },
};

export default nextConfig;
