interface ErrorFallbackProps {
  onGoHome: () => void;
}

export function ErrorFallback({ onGoHome }: ErrorFallbackProps) {
  return (
    <section className="w-full min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-medium text-red-400 mb-4">Application Error</h1>
        <p className="text-base sm:text-lg text-gray-300 mb-10 max-w-lg mx-auto">
          Something went wrong. Try going back to the home page.
        </p>
        <button
          onClick={onGoHome}
          className="inline-block px-12 py-4 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
        >
          Home
        </button>
      </div>
    </section>
  );
}
