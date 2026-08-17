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
        dialCode: DIAL_CODE_BY_REGION[isoCode] ?? '',
      };
    })
    .filter((country) => country.name && country.name !== country.isoCode)
    .sort((left, right) => left.name.localeCompare(right.name));
}

// ISO 3166-1 alpha-2 region codes. Names are resolved from the platform's
// English CLDR data so this remains a small, dependency-free shared catalog.
const ISO_REGION_CODES = 'AD,AE,AF,AG,AI,AL,AM,AO,AQ,AR,AS,AT,AU,AW,AX,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BL,BM,BN,BO,BQ,BR,BS,BT,BV,BW,BY,BZ,CA,CC,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,CR,CU,CV,CW,CX,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EE,EG,EH,ER,ES,ET,FI,FJ,FK,FM,FO,FR,GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GP,GQ,GR,GS,GT,GU,GW,GY,HK,HM,HN,HR,HT,HU,ID,IE,IL,IM,IN,IO,IQ,IR,IS,IT,JE,JM,JO,JP,KE,KG,KH,KI,KM,KN,KP,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MF,MG,MH,MK,ML,MM,MN,MO,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NF,NG,NI,NL,NO,NP,NR,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,SS,ST,SV,SX,SY,SZ,TC,TD,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,UM,US,UY,UZ,VA,VC,VE,VG,VI,VN,VU,WF,WS,YE,YT,ZA,ZM,ZW';

const DIAL_CODE_BY_REGION: Record<string, string> = {
  AD: '+376', AE: '+971', AF: '+93', AG: '+1268', AI: '+1264', AL: '+355', AM: '+374', AO: '+244', AR: '+54', AS: '+1684', AT: '+43', AU: '+61', AW: '+297', AX: '+358', AZ: '+994',
  BA: '+387', BB: '+1246', BD: '+880', BE: '+32', BF: '+226', BG: '+359', BH: '+973', BI: '+257', BJ: '+229', BL: '+590', BM: '+1441', BN: '+673', BO: '+591', BQ: '+599', BR: '+55', BS: '+1242', BT: '+975', BW: '+267', BY: '+375', BZ: '+501',
  CA: '+1', CC: '+61', CD: '+243', CF: '+236', CG: '+242', CH: '+41', CI: '+225', CK: '+682', CL: '+56', CM: '+237', CN: '+86', CO: '+57', CR: '+506', CU: '+53', CV: '+238', CW: '+599', CX: '+61', CY: '+357', CZ: '+420',
  DE: '+49', DJ: '+253', DK: '+45', DM: '+1767', DO: '+1809', DZ: '+213', EC: '+593', EE: '+372', EG: '+20', EH: '+212', ER: '+291', ES: '+34', ET: '+251', FI: '+358', FJ: '+679', FK: '+500', FM: '+691', FO: '+298', FR: '+33',
  GA: '+241', GB: '+44', GD: '+1473', GE: '+995', GF: '+594', GG: '+44', GH: '+233', GI: '+350', GL: '+299', GM: '+220', GN: '+224', GP: '+590', GQ: '+240', GR: '+30', GS: '+500', GT: '+502', GU: '+1671', GW: '+245', GY: '+592',
  HK: '+852', HM: '+672', HN: '+504', HR: '+385', HT: '+509', HU: '+36', ID: '+62', IE: '+353', IL: '+972', IM: '+44', IN: '+91', IO: '+246', IQ: '+964', IR: '+98', IS: '+354', IT: '+39', JE: '+44', JM: '+1876', JO: '+962', JP: '+81',
  KE: '+254', KG: '+996', KH: '+855', KI: '+686', KM: '+269', KN: '+1869', KP: '+850', KR: '+82', KW: '+965', KY: '+1345', KZ: '+7', LA: '+856', LB: '+961', LC: '+1758', LI: '+423', LK: '+94', LR: '+231', LS: '+266', LT: '+370', LU: '+352', LV: '+371', LY: '+218',
  MA: '+212', MC: '+377', MD: '+373', ME: '+382', MF: '+590', MG: '+261', MH: '+692', MK: '+389', ML: '+223', MM: '+95', MN: '+976', MO: '+853', MP: '+1670', MQ: '+596', MR: '+222', MS: '+1664', MT: '+356', MU: '+230', MV: '+960', MW: '+265', MX: '+52', MY: '+60', MZ: '+258',
  NA: '+264', NC: '+687', NE: '+227', NF: '+672', NG: '+234', NI: '+505', NL: '+31', NO: '+47', NP: '+977', NR: '+674', NU: '+683', NZ: '+64', OM: '+968', PA: '+507', PE: '+51', PF: '+689', PG: '+675', PH: '+63', PK: '+92', PL: '+48', PM: '+508', PN: '+64', PR: '+1787', PS: '+970', PT: '+351', PW: '+680', PY: '+595', QA: '+974', RE: '+262', RO: '+40', RS: '+381', RU: '+7', RW: '+250',
  SA: '+966', SB: '+677', SC: '+248', SD: '+249', SE: '+46', SG: '+65', SH: '+290', SI: '+386', SJ: '+47', SK: '+421', SL: '+232', SM: '+378', SN: '+221', SO: '+252', SR: '+597', SS: '+211', ST: '+239', SV: '+503', SX: '+1721', SY: '+963', SZ: '+268',
  TC: '+1649', TD: '+235', TF: '+262', TG: '+228', TH: '+66', TJ: '+992', TK: '+690', TL: '+670', TM: '+993', TN: '+216', TO: '+676', TR: '+90', TT: '+1868', TV: '+688', TW: '+886', TZ: '+255', UA: '+380', UG: '+256', UM: '+1', US: '+1', UY: '+598', UZ: '+998', VA: '+39', VC: '+1784', VE: '+58', VG: '+1284', VI: '+1340', VN: '+84', VU: '+678', WF: '+681', WS: '+685', YE: '+967', YT: '+262', ZA: '+27', ZM: '+260', ZW: '+263',
};

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
