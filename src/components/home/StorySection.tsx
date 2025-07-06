import Image from 'next/image';
import { AnimatedGreeting } from './AnimatedGreeting';
import { StorySeparator } from './StorySeparator';
import { StoryStep } from '@/constants/storyData';

interface StorySectionProps {
  step: StoryStep;
  isFirst?: boolean;
  isLast?: boolean;
}

export function StorySection({ step, isFirst = false, isLast = false }: StorySectionProps) {
  const isImageLeft = step.imagePosition === 'left';

  return (
    <>
      <section className={`${isFirst ? '' : 'mt-6 md:mt-8'}`}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
          {/* Image */}
          <div
            className={`w-full md:w-1/2 flex justify-center mb-8 md:mb-0 ${isImageLeft ? 'md:order-1' : 'md:order-2'}`}
          >
            <Image src={step.imageSrc} alt={step.imageAlt} width={256} height={256} className="w-64 h-auto" />
          </div>

          {/* Text */}
          <div className={`w-full md:w-1/2 text-center md:text-left ${isImageLeft ? 'md:order-2' : 'md:order-1'}`}>
            {step.showAnimatedGreeting ? (
              <>
                <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-8">
                  <AnimatedGreeting />
                </h2>
                <h3 className="text-lg md:text-2xl font-bold leading-tight mb-8">{step.text}</h3>
              </>
            ) : (
              <p className="text-lg md:text-xl leading-relaxed">{step.text}</p>
            )}
          </div>
        </div>
      </section>

      {/* Separator after each section except the last */}
      {!isLast && <StorySeparator />}
    </>
  );
}
