import { Features } from '@/components/features';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/hero';
import { Pricing } from '@/components/pricing';
export default function Home() {
    return (<main className="min-h-screen">
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </main>);
}
