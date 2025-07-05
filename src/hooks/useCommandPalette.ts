import { useState, useEffect } from 'react';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '/') {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const openCommand = () => setOpen(true);
  const closeCommand = () => setOpen(false);

  return {
    open,
    setOpen,
    openCommand,
    closeCommand
  };
}