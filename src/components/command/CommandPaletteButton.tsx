import { Button } from '@/components/ui/button';

interface CommandPaletteButtonProps {
  onClick: () => void;
}

export function CommandPaletteButton({ onClick }: CommandPaletteButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600 text-xs"
    >
      {/* Mobile: Click to open */}
      <div className="lg:hidden flex items-center">
        <span>Click for Quick Commands</span>
      </div>

      {/* Desktop: Show keyboard shortcut */}
      <div className="hidden lg:flex items-center">
        <span className="mr-1.5">Quick Commands</span>
        <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">/</span>
        </kbd>
      </div>
    </Button>
  );
}
