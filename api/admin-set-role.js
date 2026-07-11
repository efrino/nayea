import { createClient } from '@supabase/supabase-js';

// The superadmin role can never be granted or revoked through this endpoint —
// there is exactly one superadmin, assigned by email in the DB trigger.
const ASSIGNABLE_ROLES = ['admin', 'customer'];

/**
 * Promotes/demotes a user between 'admin' and 'customer'.
 * Superadmin-only — verified server-side via the caller's access token.
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

  const { userId, role } = req.body || {};
  if (!userId || !role) return res.status(400).json({ error: 'userId and role are required' });
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ASSIGNABLE_ROLES.join(', ')}` });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    const missing = [
      !supabaseUrl && 'VITE_SUPABASE_URL',
      !anonKey && 'VITE_SUPABASE_PUBLISHABLE_KEY',
      !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean);
    return res.status(500).json({ error: `Server misconfigured: missing env var(s): ${missing.join(', ')}` });
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
    const { data: targetData, error: targetError } = await adminClient.auth.admin.getUserById(userId);
    if (targetError) throw targetError;

    if (targetData.user.user_metadata?.role === 'superadmin') {
      return res.status(400).json({ error: 'Cannot change the superadmin role' });
    }

    const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: { ...targetData.user.user_metadata, role },
    });
    if (error) throw error;

    return res.status(200).json({ user: { id: data.user.id, role: data.user.user_metadata?.role } });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
