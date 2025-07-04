interface ProfessionalSummaryProps {
  summary: string;
}

export function ProfessionalSummary({ summary }: ProfessionalSummaryProps) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Professional Summary</h2>
      <div className="border-l-2 border-gray-800 pl-6">
        <p className="text-gray-300 leading-relaxed">{summary}</p>
      </div>
    </section>
  );
}
