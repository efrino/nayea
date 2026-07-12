import { createClient } from '@supabase/supabase-js';

const FROM_ADDRESS = 'Nayea.id <onboarding@resend.dev>';

function buildEmailHtml(order) {
  const items = order.order_items || [];
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111;">${item.product?.name || 'Produk'}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;">${item.quantity}x</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111;text-align:right;">Rp ${Number(item.price * item.quantity).toLocaleString('id-ID')}</td>
      </tr>`
    )
    .join('');

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#111;margin:0 0 4px;">NAYEA<span style="color:#10B981;">.</span>ID</h1>
    <p style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:2px;margin:0 0 32px;">Order Confirmation</p>

    <h2 style="font-size:18px;color:#111;margin:0 0 8px;">Terima kasih, ${order.customer_name}! 🌿</h2>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px;">
      Pesanan kamu dengan nomor <strong>#${order.id.toString().slice(-8).toUpperCase()}</strong> sudah kami terima dan sedang kami proses.
      Kami akan segera verifikasi pembayaranmu.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;padding-bottom:8px;border-bottom:2px solid #111;">Produk</th>
          <th style="text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;padding-bottom:8px;border-bottom:2px solid #111;">Qty</th>
          <th style="text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;padding-bottom:8px;border-bottom:2px solid #111;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div style="text-align:right;font-size:16px;font-weight:900;color:#111;padding-top:8px;">
      Total: Rp ${Number(order.total_amount).toLocaleString('id-ID')}
    </div>

    <div style="background:#f9fafb;border-radius:16px;padding:20px;margin:24px 0;">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin:0 0 4px;">Alamat Pengiriman</p>
      <p style="font-size:14px;color:#111;margin:0;">${order.shipping_address || '-'}</p>
    </div>

    <p style="font-size:12px;color:#999;line-height:1.6;margin-top:32px;">
      Kalau ada pertanyaan, langsung balas WhatsApp konfirmasi yang sudah kamu kirim atau hubungi live chat kami di nayea.id.
    </p>
  </div>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !anonKey || !resendApiKey) {
    return res.status(200).json({ sent: false, reason: 'Email not configured (missing RESEND_API_KEY)' });
  }

  // Scoped to the caller's own session — RLS lets a user read only their own order.
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: userError } = await client.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Invalid session' });
  if (!user.email) return res.status(200).json({ sent: false, reason: 'No email on this account' });

  const { data: order, error: orderError } = await client
    .from('orders')
    .select('*, order_items(*, product:products(*))')
    .eq('id', orderId)
    .single();

  if (orderError || !order) return res.status(404).json({ error: 'Order not found' });

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: user.email,
        subject: `Pesanan Diterima — #${order.id.toString().slice(-8).toUpperCase()}`,
        html: buildEmailHtml(order),
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      return res.status(502).json({ sent: false, error: `Resend error: ${errBody}` });
    }

    return res.status(200).json({ sent: true });
  } catch (err) {
    return res.status(502).json({ sent: false, error: err.message });
  }
}
