interface BrushStrokeBackgroundProps {
  variant: 'brush1' | 'brush2' | 'brush3';
  className?: string;
}

export function BrushStrokeBackground({ variant, className = '' }: BrushStrokeBackgroundProps) {
  const brushPaths = {
    brush1: (
      <path
        d="M10 60 C 40 10, 80 10, 120 40 C 160 70, 200 30, 240 50 C 280 70, 320 40, 360 60 C 400 80, 440 50, 480 70 L 490 80 L 480 90 C 440 70, 400 100, 360 80 C 320 60, 280 90, 240 70 C 200 50, 160 90, 120 60 C 80 30, 40 30, 10 80 Z"
        fill="currentColor"
        opacity="0.1"
      />
    ),
    brush2: (
      <path
        d="M0 40 C 30 20, 70 60, 110 30 C 150 0, 190 50, 230 20 C 270 -10, 310 40, 350 10 C 390 -20, 430 30, 470 0 L 490 10 L 470 20 C 430 50, 390 0, 350 30 C 310 60, 270 10, 230 40 C 190 70, 150 20, 110 50 C 70 80, 30 40, 0 60 Z"
        fill="currentColor"
        opacity="0.08"
      />
    ),
    brush3: (
      <path
        d="M20 50 C 60 30, 100 70, 140 40 C 180 10, 220 60, 260 30 C 300 0, 340 50, 380 20 C 420 -10, 460 40, 500 10 L 500 30 L 480 40 C 440 60, 400 20, 360 50 C 320 80, 280 30, 240 60 C 200 90, 160 40, 120 70 C 80 100, 40 50, 20 80 Z"
        fill="currentColor"
        opacity="0.06"
      />
    )
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 500 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {brushPaths[variant]}
      </svg>
    </div>
  );
}
