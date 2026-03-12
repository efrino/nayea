/**
 * Vercel Serverless Function
 * Proxy: POST /api/shipping-cost
 * Body (JSON): { destination, weight }
 * → securely forwards to rajaongkir.komerce.id server-side (no CORS issue)
 */
export default async function handler(req, res) {
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
