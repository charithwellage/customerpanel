export type ContentApprovalStatus = 'approved' | 'pending' | 'draft' | 'unavailable' | 'rejected';
export interface FaqCategory {
    id: string;
    name: string;
    description?: string;
    order: number;
}
export interface FaqItem {
    id: string;
    categoryId: string;
    categoryName: string;
    question: string;
    answer: string;
    slug: string;
    featured?: boolean;
    order?: number;
    owner: string;
    status: ContentApprovalStatus;
    updatedAt: string;
}
export interface FaqQueryResponse {
    categories: FaqCategory[];
    items: FaqItem[];
    total: number;
    groundedNoAnswer: boolean;
    message?: string;
}
export interface TestimonialItem {
    id: string;
    authorName: string;
    authorLocation: string;
    avatarUrl?: string;
    vehiclePurchased?: string;
    rating: number;
    content: string;
    submittedAt: string;
    status: ContentApprovalStatus;
    consent: boolean;
}
export interface TestimonialSubmissionRequest {
    authorName: string;
    authorLocation: string;
    vehiclePurchased?: string;
    rating: number;
    content: string;
    consent: boolean;
}
export interface TestimonialSubmissionResponse {
    id: string;
    status: 'pending';
    submittedAt: string;
    message: string;
}
export interface TestimonialListResponse {
    items: TestimonialItem[];
    total: number;
}
export interface ContentPageSection {
    title: string;
    content: string;
}
export interface PublicContentPage {
    slug: string;
    title: string;
    summary: string;
    body: string;
    owner: string;
    status: ContentApprovalStatus;
    updatedAt: string;
    sections?: ContentPageSection[];
    metadata?: Record<string, unknown>;
}
export interface OfficeLocation {
    id: string;
    name: string;
    city: string;
    country: string;
    address: string;
    phone: string;
    email: string;
    operatingHours: string;
    isPrimary: boolean;
    status: ContentApprovalStatus;
}
export interface OfficeListResponse {
    items: OfficeLocation[];
    total: number;
}
export interface BranchTeamMember {
    name: string;
    role: string;
    contactEmail?: string;
}
export interface BranchContactDetails {
    phone: string;
    email: string;
    address: string;
    hours: string;
}
export interface BranchContent {
    id: string;
    name: string;
    code: string;
    destinationPort: string;
    introduction: string;
    welcomeBanner: string;
    contactBanner: string;
    teamMembers: BranchTeamMember[];
    meetAndGreetInfo: string;
    contactDetails: BranchContactDetails;
    status: ContentApprovalStatus;
}
export interface BranchListResponse {
    items: BranchContent[];
    total: number;
}
//# sourceMappingURL=content.d.ts.map