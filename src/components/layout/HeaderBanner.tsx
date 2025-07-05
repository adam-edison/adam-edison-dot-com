import { CommandPaletteButton } from '@/components/command/CommandPaletteButton';

interface HeaderBannerProps {
  onOpenCommand: () => void;
}

export function HeaderBanner({ onOpenCommand }: HeaderBannerProps) {
  const message =
    'Currently available for small contract and part-time roles as a senior full-stack software engineer!';

  return (
    <div className="bg-gray-900 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Layout: Stacked */}
        <div className="lg:hidden text-center space-y-3">
          <span className="block text-gray-300 text-sm">{message}</span>
          <CommandPaletteButton onClick={onOpenCommand} />
        </div>

        {/* Desktop Layout: Side by side */}
        <div className="hidden lg:flex justify-between items-center">
          <span className="text-gray-300 text-sm">{message}</span>
          <CommandPaletteButton onClick={onOpenCommand} />
        </div>
      </div>
    </div>
  );
}
