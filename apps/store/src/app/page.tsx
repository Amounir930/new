import BannerCarousel from "@/components/BannerCarousel";
import BestSellers from "@/components/BestSellers";
import ProductGrid from "@/components/ProductGrid";
import { getHomeData } from "@/lib/api";

export default async function Home() {
    const data = await getHomeData();
    const banners = data?.banners || [];
    const bestSellers = data?.bestSellers || [];

    return (
        <div className="space-y-12 pb-20">
            <BannerCarousel banners={banners} />

            <div className="container mx-auto px-4 space-y-8">
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Best Sellers</h2>
                        <a href="/shop" className="text-blue-600 font-medium hover:underline">View All</a>
                    </div>
                    <BestSellers products={bestSellers} />
                </section>

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Latest Products</h2>
                    </div>
                    <ProductGrid products={bestSellers} />
                </section>
            </div>
        </div>
    );
}
