import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Geist } from 'next/font/google';
import { CommandPalette } from '@/components/command/CommandPalette';
import { CommandPaletteProvider } from '@/contexts/CommandPaletteContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

function AppContent({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <CommandPalette />
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <div className={geistSans.variable}>
      <CommandPaletteProvider>
        <AppContent {...props} />
      </CommandPaletteProvider>
    </div>
  );
}
