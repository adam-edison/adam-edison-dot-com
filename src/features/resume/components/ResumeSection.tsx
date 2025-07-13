import { cn } from '@/shared/utils';

interface ResumeSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ResumeSection({ title, children, className }: ResumeSectionProps) {
  const sectionClasses = cn('mb-16', className);

  return (
    <section className={sectionClasses}>
      <h2 className="text-2xl font-bold mb-6 text-blue-400">{title}</h2>
      {children}
    </section>
  );
}
