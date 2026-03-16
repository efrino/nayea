/**
 * → securely forwards to rajaongkir.komerce.id server-side (no CORS issue)
 */

// Simple in-memory rate limit (best-effort for serverless)
const rateLimitMap = new Map();
const LIMIT = 30; 
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

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { destination, weight } = req.body;
  if (!destination || !weight) return res.status(400).json({ error: 'destination and weight required' });

  // Pasar Kemis, Kab. Tangerang origin id
  const ORIGIN = process.env.KOMERCE_ORIGIN_ID || '31555';

  try {
    const body = new URLSearchParams({
      origin: ORIGIN,
      destination: String(destination),
      weight:      String(Math.max(1000, Number(weight))),
      courier:     'jne:jnt:ninja:sicepat:anteraja:pos:tiki:lion:ide',
      price:       'lowest',
    });

    const upstream = await fetch(
      'https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost',
      {
        method:  'POST',
        headers: {
          key:            process.env.KOMERCE_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );
    const json = await upstream.json();
    return res.status(upstream.status).json(json);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
