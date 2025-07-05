'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Home, FileText, Mail, Github, Linkedin, Code } from 'lucide-react';
import { SOCIAL_LINKS } from '@/constants/socialLinks';

interface CommandPaletteProps {
  children?: React.ReactNode;
}

export function CommandPalette({ children }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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

  const handleNavigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <>
      {children}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-900 hover:bg-gray-800 text-white border-gray-700 shadow-lg"
      >
        <span className="mr-2">Click Here for Quick Commands</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">/</span>
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dark bg-gray-950 dark:bg-gray-950 overflow-hidden p-0 shadow-lg">
          <Command className="dark dark:bg-gray-900 dark:text-white [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>

              <CommandGroup heading="Navigation">
                <CommandItem onSelect={() => handleNavigate('/')}>
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </CommandItem>
                <CommandItem onSelect={() => handleNavigate('/resume')}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Resume</span>
                </CommandItem>
                <CommandItem onSelect={() => handleNavigate('/contact')}>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Contact</span>
                </CommandItem>
              </CommandGroup>

              <CommandGroup heading="Social">
                <CommandItem onSelect={() => handleExternalLink(SOCIAL_LINKS.github)}>
                  <Github className="mr-2 h-4 w-4" />
                  <span>GitHub</span>
                </CommandItem>
                <CommandItem onSelect={() => handleExternalLink(SOCIAL_LINKS.linkedin)}>
                  <Linkedin className="mr-2 h-4 w-4" />
                  <span>LinkedIn</span>
                </CommandItem>
              </CommandGroup>

              <CommandGroup heading="Developer">
                <CommandItem onSelect={() => handleExternalLink('https://github.com/adam-edison/adam-edison-dot-com')}>
                  <Code className="mr-2 h-4 w-4" />
                  <span>View Source Code</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
