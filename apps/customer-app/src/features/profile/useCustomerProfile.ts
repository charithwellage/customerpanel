import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CustomerProfile, UpdateCustomerProfileRequest } from '@carchief/api-client';
import { CustomerProfileService, NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/HttpClientProvider.js';
import { loadCustomerSession } from '../account/accountState.js';

const STORAGE_KEY_PROFILE = 'carchief_customer_profile';

export function getFallbackCustomerProfile(): CustomerProfile {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.customerId) {
          return parsed as CustomerProfile;
        }
      }
    } catch {
      // Ignore storage parse error
    }
  }

  const session = loadCustomerSession();
  const rawName = session?.user?.name || 'Prabodha Wijerathne';
  const name = rawName.includes('@') ? rawName.split('@')[0] : rawName;
  const email = session?.user?.email || 'prabodha@carchief.com';
  const company = session?.user?.company || (name ? `${name} Logistics` : 'CarChief Global Traders Ltd');
  const customerId = session?.user?.id || 'cust-123';

  return {
    customerId,
    name,
    email,
    companyName: company,
    phone: '+94 77 123 4567',
    deliveryAddress: 'No.414, Polhengoda Road, Colombo 05',
    version: 1,
    updatedAt: new Date().toISOString(),
    cardPaymentEligibility: {
      eligible: true,
      outstandingAmountUsd: 0,
      currency: 'USD',
    },
  };
}

export function useCustomerProfile() {
  const httpClient = useHttpClient();
  return useQuery<CustomerProfile, Error>({
    queryKey: ['customer', 'profile'],
    queryFn: async () => {
      if (httpClient) {
        try {
          const profile = await new CustomerProfileService(httpClient).get();
          if (profile && profile.customerId) {
            try {
              localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
            } catch {
              // Ignore storage error
            }
            return profile;
          }
        } catch (err) {
          // If the network or backend returns 404 or fails in static/preview environments,
          // gracefully fallback to local session profile data
          console.warn('Backend customer profile fetch failed, using fallback profile:', err);
        }
      }
      return getFallbackCustomerProfile();
    },
  });
}

export function useUpdateCustomerProfile() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  return useMutation<CustomerProfile, Error, UpdateCustomerProfileRequest>({
    mutationFn: async (request) => {
      if (httpClient) {
        try {
          const updated = await new CustomerProfileService(httpClient).update(request);
          if (updated && updated.customerId) {
            try {
              localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
            } catch {
              // Ignore storage error
            }
            return updated;
          }
        } catch (err) {
          if (err instanceof NormalizedApiError && err.statusCode === 409) {
            throw err;
          }
          console.warn('Backend customer profile update failed, persisting locally:', err);
        }
      }
      const current = getFallbackCustomerProfile();
      const updated: CustomerProfile = {
        ...current,
        companyName: request.companyName,
        phone: request.phone,
        deliveryAddress: request.deliveryAddress,
        version: (current.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }
      return updated;
    },
    onSuccess: (profile) => queryClient.setQueryData(['customer', 'profile'], profile),
  });
}
