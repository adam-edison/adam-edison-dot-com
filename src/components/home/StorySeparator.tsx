export function StorySeparator() {
  return (
    <div className="flex justify-center my-6 md:my-8">
      <div className="w-full max-w-lg h-8 text-blue-400">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="roughPaper" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence baseFrequency="0.04" numOctaves="5" result="noise" seed="1" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
            </filter>
          </defs>

          {/* Main brush stroke with varying thickness */}
          <path
            d="M5 30 C 25 25, 45 35, 70 28 C 95 32, 120 24, 145 30 C 170 36, 195 26, 220 32 C 245 28, 270 34, 295 30 C 320 26, 345 32, 370 28 C 385 30, 395 30, 395 30"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            opacity="0.3"
            strokeLinecap="round"
            filter="url(#roughPaper)"
          />

          {/* Thicker center section */}
          <path
            d="M50 30 C 95 28, 120 32, 145 30 C 170 28, 195 32, 220 30 C 245 28, 270 32, 295 30 C 320 28, 350 30, 350 30"
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            opacity="0.2"
            strokeLinecap="round"
            filter="url(#roughPaper)"
          />

          {/* Texture overlay */}
          <path
            d="M10 30 C 30 26, 50 34, 75 29 C 100 33, 125 25, 150 31 C 175 35, 200 27, 225 33 C 250 29, 275 35, 300 31 C 325 27, 350 33, 375 29 C 390 31, 395 30, 395 30"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            opacity="0.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
