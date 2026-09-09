import {
  getCitiesByDistrictName,
  getDistricts,
  searchCities as searchAll,
  searchCitiesInDistrict,
  type SriLankaCity,
} from "sri-lanka-postal-locations";

/**
 * Sri Lankan district, city and postal-code lookup.
 *
 * SERVER ONLY. The package carries 2,170 city records with names in three
 * languages plus coordinates, which has no business in a checkout bundle —
 * everything the browser needs comes through /api/address instead. The one
 * exception is DISTRICTS below, which is 25 short strings.
 *
 * Used to *assist* address entry, never to validate it: this is a postal-town
 * list, not a list of every place someone lives, so a city it has not heard of
 * still has to be accepted.
 */

export interface CityMatch {
  city: string;
  district: string;
  province: string;
  postalCode: string;
}

/** All 25 districts. Small enough to ship to the client as a constant. */
export const DISTRICTS: string[] = getDistricts()
  .map((district) => district.name_en)
  .sort();

/** ~5% of rows carry the string "NULL" rather than a code. */
const postcodeOf = (city: SriLankaCity): string =>
  /^\d{5}$/.test(city.postcode ?? "") ? city.postcode : "";

const toMatch = (city: SriLankaCity, district: string): CityMatch => ({
  city: city.name_en,
  district,
  province: "",
  postalCode: postcodeOf(city),
});

const districtOf = (city: SriLankaCity): string =>
  getDistricts().find((district) => district.id === city.district_id)?.name_en ?? "";

/**
 * The data writes the Colombo postal divisions as "Colombo 3", but everyone in
 * Sri Lanka writes "Colombo 03". Without this, the single busiest delivery
 * destination in the country returns no suggestions at all.
 */
function normaliseQuery(query: string): string {
  return query.trim().replace(/\b0+(\d)\b/g, "$1");
}

/**
 * The package matches on substring and returns results alphabetically, so
 * "gall" offers Ahungalla and Alagalla while Galle falls off the end. Exact
 * matches come first, then prefixes, then the shortest name — which is almost
 * always the town the shopper meant.
 */
function byRelevance(query: string, cities: SriLankaCity[]): SriLankaCity[] {
  const term = query.toLowerCase();
  const tier = (name: string): number =>
    name === term ? 0 : name.startsWith(term) ? 1 : 2;

  return [...cities].sort((a, b) => {
    const left = a.name_en.toLowerCase();
    const right = b.name_en.toLowerCase();
    return tier(left) - tier(right) || left.length - right.length || left.localeCompare(right);
  });
}

/** Free-text city search for the autocomplete. */
export function searchCities(query: string, limit = 8): CityMatch[] {
  const term = normaliseQuery(query);
  if (term.length < 2) return [];

  // Over-fetch, then rank, because the package's own ordering is alphabetical.
  const found = searchAll(term, 60);
  return byRelevance(term, found)
    .slice(0, limit)
    .map((city) => toMatch(city, districtOf(city)));
}

/** Cities within one district, for when the shopper picks the district first. */
export function citiesInDistrict(district: string, query: string, limit = 8): CityMatch[] {
  const term = normaliseQuery(query);
  const found = term
    ? searchCitiesInDistrict(district, term)
    : getCitiesByDistrictName(district);

  return byRelevance(term, found)
    .slice(0, limit)
    .map((city) => toMatch(city, district));
}
