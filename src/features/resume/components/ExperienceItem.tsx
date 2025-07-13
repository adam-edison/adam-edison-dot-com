import { TechIcon } from '@/shared/components/icons/TechIcon';
import { Experience } from '@/features/resume/resume-data';

interface ExperienceItemProps {
  experience: Experience;
  isLast: boolean;
}

export function ExperienceItem({ experience, isLast }: ExperienceItemProps) {
  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className="absolute left-0 w-3 h-3 bg-blue-400 rounded-full -translate-x-1.5"></div>
      {/* Timeline line */}
      {!isLast && <div className="absolute left-0 top-3 w-0.5 h-full bg-gray-800 -translate-x-0.25"></div>}

      <div className="ml-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-3">
          <div>
            <h3 className="text-xl font-semibold text-white">{experience.position}</h3>
            <p className="text-lg text-blue-300">{experience.company}</p>
          </div>
          <div className="text-sm text-gray-400 mt-1 lg:mt-0">
            <p>{experience.location}</p>
            <p className="font-mono">{experience.period}</p>
          </div>
        </div>

        <ul className="space-y-2 mb-4">
          {experience.achievements.map((achievement, i) => (
            <li key={i} className="text-gray-300 flex items-start">
              <span className="text-blue-400 mr-3 mt-2">▸</span>
              <span className="leading-relaxed">{achievement}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          {experience.technologies.map((tech, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-950 hover:bg-gray-800 rounded-full text-sm transition-colors"
            >
              <TechIcon name={tech} className="w-4 h-4" />
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
