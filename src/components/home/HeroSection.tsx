import { StorySection } from './StorySection';
import { storySteps } from '@/constants/storyData';

export function HeroSection() {
  return (
    <main>
      {storySteps.map((step, index) => (
        <StorySection key={step.id} step={step} isFirst={index === 0} isLast={index === storySteps.length - 1} />
      ))}
    </main>
  );
}
