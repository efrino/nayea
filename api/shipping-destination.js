/**
 * → securely forwards to rajaongkir.komerce.id server-side (no CORS issue)
 */

// Simple in-memory rate limit (best-effort for serverless)
const rateLimitMap = new Map();
const LIMIT = 50; 
const WINDOW = 60 * 1000;

export default async function handler(req, res) {
  const clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const rateInfo = rateLimitMap.get(clientIp) || { count: 0, resetAt: now + WINDOW };

  if (now > rateInfo.resetAt) {
    rateInfo.count = 1;
    rateInfo.resetAt = now + WINDOW;
  } else {
    rateInfo.count++;
  }
  rateLimitMap.set(clientIp, rateInfo);

  if (rateInfo.count > LIMIT) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  // CORS headers so browser can call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { search = '', limit = 15, offset = 0 } = req.query;
  if (!search || search.length < 3) return res.status(400).json({ data: [] });

  try {
    const params = new URLSearchParams({ search, limit: String(limit), offset: String(offset) });
    const upstream = await fetch(
      `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?${params}`,
      { headers: { key: process.env.KOMERCE_API_KEY } }
    );
    const json = await upstream.json();
    return res.status(upstream.status).json(json);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
