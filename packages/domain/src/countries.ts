/**
 * ISO-3166 country + E.164 dial-code catalog (Phase 2.12, CUST-26,
 * `GET /api/v1/config/countries`). This is the one shared, frontend-facing
 * copy of the dataset the Mock API serves — the entries are kept identical
 * to `apps/mock-api/src/store.ts`'s own `COUNTRIES` array (that file cannot
 * import a frontend package; it stays the runtime source of truth reachable
 * only over HTTP, per `FRONT_END_ARCHITECTURE.md` §5). Both applications and
 * every test read this one list, so registration's country selector and its
 * dial-code prefix can never drift from what the server accepts.
 */
export interface CountryOption {
  isoCode: string;
  name: string;
  dialCode: string;
}

const CORE_COUNTRIES: readonly CountryOption[] = [
  { isoCode: 'UG', name: 'Uganda', dialCode: '+256' },
  { isoCode: 'KE', name: 'Kenya', dialCode: '+254' },
  { isoCode: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { isoCode: 'RW', name: 'Rwanda', dialCode: '+250' },
  { isoCode: 'SS', name: 'South Sudan', dialCode: '+211' },
  { isoCode: 'BI', name: 'Burundi', dialCode: '+257' },
  { isoCode: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { isoCode: 'SO', name: 'Somalia', dialCode: '+252' },
  { isoCode: 'ZM', name: 'Zambia', dialCode: '+260' },
  { isoCode: 'MW', name: 'Malawi', dialCode: '+265' },
  { isoCode: 'CD', name: 'DR Congo', dialCode: '+243' },
  { isoCode: 'NG', name: 'Nigeria', dialCode: '+234' },
  { isoCode: 'GH', name: 'Ghana', dialCode: '+233' },
  { isoCode: 'ZA', name: 'South Africa', dialCode: '+27' },
  { isoCode: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { isoCode: 'US', name: 'United States', dialCode: '+1' },
  { isoCode: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { isoCode: 'JP', name: 'Japan', dialCode: '+81' },
  { isoCode: 'IN', name: 'India', dialCode: '+91' },
  { isoCode: 'AU', name: 'Australia', dialCode: '+61' },
];

/**
 * Builds the complete ISO region catalog using the platform's CLDR data. The
 * core dial-code entries remain authoritative for the values used by the
 * registration phone prefix; other regions still participate fully in country
 * selection and server validation even when no dial prefix is displayed.
 */
function buildCountryCatalog(): readonly CountryOption[] {
  const displayNames = typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : undefined;
  const coreByCode = new Map(CORE_COUNTRIES.map((country) => [country.isoCode, country]));
  const regions = ISO_REGION_CODES.split(',');

  return regions
    .map((isoCode) => {
      const core = coreByCode.get(isoCode);
      return core ?? {
        isoCode,
        name: displayNames?.of(isoCode) ?? isoCode,
        dialCode: '',
      };
    })
    .filter((country) => country.name && country.name !== country.isoCode)
    .sort((left, right) => left.name.localeCompare(right.name));
}

// ISO 3166-1 alpha-2 region codes. Names are resolved from the platform's
// English CLDR data so this remains a small, dependency-free shared catalog.
const ISO_REGION_CODES = 'AD,AE,AF,AG,AI,AL,AM,AO,AQ,AR,AS,AT,AU,AW,AX,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BL,BM,BN,BO,BQ,BR,BS,BT,BV,BW,BY,BZ,CA,CC,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,CR,CU,CV,CW,CX,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EE,EG,EH,ER,ES,ET,FI,FJ,FK,FM,FO,FR,GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GP,GQ,GR,GS,GT,GU,GW,GY,HK,HM,HN,HR,HT,HU,ID,IE,IL,IM,IN,IO,IQ,IR,IS,IT,JE,JM,JO,JP,KE,KG,KH,KI,KM,KN,KP,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MF,MG,MH,MK,ML,MM,MN,MO,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NF,NG,NI,NL,NO,NP,NR,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,SS,ST,SV,SX,SY,SZ,TC,TD,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,UM,US,UY,UZ,VA,VC,VE,VG,VI,VN,VU,WF,WS,YE,YT,ZA,ZM,ZW';

export const COUNTRIES: readonly CountryOption[] = buildCountryCatalog();

/** Looks up a country by its ISO alpha-2 code (case-insensitive). */
export function findCountryByIsoCode(isoCode: string): CountryOption | undefined {
  const normalized = typeof isoCode === 'string' ? isoCode.trim().toUpperCase() : '';
  if (!normalized) return undefined;
  return COUNTRIES.find((country) => country.isoCode === normalized);
}

/** Resolves the E.164 dial code for an ISO alpha-2 country code, if known. */
export function resolveDialCode(isoCode: string): string | undefined {
  return findCountryByIsoCode(isoCode)?.dialCode;
}
