import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, LayoutDashboard, Image as ImageIcon, ShoppingCart, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load unread count and subscribe to new messages in real-time
  useEffect(() => {
    // Count messages with status 'sent' (admin hasn't seen) from customer
    const fetchUnread = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id')
        .eq('sender', 'customer')
        .eq('status', 'sent');
      setUnreadChatCount(data?.length ?? 0);
    };

    fetchUnread();

    // Reset count when admin navigates to Chat Inbox
    if (location.pathname === '/admin/chat') {
      setUnreadChatCount(0);
    }

    let fetchTimeout;
    
    // Real-time: count new customer messages
    const channel = supabase
      .channel('admin_layout_unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.sender === 'customer') {
          // Only bump count if not on chat page
          if (location.pathname !== '/admin/chat') {
            setUnreadChatCount(prev => prev + 1);
          }
          // Browser push notification
          if (Notification.permission === 'granted') {
            new Notification('💬 Pesan Baru — Nayea.id', {
              body: payload.new.text?.substring(0, 80) || 'Ada pesan baru dari customer.',
              icon: '/favicon.ico',
              tag: 'nayea-chat',
            });
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        // When messages are marked read, re-fetch unread count but DEBOUNCED
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

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Chat Inbox', path: '/admin/chat', icon: MessageSquare, badge: unreadChatCount },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-gray-900">nayea.id</span>
          <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Admin
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-primary bg-opacity-10 text-primary-dark'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center">
                  <Icon className={`mr-3 w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                  {item.name}
                </div>
                {/* Unread badge */}
                {item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={async () => { await logout(); navigate('/admin/login'); }}
            className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 w-5 h-5 text-red-500" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Only show header and padding if NOT on the chat page */}
        {location.pathname !== '/admin/chat' ? (
          <>
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
              <h1 className="text-lg font-medium text-gray-900">
                {navItems.find(item => item.path === location.pathname)?.name || 'Admin CMS'}
              </h1>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">Admin User</span>
                <div className="ml-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
              <Outlet />
            </main>
          </>
        ) : (
          <main className="flex-1 overflow-hidden bg-white">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  );
}

