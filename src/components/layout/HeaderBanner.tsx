import { CommandPaletteButton } from '@/components/command/CommandPaletteButton';
import { ResponsiveLayout } from './ResponsiveLayout';

export function HeaderBanner() {
  const message =
    'Currently available for small contract and part-time roles as a senior full-stack software engineer!';

  return (
    <div className="bg-gray-900 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <ResponsiveLayout
          mobileLayout={
            <div className="text-center space-y-3">
              <span className="block text-gray-300 text-sm">{message}</span>
              <CommandPaletteButton />
            </div>
          }
          desktopLayout={
            <>
              <span className="text-gray-300 text-sm">{message}</span>
              <CommandPaletteButton />
            </>
          }
          mobileClasses="lg:hidden"
          desktopClasses="hidden lg:flex justify-between items-center"
        />
      </div>
    </div>
  );
}
