export type ContentApprovalStatus = 'approved' | 'pending' | 'draft' | 'unavailable' | 'rejected';

// FAQ (PUB-20) - Exactly 12 categories
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
  matchedCount: number;
  groundedNoAnswer: boolean;
  message?: string;
}

// Testimonials (PUB-19)
export interface TestimonialItem {
  id: string;
  authorName: string;
  authorLocation: string;
  avatarUrl?: string;
  vehiclePurchased?: string;
  rating: number; // 1 to 5
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

// Public Content Pages & Templates (PUB-17, PUB-18, PUB-21, PUB-27, PUB-29, PUB-30, PUB-31)
export interface ContentPageSection {
  title: string;
  content: string;
  image?: string;
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

// Office Locations & Hours (PUB-21)
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

// Branch Content Projections (PUB-35, DEC-PUB-BRANCH-PAGE)
export interface BranchTeamMember {
  name: string;
  role: string;
  photoUrl?: string;
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
  contentOwner: string;
  status: ContentApprovalStatus;
  latestArrivalsQuery?: { destinationPort?: string; limit?: number };
  recentlyDiscountedQuery?: { destinationPort?: string; limit?: number };
}

export interface BranchListResponse {
  items: BranchContent[];
  total: number;
}
