import { SocialIconLink } from '@/components/link/SocialIconLink';
import { NavLink } from '@/components/link/NavLink';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { SOCIAL_LINKS } from '@/constants/socialLinks';

export function MainHeader() {
  const navigationLinks = (
    <>
      <NavLink href="/">Home</NavLink>
      <NavLink href="/resume">Resume</NavLink>
      <NavLink href="/contact">Contact</NavLink>
    </>
  );

  const socialIcons = (
    <>
      <SocialIconLink href={SOCIAL_LINKS.github} label="GitHub">
        <GitHubIcon />
      </SocialIconLink>
      <SocialIconLink href={SOCIAL_LINKS.linkedin} label="LinkedIn">
        <LinkedInIcon />
      </SocialIconLink>
    </>
  );

  return (
    <header className="mb-8 lg:mb-16">
      {/* Mobile Layout: Adam Edison on top */}
      <div className="flex flex-col lg:hidden">
        <NavLink href="/" className="self-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-center mb-4">Adam Edison</h1>
        </NavLink>
        <nav className="flex justify-center">
          <div className="flex items-center space-x-6">
            {/* Social Icons */}
            <div className="flex space-x-4">{socialIcons}</div>

            {/* Navigation Links */}
            <div className="flex space-x-6">{navigationLinks}</div>
          </div>
        </nav>
      </div>

      {/* Desktop Layout: Original side-by-side */}
      <div className="hidden lg:flex justify-between items-center">
        <NavLink href="/">
          <h1 className="text-4xl font-bold">Adam Edison</h1>
        </NavLink>
        <nav className="flex items-center space-x-8">
          {/* Social Icons */}
          <div className="flex space-x-4">{socialIcons}</div>

          {/* Navigation Links */}
          <div className="flex space-x-8">{navigationLinks}</div>
        </nav>
      </div>
    </header>
  );
}
