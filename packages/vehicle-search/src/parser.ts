import type { SearchVehiclesQuery } from '@carchief/domain';

export interface UnderstoodToken {
  token: string;
  field: string;
  label: string;
}

export interface ParsedNaturalQueryResult {
  rawQuery: string;
  parsedParams: SearchVehiclesQuery;
  understoodTokens: UnderstoodToken[];
  unparsedQuery: string;
}

const KNOWN_MAKES = [
  'Toyota', 'Nissan', 'Honda', 'Subaru', 'Mitsubishi',
  'Lexus', 'Mazda', 'Mercedes-Benz', 'BMW', 'Audi', 'Land Rover', 'Isuzu', 'Hino'
];

const KNOWN_BODY_STYLES: Record<string, string> = {
  suv: 'SUV',
  sedan: 'Sedan',
  hatchback: 'Hatchback',
  van: 'Van',
  minivan: 'Van',
  truck: 'Truck',
  wagon: 'Wagon',
  coupe: 'Coupe',
  convertible: 'Convertible',
};

const KNOWN_FUEL_TYPES: Record<string, string> = {
  hybrid: 'Hybrid',
  electric: 'Electric',
  ev: 'Electric',
  diesel: 'Diesel',
  petrol: 'Petrol',
  gasoline: 'Petrol',
  gas: 'Petrol',
};

const KNOWN_TRANSMISSIONS: Record<string, string> = {
  automatic: 'Automatic',
  auto: 'Automatic',
  manual: 'Manual',
  stick: 'Manual',
};

const KNOWN_DRIVE_TRAINS: Record<string, string> = {
  '4wd': '4WD',
  '4x4': '4WD',
  awd: 'AWD',
  '2wd': '2WD',
  fwd: '2WD',
  rwd: '2WD',
};

/**
 * Deterministic natural language query parser for vehicle search.
 * Parses user input into structured search parameters without invoking AI APIs.
 */
export function parseNaturalSearchQuery(query: string): ParsedNaturalQueryResult {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      rawQuery: query,
      parsedParams: {},
      understoodTokens: [],
      unparsedQuery: '',
    };
  }

  const parsedParams: SearchVehiclesQuery = {};
  const understoodTokens: UnderstoodToken[] = [];
  let remainingQuery = cleanQuery;

  // Helper to match and consume tokens
  const consumeMatch = (regex: RegExp, handler: (match: RegExpMatchArray) => void) => {
    const match = remainingQuery.match(regex);
    if (match) {
      handler(match);
      remainingQuery = remainingQuery.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
    }
  };

  // 1. Price Max: "under $15,000", "below 15k", "< 15000", "under 15000", "max 20000"
  consumeMatch(/(?:under|below|less than|max|maximum|<=|<)\s*\$?\s*(\d+(?:,\d+)?)\s*(k)?/i, (m) => {
    let val = parseFloat(m[1].replace(/,/g, ''));
    if (m[2] && m[2].toLowerCase() === 'k') val *= 1000;
    parsedParams.priceMax = val;
    understoodTokens.push({
      token: m[0].trim(),
      field: 'priceMax',
      label: `Max Price: $${val.toLocaleString()}`,
    });
  });

  // 2. Price Min: "above $5,000", "over 10k", "> 10000", "min 10000"
  consumeMatch(/(?:above|over|more than|min|minimum|>=|>)\s*\$?\s*(\d+(?:,\d+)?)\s*(k)?/i, (m) => {
    let val = parseFloat(m[1].replace(/,/g, ''));
    if (m[2] && m[2].toLowerCase() === 'k') val *= 1000;
    parsedParams.priceMin = val;
    understoodTokens.push({
      token: m[0].trim(),
      field: 'priceMin',
      label: `Min Price: $${val.toLocaleString()}`,
    });
  });

  // 3. Year Min: "after 2018", "newer than 2020", "from 2015", "year >= 2018"
  consumeMatch(/(?:year|newer than|after|from|>=|>)\s*(\d{4})/i, (m) => {
    const yr = parseInt(m[1], 10);
    parsedParams.yearMin = yr;
    understoodTokens.push({
      token: m[0].trim(),
      field: 'yearMin',
      label: `From Year: ${yr}`,
    });
  });

  // 4. Year Max: "older than 2020", "before 2018", "<= 2019"
  consumeMatch(/(?:older than|before|<=|<)\s*(\d{4})/i, (m) => {
    const yr = parseInt(m[1], 10);
    parsedParams.yearMax = yr;
    understoodTokens.push({
      token: m[0].trim(),
      field: 'yearMax',
      label: `Until Year: ${yr}`,
    });
  });

  // 5. Makes
  const lowerRemaining = remainingQuery.toLowerCase();
  for (const make of KNOWN_MAKES) {
    const makeLower = make.toLowerCase();
    if (lowerRemaining.includes(makeLower)) {
      parsedParams.make = make;
      understoodTokens.push({
        token: make,
        field: 'make',
        label: `Make: ${make}`,
      });
      const regex = new RegExp(`\\b${makeLower}\\b`, 'gi');
      remainingQuery = remainingQuery.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // 6. Body Styles
  for (const [key, val] of Object.entries(KNOWN_BODY_STYLES)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(remainingQuery)) {
      parsedParams.bodyStyle = val;
      understoodTokens.push({
        token: key,
        field: 'bodyStyle',
        label: `Body Style: ${val}`,
      });
      remainingQuery = remainingQuery.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // 7. Fuel Types
  for (const [key, val] of Object.entries(KNOWN_FUEL_TYPES)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(remainingQuery)) {
      parsedParams.fuelType = val;
      understoodTokens.push({
        token: key,
        field: 'fuelType',
        label: `Fuel: ${val}`,
      });
      remainingQuery = remainingQuery.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // 8. Transmissions
  for (const [key, val] of Object.entries(KNOWN_TRANSMISSIONS)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(remainingQuery)) {
      parsedParams.transmission = val;
      understoodTokens.push({
        token: key,
        field: 'transmission',
        label: `Transmission: ${val}`,
      });
      remainingQuery = remainingQuery.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // 9. Drive Train
  for (const [key, val] of Object.entries(KNOWN_DRIVE_TRAINS)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(remainingQuery)) {
      parsedParams.driveTrain = val;
      understoodTokens.push({
        token: key,
        field: 'driveTrain',
        label: `Drive Train: ${val}`,
      });
      remainingQuery = remainingQuery.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // Whatever remains is assigned as keyword search query if non-empty
  if (remainingQuery.trim().length > 0) {
    parsedParams.searchQuery = remainingQuery.trim();
  }

  return {
    rawQuery: query,
    parsedParams,
    understoodTokens,
    unparsedQuery: remainingQuery.trim(),
  };
}
