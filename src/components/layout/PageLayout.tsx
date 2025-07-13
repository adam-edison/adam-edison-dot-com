import { HeaderBanner } from './HeaderBanner';
import { MainHeader } from './MainHeader';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  const containerClasses = cn('max-w-7xl mx-auto px-6 py-4 lg:py-8', className);

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderBanner />
      <div className={containerClasses}>
        <MainHeader />
        {children}
      </div>
    </div>
  );
}
