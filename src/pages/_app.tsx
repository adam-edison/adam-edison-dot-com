import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Geist } from 'next/font/google';
import { CommandPalette } from '@/components/command/CommandPalette';
import { useCommandPalette } from '@/hooks/useCommandPalette';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

export default function App({ Component, pageProps }: AppProps) {
  const { open, setOpen, openCommand } = useCommandPalette();

  return (
    <div className={geistSans.variable}>
      <Component {...pageProps} onOpenCommand={openCommand} />
      <CommandPalette open={open} setOpen={setOpen} />
    </div>
  );
}
