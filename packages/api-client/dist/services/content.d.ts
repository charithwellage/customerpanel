import type { FaqQueryResponse, TestimonialListResponse, TestimonialSubmissionRequest, TestimonialSubmissionResponse, PublicContentPage, OfficeListResponse, BranchListResponse, BranchContent } from '@carchief/domain';
import type { HttpClient } from '../http.js';
/**
 * Public content, FAQ and testimonial services (PUB-17, PUB-18, PUB-19, PUB-20,
 * PUB-21, PUB-27, PUB-29, PUB-30, PUB-31, PUB-35).
 */
export declare class ContentService {
    private httpClient?;
    constructor(httpClient?: HttpClient | undefined);
    /**
     * Browse Frequently Asked Questions organized into 12 categories, with optional
     * category filtering and grounded keyword search (PUB-20, DEC-PUB-FAQ-AI).
     */
    getFaqs(query?: {
        category?: string;
        q?: string;
    }): Promise<FaqQueryResponse>;
    /**
     * Fetch approved customer testimonials for public display (PUB-19).
     */
    getTestimonials(): Promise<TestimonialListResponse>;
    /**
     * Submit a new customer testimonial (PUB-19). Persisted as pending with consent.
     */
    submitTestimonial(request: TestimonialSubmissionRequest): Promise<TestimonialSubmissionResponse>;
    /**
     * List all approved public content pages (PUB-30).
     */
    getContentPages(): Promise<PublicContentPage[]>;
    /**
     * Fetch a specific public content page by slug (PUB-17, PUB-18, PUB-21, PUB-27, PUB-29, PUB-30, PUB-31).
     * Returns null if page is unavailable or unknown (HTTP 404).
     */
    getContentPageBySlug(slug: string): Promise<PublicContentPage | null>;
    /**
     * Fetch office locations and operating hours (PUB-21).
     */
    getOffices(): Promise<OfficeListResponse>;
    /**
     * List approved branch content projections (PUB-35, DEC-PUB-BRANCH-PAGE).
     */
    getBranches(): Promise<BranchListResponse>;
    /**
     * Fetch a specific branch content projection by ID or code (PUB-35).
     * Returns null if branch is unavailable or unknown (HTTP 404).
     */
    getBranchById(id: string): Promise<BranchContent | null>;
}
//# sourceMappingURL=content.d.ts.map