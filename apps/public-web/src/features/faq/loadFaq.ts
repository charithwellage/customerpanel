import { cache } from 'react';
import { ContentService, HttpClient } from '@carchief/api-client';
import type { FaqQueryResponse } from '@carchief/domain';

const getService = (): ContentService => {
  const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:4000';
  const client = new HttpClient({ baseUrl });
  return new ContentService(client);
};

/**
 * Server data loader for FAQ categories and grounded search queries (PUB-20, DEC-PUB-FAQ-AI).
 * Uses React cache to prevent duplicate fetches per request.
 */
export const loadFaq = cache(
  async (query?: { category?: string; q?: string }): Promise<FaqQueryResponse> => {
    try {
      const service = getService();
      return await service.getFaqs(query);
    } catch {
      return {
        categories: [],
        items: [],
        total: 0,
        matchedCount: 0,
        groundedNoAnswer: true,
        message: 'FAQ service currently unavailable. Please contact customer support.',
      };
    }
  }
);
