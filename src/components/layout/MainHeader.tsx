import { SocialIconLink } from '@/components/link/SocialIconLink';
import { NavLink } from '@/components/link/NavLink';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
import { SOCIAL_LINKS } from '@/constants/socialLinks';
import { ResponsiveLayout } from './ResponsiveLayout';

export function MainHeader() {
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

  const navigationLinks = (
    <>
      <NavLink href="/">Home</NavLink>
      <NavLink href="/resume">Resume</NavLink>
      <NavLink href="/contact">Contact</NavLink>
    </>
  );

  return (
    <header className="mb-8 lg:mb-24">
      <ResponsiveLayout
        mobileLayout={
          <div className="flex flex-col">
            <NavLink href="/" className="self-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-center mb-4">Adam Edison</h1>
            </NavLink>
            <nav className="flex justify-center">
              <div className="flex items-center space-x-6">
                <div className="flex space-x-4">{socialIcons}</div>
                <div className="flex space-x-6">{navigationLinks}</div>
              </div>
            </nav>
          </div>
        }
        desktopLayout={
          <>
            <NavLink href="/">
              <h1 className="text-4xl font-bold">Adam Edison</h1>
            </NavLink>
            <nav className="flex items-center space-x-8">
              <div className="flex space-x-4">{socialIcons}</div>
              <div className="flex space-x-8">{navigationLinks}</div>
            </nav>
          </>
        }
        mobileClasses="lg:hidden"
        desktopClasses="hidden lg:flex justify-between items-center"
      />
    </header>
  );
}
