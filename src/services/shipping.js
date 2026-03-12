/**
 * Shipping Service — RajaOngkir via Komerce API
 *
 * Based on official Postman Collection (rajaongkir.komerce.id)
 *
 * Endpoints:
 *   GET  /api/v1/destination/domestic-destination?search=&limit=&offset=
 *   POST /api/v1/calculate/domestic-cost  (x-www-form-urlencoded)
 *
 * API Key (Shipping Cost): 3MWQl7O737553b9f902b6242NjSO9wmS
 *
 * Origin: Pasar Kemis, Kab. Tangerang, Banten
 * NOTE: ORIGIN_ID is the destination id returned by the search API for "Pasar Kemis".
 *       Please verify this by searching once and checking the id field.
 */

const SHIPPING_COST_KEY = '3MWQl7O737553b9f902b6242NjSO9wmS';
const BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

// Destination id for Pasar Kemis, Kab. Tangerang from RajaOngkir database
// If results are empty or wrong, search "Pasar Kemis" from the destination endpoint
// and update this value with the correct id from the response.
export const ORIGIN_ID = 31555;

// All domestic couriers supported (colon-separated as per API spec)
// This sends ONE request and returns results for all couriers at once
const ALL_COURIERS = 'jne:jnt:ninja:sicepat:anteraja:pos:tiki:lion:ide:sap';

/**
 * Search domestic destination by keyword
 * GET /api/v1/destination/domestic-destination
 *
 * @param {string} keyword  - at least 3 characters
 * @param {number} limit    - max results (default 10)
 * Returns array of: { id, label, subdistrict_name, district_name, city_name, province }
 */
export async function searchDestination(keyword, limit = 10) {
  if (!keyword || keyword.length < 3) return [];
  try {
    const params = new URLSearchParams({
      search: keyword,
      limit: String(limit),
      offset: '0',
    });
    const res = await fetch(`${BASE_URL}/destination/domestic-destination?${params}`, {
      method: 'GET',
      headers: { key: SHIPPING_COST_KEY },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    // Komerce shape: { meta: {...}, data: [...] }
    return Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    console.error('[searchDestination]', e.message);
    return [];
  }
}

/**
 * Calculate domestic shipping cost for ALL couriers in one request.
 * POST /api/v1/calculate/domestic-cost  (application/x-www-form-urlencoded)
 *
 * @param {number|string} destinationId  - id from searchDestination result
 * @param {number} weightGrams           - total package weight in grams (min 1000g)
 * @returns {Array} normalized rate objects: { courier, service, description, price, etd }
 */
export async function getShippingRates(destinationId, weightGrams) {
  try {
    const body = new URLSearchParams({
      origin: String(ORIGIN_ID),
      destination: String(destinationId),
      weight: String(Math.max(1000, weightGrams)),
      courier: ALL_COURIERS,
      price: 'lowest',
    });

    const res = await fetch(`${BASE_URL}/calculate/domestic-cost`, {
      method: 'POST',
      headers: {
        key: SHIPPING_COST_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();

    // Normalize — Komerce returns an array of service objects
    const raw = json?.data ?? [];
    if (!Array.isArray(raw)) return [];

    return raw
      .map(r => ({
        courier: (r.courier_code || r.courier || '').toUpperCase(),
        service: r.service || '',
        description: r.description || r.service || '',
        price: Number(r.price || 0),
        etd: r.etd_from != null
          ? `${r.etd_from}${r.etd_thru && r.etd_thru !== r.etd_from ? `–${r.etd_thru}` : ''} Hari`
          : '-',
      }))
      .filter(r => r.price > 0)
      .sort((a, b) => a.price - b.price); // cheapest first
  } catch (e) {
    console.error('[getShippingRates]', e.message);
    return [];
  }
}
