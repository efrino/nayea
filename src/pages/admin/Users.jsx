import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, Shield, ShieldCheck, User as UserIcon, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdmin } from '../../lib/roles';
import { listAllUsers, setUserRole } from '../../services/api';

const ROLE_STYLE = {
  superadmin: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  admin: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  customer: 'bg-gray-50 text-gray-400 border-gray-100',
};

const ROLE_LABEL = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  customer: 'Member',
};

export default function Users() {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const currentRole = session?.user?.user_metadata?.role;

  useEffect(() => {
    if (isSuperAdmin(currentRole)) fetchUsers();
  }, [currentRole]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    const { data, error } = await listAllUsers();
    if (error) setError(error.message);
    else setUsers(data || []);
    setLoading(false);
  }

  // Route guard — client-side UX only. Real enforcement is server-side in
  // api/admin-list-users.js and api/admin-set-role.js.
  if (!isSuperAdmin(currentRole)) {
    return <Navigate to="/admin" replace />;
  }

  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'customer' : 'admin';
    const verb = nextRole === 'admin' ? 'menjadikan admin' : 'mencabut akses admin';
    if (!window.confirm(`Yakin ingin ${verb} untuk ${user.email}?`)) return;

    setUpdatingId(user.id);
    const { error } = await setUserRole(user.id, nextRole);
    if (error) {
      alert('Gagal mengubah role: ' + error.message);
    } else {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
    }
    setUpdatingId(null);
  };

  const filteredUsers = users.filter((u) =>
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold font-heading text-gray-900 leading-tight">Manajemen User</h2>
          <p className="mt-1 text-gray-500">Kelola role admin — khusus untuk Anda sebagai superadmin.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">{users.length} TOTAL USER</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama atau email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-50 bg-white shadow-premium focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
        />
      </div>

      <div className="bg-white rounded-[2rem] shadow-premium border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">
                <th className="px-8 py-5 font-bold">User</th>
                <th className="px-8 py-5 font-bold">Role</th>
                <th className="px-8 py-5 font-bold">Bergabung</th>
                <th className="px-8 py-5 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                    <span className="text-sm text-gray-400 font-medium">Memuat daftar user...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-rose-500 font-medium">{error}</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-medium italic">
                    Tidak ada user yang cocok.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                          {u.role === 'superadmin' ? (
                            <Shield className="w-5 h-5 text-indigo-500" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{u.full_name || 'Tanpa nama'}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 inline-flex text-[10px] font-bold rounded-lg border ${ROLE_STYLE[u.role] || ROLE_STYLE.customer}`}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {u.role === 'superadmin' ? (
                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Tidak bisa diubah</span>
                      ) : (
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={updatingId === u.id}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-90 disabled:opacity-50 ${
                            u.role === 'admin'
                              ? 'bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                          }`}
                        >
                          {u.role === 'admin' ? (
                            <>
                              <ArrowDownCircle className="w-4 h-4" /> Cabut Admin
                            </>
                          ) : (
                            <>
                              <ArrowUpCircle className="w-4 h-4" /> Jadikan Admin
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
