import { createClient } from '@supabase/supabase-js';

/**
 * Lists all registered users for the User Management page.
 * Superadmin-only — verified server-side via the caller's access token,
 * never trust a client-side role check alone for this.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing Supabase env vars' });
  }

  const authClient = createClient(supabaseUrl, anonKey);
  const { data: { user: caller }, error: callerError } = await authClient.auth.getUser(token);

  if (callerError || !caller) return res.status(401).json({ error: 'Invalid session' });
  if (caller.user_metadata?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden: superadmin only' });
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 200 });
    if (error) throw error;

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name || null,
      role: u.user_metadata?.role || 'customer',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }));

    return res.status(200).json({ users });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
