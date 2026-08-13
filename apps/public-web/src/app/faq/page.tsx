import React from 'react';
import type { Metadata } from 'next';
import { loadFaq } from '../../features/faq/loadFaq';
import { FaqBrowserPrimitive } from '../../features/faq/components/FaqBrowserPrimitive';
import '../../features/faq/faq.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions & Verified Import Knowledge | CarChief',
  description:
    'Browse 12 categories of verified answers on Japanese vehicle buying, shipping schedules, auction bidding, and customs duties with CarChief.',
};

export default async function FaqPage() {
  const faqData = await loadFaq();

  return (
    <main className="cc-faq-page">
      <div className="cc-faq-container">
        <FaqBrowserPrimitive
          initialCategories={faqData.categories}
          initialItems={faqData.items}
          initialTotal={faqData.total}
          initialGroundedNoAnswer={faqData.groundedNoAnswer}
        />
      </div>
    </main>
  );
}
