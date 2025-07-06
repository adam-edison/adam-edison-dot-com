import { useState, useEffect } from 'react';

interface CharacterCounterProps {
  value: string;
  minLength: number;
  maxLength: number;
  className?: string;
}

export function CharacterCounter({ value, minLength, maxLength, className = '' }: CharacterCounterProps) {
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(value?.length || 0);
  }, [value]);

  const getCharCounterColor = () => {
    if (charCount < minLength) return 'text-red-400';
    if (charCount >= Math.ceil(maxLength * 0.95)) return 'text-orange-400';
    return 'text-green-400';
  };

  return (
    <div className={`absolute bottom-2 right-2 text-xs ${className}`}>
      <span className={getCharCounterColor()}>
        {charCount}/{maxLength}
      </span>
    </div>
  );
}
