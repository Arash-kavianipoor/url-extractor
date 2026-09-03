import { Language } from '../types.js';
import { SEO_CONFIG, SEO_LANGUAGES, buildCanonicalUrl, buildHreflangLinks } from './seoConfig.js';

export function updateDocumentSeo(lang: Language, origin?: string) {
  if (typeof document === 'undefined') return;

  const seo = SEO_LANGUAGES[lang] || SEO_LANGUAGES.en;
  const canonicalUrl = buildCanonicalUrl(lang, origin || window.location.origin);
  const isRtl = seo.dir === 'rtl';

  // 1. Update <html> tag lang and dir
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', seo.dir);

  // 2. Update Document Title
  document.title = seo.title;

  // 3. Helper to update or create meta tags
  const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 4. Meta descriptions and robots
  setMetaTag('name', 'description', seo.description);
  setMetaTag('name', 'keywords', seo.keywords.join(', '));
  setMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
  setMetaTag('name', 'author', SEO_CONFIG.author);

  // 5. Open Graph tags
  setMetaTag('property', 'og:title', seo.title);
  setMetaTag('property', 'og:description', seo.description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:site_name', SEO_CONFIG.siteName);
  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:locale', seo.locale);
  setMetaTag('property', 'og:image', SEO_CONFIG.defaultImage);

  // 6. Twitter / X Card
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', seo.title);
  setMetaTag('name', 'twitter:description', seo.description);
  setMetaTag('name', 'twitter:image', SEO_CONFIG.defaultImage);

  // 7. Canonical Tag
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl);

  // 8. Hreflang alternate links
  const existingAlternates = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existingAlternates.forEach((node) => node.remove());

  const hreflangs = buildHreflangLinks(origin || window.location.origin);
  for (const item of hreflangs) {
    const linkEl = document.createElement('link');
    linkEl.setAttribute('rel', 'alternate');
    linkEl.setAttribute('hreflang', item.lang);
    linkEl.setAttribute('href', item.url);
    document.head.appendChild(linkEl);
  }

  // 9. Structured Data (JSON-LD)
  let jsonLdScript = document.getElementById('seo-structured-data');
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'seo-structured-data';
    jsonLdScript.setAttribute('type', 'application/ld+json');
    document.head.appendChild(jsonLdScript);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${canonicalUrl}#website`,
        'url': canonicalUrl,
        'name': SEO_CONFIG.siteName,
        'description': seo.description,
        'inLanguage': lang,
        'publisher': {
          '@type': 'Organization',
          'name': SEO_CONFIG.siteName,
          'url': canonicalUrl,
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${canonicalUrl}#software`,
        'name': seo.title,
        'applicationCategory': 'DeveloperApplication',
        'operatingSystem': 'Any',
        'description': seo.description,
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': buildCanonicalUrl('en', origin),
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
  };

  jsonLdScript.textContent = JSON.stringify(structuredData);
}
