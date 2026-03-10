import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);

  // Mock product data
  const product = { 
    id: id, 
    name: "Khimar Syar'i Premium", 
    price: 150000, 
    description: "Khimar syar'i berbahan ceruty babydoll premium yang jatuh, lembut, dan tidak menerawang. Dilengkapi dengan soft pad antem (anti tembem) yang kokoh dan nyaman dipakai seharian. Cocok untuk daily maupun acara formal.",
    is_preorder: false, 
    stock: 12,
    images: [
      "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1598555610056-bb6f272caffb?auto=format&fit=crop&q=80&w=800"
    ]
  };

  const [activeImage, setActiveImage] = useState(product.images[0]);

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <Link to="/catalog" className="flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Link>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          {/* Image Gallery */}
          <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
            <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(img)}
                  className={`relative h-24 w-24 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden bg-gray-100 ${activeImage === img ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-gray-200'}`}
                >
                  <img src={img} alt="" className="object-cover object-center w-full h-full" />
                </button>
              ))}
            </div>
            <div className="w-full relative bg-gray-100 rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-square lg:aspect-[4/5]">
              <img src={activeImage} alt={product.name} className="object-cover object-center w-full h-full" />
              {product.is_preorder && (
                <span className="absolute top-4 left-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 backdrop-blur-sm bg-opacity-90">
                  Pre-order
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-10 px-4 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-4">{product.name}</h1>
            <div className="flex items-center justify-between mb-6">
              <p className="text-3xl font-bold text-primary">Rp {product.price.toLocaleString('id-ID')}</p>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                In Stock ({product.stock})
              </div>
            </div>

            <div className="prose prose-sm md:prose-base text-gray-600 mb-8">
              <p>{product.description}</p>
            </div>

            <div className="mt-8">
              <div className="flex items-center mb-4">
                <span className="text-sm font-medium text-gray-900 mr-4">Quantity</span>
                <div className="flex items-center border border-gray-300 rounded-full bg-white">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-gray-600 hover:text-primary transition-colors">-</button>
                  <span className="px-4 py-2 font-medium w-12 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-4 py-2 text-gray-600 hover:text-primary transition-colors">+</button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button className="flex-1 bg-primary hover:bg-primary-dark transition-colors text-white px-8 py-4 rounded-full font-bold text-lg flex justify-center items-center shadow-sm">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {product.is_preorder ? 'Pre-order Now' : 'Add to Cart'}
                </button>
              </div>
            </div>

            {/* Guarantees */}
            <div className="mt-10 border-t border-gray-100 pt-8 grid grid-cols-1 gap-4">
              <div className="flex items-center text-gray-500">
                <Truck className="w-5 h-5 mr-3 text-primary" />
                <span className="text-sm">Safe & fast delivery via reliable couriers</span>
              </div>
              <div className="flex items-center text-gray-500">
                <ShieldCheck className="w-5 h-5 mr-3 text-primary" />
                <span className="text-sm">Premium quality guarantee from nayea.id</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
