import { Outlet, Link, useLocation } from 'react-router-dom';
import { Package, LayoutDashboard, Image as ImageIcon, ShoppingCart, MessageSquare, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Chat Inbox', path: '/admin/chat', icon: MessageSquare },
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
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary bg-opacity-10 text-primary-dark'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Link to="/" className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="mr-3 w-5 h-5 text-red-500" />
            Sign out
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
      </div>
    </div>
  );
}
