import Image from 'next/image';

interface Product {
  id: string;
  name: string | { en?: string; ar?: string };
  price: string | number;
  currency: string;
  imageUrl?: string;
  slug: string;
}

function getProductName(name: string | { en?: string; ar?: string }): string {
  if (typeof name === 'string') return name;
  return name?.en || name?.ar || 'Product';
}

function getProductPrice(price: string | number): string {
  if (typeof price === 'number') return price.toFixed(2);
  return price;
}

export default function BestSellers({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((product) => {
        const productName = getProductName(product.name);
        const productPrice = getProductPrice(product.price);

        return (
          <a
            key={product.id}
            href={`/${product.slug}`}
            className="group block space-y-3"
          >
            <div className="relative aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all group-hover:shadow-md">
              <Image
                src={
                  product.imageUrl ||
                  `https://placehold.co/400x500?text=${encodeURIComponent(productName)}`
                }
                alt={productName}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold rounded uppercase tracking-wider">
                Best Seller
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {productName}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-blue-600">
                  ${productPrice}
                </span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
