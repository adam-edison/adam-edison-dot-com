import { getStore } from '@netlify/blobs';

export interface KeyValueStorageInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { metadata?: Record<string, string> }): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<{ blobs: Array<{ key: string }> }>;
}

export class NetlifyBlobsStorage implements KeyValueStorageInterface {
  private rateLimitStore = getStore('rate-limits');

  async get(key: string): Promise<string | null> {
    return this.rateLimitStore.get(key);
  }

  async set(key: string, value: string, options?: { metadata?: Record<string, string> }): Promise<void> {
    await this.rateLimitStore.set(key, value, options);
  }

  async delete(key: string): Promise<void> {
    await this.rateLimitStore.delete(key);
  }

  async list(): Promise<{ blobs: Array<{ key: string }> }> {
    return this.rateLimitStore.list();
  }
}

export class InMemoryStorage implements KeyValueStorageInterface {
  private rateLimitData = new Map<string, { value: string; metadata?: Record<string, string>; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.rateLimitData.get(key);

    if (!item) return null;

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.rateLimitData.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, options?: { metadata?: Record<string, string> }): Promise<void> {
    let expiresAt: number | undefined;
    if (options?.metadata?.expiresAt) {
      expiresAt = parseInt(options.metadata.expiresAt);
    }

    this.rateLimitData.set(key, {
      value,
      metadata: options?.metadata,
      expiresAt
    });
  }

  async delete(key: string): Promise<void> {
    this.rateLimitData.delete(key);
  }

  async list(): Promise<{ blobs: Array<{ key: string }> }> {
    const blobs = Array.from(this.rateLimitData.keys()).map((key) => ({ key }));
    return { blobs };
  }

  // Test utility methods
  clear(): void {
    this.rateLimitData.clear();
  }

  size(): number {
    return this.rateLimitData.size;
  }
}
