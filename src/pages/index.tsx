import { Geist } from 'next/font/google';
import Image from 'next/image';
import { SocialIconLink } from '@/components/SocialIconLink';
import { NavLink } from '@/components/NavLink';
import { GitHubIcon } from '@/components/GitHubIcon';
import { LinkedInIcon } from '@/components/LinkedInIcon';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

export default function Home() {
  const linkedInUrl = 'https://www.linkedin.com/in/adam-edison-software/';
  const githubUrl = 'https://github.com/adam-edison';

  return (
    <div className={`${geistSans.className} min-h-screen bg-black text-white`}>
      {/* Header Banner */}
      <div className="bg-gray-900 px-6 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-gray-300 text-sm">
            Currently available for small contract and part-time roles as a senior full-stack software engineer!
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Navigation Header */}
        <header className="flex justify-between items-center mb-24">
          <h1 className="text-4xl font-bold">Adam Edison</h1>
          <nav className="flex items-center space-x-8">
            {/* Social Icons */}
            <div className="flex space-x-4">
              <SocialIconLink href={githubUrl} label="GitHub">
                <GitHubIcon />
              </SocialIconLink>
              <SocialIconLink href={linkedInUrl} label="LinkedIn">
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

        {/* Hero Section */}
        <main>
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Image on the left */}
            <div className="w-full md:w-1/2 flex justify-center md:justify-start mb-8 md:mb-0">
              <Image
                src="/undraw_developer-activity_4zqd.svg"
                alt="Developer Environment Illustration"
                width={256}
                height={256}
                className="w-64 h-auto"
              />
            </div>
            {/* Text on the right */}
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-8">
                Hello, there! <br /> <br /> I am a software engineer, and I build scalable web applications.
              </h2>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
