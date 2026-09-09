import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { citiesInDistrict, searchCities } from "../../lib/address";

/**
 * City autocomplete for the address forms.
 *
 * Exists so the 265KB postal table stays on the server. Public and read-only —
 * it exposes nothing that is not already on the back of every envelope in the
 * country — but the result count is capped so it cannot be used to dump the
 * whole table in one request.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get("q") ?? "").slice(0, 60);
  const district = (params.get("district") ?? "").slice(0, 60);

  /*
   * With a district chosen, that district's cities come first — but a plain
   * substring match inside one district is a dead end when the shopper picked
   * the district before typing, or when the data spells the town differently
   * ("Negambo"). So an empty district-scoped result falls back to the fuzzy
   * search across the whole country.
   */
  const scoped = district ? citiesInDistrict(district, query) : [];
  const matches = scoped.length > 0 ? scoped : searchCities(query);
  return NextResponse.json({ matches });
}
