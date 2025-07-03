import { HeaderBanner } from '@/components/HeaderBanner';
import { MainHeader } from '@/components/MainHeader';
import { HeroSection } from '@/components/HeroSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderBanner />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <MainHeader />
        <HeroSection />
      </div>
    </div>
  );
}
