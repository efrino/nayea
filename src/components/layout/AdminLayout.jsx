import { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  LayoutDashboard,
  Image as ImageIcon,
  ShoppingCart,
  MessageSquare,
  LogOut,
  CreditCard,
  Menu,
  X,
  Bell,
  ChevronRight,
  Users as UsersIcon,
  Tag,
  AlertTriangle,
  Star,
  Info,
  CheckCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { isSuperAdmin } from '../../lib/roles';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';

const NOTIF_CATEGORY_META = {
  order: { icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
  message: { icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50' },
  stock: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  review: { icon: Star, color: 'text-purple-600 bg-purple-50' },
  info: { icon: Info, color: 'text-gray-600 bg-gray-100' },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  return `${Math.floor(hours / 24)}h lalu`;
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, session } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const currentRole = session?.user?.user_metadata?.role;
  const isSuper = isSuperAdmin(currentRole);
  const currentUserId = session?.user?.id;

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.read_by?.includes(currentUserId)).length,
    [notifications, currentUserId]
  );

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load unread count and subscribe to new messages in real-time
  useEffect(() => {
    const fetchUnread = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id')
        .eq('sender', 'customer')
        .eq('status', 'sent');
      setUnreadChatCount(data?.length ?? 0);
    };

    fetchUnread();

    if (location.pathname === '/admin/chat') {
      setUnreadChatCount(0);
    }

    let fetchTimeout;
    const channel = supabase
      .channel('admin_layout_unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.sender === 'customer') {
          if (location.pathname !== '/admin/chat') {
            setUnreadChatCount(prev => prev + 1);
          }
          if (Notification.permission === 'granted') {
            new Notification('💬 Pesan Baru — Nayea.id', {
              body: payload.new.text?.substring(0, 80) || 'Ada pesan baru dari customer.',
              icon: '/nayea.jpg',
              tag: 'nayea-chat',
            });
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.status === 'read' || payload.new.status === 'delivered') {
          clearTimeout(fetchTimeout);
          fetchTimeout = setTimeout(() => {
            fetchUnread();
          }, 300);
        }
      })
      .subscribe();

    return () => {
       clearTimeout(fetchTimeout);
       supabase.removeChannel(channel);
    };
  }, [location.pathname]);

  // Load notification feed and subscribe to new notifications in real-time
  useEffect(() => {
    getNotifications().then(({ data }) => {
      if (data) setNotifications(data);
    });

    const channel = supabase
      .channel('admin_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
        if (Notification.permission === 'granted') {
          new Notification(`Nayea.id — ${payload.new.title}`, {
            body: payload.new.body || '',
            icon: '/nayea.jpg',
            tag: `nayea-notif-${payload.new.category}`,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNotifClick = async (notif) => {
    if (!notif.read_by?.includes(currentUserId)) {
      markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read_by: [...(n.read_by || []), currentUserId] } : n))
      );
    }
    setIsNotifOpen(false);
    if (notif.link_url) navigate(notif.link_url);
  };

  const handleMarkAllRead = async () => {
    markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_by: [...new Set([...(n.read_by || []), currentUserId])] })));
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Vouchers', path: '/admin/vouchers', icon: Tag },
    { name: 'Documents', path: '/admin/documents', icon: FileText },
    { name: 'Chat Inbox', path: '/admin/chat', icon: MessageSquare, badge: unreadChatCount },
    ...(isSuper ? [{ name: 'User Management', path: '/admin/users', icon: UsersIcon }] : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="h-20 flex items-center px-8 border-b border-gray-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            N
          </div>
          <div>
            <span className="text-xl font-bold font-heading tracking-tight text-gray-900 block">nayea.id</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-dark -mt-1 block">Control Center</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`group flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/25 translate-x-1'
                : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-900'
                }`}
            >
              <div className="flex items-center">
                <Icon className={`mr-3 w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={isActive ? 'font-semibold' : ''}>{item.name}</span>
              </div>
              
              {item.badge > 0 ? (
                <span className={`animate-pulse rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : (
                isActive && <ChevronRight className="w-4 h-4 opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
              {session?.user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-none truncate">{session?.user?.email || 'Administrator'}</p>
              <p className="text-[10px] text-gray-400 mt-1">{isSuper ? 'Superadmin Role' : 'Admin Role'}</p>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); navigate('/admin/login'); }}
            className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors border border-red-100/50"
          >
            <LogOut className="mr-2 w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FBFBFE] text-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-gray-100/80">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar (Drawer) */}
      <aside className={`fixed top-0 left-0 bottom-0 w-80 bg-white z-[60] lg:hidden transform transition-transform duration-500 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full shadow-none'}`}>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-6 right-6 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 glass-effect sticky top-0 z-40 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-white border border-gray-100 text-gray-600 shadow-sm active:scale-95 transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold font-heading text-gray-900">
              {navItems.find(item => item.path === location.pathname)?.name || 'Admin Console'}
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all relative group"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 border-2 border-white rounded-full text-[9px] font-bold text-white">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Notifikasi</h3>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-14 text-center text-gray-400 text-xs font-medium italic">
                          Belum ada notifikasi.
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const meta = NOTIF_CATEGORY_META[notif.category] || NOTIF_CATEGORY_META.info;
                          const Icon = meta.icon;
                          const isUnread = !notif.read_by?.includes(currentUserId);
                          return (
                            <button
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`w-full flex items-start gap-3 px-6 py-4 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-primary/[0.03]' : ''}`}
                            >
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-900 truncate">{notif.title}</p>
                                {notif.body && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>}
                                <p className="text-[10px] text-gray-300 mt-1 font-medium">{timeAgo(notif.created_at)}</p>
                              </div>
                              {isUnread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-10 w-px bg-gray-100 mx-1 hidden sm:block"></div>
            
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-none">Admin Nayea</p>
                <p className="text-[10px] text-primary-dark mt-1 font-medium">Online</p>
              </div>
              <div className="w-10 h-10 rounded-xl gradient-accent p-[2px] shadow-lg shadow-accent/20">
                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                  <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden ${location.pathname === '/admin/chat' ? 'bg-white' : 'p-6 lg:p-10'}`}>
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

