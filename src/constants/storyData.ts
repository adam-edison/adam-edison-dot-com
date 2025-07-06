export interface StoryStep {
  id: string;
  imageSrc: string;
  imageAlt: string;
  text: string;
  imagePosition: 'left' | 'right';
  showAnimatedGreeting?: boolean;
}

export const storySteps: StoryStep[] = [
  {
    id: 'intro',
    imageSrc: '/story/circle_cropped_anime_avatar.webp',
    imageAlt: 'Cheerful anime programmer avatar',
    text: "I'm a full-stack developer, and I build websites and web apps - one complete feature at a time.",
    imagePosition: 'left',
    showAnimatedGreeting: true
  },
  {
    id: 'planning',
    imageSrc: '/story/abstract_figma.webp',
    imageAlt: 'Anime character sketching app ideas and designs',
    text: 'Each feature begins by understanding user needs, and designing the full solution.',
    imagePosition: 'right'
  },
  {
    id: 'security',
    imageSrc: '/story/security_stops_hackers.webp',
    imageAlt: 'Anime character implementing security and data protection',
    text: 'Security best practices are baked into every feature from day one, ensuring compliance, protecting user data, and defending against threats.',
    imagePosition: 'left'
  },
  {
    id: 'frontend',
    imageSrc: '/story/testing_responsive_interfaces.webp',
    imageAlt: 'Anime character building responsive user interfaces',
    text: 'User interfaces are built to deliver a seamless experience on phones, tablets, and desktops without compromising functionality.',
    imagePosition: 'right'
  },
  {
    id: 'backend',
    imageSrc: '/story/backend_systems.webp',
    imageAlt: 'Anime character building backend systems and features',
    text: 'Backend systems are built to power databases, APIs, application logic, AI agents, and any other essential services behind the scenes.',
    imagePosition: 'left'
  },
  {
    id: 'demo',
    imageSrc: '/story/great_demo.webp',
    imageAlt: 'Anime character with scalable server infrastructure',
    text: 'Each week, new and evolving features are showcased to all stakeholders, enabling early feedback and ensuring the product truly meets their needs. I take feedback without defensiveness and am happy to make changes.',
    imagePosition: 'right'
  },
  {
    id: 'cloud',
    imageSrc: '/story/cloud_hosting_services.webp',
    imageAlt: 'Anime character with cloud hosting and 24/7 availability',
    text: 'Cloud hosting ensures every feature runs 24/7 with 99.99% uptime, providing reliable access. I make sure the cloud hosting is secure and scalable.',
    imagePosition: 'left'
  },
  {
    id: 'performance',
    imageSrc: '/story/performance_optimized.webp',
    imageAlt: 'Anime character optimizing app performance and speed',
    text: 'Each feature is streamlined for lightning-fast performance, making every interaction smooth - even with thousands of simultaneous users. I optimize for the best possible user experience.',
    imagePosition: 'right'
  },
  {
    id: 'testing',
    imageSrc: '/story/testing.webp',
    imageAlt: 'Anime character testing backend systems',
    text: 'Every step of development is tested with unit, integration, performance, and even destructive tests. In this way, I catch issues early and deploy with confidence.',
    imagePosition: 'right'
  },
  {
    id: 'final-launch',
    imageSrc: '/story/programmer_at_desk.webp',
    imageAlt: 'Cheerful anime programmer celebrating launch',
    text: 'Launch day! 🚀 I am proud to build and deploy clean, robust software that truly meets your needs. And I look forward to building more features with you!',
    imagePosition: 'left'
  }
];
