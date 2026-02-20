interface Product {
    id: string;
    name: string;
    price: string;
    currency: string;
    imageUrl?: string;
    slug: string;
}

export default function BestSellers({ products }: { products: Product[] }) {
    if (!products) return null;
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
                <a
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group block space-y-3"
                >
                    <div className="relative aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all group-hover:shadow-md">
                        <img
                            src={product.imageUrl || `https://placehold.co/400x500?text=${product.name}`}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold rounded uppercase tracking-wider">
                            Best Seller
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {product.name}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-blue-600">{product.price} {product.currency}</span>
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
}
