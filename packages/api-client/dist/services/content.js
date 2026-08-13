"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
/**
 * Public content, FAQ and testimonial services (PUB-17, PUB-18, PUB-19, PUB-20,
 * PUB-21, PUB-27, PUB-29, PUB-30, PUB-31, PUB-35).
 */
class ContentService {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    /**
     * Browse Frequently Asked Questions organized into 12 categories, with optional
     * category filtering and grounded keyword search (PUB-20, DEC-PUB-FAQ-AI).
     */
    async getFaqs(query) {
        if (!this.httpClient) {
            throw new Error('ContentService.getFaqs requires an HttpClient');
        }
        const params = new URLSearchParams();
        if (query?.category)
            params.set('category', query.category);
        if (query?.q)
            params.set('q', query.q);
        const queryString = params.toString();
        const endpoint = queryString ? `/api/v1/content/faq?${queryString}` : '/api/v1/content/faq';
        return this.httpClient.request(endpoint);
    }
    /**
     * Fetch approved customer testimonials for public display (PUB-19).
     */
    async getTestimonials() {
        if (!this.httpClient) {
            throw new Error('ContentService.getTestimonials requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/content/testimonials');
    }
    /**
     * Submit a new customer testimonial (PUB-19). Persisted as pending with consent.
     */
    async submitTestimonial(request) {
        if (!this.httpClient) {
            throw new Error('ContentService.submitTestimonial requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/content/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
    }
    /**
     * List all approved public content pages (PUB-30).
     */
    async getContentPages() {
        if (!this.httpClient) {
            throw new Error('ContentService.getContentPages requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/content/pages');
    }
    /**
     * Fetch a specific public content page by slug (PUB-17, PUB-18, PUB-21, PUB-27, PUB-29, PUB-30, PUB-31).
     * Returns null if page is unavailable or unknown (HTTP 404).
     */
    async getContentPageBySlug(slug) {
        if (!this.httpClient) {
            throw new Error('ContentService.getContentPageBySlug requires an HttpClient');
        }
        try {
            return await this.httpClient.request(`/api/v1/content/pages/${encodeURIComponent(slug)}`);
        }
        catch (err) {
            if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 404) {
                return null;
            }
            throw err;
        }
    }
    /**
     * Fetch office locations and operating hours (PUB-21).
     */
    async getOffices() {
        if (!this.httpClient) {
            throw new Error('ContentService.getOffices requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/content/offices');
    }
    /**
     * List approved branch content projections (PUB-35, DEC-PUB-BRANCH-PAGE).
     */
    async getBranches() {
        if (!this.httpClient) {
            throw new Error('ContentService.getBranches requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/content/branches');
    }
    /**
     * Fetch a specific branch content projection by ID or code (PUB-35).
     * Returns null if branch is unavailable or unknown (HTTP 404).
     */
    async getBranchById(id) {
        if (!this.httpClient) {
            throw new Error('ContentService.getBranchById requires an HttpClient');
        }
        try {
            return await this.httpClient.request(`/api/v1/content/branches/${encodeURIComponent(id)}`);
        }
        catch (err) {
            if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 404) {
                return null;
            }
            throw err;
        }
    }
}
exports.ContentService = ContentService;
//# sourceMappingURL=content.js.map