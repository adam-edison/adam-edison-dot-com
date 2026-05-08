import { ClientConfiguration } from '@/shared/config/clientConfig';

export const SOCIAL_LINKS = {
  get github(): string {
    return ClientConfiguration.get().NEXT_PUBLIC_GITHUB_URL;
  },
  get linkedin(): string {
    return ClientConfiguration.get().NEXT_PUBLIC_LINKEDIN_URL;
  }
};
