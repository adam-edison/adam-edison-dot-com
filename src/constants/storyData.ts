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
    imageSrc: '/story/circle_cropped_anime_avatar.png',
    imageAlt: 'Cheerful anime programmer avatar',
    text: "I'm a full-stack developer who builds web applications. I build complete features, one vertical slice at a time.",
    imagePosition: 'left',
    showAnimatedGreeting: true
  },
  {
    id: 'planning',
    imageSrc:
      '/story/An abstract and cute anime-style image of _character_ sketching out ideas for app design, with beautiful interfaces and user-friendly elements, vibrant colors, and a cheerful mood..png',
    imageAlt: 'Anime character sketching app ideas and designs',
    text: 'Each feature starts with understanding what users need. I sketch out the complete flow from button click to database and back.',
    imagePosition: 'right'
  },
  {
    id: 'security',
    imageSrc:
      '/story/An abstract and cute anime-style image of _character_ protecting data with encryption, showing a lock and a shield, keeping out bad guys, vibrant colors, and a cheerful mood..png',
    imageAlt: 'Anime character implementing security and data protection',
    text: 'Security is baked into every feature from day one. I design each piece to be secure before writing any code.',
    imagePosition: 'left'
  },
  {
    id: 'frontend',
    imageSrc:
      '/story/An abstract and cute anime-style image of _character_ building a user interface that looks great and accommodates mobile, tablet, and desktop users, with responsive design elements, vibrant colors, and a cheerful mood..png',
    imageAlt: 'Anime character building responsive user interfaces',
    text: 'For each feature, I build the interface users will love - making it work perfectly on phones, tablets, and computers.',
    imagePosition: 'right'
  },
  {
    id: 'backend',
    imageSrc:
      '/story/An abstract and cute anime-style image of _character_ crafting the backend features of an app, showing gears and smooth-working mechanisms behind the scenes, vibrant colors, and a cheerful mood..png',
    imageAlt: 'Anime character building backend systems and features',
    text: 'Then I connect it to the backend systems that make the feature actually work, handling all the data and logic behind the scenes.',
    imagePosition: 'left'
  },
  {
    id: 'hosting',
    imageSrc:
      '/story/An abstract and cute anime-style image of _character_ with powerful servers hosting the app, automatically scaling up with more users, showing server racks and expanding capacity, vibrant colors, and a cheerful mood..png',
    imageAlt: 'Anime character with scalable server infrastructure',
    text: 'Each feature gets deployed to powerful servers that automatically scale up when more people use it. We demo complete features weekly.',
    imagePosition: 'right'
  },
  {
    id: 'cloud',
    imageSrc:
      '/story/An abstract and cute anime-style image of _character_ with cloud hosting, showing a cloud with app icons and 24_7 availability, vibrant colors, and a cheerful mood..png',
    imageAlt: 'Anime character with cloud hosting and 24/7 availability',
    text: 'Cloud hosting keeps every feature running 24/7, so users can access what they need anytime, anywhere.',
    imagePosition: 'left'
  },
  {
    id: 'performance',
    imageSrc:
      '/story/An abstract and cute anime-style image of _character_ optimizing app performance, showing speed lines and efficient data flow, handling many users at once, vibrant colors, and a cheerful mood..png',
    imageAlt: 'Anime character optimizing app performance and speed',
    text: 'I optimize each feature to run lightning-fast, making sure every interaction feels smooth even with thousands of users.',
    imagePosition: 'right'
  },
  {
    id: 'launch',
    imageSrc: '/story/cheerful_anime_programmer.png',
    imageAlt: 'Cheerful anime programmer celebrating launch',
    text: "Launch day! 🚀 Feature by feature, we've built something amazing together. Each slice delivered value from day one!",
    imagePosition: 'left'
  }
];
