interface EducationItem {
  degree: string;
  institution: string;
}

interface EducationProps {
  education: EducationItem;
}

export function Education({ education }: EducationProps) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Education</h2>
      <div className="border-l-2 border-gray-800 pl-6">
        <h3 className="text-lg font-semibold text-white">{education.degree}</h3>
        <p className="text-blue-300">{education.institution}</p>
      </div>
    </section>
  );
}
