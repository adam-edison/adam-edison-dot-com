import { PageLayout } from '@/components/layout/PageLayout';
import { HeroSection } from '@/components/home/HeroSection';

interface HomeProps {
  onOpenCommand: () => void;
}

export default function Home({ onOpenCommand }: HomeProps) {
  return (
    <PageLayout onOpenCommand={onOpenCommand}>
      <HeroSection />
    </PageLayout>
  );
}
