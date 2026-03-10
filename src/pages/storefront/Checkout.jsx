import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate order placement
    setIsSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 4000);
  };

  if (isSuccess) {
    return (
      <div className="bg-gray-50 min-h-screen py-24 flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm text-center max-w-lg w-full mx-4">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
          <p className="text-gray-500 mb-8">Thank you for your purchase. We have received your order and are processing it right now.</p>
          <p className="text-sm text-gray-400">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <Link to="/cart" className="flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-8">Checkout</h1>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10">
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              
              {/* Customer Info */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="mt-1">
                      <input type="text" id="name" name="name" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 px-3 border" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                    <div className="mt-1">
                      <input type="tel" id="phone" name="phone" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 px-3 border" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Full Address</label>
                    <div className="mt-1">
                      <textarea id="address" name="address" rows={3} required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 px-3 border" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input id="bank_transfer" name="payment_method" type="radio" defaultChecked className="focus:ring-primary h-4 w-4 text-primary border-gray-300" />
                    <label htmlFor="bank_transfer" className="ml-3 block text-sm font-medium text-gray-700">Bank Transfer</label>
                  </div>
                  <div className="flex items-center">
                    <input id="cod" name="payment_method" type="radio" className="focus:ring-primary h-4 w-4 text-primary border-gray-300" />
                    <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-700">Cash on Delivery (COD)</label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button type="submit" className="w-full bg-primary hover:bg-primary-dark transition-colors border border-transparent rounded-full shadow-sm py-4 px-4 text-lg font-medium text-white flex justify-center items-center">
                  Place Order
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
