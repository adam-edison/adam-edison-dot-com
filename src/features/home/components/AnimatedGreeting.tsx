import SplitText from '@/blocks/TextAnimations/SplitText/SplitText';
import { useState, useEffect } from 'react';

export function AnimatedGreeting() {
  const [key, setKey] = useState(0);

  const delayMilliseconds = 8000;

  useEffect(() => {
    const interval = setInterval(() => {
      // when key changes, the animation will restart
      setKey((prev) => prev + 1);
    }, delayMilliseconds);

    return () => clearInterval(interval);
  }, []);

  return <SplitText key={key} text="Hello, there!" ease="elastic.out(1, 0.3)" duration={2} threshold={0.2} />;
}
