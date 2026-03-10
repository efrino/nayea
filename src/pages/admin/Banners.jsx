import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Banners() {
  const banners = [
    { id: 1, name: 'Ramadhan Sale', image: 'https://images.unsplash.com/photo-1600262102148-18e5e80826bf?auto=format&fit=crop&q=80&w=400', active: true },
    { id: 2, name: 'New Arrival Khimar', image: 'https://images.unsplash.com/photo-1598555610056-bb6f272caffb?auto=format&fit=crop&q=80&w=400', active: true },
    { id: 3, name: 'Free Shipping Promo', image: 'https://images.unsplash.com/photo-1601646960002-315cc6ba771a?auto=format&fit=crop&q=80&w=400', active: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Banners</h2>
          <p className="mt-1 text-sm text-gray-500">Manage promotional banners shown on the storefront homepage.</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none transition-colors">
          <Plus className="-ml-1 mr-2 w-5 h-5" aria-hidden="true" />
          Add Banner
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image Preview</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={banner.image} alt={banner.name} className="h-16 w-32 object-cover rounded-md bg-gray-100" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{banner.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${banner.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button className="text-primary hover:text-primary-dark transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button className="text-red-500 hover:text-red-700 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
