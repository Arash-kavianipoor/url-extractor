import { SEO_CONFIG, SEO_LANGUAGES, buildCanonicalUrl, buildHreflangLinks } from '../src/seo/seoConfig.js';
import { Language } from '../src/types.js';

export function getBaseOrigin(req: { headers: Record<string, string | string[] | undefined>; protocol?: string }): string {
  const forwardedProto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || (req.headers['host'] as string);
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '');
  }
  return SEO_CONFIG.defaultOrigin;
}

export function generateRobotsTxt(origin: string): string {
  return `# Production Robots Exclusion Policy
# Conforms to SEO specification
User-agent: *
Allow: /

# Sitemap Index for all 20 language endpoints
Sitemap: ${origin}/sitemap.xml
`;
}

export function generateSitemapXml(origin: string): string {
  const lastMod = '2026-09-02';
  const langKeys = Object.keys(SEO_LANGUAGES) as Language[];

  // Build hreflang alternate tags for all languages
  const alternateLinksXml = langKeys
    .map((l) => {
      const href = l === 'en' ? `${origin}/` : `${origin}/?lang=${l}`;
      return `    <xhtml:link rel="alternate" hreflang="${l}" href="${href}" />`;
    })
    .join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/" />`;

  const urlEntries = langKeys
    .map((l) => {
      const loc = l === 'en' ? `${origin}/` : `${origin}/?lang=${l}`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastMod}</lastmod>
${alternateLinksXml}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;
}

export function injectSeoIntoHtml(rawHtml: string, langQuery: string | undefined, origin: string): string {
  const lang: Language = (langQuery && langQuery in SEO_LANGUAGES ? langQuery : 'en') as Language;
  const seo = SEO_LANGUAGES[lang] || SEO_LANGUAGES.en;
  const canonicalUrl = buildCanonicalUrl(lang, origin);
  const hreflangItems = buildHreflangLinks(origin);

  const hreflangTags = hreflangItems
    .map((item) => `    <link rel="alternate" hreflang="${item.lang}" href="${item.url}" />`)
    .join('\n');

  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${canonicalUrl}#website`,
        url: canonicalUrl,
        name: SEO_CONFIG.siteName,
        description: seo.description,
        inLanguage: lang,
        publisher: {
          '@type': 'Organization',
          name: SEO_CONFIG.siteName,
          url: canonicalUrl,
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${canonicalUrl}#software`,
        name: seo.title,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        description: seo.description,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': `${origin}/`,
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': seo.name,
            'item': canonicalUrl,
          },
        ],
      },
    ],
  });

  let modifiedHtml = rawHtml;

  // Replace <html ...>
  modifiedHtml = modifiedHtml.replace(
    /<html[^>]*>/i,
    `<html lang="${lang}" dir="${seo.dir}">`
  );

  // Replace <title>...</title>
  modifiedHtml = modifiedHtml.replace(
    /<title>.*?<\/title>/i,
    `<title>${seo.title}</title>`
  );

  // Replace or inject description
  if (modifiedHtml.includes('<meta name="description"')) {
    modifiedHtml = modifiedHtml.replace(
      /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
      `<meta name="description" content="${seo.description.replace(/"/g, '&quot;')}" />`
    );
  }

  // Inject Canonical, Hreflangs, OpenGraph & Structured data before </head>
  const seoHeadBlock = `
    <link rel="canonical" href="${canonicalUrl}" />
${hreflangTags}
    <meta name="keywords" content="${seo.keywords.join(', ')}" />
    <meta property="og:title" content="${seo.title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${seo.description.replace(/"/g, '&quot;')}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:locale" content="${seo.locale}" />
    <script type="application/ld+json" id="seo-structured-data">${structuredData}</script>
  </head>`;

  modifiedHtml = modifiedHtml.replace('</head>', seoHeadBlock);

  return modifiedHtml;
}
