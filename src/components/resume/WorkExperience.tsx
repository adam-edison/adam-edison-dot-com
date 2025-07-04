import { Experience } from '@/data/resume';
import { ExperienceItem } from './ExperienceItem';

interface WorkExperienceProps {
  experiences: Experience[];
}

export function WorkExperience({ experiences }: WorkExperienceProps) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-8 text-blue-400">Work Experience</h2>
      <div className="space-y-12">
        {experiences.map((exp, index) => (
          <ExperienceItem key={index} experience={exp} index={index} isLast={index === experiences.length - 1} />
        ))}
      </div>
    </section>
  );
}
