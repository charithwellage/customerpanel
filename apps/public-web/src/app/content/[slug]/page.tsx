import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadContentPageBySlug } from '../../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../../features/public-content/components/ContentPageTemplate';
import '../../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadContentPageBySlug(slug);

  if (!page) {
    return {
      title: 'Content Not Found | CarChief',
      description: 'The requested information page could not be found.',
    };
  }

  return {
    title: `${page.title} | CarChief`,
    description: page.summary,
  };
}

export default async function DynamicContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await loadContentPageBySlug(slug);

  if (!page || page.status !== 'approved') {
    notFound();
  }

  return (
    <ContentPageTemplate
      title={page.title}
      subtitle={page.summary}
      badge="Company Content"
      owner={page.owner}
      updatedAt={page.updatedAt}
      status={page.status}
      body={page.body}
      sections={page.sections}
      heroActions={
        <div className="cc-public-content-page__actions">
          <a href="/contact" className="cc-btn cc-btn--primary">
            Contact Us
          </a>
          <a href="/how-to-buy" className="cc-btn cc-btn--secondary">
            How to Buy
          </a>
        </div>
      }
    />
  );
}
