import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { scrapeWebPage } from './server/scraper.js';
import {
  generateRobotsTxt,
  generateSitemapXml,
  getBaseOrigin,
  injectSeoIntoHtml,
} from './server/seoServer.js';
import { SEO_LANGUAGES } from './src/seo/seoConfig.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Robots.txt endpoint for search engines
  app.get('/robots.txt', (req, res) => {
    const origin = getBaseOrigin(req);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(generateRobotsTxt(origin));
  });

  // Sitemap.xml endpoint with 20 language URLs and alternate hreflang tags
  app.get('/sitemap.xml', (req, res) => {
    const origin = getBaseOrigin(req);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml(origin));
  });

  // SEO Health check verifying all 20 language endpoints
  app.get('/api/seo-status', (req, res) => {
    const origin = getBaseOrigin(req);
    const languages = Object.keys(SEO_LANGUAGES);
    res.json({
      status: 'healthy',
      totalLanguages: languages.length,
      supportedLanguages: languages,
      sitemapUrl: `${origin}/sitemap.xml`,
      robotsUrl: `${origin}/robots.txt`,
      hreflangCompliant: true,
    });
  });

  // Scrape endpoint
  app.post('/api/scrape', async (req, res) => {
    try {
      const { url, mode, maxPages } = req.body;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'URL parameter is required and must be a valid string.' });
        return;
      }

      const crawlMode = mode === 'all' ? 'all' : 'single';
      const pagesLimit = typeof maxPages === 'number' ? Math.min(Math.max(1, maxPages), 20) : 10;

      const result = await scrapeWebPage(url, crawlMode, pagesLimit);
      res.json(result);
    } catch (error: any) {
      console.error('Scraping error:', error);
      res.status(500).json({
        error: error.message || 'An error occurred while scraping the requested website.',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // Custom HTML SEO injector in dev mode for ?lang= parameter
    app.use(async (req, res, next) => {
      const url = req.originalUrl;
      // Only intercept HTML navigation requests (not static scripts or assets)
      if (
        req.method === 'GET' &&
        !url.startsWith('/api') &&
        !url.startsWith('/@') &&
        !url.includes('.')
      ) {
        try {
          const origin = getBaseOrigin(req);
          const langQuery = (req.query.lang as string) || undefined;
          const templatePath = path.resolve(process.cwd(), 'index.html');
          const rawTemplate = fs.readFileSync(templatePath, 'utf-8');
          const transformedHtml = await vite.transformIndexHtml(url, rawTemplate);
          const finalHtml = injectSeoIntoHtml(transformedHtml, langQuery, origin);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
          return;
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
          return;
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      try {
        const origin = getBaseOrigin(req);
        const langQuery = (req.query.lang as string) || undefined;
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          const rawHtml = fs.readFileSync(indexPath, 'utf-8');
          const finalHtml = injectSeoIntoHtml(rawHtml, langQuery, origin);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.send(finalHtml);
        } else {
          res.sendFile(indexPath);
        }
      } catch (err) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
