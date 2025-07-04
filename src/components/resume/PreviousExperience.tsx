interface PreviousExperienceItem {
  position: string;
  company: string;
  location: string;
  period: string;
}

interface PreviousExperienceProps {
  experiences: PreviousExperienceItem[];
}

export function PreviousExperience({ experiences }: PreviousExperienceProps) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-8 text-blue-400">Previous Experience</h2>
      <div className="space-y-8">
        {experiences.map((exp, index) => (
          <div key={index} className="border-l-2 border-gray-800 pl-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-white">{exp.position}</h3>
                <p className="text-blue-300">{exp.company}</p>
              </div>
              <div className="text-sm text-gray-400 mt-1 lg:mt-0">
                <p>{exp.location}</p>
                <p className="font-mono">{exp.period}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
