import { createLogger } from './logger';

const logger = createLogger('robots-checker');

export interface RobotsRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
}

export class RobotsChecker {
  private cache: Map<string, { rules: RobotsRule[]; expiry: number }> = new Map();
  private readonly cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

  async getRobotsRules(baseUrl: string): Promise<RobotsRule[]> {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    
    // Check cache first
    const cached = this.cache.get(baseUrl);
    if (cached && cached.expiry > Date.now()) {
      return cached.rules;
    }

    try {
      logger.info({ robotsUrl }, 'Fetching robots.txt');
      
      const response = await fetch(robotsUrl, {
        headers: {
          'User-Agent': 'SignatureQuoteCrawler/1.0 (+https://yoursite.com/bot)',
        },
      });

      if (!response.ok) {
        logger.warn({ robotsUrl, status: response.status }, 'robots.txt not found or inaccessible');
        // If robots.txt doesn't exist, assume crawling is allowed
        const defaultRules: RobotsRule[] = [{
          userAgent: '*',
          allow: ['/'],
          disallow: [],
        }];
        
        this.cache.set(baseUrl, {
          rules: defaultRules,
          expiry: Date.now() + this.cacheTimeout,
        });
        
        return defaultRules;
      }

      const robotsText = await response.text();
      const rules = this.parseRobotsTxt(robotsText);
      
      // Cache the rules
      this.cache.set(baseUrl, {
        rules,
        expiry: Date.now() + this.cacheTimeout,
      });

      logger.debug({ baseUrl, ruleCount: rules.length }, 'Parsed robots.txt rules');
      return rules;

    } catch (error) {
      logger.error({ robotsUrl, error }, 'Error fetching robots.txt');
      
      // Return permissive default rules on error
      const defaultRules: RobotsRule[] = [{
        userAgent: '*',
        allow: ['/'],
        disallow: [],
      }];
      
      return defaultRules;
    }
  }

  private parseRobotsTxt(robotsText: string): RobotsRule[] {
    const lines = robotsText.split('\n').map(line => line.trim());
    const rules: RobotsRule[] = [];
    let currentRule: Partial<RobotsRule> | null = null;

    for (const line of lines) {
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        continue;
      }

      const [directive, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      if (!directive || !value) {
        continue;
      }

      const normalizedDirective = directive.toLowerCase().trim();

      switch (normalizedDirective) {
        case 'user-agent':
          // Start a new rule
          if (currentRule) {
            rules.push({
              userAgent: currentRule.userAgent || '*',
              allow: currentRule.allow || [],
              disallow: currentRule.disallow || [],
              crawlDelay: currentRule.crawlDelay,
            });
          }
          
          currentRule = {
            userAgent: value.toLowerCase(),
            allow: [],
            disallow: [],
          };
          break;

        case 'allow':
          if (currentRule) {
            if (!currentRule.allow) currentRule.allow = [];
            currentRule.allow.push(value);
          }
          break;

        case 'disallow':
          if (currentRule) {
            if (!currentRule.disallow) currentRule.disallow = [];
            currentRule.disallow.push(value);
          }
          break;

        case 'crawl-delay':
          if (currentRule) {
            const delay = parseInt(value);
            if (!isNaN(delay)) {
              currentRule.crawlDelay = delay * 1000; // Convert to milliseconds
            }
          }
          break;
      }
    }

    // Add the last rule
    if (currentRule) {
      rules.push({
        userAgent: currentRule.userAgent || '*',
        allow: currentRule.allow || [],
        disallow: currentRule.disallow || [],
        crawlDelay: currentRule.crawlDelay,
      });
    }

    return rules;
  }

  async canCrawl(url: string, userAgent: string = 'SignatureQuoteCrawler'): Promise<{
    allowed: boolean;
    crawlDelay?: number;
    matchedRule?: string;
  }> {
    try {
      const parsedUrl = new URL(url);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      const path = parsedUrl.pathname;

      const rules = await this.getRobotsRules(baseUrl);
      const normalizedUserAgent = userAgent.toLowerCase();

      // Find the most specific matching rule
      let matchedRule: RobotsRule | null = null;
      
      // First, look for exact user-agent match
      for (const rule of rules) {
        if (rule.userAgent === normalizedUserAgent) {
          matchedRule = rule;
          break;
        }
      }

      // If no exact match, look for wildcard match
      if (!matchedRule) {
        for (const rule of rules) {
          if (rule.userAgent === '*') {
            matchedRule = rule;
            break;
          }
        }
      }

      if (!matchedRule) {
        // No applicable rule found, assume allowed
        return { allowed: true };
      }

      // Check disallow rules first (they take precedence)
      for (const disallowPattern of matchedRule.disallow) {
        if (this.pathMatches(path, disallowPattern)) {
          logger.debug({ 
            url, 
            path, 
            disallowPattern,
            userAgent: matchedRule.userAgent 
          }, 'URL blocked by robots.txt');
          
          return { 
            allowed: false, 
            matchedRule: `Disallow: ${disallowPattern}` 
          };
        }
      }

      // Check allow rules
      for (const allowPattern of matchedRule.allow) {
        if (this.pathMatches(path, allowPattern)) {
          return { 
            allowed: true, 
            crawlDelay: matchedRule.crawlDelay,
            matchedRule: `Allow: ${allowPattern}` 
          };
        }
      }

      // If we have disallow rules but no matching allow rules,
      // and the path doesn't match any disallow rules, it's allowed
      if (matchedRule.disallow.length > 0) {
        return { 
          allowed: true, 
          crawlDelay: matchedRule.crawlDelay 
        };
      }

      // Default to allowed
      return { 
        allowed: true, 
        crawlDelay: matchedRule.crawlDelay 
      };

    } catch (error) {
      logger.error({ url, error }, 'Error checking robots.txt');
      return { allowed: true }; // Default to allowed on error
    }
  }

  private pathMatches(path: string, pattern: string): boolean {
    // Handle exact matches
    if (pattern === path) {
      return true;
    }

    // Handle wildcard patterns
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
        .replace(/\\\*/g, '.*'); // Convert * to .*
      
      const regex = new RegExp(`^${regexPattern}`);
      return regex.test(path);
    }

    // Handle prefix matches (common in robots.txt)
    return path.startsWith(pattern);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const robotsChecker = new RobotsChecker();