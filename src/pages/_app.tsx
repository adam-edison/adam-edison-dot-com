import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Geist } from 'next/font/google';
import { CommandPalette } from '@/components/command/CommandPalette';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={geistSans.variable}>
      <CommandPalette>{(setOpen) => <Component {...pageProps} onOpenCommand={() => setOpen(true)} />}</CommandPalette>
    </div>
  );
}
