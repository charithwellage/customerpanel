import type {
  FaqQueryResponse,
  TestimonialListResponse,
  TestimonialSubmissionRequest,
  TestimonialSubmissionResponse,
  PublicContentPage,
  OfficeListResponse,
  BranchListResponse,
  BranchContent,
} from '@carchief/domain';
import type { HttpClient } from '../http.js';

/**
 * Public content, FAQ and testimonial services (PUB-17, PUB-18, PUB-19, PUB-20,
 * PUB-21, PUB-27, PUB-29, PUB-30, PUB-31, PUB-35).
 */
export class ContentService {
  constructor(private httpClient?: HttpClient) {}

  /**
   * Browse Frequently Asked Questions organized into 12 categories, with optional
   * category filtering and grounded keyword search (PUB-20, DEC-PUB-FAQ-AI).
   */
  public async getFaqs(query?: { category?: string; q?: string }): Promise<FaqQueryResponse> {
    if (!this.httpClient) {
      throw new Error('ContentService.getFaqs requires an HttpClient');
    }
    const params = new URLSearchParams();
    if (query?.category) params.set('category', query.category);
    if (query?.q) params.set('q', query.q);
    const queryString = params.toString();
    const endpoint = queryString ? `/api/v1/content/faq?${queryString}` : '/api/v1/content/faq';
    return this.httpClient.request<FaqQueryResponse>(endpoint);
  }

  /**
   * Fetch approved customer testimonials for public display (PUB-19).
   */
  public async getTestimonials(): Promise<TestimonialListResponse> {
    if (!this.httpClient) {
      throw new Error('ContentService.getTestimonials requires an HttpClient');
    }
    return this.httpClient.request<TestimonialListResponse>('/api/v1/content/testimonials');
  }

  /**
   * Submit a new customer testimonial (PUB-19). Persisted as pending with consent.
   */
  public async submitTestimonial(request: TestimonialSubmissionRequest): Promise<TestimonialSubmissionResponse> {
    if (!this.httpClient) {
      throw new Error('ContentService.submitTestimonial requires an HttpClient');
    }
    return this.httpClient.request<TestimonialSubmissionResponse>('/api/v1/content/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  /**
   * List all approved public content pages (PUB-30).
   */
  public async getContentPages(): Promise<PublicContentPage[]> {
    if (!this.httpClient) {
      throw new Error('ContentService.getContentPages requires an HttpClient');
    }
    return this.httpClient.request<PublicContentPage[]>('/api/v1/content/pages');
  }

  /**
   * Fetch a specific public content page by slug (PUB-17, PUB-18, PUB-21, PUB-27, PUB-29, PUB-30, PUB-31).
   * Returns null if page is unavailable or unknown (HTTP 404).
   */
  public async getContentPageBySlug(slug: string): Promise<PublicContentPage | null> {
    if (!this.httpClient) {
      throw new Error('ContentService.getContentPageBySlug requires an HttpClient');
    }
    try {
      return await this.httpClient.request<PublicContentPage>(`/api/v1/content/pages/${encodeURIComponent(slug)}`);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Fetch office locations and operating hours (PUB-21).
   */
  public async getOffices(): Promise<OfficeListResponse> {
    if (!this.httpClient) {
      throw new Error('ContentService.getOffices requires an HttpClient');
    }
    return this.httpClient.request<OfficeListResponse>('/api/v1/content/offices');
  }

  /**
   * List approved branch content projections (PUB-35, DEC-PUB-BRANCH-PAGE).
   */
  public async getBranches(): Promise<BranchListResponse> {
    if (!this.httpClient) {
      throw new Error('ContentService.getBranches requires an HttpClient');
    }
    return this.httpClient.request<BranchListResponse>('/api/v1/content/branches');
  }

  /**
   * Fetch a specific branch content projection by ID or code (PUB-35).
   * Returns null if branch is unavailable or unknown (HTTP 404).
   */
  public async getBranchById(id: string): Promise<BranchContent | null> {
    if (!this.httpClient) {
      throw new Error('ContentService.getBranchById requires an HttpClient');
    }
    try {
      return await this.httpClient.request<BranchContent>(`/api/v1/content/branches/${encodeURIComponent(id)}`);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
        return null;
      }
      throw err;
    }
  }
}
