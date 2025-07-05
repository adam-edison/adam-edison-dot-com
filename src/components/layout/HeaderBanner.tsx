import { CommandPaletteButton } from '@/components/command/CommandPaletteButton';

export function HeaderBanner() {
  return (
    <div className="bg-gray-900 px-6 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <span className="text-gray-300 text-sm">
          Currently available for small contract and part-time roles as a senior full-stack software engineer!
        </span>
        <CommandPaletteButton />
      </div>
    </div>
  );
}
