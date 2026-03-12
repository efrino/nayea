/**
 * Shipping Service — calls Vercel API routes that proxy Komerce/RajaOngkir server-side.
 *
 * In production (Vercel), /api/* routes are serverless functions.
 * In local dev, either run `vercel dev` OR the direct fallback below is used.
 *
 * Two functions exported for use in Checkout.jsx:
 *   searchDestination(keyword)          → list of destinations
 *   getShippingRates(destinationId, weightGrams) → list of rates
 */

// Relative path — works on both Vercel production and vercel dev
const API_BASE = '/api';

/**
 * Search domestic destination
 * @param {string} keyword  min 3 chars
 * @param {number} limit    max results
 */
export async function searchDestination(keyword, limit = 15) {
  if (!keyword || keyword.length < 3) return [];
  try {
    const params = new URLSearchParams({ search: keyword, limit: String(limit) });
    const res = await fetch(`${API_BASE}/shipping-destination?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    console.error('[searchDestination]', e.message);
    return [];
  }
}

/**
 * Get all courier rates for a destination in one request
 * @param {number|string} destinationId  — id from searchDestination
 * @param {number} weightGrams           — min 1000g
 * @returns normalized rate array: { courier, service, description, price, etd }
 */
export async function getShippingRates(destinationId, weightGrams) {
  try {
    const res = await fetch(`${API_BASE}/shipping-cost`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        destination: destinationId,
        weight:      Math.max(1000, weightGrams),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const raw = json?.data ?? [];
    if (!Array.isArray(raw)) return [];

    return raw
      .map(r => ({
        courier:     (r.code || r.courier || '').toUpperCase(),
        service:     r.service || '',
        description: r.description || r.service || '',
        price:       Number(r.cost || 0),
        etd:         r.etd || '-'
      }))
      .filter(r => r.price > 0)
      .sort((a, b) => a.price - b.price);
  } catch (e) {
    console.error('[getShippingRates]', e.message);
    return [];
  }
}
