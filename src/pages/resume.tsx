import { HeaderBanner } from '@/components/HeaderBanner';
import { MainHeader } from '@/components/MainHeader';
import { TechIcon } from '@/components/icons/TechIcon';

interface Experience {
  company: string;
  position: string;
  location: string;
  period: string;
  achievements: string[];
  technologies: string[];
}

const experiences: Experience[] = [
  {
    company: 'Trust and Will',
    position: 'Lead Full-Stack Engineer',
    location: 'Remote',
    period: '03/2024 — Present',
    achievements: [
      'Launched a tiered membership model with accompanying administrative tools, achieving a 20% increase in annual recurring revenue within the second quarter',
      'Integrated a real-time data pipeline utilizing Segment and Iterable, replacing Klaviyo and enabling more personalized marketing campaigns that grew user engagement by 10%',
      'Filtered out test users to reduce cost for Segment MTU, saving 60% of marketing budget for analytics tools',
      'Upgraded GitHub Actions workflows to automate Git flow, saving 1 hour average daily for all developers',
      'Instituted use of AWS Lambda Layers in Serverless deployment, speeding up average deployment by 90%'
    ],
    technologies: ['AWS', 'Node.js', 'React', 'TypeScript', 'Docker', 'GitHub']
  },
  {
    company: 'Funky Goblin Software, LLC',
    position: 'Founder, Principal Developer',
    location: 'Remote',
    period: '04/2023 — Present',
    achievements: [
      'Engineered a streamlined data model for a personal productivity application intended to challenge Notion and Clickup, enabling efficient data retrieval and reducing query response times by 90%',
      'Integrated OpenAI API with data analysis to provide automation features and natural language interface',
      'Developed virtual assistant with text-to-speech feedback and prompting using Google Journey TTS API, with capability for 100% screen and hands-free usage'
    ],
    technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'GitHub']
  },
  {
    company: 'Curastory',
    position: 'Lead Full-Stack Engineer',
    location: 'Remote',
    period: '02/2023 — 04/2023',
    achievements: [
      'Acted as Team Lead for 4 engineers while instituting Agile Scrum process, JIRA usage, code reviews, technical specifications, and best practices guide',
      'Performed internal backend and frontend codebase security audit and mitigated severe security risks',
      'Replaced existing logging systems, resulting in $10K per month cost reduction',
      'Constructed internal backend RPC APIs for third-party integrations with APM Music, PAC-12, and WeVideo',
      'Mentored junior developers in technical communication and advanced usage of development tools'
    ],
    technologies: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'MongoDB', 'GitHub']
  },
  {
    company: 'Kasa Living',
    position: 'Senior Software Engineer',
    location: 'Remote',
    period: '01/2022 — 11/2022',
    achievements: [
      'Drove company-wide, multi-team code architecture improvements via adoption of Nest.js framework',
      'Pioneered ConfigStore library, centralizing configuration management across 10+ microservices, resulting in a 50% faster deployment time, and reduction of runtime configuration errors by 75%',
      'Enhanced Quotes API by building persistent calculation history, reducing website checkout time by 90%',
      'Implemented Payments API and improved billing accuracy and internal accounting team efficiency',
      'Wrote technical specifications and acted as lead engineer for Credit Card Authorization 2.0 feature set'
    ],
    technologies: ['JavaScript', 'TypeScript', 'Node.js', 'AWS', 'MongoDB', 'Docker']
  },
  {
    company: 'Touchtown',
    position: 'Senior Software Engineer',
    location: 'Remote',
    period: '08/2019 — 01/2022',
    achievements: [
      'Delivered a robust real-time backend integration with Worxhub JSON API using Node.js and Express, replacing the antiquated email system, and decreasing resolution time of maintenance requests by 40%',
      'Architected and delivered backend integration with PointClickCare using both URL and event-driven APIs',
      'Spearheaded integration testing with the database to allow testing of critical features, reducing time to delivery of major calendar event unrolling procedure by 25%',
      'Authored BitBucket pipeline for integration testing of Node.js and AWS Lambda applications',
      'Created OpenAPI documentation and technical specifications for new features based upon product specs'
    ],
    technologies: ['Java', 'JavaScript', 'Node.js', 'AWS', 'Docker']
  },
  {
    company: 'LendPro',
    position: 'Senior Software Engineer',
    location: 'Remote',
    period: '12/2018 — 07/2019',
    achievements: [
      'Overhauled Ant build scripts, reducing build time by 60% and saving 1 hour of daily developer time',
      'Developed technical blueprints for key microservices, detailing APIs, data models, and error handling strategies, enabling developers to deliver features with 99.99% uptime for crucial customer-facing services',
      'Co-led OWASP and SANS security training for web application development for 3 engineers'
    ],
    technologies: ['Java', 'JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Docker']
  },
  {
    company: 'Ebix Health',
    position: 'Senior Software Engineer',
    location: 'Pittsburgh, PA, USA',
    period: '09/2016 — 09/2018',
    achievements: [
      'Converted health plan enrollments web application to use jQuery and Bootstrap for responsive behavior',
      'Addressed and resolved 100% of high-priority security concerns identified during annual external audits, safeguarding sensitive patient health information (PHI)',
      'Implemented a Java application that synchronized 500+ external HIPAA code updates with the internal database, ensuring compliance with regulatory requirements'
    ],
    technologies: ['Java', 'JavaScript']
  }
];

const skills = {
  Languages: ['JavaScript', 'TypeScript', 'Java'],
  Backend: ['Node.js', 'AWS', 'PostgreSQL', 'MongoDB'],
  Frontend: ['React', 'TypeScript'],
  DevOps: ['Docker', 'GitHub', 'AWS']
};

export default function Resume() {
  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderBanner />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <MainHeader />
        {/* Resume Content */}
        <div className="max-w-5xl mx-auto">
          {/* Professional Summary */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-blue-400">Professional Summary</h2>
            <div className="border-l-2 border-gray-700 pl-6">
              <p className="text-gray-300 leading-relaxed">
                Senior Full-Stack Engineer with 10+ years of experience in backend development, REST APIs, and cloud
                infrastructure. Reduced marketing analytics tool cost by 60% at Trust and Will by filtering out test
                users from Segment MTU. Led team of 4 engineers and replaced logging system to save $10K in monthly
                costs. Spearheaded code architecture improvements at Kasa Living, resulting in 50% faster deployment
                times and a 75% reduction in runtime configuration errors. Prior roles include Technical Support
                Engineer, Quality Engineer, and Software Engineer.
              </p>
            </div>
          </section>

          {/* Work Experience */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-blue-400">Work Experience</h2>
            <div className="space-y-12">
              {experiences.map((exp, index) => (
                <div key={index} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-0 w-3 h-3 bg-blue-400 rounded-full -translate-x-1.5"></div>
                  {/* Timeline line */}
                  {index < experiences.length - 1 && (
                    <div className="absolute left-0 top-3 w-0.5 h-full bg-gray-700 -translate-x-0.25"></div>
                  )}

                  <div className="ml-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{exp.position}</h3>
                        <p className="text-lg text-blue-300">{exp.company}</p>
                      </div>
                      <div className="text-sm text-gray-400 mt-1 lg:mt-0">
                        <p>{exp.location}</p>
                        <p className="font-mono">{exp.period}</p>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {exp.achievements.map((achievement, i) => (
                        <li key={i} className="text-gray-300 flex items-start">
                          <span className="text-blue-400 mr-3 mt-2">▸</span>
                          <span className="leading-relaxed">{achievement}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors"
                        >
                          <TechIcon name={tech} className="w-4 h-4" />
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Previous Experience */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-blue-400">Previous Experience</h2>
            <div className="space-y-8">
              <div className="border-l-2 border-gray-700 pl-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Music Instructor</h3>
                    <p className="text-blue-300">Self-Employed</p>
                  </div>
                  <div className="text-sm text-gray-400 mt-1 lg:mt-0">
                    <p>Falls Church, VA</p>
                    <p className="font-mono">08/2010 — 12/2017</p>
                  </div>
                </div>
              </div>

              <div className="border-l-2 border-gray-700 pl-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Open Source Developer</h3>
                    <p className="text-blue-300">Ginkgo Street Labs</p>
                  </div>
                  <div className="text-sm text-gray-400 mt-1 lg:mt-0">
                    <p>Washington, DC, USA</p>
                    <p className="font-mono">11/2015 — 04/2016</p>
                  </div>
                </div>
              </div>

              <div className="border-l-2 border-gray-700 pl-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Consultant Developer</h3>
                    <p className="text-blue-300">Acumen Solutions at SoundExchange</p>
                  </div>
                  <div className="text-sm text-gray-400 mt-1 lg:mt-0">
                    <p>McLean, VA, USA</p>
                    <p className="font-mono">05/2014 — 01/2015</p>
                  </div>
                </div>
              </div>

              <div className="border-l-2 border-gray-700 pl-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Quality Engineer</h3>
                    <p className="text-blue-300">MicroStrategy</p>
                  </div>
                  <div className="text-sm text-gray-400 mt-1 lg:mt-0">
                    <p>McLean, VA, USA</p>
                    <p className="font-mono">01/2008 — 08/2010</p>
                  </div>
                </div>
              </div>

              <div className="border-l-2 border-gray-700 pl-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Technical Support Engineer</h3>
                    <p className="text-blue-300">MicroStrategy</p>
                  </div>
                  <div className="text-sm text-gray-400 mt-1 lg:mt-0">
                    <p>McLean, VA, USA</p>
                    <p className="font-mono">05/2007 — 01/2008</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Education */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-blue-400">Education</h2>
            <div className="border-l-2 border-gray-700 pl-6">
              <h3 className="text-lg font-semibold text-white">Bachelor of Science — Chemical Engineering</h3>
              <p className="text-blue-300">Carnegie Mellon University</p>
            </div>
          </section>

          {/* Skills */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-blue-400">Skills & Technologies</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(skills).map(([category, techs]) => (
                <div key={category} className="bg-gray-900 rounded-lg p-4">
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

          {/* Download PDF Button */}
          <div className="max-w-5xl mx-auto mb-8">
            <a
              href="/resume.pdf"
              download="Adam_Edison_Resume.pdf"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
