import { createLogger, logOperation } from './logger';

const logger = createLogger('image-search');

export type ImageSearchResult = {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  name?: string;
  contentSize?: number;
};

export class ImageSearchService {
  private apiKey: string | undefined;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.BING_IMAGE_SEARCH_KEY;
    this.endpoint = process.env.BING_IMAGE_SEARCH_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/images/search';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async searchProductImages(
    query: string,
    opts: {
      count?: number;
      market?: string;
      safeSearch?: 'Off' | 'Moderate' | 'Strict';
    } = {}
  ): Promise<string[]> {
    return logOperation(logger, 'bing_image_search', async () => {
      if (!this.apiKey) {
        logger.warn('Bing Image Search API key not configured');
        return [];
      }

      const params = new URLSearchParams({
        q: query,
        count: String(opts.count ?? 5),
        mkt: opts.market ?? 'en-US',
        safeSearch: opts.safeSearch ?? 'Moderate',
        imageType: 'Photo',
        color: 'Color',
      });

      const resp = await fetch(`${this.endpoint}?${params.toString()}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        logger.warn({ status: resp.status, text }, 'Bing image search failed');
        return [];
      }

      const data = await resp.json();
      const items: any[] = Array.isArray(data?.value) ? data.value : [];

      const urls = items
        .map((it) => it?.contentUrl as string)
        .filter((u) => typeof u === 'string')
        .filter((u) => /\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(u))
        .slice(0, opts.count ?? 5);

      return urls;
    }, { query });
  }
}

export const imageSearch = new ImageSearchService();


