export interface VehicleSearchFilter {
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  maxPriceUsd?: number;
}

export function buildSearchQueryString(filter: VehicleSearchFilter): string {
  const params = new URLSearchParams();
  if (filter.make) params.set('make', filter.make);
  if (filter.model) params.set('model', filter.model);
  if (filter.yearFrom) params.set('yearFrom', String(filter.yearFrom));
  if (filter.yearTo) params.set('yearTo', String(filter.yearTo));
  if (filter.maxPriceUsd) params.set('maxPriceUsd', String(filter.maxPriceUsd));
  return params.toString();
}

export * from './VehicleCardPrimitive.js';
export * from './VehicleCollectionPrimitive.js';

