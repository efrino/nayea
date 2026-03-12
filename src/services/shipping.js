/**
 * Shipping Service — Komerce (RajaOngkir) API
 * 
 * Base URL: https://rajaongkir.komerce.id
 * API Key (Shipping Cost): 3MWQl7O737553b9f902b6242NjSO9wmS
 * 
 * Endpoint:
 *   GET  /api/v1/destination/domestic-destination?search={keyword}
 *   POST /api/v1/calculate/domestic-cost
 * 
 * Origin: Pasar Kemis, Kab. Tangerang, Banten (destination_id: 12439)
 */

const KOMERCE_API_KEY = '3MWQl7O737553b9f902b6242NjSO9wmS';
const BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

// Origin destination_id for Pasar Kemis, Kab Tangerang in Komerce DB
export const ORIGIN_DESTINATION_ID = 12439;

export const COURIERS = [
  { value: 'jne', label: 'JNE' },
  { value: 'jnt', label: 'J&T Express' },
  { value: 'ninja', label: 'Ninja Xpress' },
  { value: 'pos', label: 'POS Indonesia' },
  { value: 'sicepat', label: 'SiCepat' },
];

/**
 * Search destination by keyword (min 3 chars)
 * GET /api/v1/destination/domestic-destination?search=...
 */
export async function searchDestination(keyword) {
  if (!keyword || keyword.length < 3) return [];
  try {
    const res = await fetch(
      `${BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(keyword)}`,
      {
        method: 'GET',
        headers: { 'key': KOMERCE_API_KEY },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // Komerce shape: { meta: {...}, data: [...] }
    return Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    console.error('[searchDestination] error:', e);
    return [];
  }
}

/**
 * Calculate domestic shipping cost
 * POST /api/v1/calculate/domestic-cost
 * 
 * @param {number} receiverDestinationId  - Komerce destination id
 * @param {number} weightGrams            - total weight in grams (min 1000)
 * @param {string} courier                - 'jne' | 'jnt' | 'ninja' | 'pos' | 'sicepat'
 */
export async function getShippingCost(receiverDestinationId, weightGrams, courier) {
  try {
    const formData = new FormData();
    formData.append('shipper_destination_id', String(ORIGIN_DESTINATION_ID));
    formData.append('receiver_destination_id', String(receiverDestinationId));
    formData.append('weight', String(Math.max(1000, Math.ceil(weightGrams / 1000) * 1000)));
    formData.append('courier', courier);

    const res = await fetch(`${BASE_URL}/calculate/domestic-cost`, {
      method: 'POST',
      headers: { 'key': KOMERCE_API_KEY },
      body: formData,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // Normalize Komerce response to internal format
    const rawRates =
      json?.data?.calculate_reguler ||
      json?.data?.results ||
      json?.data ||
      [];

    if (!Array.isArray(rawRates)) return [];

    return rawRates
      .map(r => ({
        service: r.service || r.courier_service_code || '-',
        description: r.description || r.courier_service_name || r.service || '',
        cost: [{
          value: Number(r.price || r.cost || 0),
          etd: [r.etd_from, r.etd_thru].filter(Boolean).join('–') + ' Hari',
        }],
      }))
      .filter(r => r.cost[0].value > 0);
  } catch (e) {
    console.error('[getShippingCost] error:', e);
    return [];
  }
}
