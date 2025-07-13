import { ResumeSection } from './ResumeSection';

interface ProfessionalSummaryProps {
  summary: string;
}

export function ProfessionalSummary({ summary }: ProfessionalSummaryProps) {
  return (
    <ResumeSection title="Professional Summary">
      <div className="border-l-2 border-gray-800 pl-6">
        <p className="text-gray-300 leading-relaxed">{summary}</p>
      </div>
    </ResumeSection>
  );
}
