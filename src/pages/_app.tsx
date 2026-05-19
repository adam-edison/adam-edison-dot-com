import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Geist } from 'next/font/google';
import { CommandPalette } from '@/features/navigation/components/CommandPalette';
import { CommandPaletteProvider } from '@/features/navigation/CommandPaletteContext';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

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
      <ErrorBoundary>
        <CommandPaletteProvider>
          <AppContent {...props} />
        </CommandPaletteProvider>
      </ErrorBoundary>
    </div>
  );
}
