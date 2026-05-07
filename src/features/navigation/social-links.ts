import { ClientConfiguration } from '@/shared/config/clientConfig';

const clientConfig = ClientConfiguration.get();

export const SOCIAL_LINKS = {
  github: clientConfig.NEXT_PUBLIC_GITHUB_URL,
  linkedin: clientConfig.NEXT_PUBLIC_LINKEDIN_URL
};
