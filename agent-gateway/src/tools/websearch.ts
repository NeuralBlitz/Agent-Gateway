import { fetch } from 'undici';
import { logger } from '../infra/index.js';

export interface WebSearchConfig {
  apiKey?: string;
  engine?: 'duckduckgo' | 'google';
  maxResults?: number;
}

export class WebSearchTool {
  private config: Required<WebSearchConfig>;

  constructor(config: WebSearchConfig = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      engine: config.engine || 'duckduckgo',
      maxResults: config.maxResults || 5,
    };
  }

  /** Search the web and return results */
  async search(query: string): Promise<{ query: string; results: SearchResult[] }> {
    logger.debug({ query, engine: this.config.engine }, 'Web search');

    if (this.config.engine === 'duckduckgo') {
      return this.searchDuckDuckGo(query);
    }
    return this.searchGoogle(query);
  }

  /** Fetch a URL and return its text content */
  async fetchUrl(url: string, maxLength?: number): Promise<{ url: string; content: string }> {
    const max = maxLength ?? 10_000;
    logger.debug({ url }, 'Fetching URL');

    const response = await fetch(url, {
      headers: { 'User-Agent': 'agent-gateway/1.0' },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let text = await response.text();
    // Strip HTML tags for cleaner content
    text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > max) {
      text = text.slice(0, max) + '... [truncated]';
    }

    return { url, content: text };
  }

  private async searchDuckDuckGo(query: string): Promise<{ query: string; results: SearchResult[] }> {
    // Use DuckDuckGo HTML endpoint (no API key needed)
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const results = this.parseDuckDuckGoHtml(html);
      return { query, results: results.slice(0, this.config.maxResults) };
    } catch (err: any) {
      logger.warn({ err }, 'DuckDuckGo search failed, returning empty results');
      return { query, results: [] };
    }
  }

  private async searchGoogle(query: string): Promise<{ query: string; results: SearchResult[] }> {
    if (!this.config.apiKey) {
      throw new Error('Google search requires an API key');
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${this.config.apiKey}&cx=017576662512468239146:omuauf_gfve&q=${encodeURIComponent(query)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google API error: ${response.status}`);

    const data = await response.json() as any;
    const results: SearchResult[] = (data.items || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
    }));

    return { query, results };
  }

  private parseDuckDuckGoHtml(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    // Simple regex-based parsing for DuckDuckGo HTML results
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>.*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/gs;
    let match;
    while ((match = resultRegex.exec(html)) !== null) {
      results.push({
        title: match[2],
        url: match[1],
        snippet: match[3].replace(/<[^>]*>/g, '').trim(),
      });
    }
    return results;
  }
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export function createWebSearchTool(config?: WebSearchConfig): WebSearchTool {
  return new WebSearchTool(config);
}
