import { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Chat Inbox', path: '/admin/chat', icon: MessageSquare, badge: unreadChatCount },
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
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">A</div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">Administrator</p>
              <p className="text-[10px] text-gray-400 mt-1">Super Admin Role</p>
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
            <button className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all relative group">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full group-hover:animate-ping"></span>
            </button>
            
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

