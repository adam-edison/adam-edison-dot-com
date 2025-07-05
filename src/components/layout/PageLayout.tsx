import { HeaderBanner } from './HeaderBanner';
import { MainHeader } from './MainHeader';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderBanner />
      <div className={`max-w-7xl mx-auto px-6 py-4 lg:py-8 ${className}`}>
        <MainHeader />
        {children}
      </div>
    </div>
  );
}
