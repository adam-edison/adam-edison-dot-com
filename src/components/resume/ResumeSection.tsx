interface ResumeSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ResumeSection({ title, children, className = '' }: ResumeSectionProps) {
  return (
    <section className={`mb-16 ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-blue-400">{title}</h2>
      {children}
    </section>
  );
}
