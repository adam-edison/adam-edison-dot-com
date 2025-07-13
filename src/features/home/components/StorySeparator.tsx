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
            d="M50 25 C 75 25, 85 18, 115 20 C 130 21, 155 44, 190 38 C 205 36, 225 14, 260 22 C 275 24, 295 46, 330 40 C 340 38, 350 30, 350 30"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            opacity="0.3"
            strokeLinecap="round"
            filter="url(#roughPaper)"
          />

          {/* Thicker center section */}
          <path
            d="M50 25 C 75 25, 85 18, 115 20 C 130 21, 155 44, 190 38 C 205 36, 225 14, 260 22 C 275 24, 295 46, 330 40 C 340 38, 350 30, 350 30"
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            opacity="0.2"
            strokeLinecap="round"
            filter="url(#roughPaper)"
          />

          {/* Texture overlay */}
          <path
            d="M50 25 C 75 25, 85 18, 115 20 C 130 21, 155 44, 190 38 C 205 36, 225 14, 260 22 C 275 24, 295 46, 330 40 C 340 38, 350 30, 350 30"
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
