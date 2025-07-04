import { TechIcon } from '@/components/icons/TechIcon';

interface SkillsProps {
  skills: Record<string, string[]>;
}

export function Skills({ skills }: SkillsProps) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-8 text-blue-400">Skills & Technologies</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(skills).map(([category, techs]) => (
          <div key={category} className="bg-gray-950 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">{category}</h3>
            <div className="space-y-2">
              {techs.map((tech, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TechIcon name={tech} className="w-4 h-4" />
                  <span className="text-gray-300 text-sm">{tech}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
