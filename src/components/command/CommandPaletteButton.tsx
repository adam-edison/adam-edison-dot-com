import { Button } from '@/components/ui/button';
import { useCommandPalette } from './CommandPalette';

export function CommandPaletteButton() {
  const { setOpen } = useCommandPalette();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpen(true)}
      className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600 text-xs"
    >
      <span className="mr-1.5">Quick Commands</span>
      <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">/</span>
      </kbd>
    </Button>
  );
}
