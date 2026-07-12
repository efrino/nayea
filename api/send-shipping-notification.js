import { createClient } from '@supabase/supabase-js';

const FROM_ADDRESS = 'Nayea.id <onboarding@resend.dev>';
const STAFF_ROLES = ['admin', 'superadmin'];

function buildEmailHtml(order) {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#111;margin:0 0 4px;">NAYEA<span style="color:#10B981;">.</span>ID</h1>
    <p style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:2px;margin:0 0 32px;">Shipping Update</p>

    <h2 style="font-size:18px;color:#111;margin:0 0 8px;">Pesananmu sudah dikirim! 📦</h2>
    <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 24px;">
      Halo ${order.customer_name}, pesanan <strong>#${order.id.toString().slice(-8).toUpperCase()}</strong> sudah diserahkan ke kurir
      ${order.shipping_courier ? `(<strong>${order.shipping_courier}</strong>)` : ''} dan dalam perjalanan ke alamatmu.
    </p>

    ${order.tracking_number ? `
    <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:16px;padding:20px;margin:0 0 24px;">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#059669;margin:0 0 4px;">Nomor Resi</p>
      <p style="font-size:18px;font-weight:900;font-family:monospace;color:#111;margin:0;">${order.tracking_number}</p>
    </div>` : ''}

    <div style="background:#f9fafb;border-radius:16px;padding:20px;margin:0 0 24px;">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin:0 0 4px;">Dikirim Ke</p>
      <p style="font-size:14px;color:#111;margin:0;">${order.shipping_address || '-'}</p>
    </div>

    <p style="font-size:12px;color:#999;line-height:1.6;margin-top:32px;">
      Ada pertanyaan soal pengiriman? Hubungi live chat kami di nayea.id.
    </p>
  </div>`;
}

/**
 * Sends a "your order has shipped" email. Staff-only (verified server-side).
 * Silently no-ops (200, sent:false) for guest orders with no account email
 * on file, or when RESEND_API_KEY isn't configured — this should never
 * block the admin's actual save action in the UI.
 */
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing Supabase env vars' });
  }
  if (!resendApiKey) {
    return res.status(200).json({ sent: false, reason: 'Email not configured (missing RESEND_API_KEY)' });
  }

  const authClient = createClient(supabaseUrl, anonKey);
  const { data: { user: caller }, error: callerError } = await authClient.auth.getUser(token);
  if (callerError || !caller) return res.status(401).json({ error: 'Invalid session' });
  if (!STAFF_ROLES.includes(caller.user_metadata?.role)) {
    return res.status(403).json({ error: 'Forbidden: staff only' });
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) return res.status(404).json({ error: 'Order not found' });
  if (!order.user_id) return res.status(200).json({ sent: false, reason: 'Guest order, no account email on file' });

  const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(order.user_id);
  if (userError || !userData?.user?.email) {
    return res.status(200).json({ sent: false, reason: 'Customer email not found' });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: userData.user.email,
        subject: `Pesananmu Sudah Dikirim — #${order.id.toString().slice(-8).toUpperCase()}`,
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
