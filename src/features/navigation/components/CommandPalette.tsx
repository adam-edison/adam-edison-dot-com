'use client';

import { useRouter } from 'next/router';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/shared/components/ui/command';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { Home, FileText, Mail, Github, Linkedin, Code } from 'lucide-react';
import { SOCIAL_LINKS } from '@/features/navigation/social-links';
import { useCommandPalette } from '@/features/navigation/CommandPaletteContext';

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
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
              <CommandItem onSelect={() => handleExternalLink(process.env.NEXT_PUBLIC_REPO_URL!)}>
                <Code className="mr-2 h-4 w-4" />
                <span>View Source Code</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
