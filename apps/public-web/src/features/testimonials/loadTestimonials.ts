import { cache } from 'react';
import { ContentService, HttpClient } from '@carchief/api-client';
import type {
  TestimonialListResponse,
  TestimonialSubmissionRequest,
  TestimonialSubmissionResponse,
} from '@carchief/domain';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:4000';

function getService(): ContentService {
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return new ContentService(new HttpClient({ baseUrl }));
}

export const loadTestimonials = cache(async (): Promise<TestimonialListResponse> => {
  try {
    const service = getService();
    return await service.getTestimonials();
  } catch {
    return { items: [], total: 0 };
  }
});

export async function submitTestimonial(
  request: TestimonialSubmissionRequest
): Promise<TestimonialSubmissionResponse> {
  const service = getService();
  return await service.submitTestimonial(request);
}
