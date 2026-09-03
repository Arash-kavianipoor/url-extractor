import { scrapeWebPage } from './server/scraper.js';
import { generateRobotsTxt, generateSitemapXml } from './server/seoServer.js';
import { SEO_LANGUAGES } from './src/seo/seoConfig.js';

export interface Fetcher {
  fetch(request: Request | string): Promise<Response>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface Env {
  ASSETS: Fetcher;
  DB?: unknown;
  ENVIRONMENT?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight options request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 1. Handle API and SEO routes
    if (url.pathname.startsWith('/api/')) {
      // System health-check endpoint (Section 4 Standard)
      if (url.pathname === '/api/health') {
        return new Response(
          JSON.stringify({
            status: 'ok',
            db_connected: !!env.DB,
            timestamp: new Date().toISOString(),
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...CORS_HEADERS,
            },
          }
        );
      }

      // SEO Health status
      if (url.pathname === '/api/seo-status') {
        const languages = Object.keys(SEO_LANGUAGES);
        return new Response(
          JSON.stringify({
            status: 'healthy',
            totalLanguages: languages.length,
            supportedLanguages: languages,
            sitemapUrl: `${url.origin}/sitemap.xml`,
            robotsUrl: `${url.origin}/robots.txt`,
            hreflangCompliant: true,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...CORS_HEADERS,
            },
          }
        );
      }

      // Scrape endpoint
      if (url.pathname === '/api/scrape') {
        if (request.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
          });
        }

        try {
          const body = (await request.json()) as {
            url?: string;
            mode?: string;
            maxPages?: number;
          };
          const { url: targetUrl, mode, maxPages } = body;

          if (!targetUrl || typeof targetUrl !== 'string') {
            return new Response(
              JSON.stringify({ error: 'URL parameter is required and must be a valid string.' }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
              }
            );
          }

          const crawlMode = mode === 'all' ? 'all' : 'single';
          const pagesLimit = typeof maxPages === 'number' ? Math.min(Math.max(1, maxPages), 20) : 10;

          const result = await scrapeWebPage(targetUrl, crawlMode, pagesLimit);
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
          });
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              error: error.message || 'An error occurred while scraping the requested website.',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
            }
          );
        }
      }

      // Other API routes
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // SEO robots.txt
    if (url.pathname === '/robots.txt') {
      return new Response(generateRobotsTxt(url.origin), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // SEO sitemap.xml
    if (url.pathname === '/sitemap.xml') {
      return new Response(generateSitemapXml(url.origin), {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // 2. Serve frontend and static assets from dist through ASSETS
    if (env.ASSETS) {
      return await env.ASSETS.fetch(request);
    }

    return new Response('Assets binding not available', { status: 500 });
  },
};
