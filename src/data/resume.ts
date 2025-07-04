export interface Experience {
  company: string;
  position: string;
  location: string;
  period: string;
  achievements: string[];
  technologies: string[];
}

export const experiences: Experience[] = [
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

export const skills = {
  Languages: ['JavaScript', 'TypeScript', 'Java'],
  Backend: ['Node.js', 'AWS', 'PostgreSQL', 'MongoDB'],
  Frontend: ['React', 'TypeScript'],
  DevOps: ['Docker', 'GitHub', 'AWS']
};

export const professionalSummary = `Senior Full-Stack Engineer with 10+ years of experience in backend development, REST APIs, and cloud
infrastructure. Reduced marketing analytics tool cost by 60% at Trust and Will by filtering out test
users from Segment MTU. Led team of 4 engineers and replaced logging system to save $10K in monthly
costs. Spearheaded code architecture improvements at Kasa Living, resulting in 50% faster deployment
times and a 75% reduction in runtime configuration errors. Prior roles include Technical Support
Engineer, Quality Engineer, and Software Engineer.`;

export const previousExperience = [
  {
    position: 'Music Instructor',
    company: 'Self-Employed',
    location: 'Falls Church, VA',
    period: '08/2010 — 12/2017'
  },
  {
    position: 'Open Source Developer',
    company: 'Ginkgo Street Labs',
    location: 'Washington, DC, USA',
    period: '11/2015 — 04/2016'
  },
  {
    position: 'Consultant Developer',
    company: 'Acumen Solutions at SoundExchange',
    location: 'McLean, VA, USA',
    period: '05/2014 — 01/2015'
  },
  {
    position: 'Quality Engineer',
    company: 'MicroStrategy',
    location: 'McLean, VA, USA',
    period: '01/2008 — 08/2010'
  },
  {
    position: 'Technical Support Engineer',
    company: 'MicroStrategy',
    location: 'McLean, VA, USA',
    period: '05/2007 — 01/2008'
  }
];

export const education = {
  degree: 'Bachelor of Science — Chemical Engineering',
  institution: 'Carnegie Mellon University'
};
