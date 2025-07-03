import { SocialIconLink } from './SocialIconLink';
import { NavLink } from './NavLink';
import { GitHubIcon } from './GitHubIcon';
import { LinkedInIcon } from './LinkedInIcon';
import { SOCIAL_LINKS } from '@/constants/socialLinks';

export function MainHeader() {
  return (
    <header className="flex justify-between items-center mb-24">
      <h1 className="text-4xl font-bold">Adam Edison</h1>
      <nav className="flex items-center space-x-8">
        {/* Social Icons */}
        <div className="flex space-x-4">
          <SocialIconLink href={SOCIAL_LINKS.github} label="GitHub">
            <GitHubIcon />
          </SocialIconLink>
          <SocialIconLink href={SOCIAL_LINKS.linkedin} label="LinkedIn">
            <LinkedInIcon />
          </SocialIconLink>
        </div>

        {/* Navigation Links */}
        <div className="flex space-x-8">
          <NavLink href="/about">About Me</NavLink>
          <NavLink href="/resume">Resume</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </div>
      </nav>
    </header>
  );
}
