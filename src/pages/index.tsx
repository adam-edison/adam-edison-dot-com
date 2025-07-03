import { Geist } from 'next/font/google';
import { HeaderBanner } from '@/components/HeaderBanner';
import { MainHeader } from '@/components/MainHeader';
import { HeroSection } from '@/components/HeroSection';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

export default function Home() {
  const linkedInUrl = 'https://www.linkedin.com/in/adam-edison-software/';
  const githubUrl = 'https://github.com/adam-edison';

  return (
    <div className={`${geistSans.className} min-h-screen bg-black text-white`}>
      <HeaderBanner />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <MainHeader githubUrl={githubUrl} linkedInUrl={linkedInUrl} />
        <HeroSection />
      </div>
    </div>
  );
}
