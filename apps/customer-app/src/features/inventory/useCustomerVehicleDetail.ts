import { useState, useEffect, useCallback } from 'react';
import type { VehicleDetail, ReservationResponse, EnquiryResponse, CustomerProfile } from '@carchief/domain';
import { HttpClient, VehicleService, ReservationService, EnquiryService, WishlistService, CustomerProfileService } from '@carchief/api-client';
import type { CustomerVehicleDetailState } from './types.js';

export interface UseCustomerVehicleDetailOptions {
  idOrSlug: string;
  apiBaseUrl?: string;
  token?: string;
}

export function useCustomerVehicleDetail({
  idOrSlug,
  apiBaseUrl = '',
  token,
}: UseCustomerVehicleDetailOptions) {
  const [state, setState] = useState<CustomerVehicleDetailState>({
    vehicle: null,
    loading: true,
    error: null,
    reserving: false,
    reserveSuccess: false,
    reserveError: null,
    inquirySubmitting: false,
    inquirySuccess: false,
    inquiryError: null,
    wishlistLoading: true,
    wishlistError: null,
    isWishlisted: false,
    quoteSubmitting: false,
    quoteSubmitError: null,
    quoteSubmitSuccess: false,
  });

  const fetchDetail = useCallback(async () => {
    if (!idOrSlug) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const httpClient = new HttpClient({
        baseUrl: apiBaseUrl,
        getAuthToken: () => token,
      });
      const vehicleService = new VehicleService(httpClient);

      const detail = await vehicleService.getVehicleDetail(idOrSlug, {
        audience: 'customer',
      });

      if (!detail) {
        setState((prev) => ({
          ...prev,
          vehicle: null,
          loading: false,
          error: 'Vehicle not found or no longer available.',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        vehicle: detail,
        loading: false,
        error: null,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load vehicle details.';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [apiBaseUrl, idOrSlug, token]);

  const fetchWishlistState = useCallback(async () => {
    if (!idOrSlug) return;
    setState((prev) => ({ ...prev, wishlistLoading: true, wishlistError: null }));

    try {
      const httpClient = new HttpClient({
        baseUrl: apiBaseUrl,
        getAuthToken: () => token,
      });
      const wishlistService = new WishlistService(httpClient);

      const response = await wishlistService.list();
      const isWishlisted = response.items.some((item) => item.vehicleSlug === idOrSlug);

      setState((prev) => ({
        ...prev,
        wishlistLoading: false,
        isWishlisted,
        wishlistError: null,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load wishlist status.';
      setState((prev) => ({
        ...prev,
        wishlistLoading: false,
        wishlistError: message,
      }));
    }
  }, [apiBaseUrl, idOrSlug, token]);

  useEffect(() => {
    fetchDetail();
    fetchWishlistState();
  }, [fetchDetail, fetchWishlistState]);

  const reserveVehicle = useCallback(async () => {
    if (!state.vehicle) return;

    // Offline check: block mutation when network is unavailable
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState((prev) => ({
        ...prev,
        reserving: false,
        reserveSuccess: false,
        reserveError: 'You are currently offline. Reservations cannot be placed while offline.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      reserving: true,
      reserveError: null,
    }));

    try {
      const httpClient = new HttpClient({
        baseUrl: apiBaseUrl,
        getAuthToken: () => token,
      });
      const reservationService = new ReservationService(httpClient);

      const res: ReservationResponse = await reservationService.create({
        vehicleSlug: state.vehicle.slug,
      });

      // Update vehicle reservation eligibility to reflect user's new hold
      setState((prev) => {
        if (!prev.vehicle) return prev;
        const updatedVehicle: VehicleDetail = {
          ...prev.vehicle,
          reservationEligibility: {
            eligible: false,
            reason: 'already_reserved_by_you',
            holdExpiresAt: res.expiresAt,
            isOwnHold: true,
          },
        };
        return {
          ...prev,
          vehicle: updatedVehicle,
          reserving: false,
          reserveSuccess: true,
          reserveError: null,
          reservationId: res.id,
          holdExpiresAt: res.expiresAt,
        };
      });
    } catch (err: unknown) {
      let errorMsg = 'Failed to reserve vehicle.';
      if (err && typeof err === 'object') {
        const errorObj = err as { message?: string; error?: { message?: string; reason?: string } };
        if (errorObj.error?.reason === 'conflict' || errorObj.error?.reason === 'vehicle_unavailable') {
          errorMsg = 'This vehicle was just reserved by another customer.';
        } else if (errorObj.error?.reason === 'already_reserved_by_you') {
          errorMsg = 'You already have an active reservation hold on this vehicle.';
        } else if (errorObj.error?.message) {
          errorMsg = errorObj.error.message;
        } else if (errorObj.message) {
          errorMsg = errorObj.message;
        }
      }
      setState((prev) => ({
        ...prev,
        reserving: false,
        reserveSuccess: false,
        reserveError: errorMsg,
      }));
    }
  }, [apiBaseUrl, state.vehicle, token]);

  const requestPriceInquiry = useCallback(async (customMessage?: string) => {
    if (!state.vehicle) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState((prev) => ({
        ...prev,
        inquirySubmitting: false,
        inquirySuccess: false,
        inquiryError: 'You are currently offline. Inquiries cannot be sent while offline.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      inquirySubmitting: true,
      inquiryError: null,
    }));

    try {
      const httpClient = new HttpClient({
        baseUrl: apiBaseUrl,
        getAuthToken: () => token,
      });
      const enquiryService = new EnquiryService(httpClient);

      const res: EnquiryResponse = await enquiryService.submit({
        name: 'Customer Account User',
        email: 'user@carchief.com',
        phone: '+81-3-0000-0000',
        message: customMessage || `Price quotation request for vehicle ${state.vehicle.model} (${state.vehicle.chassisNumber})`,
        consent: true,
        vehicleSlug: state.vehicle.slug,
      });

      setState((prev) => ({
        ...prev,
        inquirySubmitting: false,
        inquirySuccess: true,
        inquiryError: null,
        inquiryId: res.id,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to submit price quotation request.';
      setState((prev) => ({
        ...prev,
        inquirySubmitting: false,
        inquirySuccess: false,
        inquiryError: msg,
      }));
    }
  }, [apiBaseUrl, state.vehicle, token]);

  const submitQuoteRequest = useCallback(async () => {
    if (!state.vehicle) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState((prev) => ({
        ...prev,
        quoteSubmitting: false,
        quoteSubmitError: 'You are currently offline. Quotes cannot be requested while offline.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      quoteSubmitting: true,
      quoteSubmitError: null,
    }));

    try {
      const httpClient = new HttpClient({
        baseUrl: apiBaseUrl,
        getAuthToken: () => token,
      });

      const profileService = new CustomerProfileService(httpClient);
      const profile: CustomerProfile = await profileService.get();

      const enquiryService = new EnquiryService(httpClient);
      await enquiryService.submit({
        name: profile.name || 'Customer',
        email: profile.email || '',
        phone: profile.phone || '',
        message: 'Quote request from customer application',
        consent: true,
        vehicleSlug: state.vehicle.slug,
        enquiryType: 'price-request',
        source: 'form',
      });

      setState((prev) => ({
        ...prev,
        quoteSubmitting: false,
        quoteSubmitSuccess: true,
        quoteSubmitError: null,
      }));

      // Reset success state after a short delay to allow the UI to show feedback
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          quoteSubmitSuccess: false,
        }));
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to submit quote request.';
      setState((prev) => ({
        ...prev,
        quoteSubmitting: false,
        quoteSubmitSuccess: false,
        quoteSubmitError: msg,
      }));
    }
  }, [apiBaseUrl, state.vehicle, token]);

  const toggleWishlist = useCallback(async () => {
    if (!state.vehicle) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState((prev) => ({
        ...prev,
        wishlistLoading: false,
        wishlistError: 'You are currently offline. Wishlist cannot be modified while offline.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      wishlistLoading: true,
      wishlistError: null,
    }));

    try {
      const httpClient = new HttpClient({
        baseUrl: apiBaseUrl,
        getAuthToken: () => token,
      });
      const wishlistService = new WishlistService(httpClient);

      if (state.isWishlisted) {
        await wishlistService.remove(state.vehicle.slug);
        setState((prev) => ({
          ...prev,
          wishlistLoading: false,
          isWishlisted: false,
          wishlistError: null,
        }));
      } else {
        await wishlistService.add(state.vehicle.slug);
        setState((prev) => ({
          ...prev,
          wishlistLoading: false,
          isWishlisted: true,
          wishlistError: null,
        }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to update wishlist.';
      setState((prev) => ({
        ...prev,
        wishlistLoading: false,
        wishlistError: message,
      }));
    }
  }, [apiBaseUrl, state.vehicle, state.isWishlisted, token]);

  return {
    state,
    refetch: fetchDetail,
    reserveVehicle,
    requestPriceInquiry,
    submitQuoteRequest,
    toggleWishlist,
  };
}
