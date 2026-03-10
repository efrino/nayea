import { ShoppingBag, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { name: 'Total Revenue', value: 'Rp 14,500,000', change: '+12%', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'New Orders', value: '24', change: '+5.4%', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Active Customers', value: '142', change: '+18%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Conversion Rate', value: '3.2%', change: '+1.1%', icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: 'Siti Aminah', product: "Khimar Syar'i Premium", total: 'Rp 150,000', status: 'Pending' },
    { id: 'ORD-002', customer: 'Nisa Rahmawati', product: "Gamis Set Aisyah", total: 'Rp 350,000', status: 'Paid' },
    { id: 'ORD-003', customer: 'Aulia Putri', product: "Pashmina Silk Exclusive", total: 'Rp 240,000', status: 'Shipped' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${item.bg}`}>
                    <Icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          {item.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 mt-8">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
