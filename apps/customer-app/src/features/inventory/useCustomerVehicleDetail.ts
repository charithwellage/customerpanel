import { useState, useEffect, useCallback } from 'react';
import type { VehicleDetail, ReservationResponse } from '@carchief/domain';
import { HttpClient, VehicleService, ReservationService } from '@carchief/api-client';
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
        setState({
          vehicle: null,
          loading: false,
          error: 'Vehicle not found or no longer available.',
          reserving: false,
          reserveSuccess: false,
          reserveError: null,
        });
        return;
      }

      setState({
        vehicle: detail,
        loading: false,
        error: null,
        reserving: false,
        reserveSuccess: false,
        reserveError: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load vehicle details.';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [apiBaseUrl, idOrSlug, token]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const reserveVehicle = useCallback(async () => {
    if (!state.vehicle) return;

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

  return {
    state,
    refetch: fetchDetail,
    reserveVehicle,
  };
}
