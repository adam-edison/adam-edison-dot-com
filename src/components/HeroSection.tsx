import Image from 'next/image';

export function HeroSection() {
  return (
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
  );
}
