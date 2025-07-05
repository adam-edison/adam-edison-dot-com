import React, { createContext, useContext, useState, useEffect } from 'react';

interface CommandPaletteContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  openCommand: () => void;
  closeCommand: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, openCommand, closeCommand }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (context === undefined) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}
