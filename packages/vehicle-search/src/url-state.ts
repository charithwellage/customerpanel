import type { SearchVehiclesQuery } from '@carchief/domain';

/**
 * Parses search query parameters from URLSearchParams or a query string.
 */
export function parseUrlSearchQuery(source: URLSearchParams | string): SearchVehiclesQuery {
  const params = typeof source === 'string' ? new URLSearchParams(source) : source;
  const result: SearchVehiclesQuery = {};

  const getString = (key: string) => params.get(key) || undefined;
  const getNumber = (key: string) => {
    const val = params.get(key);
    if (!val) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  result.searchQuery = getString('searchQuery') || getString('q');
  result.make = getString('make');
  result.model = getString('model');
  result.modelCode = getString('modelCode');
  result.bodyStyle = getString('bodyStyle');
  result.fuelType = getString('fuelType');
  result.transmission = getString('transmission');
  result.driveTrain = getString('driveTrain');
  result.vehicleSubType = getString('vehicleSubType');
  result.overdrive = getString('overdrive');
  result.color = getString('color');
  result.exteriorGrade = getString('exteriorGrade');
  result.steering = getString('steering');
  result.stockCountry = getString('stockCountry');
  result.stockLocation = getString('stockLocation');
  result.features = params.getAll('features').flatMap((value) => value.split(',')).filter(Boolean);
  result.stockType = getString('stockType') as 'J' | 'CRFO' | undefined;
  result.locationStatus = getString('locationStatus') as 'In Japan' | 'In Transit' | 'In Port' | undefined;

  result.yearMin = getNumber('yearMin');
  result.yearMax = getNumber('yearMax');
  result.priceMin = getNumber('priceMin');
  result.priceMax = getNumber('priceMax');
  result.mileageMin = getNumber('mileageMin');
  result.mileageMax = getNumber('mileageMax');
  result.discountMin = getNumber('discountMin');
  result.engineCcMin = getNumber('engineCcMin');
  result.engineCcMax = getNumber('engineCcMax');
  result.seatsMin = getNumber('seatsMin');
  result.seatsMax = getNumber('seatsMax');
  result.loadCapacityMin = getNumber('loadCapacityMin');
  result.loadCapacityMax = getNumber('loadCapacityMax');

  result.sortBy = (getString('sortBy') || 'newest') as SearchVehiclesQuery['sortBy'];
  result.page = getNumber('page') || 1;
  result.limit = getNumber('limit') || 12;

  // Market & Destination Port context preservation
  result.market = getString('market');
  result.destinationPort = getString('destinationPort');
  result.category = getString('category');
  result.collection = getString('collection');

  return result;
}

/**
 * Serializes SearchVehiclesQuery into URLSearchParams while omitting empty or default values.
 * Preserves additional context parameters (e.g. market, country, destinationPort, category, collection).
 */
export function serializeSearchQuery(query: SearchVehiclesQuery, existingParams?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(existingParams ? existingParams.toString() : '');

  const setOrDelete = (key: string, val: string | number | undefined | null) => {
    if (val !== undefined && val !== null && val !== '') {
      params.set(key, String(val));
    } else {
      params.delete(key);
    }
  };

  setOrDelete('searchQuery', query.searchQuery);
  setOrDelete('make', query.make);
  setOrDelete('model', query.model);
  setOrDelete('modelCode', query.modelCode);
  setOrDelete('bodyStyle', query.bodyStyle);
  setOrDelete('fuelType', query.fuelType);
  setOrDelete('transmission', query.transmission);
  setOrDelete('driveTrain', query.driveTrain);
  setOrDelete('vehicleSubType', query.vehicleSubType);
  setOrDelete('overdrive', query.overdrive);
  setOrDelete('color', query.color);
  setOrDelete('exteriorGrade', query.exteriorGrade);
  setOrDelete('steering', query.steering);
  setOrDelete('stockCountry', query.stockCountry);
  setOrDelete('stockLocation', query.stockLocation);
  setOrDelete('features', query.features?.join(','));
  setOrDelete('stockType', query.stockType);
  setOrDelete('locationStatus', query.locationStatus);
  setOrDelete('category', query.category);
  setOrDelete('collection', query.collection);

  setOrDelete('yearMin', query.yearMin);
  setOrDelete('yearMax', query.yearMax);
  setOrDelete('priceMin', query.priceMin);
  setOrDelete('priceMax', query.priceMax);
  setOrDelete('mileageMin', query.mileageMin);
  setOrDelete('mileageMax', query.mileageMax);
  setOrDelete('discountMin', query.discountMin);
  setOrDelete('engineCcMin', query.engineCcMin);
  setOrDelete('engineCcMax', query.engineCcMax);
  setOrDelete('seatsMin', query.seatsMin);
  setOrDelete('seatsMax', query.seatsMax);
  setOrDelete('loadCapacityMin', query.loadCapacityMin);
  setOrDelete('loadCapacityMax', query.loadCapacityMax);

  if (query.sortBy && query.sortBy !== 'newest') {
    params.set('sortBy', query.sortBy);
  } else {
    params.delete('sortBy');
  }

  if (query.page && query.page > 1) {
    params.set('page', String(query.page));
  } else {
    params.delete('page');
  }

  if (query.limit && query.limit !== 12) {
    params.set('limit', String(query.limit));
  } else {
    params.delete('limit');
  }

  setOrDelete('market', query.market);
  setOrDelete('destinationPort', query.destinationPort);

  return params;
}
