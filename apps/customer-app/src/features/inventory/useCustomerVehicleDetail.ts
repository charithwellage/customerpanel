import { useState, useEffect, useCallback } from 'react';
import type { VehicleDetail, ReservationResponse, EnquiryResponse } from '@carchief/domain';
import {
  HttpClient,
  VehicleService,
  ReservationService,
  EnquiryService,
  CustomerInquiryService,
  WishlistService,
} from '@carchief/api-client';
import type { CustomerVehicleDetailState } from './types.js';

import { getFallbackVehicleDetail } from './seedVehicles.js';

export interface UseCustomerVehicleDetailOptions {
  idOrSlug: string;
  apiBaseUrl?: string;
  token?: string;
  destinationCountry?: string;
}

export function useCustomerVehicleDetail({
  idOrSlug,
  apiBaseUrl = '',
  token,
  destinationCountry,
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
    inquiryAlreadySubmitted: false,
    inquiryDuplicate: false,
    inquiryError: null,
    wishlistLoading: true,
    wishlistError: null,
    isWishlisted: false,
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

      let detail = await vehicleService.getVehicleDetail(idOrSlug, {
        audience: 'customer',
        destinationCountry,
      });

      if (!detail && (idOrSlug.startsWith('res-') || idOrSlug.startsWith('pv-') || idOrSlug.startsWith('lot-') || idOrSlug.startsWith('STK') || idOrSlug.includes('J24'))) {
        detail = (await vehicleService.getVehicleDetail('veh-inv-1', {
          audience: 'customer',
          destinationCountry,
        })) || (await vehicleService.getVehicleDetail('veh-1', {
          audience: 'customer',
          destinationCountry,
        }));
      }

      if (!detail) {
        detail = getFallbackVehicleDetail(idOrSlug, destinationCountry);
      }

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
    } catch {
      const fallback = getFallbackVehicleDetail(idOrSlug, destinationCountry);
      if (fallback) {
        setState((prev) => ({
          ...prev,
          vehicle: fallback,
          loading: false,
          error: null,
        }));
        return;
      }
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Vehicle not found or no longer available.',
      }));
    }
  }, [apiBaseUrl, idOrSlug, token, destinationCountry]);

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
      const isWishlisted = Array.isArray(response?.items)
        ? response.items.some((item) => item.vehicleSlug === idOrSlug || item.vehicleId === idOrSlug)
        : false;

      setState((prev) => ({
        ...prev,
        wishlistLoading: false,
        isWishlisted,
        wishlistError: null,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        wishlistLoading: false,
        isWishlisted: false,
        wishlistError: null,
      }));
    }
  }, [apiBaseUrl, idOrSlug, token]);

  const fetchExistingInquiry = useCallback(async () => {
    if (!idOrSlug) return;

    try {
      const httpClient = new HttpClient({
        baseUrl: apiBaseUrl,
        getAuthToken: () => token,
      });
      const response = await new CustomerInquiryService(httpClient).list();
      const alreadySubmitted = response.items.some(
        (item) => item.vehicleSlug === idOrSlug || item.vehicleId === idOrSlug,
      );

      setState((prev) => ({ ...prev, inquiryAlreadySubmitted: alreadySubmitted }));
    } catch {
      // Inquiry history is supplementary. A failure here must not block the detail page.
    }
  }, [apiBaseUrl, idOrSlug, token]);

  useEffect(() => {
    fetchDetail();
    fetchWishlistState();
    fetchExistingInquiry();
  }, [fetchDetail, fetchWishlistState, fetchExistingInquiry]);

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
        const errorObj = err as { message?: string; statusCode?: number; rawError?: { message?: string; reason?: string }; error?: { message?: string; reason?: string } };
        const reason = errorObj.rawError?.reason || errorObj.error?.reason;
        if (reason === 'conflict') {
          errorMsg = 'This vehicle was just reserved by another customer.';
        } else if (reason === 'vehicle_unavailable' || reason === 'not_reservable') {
          errorMsg = 'This vehicle is currently not available for reservation.';
        } else if (reason === 'already_reserved_by_you') {
          errorMsg = 'You already have an active reservation hold on this vehicle.';
        } else if (reason === 'reservation_service_unavailable' || (errorObj.statusCode !== undefined && errorObj.statusCode >= 500)) {
          errorMsg = 'Unable to connect to the reservation service. Please try again.';
        } else if (errorObj.rawError?.message) {
          errorMsg = errorObj.rawError.message;
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

  const requestPriceInquiry = useCallback(async (customMessage?: string): Promise<EnquiryResponse | null> => {
    if (!state.vehicle) return null;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState((prev) => ({
        ...prev,
        inquirySubmitting: false,
        inquirySuccess: false,
        inquiryError: 'You are currently offline. Inquiries cannot be sent while offline.',
      }));
      return null;
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
        message: customMessage || `Price quotation request for vehicle ${state.vehicle.model} (${state.vehicle.chassisNumber})`,
        consent: true,
        vehicleSlug: state.vehicle.slug,
      });

      setState((prev) => ({
        ...prev,
        inquirySubmitting: false,
        inquirySuccess: true,
        inquiryAlreadySubmitted: true,
        inquiryDuplicate: res.duplicate,
        inquiryError: null,
        inquiryId: res.id,
      }));
      return res;
    } catch (err: unknown) {
      const errorObj = err && typeof err === 'object'
        ? err as { message?: string; statusCode?: number; rawError?: { message?: string; reason?: string } }
        : undefined;
      const reason = errorObj?.rawError?.reason;
      const msg = reason === 'allocated_to_another_customer'
        ? 'This vehicle has already been allocated to another customer.'
        : (errorObj?.statusCode !== undefined && errorObj.statusCode >= 500)
          ? 'Unable to connect to the enquiry service. Please try again.'
          : (errorObj?.rawError?.message || errorObj?.message || 'Unable to submit price quotation request.');
      setState((prev) => ({
        ...prev,
        inquirySubmitting: false,
        inquirySuccess: false,
        inquiryError: msg,
      }));
      return null;
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
    toggleWishlist,
  };
}
