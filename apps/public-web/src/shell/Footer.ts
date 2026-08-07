export interface FooterProps {
  siteName?: string;
  year?: number;
  contactPhone?: string;
}

export function renderFooterConfig(props: FooterProps = {}) {
  const siteName = props.siteName || 'CarChief';
  const year = props.year || new Date().getFullYear();
  const contactPhone = props.contactPhone || '+256 700 000 000';

  return {
    landmark: 'footer',
    copyright: `© ${year} ${siteName}. All rights reserved.`,
    contactPhone,
  };
}
