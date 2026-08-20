import { cache } from 'react';
import { ContentService, VehicleService, HttpClient } from '@carchief/api-client';
import type {
  PublicContentPage,
  OfficeListResponse,
  BranchListResponse,
  BranchContent,
  VehicleDomainSummary,
} from '@carchief/domain';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:4000';

function getService(): ContentService {
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return new ContentService(new HttpClient({ baseUrl }));
}

function getVehicleService(): VehicleService {
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return new VehicleService(new HttpClient({ baseUrl }));
}

export const loadContentPages = cache(async (): Promise<PublicContentPage[]> => {
  try {
    const service = getService();
    return await service.getContentPages();
  } catch {
    return [];
  }
});

export const loadContentPageBySlug = cache(async (slug: string): Promise<PublicContentPage | null> => {
  try {
    const service = getService();
    return await service.getContentPageBySlug(slug);
  } catch {
    return null;
  }
});

export const loadOffices = cache(async (): Promise<OfficeListResponse> => {
  try {
    const service = getService();
    return await service.getOffices();
  } catch {
    return { items: [], total: 0 };
  }
});

export const loadBranches = cache(async (): Promise<BranchListResponse> => {
  try {
    const service = getService();
    return await service.getBranches();
  } catch {
    return { items: [], total: 0 };
  }
});

export const loadBranchById = cache(async (idOrCode: string): Promise<BranchContent | null> => {
  try {
    const service = getService();
    return await service.getBranchById(idOrCode);
  } catch {
    return null;
  }
});

export const loadBranchVehicles = cache(
  async (
    branch: BranchContent
  ): Promise<{
    latestArrivals: VehicleDomainSummary[];
    recentlyDiscounted: VehicleDomainSummary[];
  }> => {
    try {
      const vService = getVehicleService();
      const port = branch.destinationPort;

      const latestArrivals = await vService.getVehicles({
        collection: 'latest_arrivals',
        destinationPort: port,
        limit: 4,
      });

      const recentlyDiscounted = await vService.getVehicles({
        collection: 'discounted',
        destinationPort: port,
        limit: 4,
      });

      return { latestArrivals: latestArrivals.items, recentlyDiscounted: recentlyDiscounted.items };
    } catch {
      return { latestArrivals: [], recentlyDiscounted: [] };
    }
  }
);
