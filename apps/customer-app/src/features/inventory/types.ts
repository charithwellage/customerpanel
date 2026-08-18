import type { VehicleDomainSummary, VehicleDetail, VehicleFacets, SearchVehiclesQuery } from '@carchief/domain';

export interface CustomerInventoryState {
  items: VehicleDomainSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: VehicleFacets;
  loading: boolean;
  error: string | null;
}

export interface CustomerVehicleDetailState {
  vehicle: VehicleDetail | null;
  loading: boolean;
  error: string | null;
  reserving: boolean;
  reserveSuccess: boolean;
  reserveError: string | null;
  reservationId?: string;
  holdExpiresAt?: string;
  inquirySubmitting: boolean;
  inquirySuccess: boolean;
  inquiryError: string | null;
  inquiryId?: string;
  wishlistLoading: boolean;
  wishlistError: string | null;
  isWishlisted: boolean;
  quoteSubmitting: boolean;
  quoteSubmitError: string | null;
  quoteSubmitSuccess: boolean;
}

export interface CustomerInventoryFilterState extends SearchVehiclesQuery {
  naturalPhrase?: string;
}
