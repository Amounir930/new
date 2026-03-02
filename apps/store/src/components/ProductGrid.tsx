import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: string;
  currency: string;
  imageUrl?: string;
  slug: string;
}

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map((product) => (
        <div
          key={product.id}
          className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
        >
          <div className="relative aspect-square mb-4 rounded-2xl overflow-hidden bg-gray-50">
            <Image
              src={
                product.imageUrl ||
                `https://placehold.co/400x400?text=${product.name}`
              }
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <button
              type="button"
              className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-2xl shadow-lg transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Add to Cart</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          <div className="space-y-1 px-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Premium Collection
            </span>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xl font-black text-gray-900">
                {product.price}{' '}
                <span className="text-sm font-medium text-gray-500 lowercase">
                  {product.currency}
                </span>
              </span>
              <div className="flex bg-yellow-50 px-2 py-0.5 rounded-lg">
                <svg
                  className="w-3 h-3 text-yellow-500 fill-current"
                  viewBox="0 0 20 20"
                >
                  <title>Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-[10px] font-bold text-yellow-700 ml-1">
                  4.9
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
