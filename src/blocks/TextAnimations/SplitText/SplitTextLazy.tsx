import { useState, useEffect, useRef } from 'react';
import type { SplitTextProps } from './SplitText';
import { logger } from '@/shared/Logger';

export default function SplitTextLazy(props: SplitTextProps) {
  const [SplitTextComponent, setSplitTextComponent] = useState<React.ComponentType<SplitTextProps> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountRef = useRef(false);

  useEffect(() => {
    if (mountRef.current) return;
    mountRef.current = true;

    // Dynamically import GSAP and SplitText only when component is used
    const loadComponent = async () => {
      try {
        const { default: SplitText } = await import('./SplitText');
        setSplitTextComponent(() => SplitText);
      } catch (error) {
        logger.error('Failed to load SplitText component:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComponent();
  }, []);

  if (isLoading) {
    // Return the text without animation while loading
    return <span>{props.text}</span>;
  }

  if (!SplitTextComponent) {
    // Fallback to plain text if loading failed
    return <span>{props.text}</span>;
  }

  return <SplitTextComponent {...props} />;
}
