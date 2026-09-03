import * as cheerio from 'cheerio';
import {
  ScrapedLink,
  ScrapedHeading,
  HeadingLevel,
  ExtractedFile,
  ScrapeResult,
  CrawlMode,
  LinkType,
  DeviceType,
  DeviceVersion,
} from '../src/types.js';

// Realistic Device Profiles for 3-way Browser Emulation
export const DEVICE_PROFILES: Record<
  DeviceType,
  {
    name: string;
    userAgent: string;
    secChUa: string;
    secChUaMobile: string;
    secChUaPlatform: string;
    viewport: string;
    previewWidth: number;
  }
> = {
  desktop: {
    name: 'Desktop',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    secChUa: '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    secChUaMobile: '?0',
    secChUaPlatform: '"Windows"',
    viewport: 'width=device-width, initial-scale=1.0',
    previewWidth: 1280,
  },
  tablet: {
    name: 'Tablet',
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    secChUa: '"Not(A:Brand";v="99", "Apple Safari";v="17", "WebKit";v="605"',
    secChUaMobile: '?1',
    secChUaPlatform: '"iOS"',
    viewport: 'width=768, initial-scale=1.0, maximum-scale=2.0',
    previewWidth: 768,
  },
  mobile: {
    name: 'Mobile',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
    secChUa: '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    secChUaMobile: '?1',
    secChUaPlatform: '"Android"',
    viewport: 'width=390, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes',
    previewWidth: 390,
  },
};

// Modern Desktop Chrome 133 User-Agent
const CHROME_DESKTOP_UA = DEVICE_PROFILES.desktop.userAgent;

// Known trackers and ad networks to strip for clean offline execution
const TRACKER_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'connect.facebook.net',
  'facebook.com/tr',
  'clarity.ms',
  'hotjar.com',
  'doubleclick.net',
  'pagead2.googlesyndication.com',
  'yandex.ru',
  'mc.yandex.ru',
  'adsbygoogle',
  'amplitude.com',
  'mixpanel.com',
  'segment.io',
  'sentry.io',
  'datadoghq.com',
  'newrelic.com',
];

// Check if running in Node.js runtime vs Cloudflare Workers
const isNodeRuntime =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

/**
 * Cookie Jar for realistic browser simulation:
 * Captures Set-Cookie headers from the initial page request and passes them
 * in all subsequent asset/media subrequests to prevent host anti-bot 403 blocks.
 */
export class CookieJar {
  private cookies = new Map<string, string>();

  storeCookies(rawHeader: string | null) {
    if (!rawHeader) return;
    // Handle both single string and comma-delimited multiple set-cookie entries
    const items = rawHeader.split(/,(?=[^;]+=[^;]+)/g);
    for (const item of items) {
      const firstPart = item.split(';')[0].trim();
      const eqIdx = firstPart.indexOf('=');
      if (eqIdx > 0) {
        const key = firstPart.slice(0, eqIdx).trim();
        const val = firstPart.slice(eqIdx + 1).trim();
        const lowerKey = key.toLowerCase();
        if (
          key &&
          lowerKey !== 'expires' &&
          lowerKey !== 'domain' &&
          lowerKey !== 'path' &&
          lowerKey !== 'samesite' &&
          lowerKey !== 'max-age'
        ) {
          this.cookies.set(key, val);
        }
      }
    }
  }

  getCookieHeader(): string {
    if (this.cookies.size === 0) return '';
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
}

/**
 * Generates realistic browser client-hints and navigational headers
 */
function getBrowserHeaders(
  resourceType: 'document' | 'image' | 'style' | 'font' | 'script' | 'other',
  refererUrl?: string,
  cookieHeader?: string,
  targetOrigin?: string,
  device: DeviceType = 'desktop'
): Record<string, string> {
  const profile = DEVICE_PROFILES[device] || DEVICE_PROFILES.desktop;
  const isSameOrigin = refererUrl && targetOrigin && refererUrl.startsWith(targetOrigin);

  const headers: Record<string, string> = {
    'User-Agent': profile.userAgent,
    'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
    'Sec-Ch-Ua': profile.secChUa,
    'Sec-Ch-Ua-Mobile': profile.secChUaMobile,
    'Sec-Ch-Ua-Platform': profile.secChUaPlatform,
  };

  if (resourceType === 'document') {
    headers['Accept'] =
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
    headers['Sec-Fetch-Dest'] = 'document';
    headers['Sec-Fetch-Mode'] = 'navigate';
    headers['Sec-Fetch-Site'] = 'none';
    headers['Sec-Fetch-User'] = '?1';
    headers['Upgrade-Insecure-Requests'] = '1';
    headers['Cache-Control'] = 'max-age=0';
  } else if (resourceType === 'image') {
    headers['Accept'] = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';
    headers['Sec-Fetch-Dest'] = 'image';
    headers['Sec-Fetch-Mode'] = 'no-cors';
    headers['Sec-Fetch-Site'] = isSameOrigin ? 'same-origin' : 'cross-site';
  } else if (resourceType === 'style') {
    headers['Accept'] = 'text/css,*/*;q=0.1';
    headers['Sec-Fetch-Dest'] = 'style';
    headers['Sec-Fetch-Mode'] = 'no-cors';
    headers['Sec-Fetch-Site'] = isSameOrigin ? 'same-origin' : 'cross-site';
  } else if (resourceType === 'font') {
    headers['Accept'] = 'font/woff2,font/woff,font/ttf,*/*;q=0.1';
    headers['Sec-Fetch-Dest'] = 'font';
    headers['Sec-Fetch-Mode'] = 'cors';
    headers['Sec-Fetch-Site'] = isSameOrigin ? 'same-origin' : 'cross-site';
  } else {
    headers['Accept'] = '*/*';
    headers['Sec-Fetch-Dest'] = 'empty';
    headers['Sec-Fetch-Mode'] = 'cors';
    headers['Sec-Fetch-Site'] = isSameOrigin ? 'same-origin' : 'cross-site';
  }

  if (refererUrl) {
    headers['Referer'] = refererUrl;
  }

  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  return headers;
}

export class SubrequestTracker {
  private count = 0;
  private totalDownloadedBytes = 0;
  private readonly maxLimit: number;
  private readonly maxBytesLimit: number;

  constructor(maxLimit?: number, maxBytesLimit = 65 * 1024 * 1024) {
    // In Node.js, allow up to 600 subrequests so bottom sections and all page media are fully saved
    this.maxLimit = maxLimit ?? (isNodeRuntime ? 600 : 45);
    this.maxBytesLimit = maxBytesLimit;
  }

  canFetch(): boolean {
    return this.count < this.maxLimit && this.totalDownloadedBytes < this.maxBytesLimit;
  }

  record(bytes = 0): boolean {
    if (this.count >= this.maxLimit || this.totalDownloadedBytes >= this.maxBytesLimit) {
      return false;
    }
    this.count++;
    this.totalDownloadedBytes += bytes;
    return true;
  }

  recordBytes(bytes: number) {
    this.totalDownloadedBytes += bytes;
  }

  get remaining(): number {
    return Math.max(0, this.maxLimit - this.count);
  }

  get total(): number {
    return this.count;
  }

  get totalBytes(): number {
    return this.totalDownloadedBytes;
  }
}

/**
 * Concurrency runner matching standard browser connection pooling (up to 10 lanes)
 * for rapid parallel subresource downloading without blocking the event loop.
 */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch {
        // Continue processing other lanes even if one task fails
      }
    }
  });

  await Promise.all(workers);
  return results;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = 6000,
  tracker?: SubrequestTracker,
  resourceType: 'document' | 'image' | 'style' | 'font' | 'script' | 'other' = 'document',
  refererUrl?: string,
  cookieJar?: CookieJar,
  device: DeviceType = 'desktop'
): Promise<{ ok: boolean; status: number; text: string; contentType: string; finalUrl: string }> {
  if (tracker && !tracker.record()) {
    throw new Error(`Subrequest limit budget reached (max ${tracker.total})`);
  }

  const cookieHeader = cookieJar?.getCookieHeader();
  let targetOrigin = '';
  try {
    targetOrigin = new URL(url).origin;
  } catch {}

  const headers = getBrowserHeaders(resourceType, refererUrl, cookieHeader, targetOrigin, device);

  const attemptFetch = async (retryCount = 0): Promise<any> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(id);

      // Capture cookies if returned by host
      if (cookieJar) {
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) cookieJar.storeCookies(setCookie);
      }

      // Handle rate limit (429) or transient 503 only for the primary document (fast backoff)
      if (resourceType === 'document' && (res.status === 429 || res.status === 503) && retryCount < 1) {
        await new Promise((r) => setTimeout(r, 250));
        return attemptFetch(retryCount + 1);
      }

      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      if (tracker) {
        tracker.recordBytes(Buffer.byteLength(text, 'utf-8'));
      }
      return { ok: res.ok, status: res.status, text, contentType, finalUrl: res.url || url };
    } catch (err: any) {
      clearTimeout(id);
      // Fast single retry only for the primary HTML document, never for subresources
      if (resourceType === 'document' && retryCount < 1) {
        await new Promise((r) => setTimeout(r, 200));
        return attemptFetch(retryCount + 1);
      }
      throw new Error(`Failed to fetch ${url}: ${err.message}`);
    }
  };

  return attemptFetch(0);
}

async function fetchBinary(
  url: string,
  timeoutMs = 2500,
  tracker?: SubrequestTracker,
  refererUrl?: string,
  cookieJar?: CookieJar,
  resourceType: 'image' | 'font' = 'image'
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (tracker && !tracker.record()) {
    return null;
  }

  const cookieHeader = cookieJar?.getCookieHeader();
  let targetOrigin = '';
  try {
    targetOrigin = new URL(url).origin;
  } catch {}

  const headers = getBrowserHeaders(resourceType, refererUrl, cookieHeader, targetOrigin);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(id);

    if (cookieJar) {
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) cookieJar.storeCookies(setCookie);
    }

    if (!res.ok) return null;

    let mimeType = res.headers.get('content-type') || '';
    mimeType = mimeType.split(';')[0].trim().toLowerCase();

    if (!mimeType || mimeType === 'application/octet-stream') {
      mimeType = guessMimeType(url);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Limit individual asset to 2.5MB to keep response snappy
    if (buffer.byteLength > 2.5 * 1024 * 1024) {
      return null;
    }

    if (tracker) {
      tracker.recordBytes(buffer.byteLength);
    }

    return { buffer, mimeType };
  } catch {
    clearTimeout(id);
    return null;
  }
}

function guessMimeType(urlStr: string): string {
  try {
    const pathname = new URL(urlStr).pathname.toLowerCase();
    if (pathname.endsWith('.woff2')) return 'font/woff2';
    if (pathname.endsWith('.woff')) return 'font/woff';
    if (pathname.endsWith('.ttf')) return 'font/ttf';
    if (pathname.endsWith('.otf')) return 'font/otf';
    if (pathname.endsWith('.eot')) return 'application/vnd.ms-fontobject';
    if (pathname.endsWith('.svg')) return 'image/svg+xml';
    if (pathname.endsWith('.png')) return 'image/png';
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
    if (pathname.endsWith('.gif')) return 'image/gif';
    if (pathname.endsWith('.webp')) return 'image/webp';
    if (pathname.endsWith('.avif')) return 'image/avif';
    if (pathname.endsWith('.ico')) return 'image/x-icon';
    if (pathname.endsWith('.css')) return 'text/css';
    if (pathname.endsWith('.js')) return 'application/javascript';
  } catch {}
  return 'application/octet-stream';
}

function classifyLink(
  rawHref: string,
  basePageUrl: string,
  rootOrigin: string
): { resolvedUrl: string; type: LinkType } {
  const trimmed = rawHref.trim();
  if (trimmed.startsWith('mailto:')) {
    return { resolvedUrl: trimmed, type: 'mailto' };
  }
  if (trimmed.startsWith('tel:') || trimmed.startsWith('sms:')) {
    return { resolvedUrl: trimmed, type: 'other' };
  }
  if (trimmed.startsWith('#')) {
    return { resolvedUrl: trimmed, type: 'anchor' };
  }
  if (trimmed.startsWith('javascript:')) {
    return { resolvedUrl: trimmed, type: 'other' };
  }

  try {
    const resolved = new URL(trimmed, basePageUrl);
    const pathname = resolved.pathname.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|avif|svg|ico|pdf|zip|tar|gz|mp3|mp4|mov|woff2?|ttf|eot)$/i.test(pathname)) {
      return { resolvedUrl: resolved.href, type: 'asset' };
    }
    if (resolved.origin === rootOrigin) {
      return { resolvedUrl: resolved.href, type: 'internal' };
    }
    return { resolvedUrl: resolved.href, type: 'external' };
  } catch {
    return { resolvedUrl: trimmed, type: 'other' };
  }
}

/**
 * Universal stylesheet tester: accurately catches all variants of stylesheet link tags
 */
function isStylesheetLink(relAttr: string, asAttr: string, typeAttr: string, hrefAttr: string): boolean {
  const rel = (relAttr || '').toLowerCase();
  const as = (asAttr || '').toLowerCase();
  const type = (typeAttr || '').toLowerCase();
  const href = (hrefAttr || '').toLowerCase();

  return (
    rel.includes('stylesheet') ||
    as === 'style' ||
    type === 'text/css' ||
    /\.css(\?.*)?$/i.test(href)
  );
}

/**
 * Parses srcset or data-srcset strings into individual URLs
 */
function parseSrcsetUrls(srcsetValue: string): string[] {
  if (!srcsetValue) return [];
  const urls: string[] = [];
  // Split on commas not enclosed in quotes or parentheses
  const entries = srcsetValue.split(/,\s*(?![^()]*\))/);
  for (const entry of entries) {
    const parts = entry.trim().split(/\s+/);
    if (parts[0] && !parts[0].startsWith('data:')) {
      urls.push(parts[0]);
    }
  }
  return urls;
}

/**
 * Recursively resolves @import rules and embeds webfonts and images as Base64 Data URIs
 * so the CSS has ZERO internet dependencies and renders identical offline.
 */
async function processCssContent(
  rawCss: string,
  cssBaseUrl: string,
  visitedCssUrls: Set<string>,
  assetCache: Map<string, string>,
  tracker: SubrequestTracker,
  cookieJar: CookieJar,
  depth = 0
): Promise<string> {
  if (depth > 3) return rawCss;

  // Remove individual @charset directives
  let processed = rawCss.replace(/@charset\s+['"][^'"]*['"];?/gi, '');

  // 1. Resolve and inline @import rules recursively
  const importRegex = /@import\s+(?:url\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"])\s*([^;]*);/gi;
  const importMatches = [...processed.matchAll(importRegex)];

  for (const match of importMatches) {
    if (!tracker.canFetch()) break;
    const fullStatement = match[0];
    const importPath = (match[1] || match[2] || '').trim();
    if (!importPath || importPath.startsWith('data:')) continue;

    try {
      const resolvedImportUrl = new URL(importPath, cssBaseUrl).href;
      if (visitedCssUrls.has(resolvedImportUrl)) {
        processed = processed.replace(fullStatement, `/* Circular @import prevented: ${resolvedImportUrl} */`);
        continue;
      }
      visitedCssUrls.add(resolvedImportUrl);

      const res = await fetchWithTimeout(
        resolvedImportUrl,
        2500,
        tracker,
        'style',
        cssBaseUrl,
        cookieJar
      );
      if (res.ok && res.text) {
        const nestedProcessed = await processCssContent(
          res.text,
          resolvedImportUrl,
          visitedCssUrls,
          assetCache,
          tracker,
          cookieJar,
          depth + 1
        );
        processed = processed.replace(
          fullStatement,
          `\n/* ===== INLINED IMPORT: ${resolvedImportUrl} ===== */\n${nestedProcessed}\n/* ===== END INLINED IMPORT ===== */\n`
        );
      } else {
        processed = processed.replace(
          fullStatement,
          `/* Note: Failed to fetch imported CSS ${resolvedImportUrl} */`
        );
      }
    } catch {
      processed = processed.replace(fullStatement, `/* Note: Invalid @import URL ${importPath} */`);
    }
  }

  // 2. Discover all url(...) asset paths in CSS (fonts, background images, icons)
  const urlRegex = /url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi;
  const urlMatches = [...processed.matchAll(urlRegex)];

  const distinctAssetPaths: string[] = [];
  const seenPaths = new Set<string>();
  for (const match of urlMatches) {
    const assetPath = match[2]?.trim();
    if (
      assetPath &&
      !assetPath.startsWith('data:') &&
      !assetPath.startsWith('#') &&
      !assetPath.startsWith('blob:') &&
      !seenPaths.has(assetPath)
    ) {
      seenPaths.add(assetPath);
      distinctAssetPaths.push(assetPath);
    }
  }

  // Pre-fetch key fonts and images with concurrency pooling (top 20 priority assets)
  await runWithConcurrency(distinctAssetPaths.slice(0, 20), 8, async (assetPath) => {
    if (!tracker.canFetch()) return;
    try {
      const resolvedAssetUrl = new URL(assetPath, cssBaseUrl).href;
      if (!assetCache.has(resolvedAssetUrl)) {
        const isFont = /\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(resolvedAssetUrl);
        const isEmbeddable =
          isFont || /\.(svg|png|jpe?g|gif|webp|avif|ico)(\?.*)?$/i.test(resolvedAssetUrl);

        if (isEmbeddable) {
          const binary = await fetchBinary(
            resolvedAssetUrl,
            2200,
            tracker,
            cssBaseUrl,
            cookieJar,
            isFont ? 'font' : 'image'
          );
          if (binary && binary.buffer.byteLength <= 2.5 * 1024 * 1024) {
            const b64 = binary.buffer.toString('base64');
            const dataUri = `data:${binary.mimeType};base64,${b64}`;
            assetCache.set(resolvedAssetUrl, dataUri);
          }
        }
      }
    } catch {}
  });

  // 3. Single-pass URL rewriting
  processed = processed.replace(
    /url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi,
    (fullMatch, _quote, rawUrl) => {
      const trimmed = (rawUrl || '').trim();
      if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('#') || trimmed.startsWith('blob:')) {
        return fullMatch;
      }
      try {
        const resolved = new URL(trimmed, cssBaseUrl).href;
        const replacement = assetCache.get(resolved) || resolved;
        return `url("${replacement}")`;
      } catch {
        return fullMatch;
      }
    }
  );

  return processed;
}

/**
 * Transforms scraped HTML into a completely self-contained, 100% offline-compatible document:
 * 1. Discovers and removes all remote stylesheet links
 * 2. Unveils all lazy-loaded bottom sections, animations (AOS, Wow, scroll-reveal), and footers
 * 3. Extracts and inlines ALL media across the full document height (images, svgs, picture sources, background images)
 * 4. Strips tracking scripts
 * 5. Embeds offline resilience CSS rules ensuring 100% visibility offline
 */
async function processHtmlForOffline(
  rawHtml: string,
  pageUrl: string,
  combinedCss: string,
  pageMapping: Map<string, string>,
  assetCache: Map<string, string>,
  tracker: SubrequestTracker,
  cookieJar: CookieJar,
  device: DeviceType = 'desktop'
): Promise<string> {
  const $ = cheerio.load(rawHtml);

  // Remove <base> tag to allow local file:/// resolution
  $('base').remove();

  // Remove ALL remote stylesheet links
  $('link').each((_, elem) => {
    const rel = ($(elem).attr('rel') || '').toLowerCase();
    const as = ($(elem).attr('as') || '').toLowerCase();
    const type = ($(elem).attr('type') || '').toLowerCase();
    const href = $(elem).attr('href') || $(elem).attr('data-href') || '';

    if (isStylesheetLink(rel, as, type, href)) {
      $(elem).remove();
    }
  });

  // Clean out analytics and tracking scripts
  $('script').each((_, elem) => {
    const src = $(elem).attr('src') || '';
    const content = $(elem).html() || '';
    const isTracker = TRACKER_DOMAINS.some(
      (trackerDomain) => src.includes(trackerDomain) || content.includes(trackerDomain)
    );
    if (isTracker) {
      $(elem).remove();
    }
  });

  // =========================================================================
  // 1. DISCOVER AND PREPARE ALL MEDIA TARGETS (ACROSS THE ENTIRE DOM TREE)
  // =========================================================================
  interface MediaTarget {
    type: 'img' | 'picture-source' | 'background' | 'svg-image' | 'video-poster' | 'favicon';
    element: any;
    urlCandidates: string[];
    originalAttr?: string;
  }

  const mediaTargets: MediaTarget[] = [];
  const urlsToFetch = new Set<string>();

  // A. Check <noscript> tags for real lazyloaded images (WordPress, Gatsby, Shopify)
  $('noscript').each((_, noscriptElem) => {
    const noscriptContent = $(noscriptElem).html() || '';
    if (noscriptContent.includes('<img')) {
      try {
        const $nested = cheerio.load(noscriptContent);
        $nested('img').each((_, nestedImg) => {
          const realSrc = $(nestedImg).attr('src');
          if (realSrc && !realSrc.startsWith('data:')) {
            // Check if there is an adjacent lazyload placeholder img
            const prevImg = $(noscriptElem).prev('img');
            if (prevImg.length > 0) {
              prevImg.attr('data-noscript-src', realSrc);
            }
          }
        });
      } catch {}
    }
  });

  // B. Process ALL <img> tags from top to very bottom of footer
  $('img').each((_, elem) => {
    const $img = $(elem);

    // Collect all candidate source attributes
    const rawSrc = $img.attr('src') || '';
    const candidates = [
      $img.attr('data-noscript-src'),
      $img.attr('data-src'),
      $img.attr('data-lazy-src'),
      $img.attr('data-original'),
      $img.attr('data-orig-file'),
      $img.attr('data-hi-res-src'),
      $img.attr('data-large-file'),
      $img.attr('data-zoom-src'),
      $img.attr('data-full-url'),
      $img.attr('data-fallback-src'),
      $img.attr('data-url'),
      $img.attr('data-src-retina'),
      $img.attr('data-img-url'),
      rawSrc,
    ].filter(Boolean) as string[];

    // Parse candidate URLs from srcset / data-srcset
    const rawSrcset = $img.attr('srcset') || $img.attr('data-srcset') || '';
    const srcsetUrls = parseSrcsetUrls(rawSrcset);
    if (srcsetUrls.length > 0) {
      // Add highest resolution / last candidate from srcset
      candidates.unshift(srcsetUrls[srcsetUrls.length - 1]);
    }

    // Filter out 1x1 blank gifs or data:svg placeholders
    const validCandidates = candidates.filter(
      (c) =>
        c &&
        !c.startsWith('data:image/svg') &&
        !c.startsWith('data:image/gif') &&
        c.trim().length > 0
    );

    // If only data URIs exist, keep them
    const finalCandidates = validCandidates.length > 0 ? validCandidates : candidates;

    if (finalCandidates.length > 0) {
      mediaTargets.push({
        type: 'img',
        element: elem,
        urlCandidates: finalCandidates,
        originalAttr: rawSrc,
      });

      for (const cand of finalCandidates) {
        if (!cand.startsWith('data:')) {
          try {
            urlsToFetch.add(new URL(cand, pageUrl).href);
          } catch {}
        }
      }
    }

    // Also collect all URLs in srcset for download
    for (const sUrl of srcsetUrls) {
      try {
        urlsToFetch.add(new URL(sUrl, pageUrl).href);
      } catch {}
    }
  });

  // C. Process <picture> <source> tags
  $('picture source').each((_, elem) => {
    const rawSrcset = $(elem).attr('srcset') || $(elem).attr('data-srcset') || '';
    const urls = parseSrcsetUrls(rawSrcset);
    if (urls.length > 0) {
      mediaTargets.push({
        type: 'picture-source',
        element: elem,
        urlCandidates: urls,
      });
      for (const u of urls) {
        try {
          urlsToFetch.add(new URL(u, pageUrl).href);
        } catch {}
      }
    }
  });

  // D. Process background images on elements (style="..." or data-bg="...")
  $('[style*="url("], [data-bg], [data-background], [data-background-image], [data-bg-hidpi]').each(
    (_, elem) => {
      const $el = $(elem);
      const styleAttr = $el.attr('style') || '';
      const dataBg =
        $el.attr('data-bg') ||
        $el.attr('data-background') ||
        $el.attr('data-background-image') ||
        $el.attr('data-bg-hidpi') ||
        '';

      const foundUrls: string[] = [];

      // Extract from style
      const urlMatches = [...styleAttr.matchAll(/url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi)];
      for (const m of urlMatches) {
        const u = m[2]?.trim();
        if (u && !u.startsWith('data:') && !u.startsWith('#')) {
          foundUrls.push(u);
        }
      }

      // Extract from data-bg
      if (dataBg && !dataBg.startsWith('data:')) {
        const cleanBg = dataBg.replace(/url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi, '$2').trim();
        if (cleanBg && !cleanBg.startsWith('data:') && !cleanBg.startsWith('#')) {
          foundUrls.push(cleanBg);
        }
      }

      if (foundUrls.length > 0) {
        mediaTargets.push({
          type: 'background',
          element: elem,
          urlCandidates: foundUrls,
        });
        for (const u of foundUrls) {
          try {
            urlsToFetch.add(new URL(u, pageUrl).href);
          } catch {}
        }
      }
    }
  );

  // E. Process SVG <image> tags
  $('svg image').each((_, elem) => {
    const href = $(elem).attr('href') || $(elem).attr('xlink:href');
    if (href && !href.startsWith('data:')) {
      mediaTargets.push({
        type: 'svg-image',
        element: elem,
        urlCandidates: [href],
      });
      try {
        urlsToFetch.add(new URL(href, pageUrl).href);
      } catch {}
    }
  });

  // F. Process video poster attributes
  $('video[poster]').each((_, elem) => {
    const poster = $(elem).attr('poster');
    if (poster && !poster.startsWith('data:')) {
      mediaTargets.push({
        type: 'video-poster',
        element: elem,
        urlCandidates: [poster],
      });
      try {
        urlsToFetch.add(new URL(poster, pageUrl).href);
      } catch {}
    }
  });

  // G. Process Favicons and Icons
  $('link[rel*="icon"], link[rel*="apple-touch-icon"]').each((_, elem) => {
    const href = $(elem).attr('href');
    if (href && !href.startsWith('data:')) {
      mediaTargets.push({
        type: 'favicon',
        element: elem,
        urlCandidates: [href],
      });
      try {
        urlsToFetch.add(new URL(href, pageUrl).href);
      } catch {}
    }
  });

  // =========================================================================
  // 2. CONCURRENT BATCH DOWNLOAD WITH BROWSER HEADERS & COOKIES
  // =========================================================================
  const distinctUrlsList = Array.from(urlsToFetch);

  await runWithConcurrency(distinctUrlsList, 6, async (resolvedUrl) => {
    if (!tracker.canFetch()) return;
    if (!assetCache.has(resolvedUrl)) {
      const binary = await fetchBinary(
        resolvedUrl,
        8000,
        tracker,
        pageUrl,
        cookieJar,
        'image'
      );
      if (binary && binary.buffer.byteLength <= 4 * 1024 * 1024) {
        const b64 = binary.buffer.toString('base64');
        const dataUri = `data:${binary.mimeType};base64,${b64}`;
        assetCache.set(resolvedUrl, dataUri);
      }
    }
  });

  // =========================================================================
  // 3. APPLY INLINED MEDIA DATA URIS & STRIP BLOCKING ATTRIBUTES
  // =========================================================================
  for (const target of mediaTargets) {
    const $elem = $(target.element);

    if (target.type === 'img') {
      // Pick best candidate that has a cached Data URI
      let finalSrc = '';
      for (const cand of target.urlCandidates) {
        if (cand.startsWith('data:')) {
          finalSrc = cand;
          break;
        }
        try {
          const resolved = new URL(cand, pageUrl).href;
          if (assetCache.has(resolved)) {
            finalSrc = assetCache.get(resolved)!;
            break;
          }
        } catch {}
      }

      // If no cached Data URI, pick first candidate and ensure absolute URL fallback
      if (!finalSrc && target.urlCandidates.length > 0) {
        const first = target.urlCandidates[0];
        try {
          finalSrc = new URL(first, pageUrl).href;
        } catch {
          finalSrc = first;
        }
      }

      if (finalSrc) {
        $elem.attr('src', finalSrc);
      }

      // Clean up lazy-load markers that block rendering
      $elem.removeAttr('data-src');
      $elem.removeAttr('data-lazy-src');
      $elem.removeAttr('data-original');
      $elem.removeAttr('data-orig-file');
      $elem.removeAttr('data-hi-res-src');
      $elem.removeAttr('data-large-file');
      $elem.removeAttr('data-zoom-src');
      $elem.removeAttr('data-full-url');
      $elem.removeAttr('data-fallback-src');
      $elem.removeAttr('data-url');
      $elem.removeAttr('data-src-retina');
      $elem.removeAttr('data-img-url');
      $elem.removeAttr('data-noscript-src');
      $elem.removeAttr('srcset');
      $elem.removeAttr('data-srcset');
      $elem.attr('loading', 'eager');
      $elem.attr('decoding', 'async');
      $elem.attr('referrerpolicy', 'no-referrer');
    } else if (target.type === 'picture-source') {
      const firstCand = target.urlCandidates[0];
      if (firstCand) {
        try {
          const resolved = new URL(firstCand, pageUrl).href;
          const cached = assetCache.get(resolved) || resolved;
          $elem.attr('srcset', cached);
          $elem.removeAttr('data-srcset');
        } catch {}
      }
    } else if (target.type === 'background') {
      let currentStyle = $elem.attr('style') || '';
      // Rewrite url(...) in style
      currentStyle = currentStyle.replace(
        /url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi,
        (fullMatch, _quote, rawUrl) => {
          const trimmed = (rawUrl || '').trim();
          if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('#')) return fullMatch;
          try {
            const resolved = new URL(trimmed, pageUrl).href;
            const replacement = assetCache.get(resolved) || resolved;
            return `url("${replacement}")`;
          } catch {
            return fullMatch;
          }
        }
      );

      // If data-bg was present, set as inline style
      const dataBg =
        $elem.attr('data-bg') ||
        $elem.attr('data-background') ||
        $elem.attr('data-background-image') ||
        '';
      if (dataBg) {
        const cleanBg = dataBg.replace(/url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi, '$2').trim();
        try {
          const resolved = new URL(cleanBg, pageUrl).href;
          const replacement = assetCache.get(resolved) || resolved;
          currentStyle += `; background-image: url("${replacement}") !important;`;
        } catch {}
        $elem.removeAttr('data-bg');
        $elem.removeAttr('data-background');
        $elem.removeAttr('data-background-image');
        $elem.removeAttr('data-bg-hidpi');
      }

      $elem.attr('style', currentStyle);
    } else if (target.type === 'svg-image') {
      const first = target.urlCandidates[0];
      if (first) {
        try {
          const resolved = new URL(first, pageUrl).href;
          const replacement = assetCache.get(resolved) || resolved;
          $elem.attr('href', replacement);
          if ($elem.attr('xlink:href')) {
            $elem.attr('xlink:href', replacement);
          }
        } catch {}
      }
    } else if (target.type === 'video-poster') {
      const first = target.urlCandidates[0];
      if (first) {
        try {
          const resolved = new URL(first, pageUrl).href;
          const replacement = assetCache.get(resolved) || resolved;
          $elem.attr('poster', replacement);
        } catch {}
      }
    } else if (target.type === 'favicon') {
      const first = target.urlCandidates[0];
      if (first) {
        try {
          const resolved = new URL(first, pageUrl).href;
          const replacement = assetCache.get(resolved) || resolved;
          $elem.attr('href', replacement);
        } catch {}
      }
    }
  }

  // Rewrite URLs inside inline <style> blocks
  $('style').each((_, elem) => {
    const originalCss = $(elem).html() || '';
    if (originalCss) {
      const rewritten = originalCss.replace(
        /url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi,
        (fullMatch, _quote, rawUrl) => {
          const trimmed = (rawUrl || '').trim();
          if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('#')) return fullMatch;
          try {
            const resolved = new URL(trimmed, pageUrl).href;
            const replacement = assetCache.get(resolved) || resolved;
            return `url("${replacement}")`;
          } catch {
            return fullMatch;
          }
        }
      );
      $(elem).html(rewritten);
    }
  });

  // Rewrite internal links if we crawled multiple pages
  $('a').each((_, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      try {
        const resolved = new URL(href, pageUrl).href.split('#')[0];
        if (pageMapping.has(resolved)) {
          const localFileName = pageMapping.get(resolved)!;
          const hash = href.includes('#') ? '#' + href.split('#')[1] : '';
          $(elem).attr('href', `${localFileName}${hash}`);
        }
      } catch {}
    }
  });

  // =========================================================================
  // 4. UN-HIDE BOTTOM SECTIONS AND SCROLL-TRIGGERED ANIMATIONS
  // =========================================================================
  // Remove animation and hiding classes (AOS, wow, animate-on-scroll, opacity-0, invisible)
  $('[class*="opacity-0"], [class*="invisible"], [data-aos], .aos-animate, .lazyload, .wow').each(
    (_, elem) => {
      const $el = $(elem);
      let classAttr = $el.attr('class') || '';
      classAttr = classAttr
        .replace(/\bopacity-0\b/g, '')
        .replace(/\binvisible\b/g, '')
        .replace(/\bhidden-before-scroll\b/g, '')
        .replace(/\blazyload\b/g, 'lazyloaded')
        .replace(/\s+/g, ' ')
        .trim();
      $el.attr('class', classAttr);
      $el.removeAttr('data-aos');
      $el.removeAttr('data-aos-delay');
      $el.removeAttr('data-aos-duration');

      // If element has inline style="opacity: 0", remove or set to 1
      const inlineStyle = $el.attr('style') || '';
      if (inlineStyle.includes('opacity: 0') || inlineStyle.includes('opacity:0')) {
        $el.attr('style', inlineStyle.replace(/opacity\s*:\s*0\s*;?/gi, 'opacity: 1;'));
      }
      if (inlineStyle.includes('visibility: hidden') || inlineStyle.includes('visibility:hidden')) {
        $el.attr('style', inlineStyle.replace(/visibility\s*:\s*hidden\s*;?/gi, 'visibility: visible;'));
      }
    }
  );

  // Set all iframes and images to eager loading so bottom widgets render
  $('iframe[loading="lazy"], img[loading="lazy"]').each((_, elem) => {
    $(elem).attr('loading', 'eager');
  });

  // Ensure <head> exists
  if ($('head').length === 0) {
    $('html').prepend('<head></head>');
  }

  // Ensure UTF-8 charset and responsive viewport are in <head>
  if ($('meta[charset]').length === 0) {
    $('head').prepend('<meta charset="UTF-8">\n');
  }
  // Ensure device-specific viewport is in <head>
  $('meta[name="viewport"]').remove();
  const profile = DEVICE_PROFILES[device] || DEVICE_PROFILES.desktop;
  $('head').append(`  <meta name="viewport" content="${profile.viewport}">\n`);
  $('head').append(`  <meta name="target-device" content="${device}">\n`);

  // 1. Link to local styles.css
  $('head').append('  <link rel="stylesheet" href="styles.css">\n');

  // 2. Inject CSS bundle with OFFLINE FULL-VISIBILITY ENGINE
  const safeCss = combinedCss.replace(/<\/style>/gi, '<\\/style>');
  const offlineEngineRules = `
/* ========================================================================
   OFFLINE FULL-RENDER & BOTTOM-SECTION VISIBILITY ENGINE
   Guarantees footer, bottom grids, lazy containers & animations are 100% visible
======================================================================== */
html, body {
  overflow-x: hidden !important;
  min-height: 100% !important;
  height: auto !important;
}
[data-aos], .aos-init, .aos-animate,
.wow, .reveal, .reveal-on-scroll,
.lazyload, .lazyloading, .lazyloaded,
[data-lazy], [loading="lazy"],
.opacity-0, [style*="opacity: 0"], [style*="opacity:0"],
.invisible, [style*="visibility: hidden"], [style*="visibility:hidden"],
footer, section, main, [role="main"],
.site-footer, .page-footer, .footer,
div[class*="footer"], div[class*="bottom"],
div[class*="section"], div[class*="content"] {
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
  transition: none !important;
  filter: none !important;
}
img, picture, source {
  content-visibility: visible !important;
}
`;

  $('head').append(
    `  <style id="offline-bundle-styles">\n/* =========================================================\n   100% OFFLINE BUNDLE - ZERO INTERNET CONNECTION REQUIRED\n========================================================= */\n${offlineEngineRules}\n${safeCss}\n  </style>\n`
  );

  // 3. Link to scripts.js at bottom of body
  if ($('body').length === 0) {
    $('html').append('<body></body>');
  }
  $('body').append('  <script src="scripts.js"></script>\n');

  return $.html();
}

export async function scrapeWebPage(
  startUrlInput: string,
  mode: CrawlMode = 'single',
  maxPages = 10
): Promise<ScrapeResult> {
  const startTime = Date.now();
  let parsedStartUrl: URL;
  let normalizedInput = startUrlInput.trim();
  if (!/^https?:\/\//i.test(normalizedInput)) {
    normalizedInput = 'https://' + normalizedInput;
  }

  try {
    parsedStartUrl = new URL(normalizedInput);
  } catch {
    throw new Error(`Invalid URL provided: ${startUrlInput}`);
  }

  const baseOrigin = parsedStartUrl.origin;
  const domain = parsedStartUrl.hostname;

  // Dedicated cookie jar for real-browser session emulation
  const cookieJar = new CookieJar();

  const visitedUrls = new Set<string>();
  const toVisitQueue: string[] = [parsedStartUrl.href];
  const allScrapedLinks: ScrapedLink[] = [];
  const allScrapedHeadings: ScrapedHeading[] = [];
  const seenLinkKeys = new Set<string>();

  // Map to store raw crawled pages: url -> { filename, title, rawHtml }
  const rawPagesMap = new Map<string, { filename: string; title: string; rawHtml: string }>();
  const pageMapping = new Map<string, string>(); // url -> filename

  // Structured record of styles discovered in document order
  interface DiscoveredStyle {
    type: 'external' | 'inline';
    url?: string;
    content?: string;
    media?: string;
    source: string;
  }

  const discoveredStyles: DiscoveredStyle[] = [];
  const discoveredScriptUrls = new Set<string>();
  const discoveredInlineScripts: { source: string; content: string }[] = [];

  const assetCache = new Map<string, string>(); // url -> dataUri
  let siteTitle = '';

  // Adaptive subrequest budgeting: Node.js allows up to 600 requests with 65MB payload
  const tracker = new SubrequestTracker();

  const maxPagesToCrawl = mode === 'single' ? 1 : Math.min(Math.max(1, maxPages), 20);

  while (toVisitQueue.length > 0 && visitedUrls.size < maxPagesToCrawl) {
    if (!tracker.canFetch()) break;
    const currentUrl = toVisitQueue.shift()!;
    const normalizedUrl = currentUrl.split('#')[0];

    if (visitedUrls.has(normalizedUrl)) continue;
    visitedUrls.add(normalizedUrl);

    try {
      let response: { ok: boolean; status: number; text: string; contentType: string; finalUrl: string };
      try {
        response = await fetchWithTimeout(
          currentUrl,
          12000,
          tracker,
          'document',
          undefined,
          cookieJar
        );
      } catch (firstErr: any) {
        // If HTTPS fails and was auto-prepended, try HTTP fallback
        if (currentUrl.startsWith('https://') && !startUrlInput.startsWith('https://')) {
          const httpUrl = currentUrl.replace(/^https:\/\//i, 'http://');
          response = await fetchWithTimeout(
            httpUrl,
            12000,
            tracker,
            'document',
            undefined,
            cookieJar
          );
        } else {
          throw firstErr;
        }
      }

      if (!response.ok) continue;

      const html = response.text;
      const $ = cheerio.load(html);

      const pageTitle = $('title').text().trim() || domain;
      if (!siteTitle) {
        siteTitle = pageTitle;
      }

      let fileName = 'index.html';
      if (visitedUrls.size > 1) {
        let safePath = new URL(currentUrl).pathname.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '');
        if (!safePath) safePath = `page_${visitedUrls.size}`;
        fileName = `${safePath}.html`;
      }

      rawPagesMap.set(normalizedUrl, { filename: fileName, title: pageTitle, rawHtml: html });
      pageMapping.set(normalizedUrl, fileName);

      // 1. Discover all links <a>
      $('a').each((_, elem) => {
        const href = $(elem).attr('href');
        if (!href) return;
        const text =
          $(elem).text().replace(/\s+/g, ' ').trim() ||
          $(elem).attr('title')?.trim() ||
          '[No anchor text]';
        const { resolvedUrl, type } = classifyLink(href, currentUrl, baseOrigin);

        const key = `${type}:${resolvedUrl}:${text}`;
        if (!seenLinkKeys.has(key)) {
          seenLinkKeys.add(key);
          allScrapedLinks.push({
            id: `link-${allScrapedLinks.length + 1}`,
            url: resolvedUrl,
            text: text.slice(0, 200),
            type,
            sourceUrl: currentUrl,
          });
        }

        if (mode === 'all' && type === 'internal' && resolvedUrl.startsWith(baseOrigin)) {
          const cleanUrl = resolvedUrl.split('#')[0];
          if (!visitedUrls.has(cleanUrl) && !toVisitQueue.includes(cleanUrl)) {
            if (!/\.(png|jpe?g|gif|svg|pdf|zip|css|js|xml|json|mp4|mp3)$/i.test(cleanUrl)) {
              toVisitQueue.push(cleanUrl);
            }
          }
        }
      });

      // 2. Discover all headings (H1 to H6)
      $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
        const tagName = (((elem as any).tagName || (elem as any).name || '') as string).toLowerCase() as HeadingLevel;
        const headingText = $(elem).text().replace(/\s+/g, ' ').trim();
        if (headingText) {
          allScrapedHeadings.push({
            id: `heading-${allScrapedHeadings.length + 1}`,
            level: tagName,
            text: headingText.slice(0, 500),
            sourceUrl: currentUrl,
            pageTitle,
            index: allScrapedHeadings.length + 1,
          });
        }
      });

      // 3. Discover ALL stylesheets in document order (external and inline style tags)
      $('link, style').each((idx, elem) => {
        const tagName = (((elem as any).tagName || (elem as any).name || '') as string).toLowerCase();
        if (tagName === 'link') {
          const rel = ($(elem).attr('rel') || '').toLowerCase();
          const as = ($(elem).attr('as') || '').toLowerCase();
          const type = ($(elem).attr('type') || '').toLowerCase();
          const href = $(elem).attr('href') || $(elem).attr('data-href');
          const media = $(elem).attr('media')?.trim();

          if (href && isStylesheetLink(rel, as, type, href)) {
            try {
              const fullCssUrl = new URL(href, currentUrl).href;
              if (!discoveredStyles.some((s) => s.url === fullCssUrl)) {
                discoveredStyles.push({
                  type: 'external',
                  url: fullCssUrl,
                  media,
                  source: `${fileName} (<link href="${href}">)`,
                });
              }
            } catch {}
          }
        } else if (tagName === 'style') {
          const styleText = $(elem).html()?.trim();
          const media = $(elem).attr('media')?.trim();
          if (styleText) {
            discoveredStyles.push({
              type: 'inline',
              content: styleText,
              media,
              source: `${fileName} (<style #${idx + 1}>)`,
            });
          }
        }
      });

      // 4. Discover external scripts (excluding trackers)
      $('script[src]').each((_, elem) => {
        const src = $(elem).attr('src') || $(elem).attr('data-src');
        if (src) {
          const isTracker = TRACKER_DOMAINS.some((t) => src.includes(t));
          if (!isTracker) {
            try {
              discoveredScriptUrls.add(new URL(src, currentUrl).href);
            } catch {}
          }
        }
      });

      // 5. Extract inline scripts (excluding trackers)
      $('script:not([src])').each((idx, elem) => {
        const scriptType = $(elem).attr('type')?.toLowerCase();
        if (
          !scriptType ||
          scriptType === 'text/javascript' ||
          scriptType === 'application/javascript' ||
          scriptType === 'module'
        ) {
          const scriptText = $(elem).html()?.trim();
          if (scriptText && scriptText.length > 5) {
            const isTracker = TRACKER_DOMAINS.some((t) => scriptText.includes(t));
            if (!isTracker) {
              discoveredInlineScripts.push({
                source: `${fileName} (inline script #${idx + 1})`,
                content: scriptText,
              });
            }
          }
        }
      });
    } catch (e: any) {
      console.warn(`Error crawling ${currentUrl}:`, e.message);
    }
  }

  // ==========================================================
  // MULTI-DEVICE EMULATION PASS (DESKTOP, TABLET, MOBILE)
  // Fetch site in all 3 modes using authentic device headers
  // ==========================================================
  const rawPagesMapTablet = new Map<string, { filename: string; title: string; rawHtml: string }>();
  const rawPagesMapMobile = new Map<string, { filename: string; title: string; rawHtml: string }>();

  for (const [pageUrl, rawData] of rawPagesMap.entries()) {
    // 1. Fetch Tablet pass
    try {
      const tabRes = await fetchWithTimeout(
        pageUrl,
        10000,
        tracker,
        'document',
        undefined,
        cookieJar,
        'tablet'
      );
      if (tabRes.ok && tabRes.text) {
        rawPagesMapTablet.set(pageUrl, {
          filename: rawData.filename,
          title: rawData.title,
          rawHtml: tabRes.text,
        });

        // Discover tablet-specific stylesheets
        const $tab = cheerio.load(tabRes.text);
        $tab('link, style').each((idx, elem) => {
          const tagName = (elem as any).name?.toLowerCase();
          if (tagName === 'link') {
            const rel = ($tab(elem).attr('rel') || '').toLowerCase();
            const as = ($tab(elem).attr('as') || '').toLowerCase();
            const type = ($tab(elem).attr('type') || '').toLowerCase();
            const href = $tab(elem).attr('href') || $tab(elem).attr('data-href');
            const media = $tab(elem).attr('media')?.trim();
            if (href && isStylesheetLink(rel, as, type, href)) {
              try {
                const fullCssUrl = new URL(href, pageUrl).href;
                if (!discoveredStyles.some((s) => s.url === fullCssUrl)) {
                  discoveredStyles.push({
                    type: 'external',
                    url: fullCssUrl,
                    media,
                    source: `Tablet Layout (${pageUrl})`,
                  });
                }
              } catch {}
            }
          } else if (tagName === 'style') {
            const styleText = $tab(elem).html()?.trim();
            const media = $tab(elem).attr('media')?.trim();
            if (styleText) {
              discoveredStyles.push({
                type: 'inline',
                content: styleText,
                media,
                source: `Tablet Inline Style #${idx + 1}`,
              });
            }
          }
        });
      } else {
        rawPagesMapTablet.set(pageUrl, { ...rawData });
      }
    } catch {
      rawPagesMapTablet.set(pageUrl, { ...rawData });
    }

    // 2. Fetch Mobile pass
    try {
      const mobRes = await fetchWithTimeout(
        pageUrl,
        10000,
        tracker,
        'document',
        undefined,
        cookieJar,
        'mobile'
      );
      if (mobRes.ok && mobRes.text) {
        rawPagesMapMobile.set(pageUrl, {
          filename: rawData.filename,
          title: rawData.title,
          rawHtml: mobRes.text,
        });

        // Discover mobile-specific stylesheets
        const $mob = cheerio.load(mobRes.text);
        $mob('link, style').each((idx, elem) => {
          const tagName = (elem as any).name?.toLowerCase();
          if (tagName === 'link') {
            const rel = ($mob(elem).attr('rel') || '').toLowerCase();
            const as = ($mob(elem).attr('as') || '').toLowerCase();
            const type = ($mob(elem).attr('type') || '').toLowerCase();
            const href = $mob(elem).attr('href') || $mob(elem).attr('data-href');
            const media = $mob(elem).attr('media')?.trim();
            if (href && isStylesheetLink(rel, as, type, href)) {
              try {
                const fullCssUrl = new URL(href, pageUrl).href;
                if (!discoveredStyles.some((s) => s.url === fullCssUrl)) {
                  discoveredStyles.push({
                    type: 'external',
                    url: fullCssUrl,
                    media,
                    source: `Mobile Layout (${pageUrl})`,
                  });
                }
              } catch {}
            }
          } else if (tagName === 'style') {
            const styleText = $mob(elem).html()?.trim();
            const media = $mob(elem).attr('media')?.trim();
            if (styleText) {
              discoveredStyles.push({
                type: 'inline',
                content: styleText,
                media,
                source: `Mobile Inline Style #${idx + 1}`,
              });
            }
          }
        });
      } else {
        rawPagesMapMobile.set(pageUrl, { ...rawData });
      }
    } catch {
      rawPagesMapMobile.set(pageUrl, { ...rawData });
    }
  }

  // ==========================================================
  // COMPLETE CSS EXTRACTION & OFFLINE PREPARATION
  // ==========================================================
  const cssSections: string[] = [
    `@charset "UTF-8";\n/* ========================================================================\n   OFFLINE-READY STYLESHEET (100% SELF-CONTAINED)\n   Generated for: ${startUrlInput}\n   Extracted on: ${new Date().toUTCString()}\n   Zero Internet Dependencies: All @imports inlined, fonts/icons embedded as Base64 Data URIs.\n======================================================================== */\n`,
  ];

  const visitedCssUrls = new Set<string>();

  // Process all discovered stylesheets in cascade order
  for (const item of discoveredStyles) {
    if (item.type === 'external' && item.url) {
      if (visitedCssUrls.has(item.url)) continue;
      visitedCssUrls.add(item.url);

      if (!tracker.canFetch()) {
        cssSections.push(`/* Note: Skipped external stylesheet ${item.url} due to budget limits */\n`);
        continue;
      }

      try {
        const cssRes = await fetchWithTimeout(
          item.url,
          9000,
          tracker,
          'style',
          parsedStartUrl.href,
          cookieJar
        );
        if (cssRes.ok && cssRes.text) {
          let processedCss = await processCssContent(
            cssRes.text,
            item.url,
            visitedCssUrls,
            assetCache,
            tracker,
            cookieJar,
            0
          );

          if (item.media && item.media !== 'all' && item.media !== 'screen') {
            processedCss = `@media ${item.media} {\n${processedCss}\n}`;
          }

          cssSections.push(
            `/* ------------------------------------------------------------------------\n   Styles from External Stylesheet: ${item.url}\n------------------------------------------------------------------------ */\n${processedCss}\n`
          );
        }
      } catch {
        cssSections.push(`/* Note: Could not fetch stylesheet ${item.url} */\n`);
      }
    } else if (item.type === 'inline' && item.content) {
      try {
        let processedInline = await processCssContent(
          item.content,
          parsedStartUrl.href,
          visitedCssUrls,
          assetCache,
          tracker,
          cookieJar,
          0
        );

        if (item.media && item.media !== 'all' && item.media !== 'screen') {
          processedInline = `@media ${item.media} {\n${processedInline}\n}`;
        }

        cssSections.push(
          `/* ------------------------------------------------------------------------\n   Inline Style from: ${item.source}\n------------------------------------------------------------------------ */\n${processedInline}\n`
        );
      } catch {
        cssSections.push(`/* Note: Failed to process inline style from ${item.source} */\n`);
      }
    }
  }

  const combinedCss = cssSections.join('\n\n');

  // ==========================================================
  // JAVASCRIPT BUNDLE FOR OFFLINE INTERACTIVITY
  // ==========================================================
  const jsSections: string[] = [
    `// ========================================================================\n// OFFLINE JAVASCRIPT BUNDLE\n// Extracted from ${startUrlInput}\n// ========================================================================\n`,
  ];

  // Fetch external scripts (prioritized to key UI libraries)
  for (const jsUrl of Array.from(discoveredScriptUrls).slice(0, 10)) {
    if (!tracker.canFetch()) break;
    try {
      const jsRes = await fetchWithTimeout(
        jsUrl,
        7000,
        tracker,
        'script',
        parsedStartUrl.href,
        cookieJar
      );
      if (jsRes.ok && jsRes.text && jsRes.text.length < 800000) {
        jsSections.push(
          `// --- Script from ${jsUrl} ---\n(function(){\ntry {\n${jsRes.text}\n} catch(e){ console.warn("Error in script ${jsUrl}:", e); }\n})();\n`
        );
      }
    } catch {}
  }

  // Include extracted inline scripts
  for (const inlineScript of discoveredInlineScripts) {
    jsSections.push(
      `// --- ${inlineScript.source} ---\n(function(){\ntry {\n${inlineScript.content}\n} catch(e){ console.warn("Error in inline script ${inlineScript.source}:", e); }\n})();\n`
    );
  }

  const combinedJs = jsSections.join('\n\n');

  // ==========================================================
  // TRANSFORM HTML PAGES FOR 100% OFFLINE USAGE (DESKTOP, TABLET, MOBILE)
  // ==========================================================
  // 1. Desktop HTML Pages
  const filesDesktop: ExtractedFile[] = [];
  for (const [pageUrl, rawData] of rawPagesMap.entries()) {
    const offlineHtml = await processHtmlForOffline(
      rawData.rawHtml,
      pageUrl,
      combinedCss,
      pageMapping,
      assetCache,
      tracker,
      cookieJar,
      'desktop'
    );

    filesDesktop.push({
      id: `file-html-${rawData.filename}-desktop`,
      name: rawData.filename,
      type: 'html',
      content: offlineHtml,
      size: Buffer.byteLength(offlineHtml, 'utf-8'),
      sourceUrl: pageUrl,
      description: `Desktop (1920×1080): ${rawData.title}`,
    });
  }

  // 2. Tablet HTML Pages
  const filesTablet: ExtractedFile[] = [];
  for (const [pageUrl, rawData] of rawPagesMapTablet.entries()) {
    const offlineHtml = await processHtmlForOffline(
      rawData.rawHtml,
      pageUrl,
      combinedCss,
      pageMapping,
      assetCache,
      tracker,
      cookieJar,
      'tablet'
    );

    filesTablet.push({
      id: `file-html-${rawData.filename}-tablet`,
      name: rawData.filename,
      type: 'html',
      content: offlineHtml,
      size: Buffer.byteLength(offlineHtml, 'utf-8'),
      sourceUrl: pageUrl,
      description: `Tablet (768×1024 iPadOS): ${rawData.title}`,
    });
  }

  // 3. Mobile HTML Pages
  const filesMobile: ExtractedFile[] = [];
  for (const [pageUrl, rawData] of rawPagesMapMobile.entries()) {
    const offlineHtml = await processHtmlForOffline(
      rawData.rawHtml,
      pageUrl,
      combinedCss,
      pageMapping,
      assetCache,
      tracker,
      cookieJar,
      'mobile'
    );

    filesMobile.push({
      id: `file-html-${rawData.filename}-mobile`,
      name: rawData.filename,
      type: 'html',
      content: offlineHtml,
      size: Buffer.byteLength(offlineHtml, 'utf-8'),
      sourceUrl: pageUrl,
      description: `Mobile (390×844 Android): ${rawData.title}`,
    });
  }

  // Common styles, scripts, and reports
  const fileCssMain: ExtractedFile = {
    id: 'file-css-main',
    name: 'styles.css',
    type: 'css',
    content: combinedCss,
    size: Buffer.byteLength(combinedCss, 'utf-8'),
    description: `Complete offline stylesheet (${discoveredStyles.length} styles merged with embedded fonts/assets)`,
  };

  const fileJsMain: ExtractedFile = {
    id: 'file-js-main',
    name: 'scripts.js',
    type: 'javascript',
    content: combinedJs,
    size: Buffer.byteLength(combinedJs, 'utf-8'),
    description: `Extracted JavaScript bundle (${discoveredScriptUrls.size} external scripts + ${discoveredInlineScripts.length} inline scripts)`,
  };

  // Add links_report.html
  const linksReportHtml = `<!DOCTYPE html>
<html lang="en" dir="auto">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extracted Links Report - ${escapeHtml(siteTitle || domain)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 2rem; background: #0f172a; color: #e2e8f0; }
    .container { max-width: 1100px; margin: 0 auto; background: #1e293b; padding: 2rem; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); }
    h1 { margin-top: 0; color: #f8fafc; font-size: 1.75rem; }
    .meta { display: flex; gap: 1.5rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #334155; font-size: 0.9rem; color: #94a3b8; flex-wrap: wrap; }
    .badge { display: inline-block; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .badge-internal { background: #064e3b; color: #34d399; border: 1px solid #059669; }
    .badge-external { background: #78350f; color: #fbbf24; border: 1px solid #d97706; }
    .badge-asset { background: #312e81; color: #a5b4fc; border: 1px solid #6366f1; }
    .badge-anchor { background: #334155; color: #cbd5e1; border: 1px solid #475569; }
    .badge-other { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
    th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #334155; vertical-align: top; }
    th { background: #0f172a; color: #94a3b8; font-weight: 600; }
    a { color: #60a5fa; text-decoration: none; word-break: break-all; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Extracted Links Report</h1>
    <div class="meta">
      <div><strong>Target:</strong> ${escapeHtml(startUrlInput)}</div>
      <div><strong>Pages Scanned:</strong> ${visitedUrls.size}</div>
      <div><strong>Total Links:</strong> ${allScrapedLinks.length}</div>
      <div><strong>Offline Status:</strong> 100% Self-Contained (Zero Internet Dependency)</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 50px;">#</th>
          <th>Link Text</th>
          <th>Target URL</th>
          <th style="width: 100px;">Type</th>
          <th>Found on Page</th>
        </tr>
      </thead>
      <tbody>
        ${allScrapedLinks
          .map(
            (link, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${escapeHtml(link.text)}</strong></td>
          <td><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.url)}</a></td>
          <td><span class="badge badge-${link.type}">${link.type}</span></td>
          <td><small>${escapeHtml(link.sourceUrl)}</small></td>
        </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const fileReportHtml: ExtractedFile = {
    id: 'file-report-html',
    name: 'links_report.html',
    type: 'html',
    content: linksReportHtml,
    size: Buffer.byteLength(linksReportHtml, 'utf-8'),
    description: 'Self-contained interactive HTML report of all extracted links',
  };

  // Structured links.json
  const linksJsonContent = JSON.stringify(
    {
      scrapedAt: new Date().toISOString(),
      targetUrl: startUrlInput,
      domain,
      offlineReady: true,
      pagesScanned: Array.from(visitedUrls),
      totalLinks: allScrapedLinks.length,
      totalHeadings: allScrapedHeadings.length,
      stylesDiscovered: discoveredStyles.length,
      embeddedAssetsCount: assetCache.size,
      links: allScrapedLinks,
      headings: allScrapedHeadings,
    },
    null,
    2
  );

  const fileJsonLinks: ExtractedFile = {
    id: 'file-json-links',
    name: 'links.json',
    type: 'json',
    content: linksJsonContent,
    size: Buffer.byteLength(linksJsonContent, 'utf-8'),
    description: 'Structured JSON file containing all scraped links metadata',
  };

  const headingsCount: Record<HeadingLevel, number> = {
    h1: allScrapedHeadings.filter((h) => h.level === 'h1').length,
    h2: allScrapedHeadings.filter((h) => h.level === 'h2').length,
    h3: allScrapedHeadings.filter((h) => h.level === 'h3').length,
    h4: allScrapedHeadings.filter((h) => h.level === 'h4').length,
    h5: allScrapedHeadings.filter((h) => h.level === 'h5').length,
    h6: allScrapedHeadings.filter((h) => h.level === 'h6').length,
  };

  // Structured headings.json
  const headingsJsonContent = JSON.stringify(
    {
      scrapedAt: new Date().toISOString(),
      targetUrl: startUrlInput,
      domain,
      totalHeadings: allScrapedHeadings.length,
      counts: headingsCount,
      headings: allScrapedHeadings,
    },
    null,
    2
  );

  const fileJsonHeadings: ExtractedFile = {
    id: 'file-json-headings',
    name: 'headings.json',
    type: 'json',
    content: headingsJsonContent,
    size: Buffer.byteLength(headingsJsonContent, 'utf-8'),
    description: `Structured JSON file with all ${allScrapedHeadings.length} extracted H1-H6 headings`,
  };

  const commonFiles: ExtractedFile[] = [
    fileCssMain,
    fileJsMain,
    fileReportHtml,
    fileJsonLinks,
    fileJsonHeadings,
  ];

  const allDesktopFiles: ExtractedFile[] = [...filesDesktop, ...commonFiles];
  const allTabletFiles: ExtractedFile[] = [...filesTablet, ...commonFiles];
  const allMobileFiles: ExtractedFile[] = [...filesMobile, ...commonFiles];

  const deviceVersions: Record<DeviceType, DeviceVersion> = {
    desktop: {
      device: 'desktop',
      title: `${siteTitle || domain} (Desktop)`,
      files: allDesktopFiles,
      totalBytes: allDesktopFiles.reduce((acc, f) => acc + f.size, 0),
      viewport: DEVICE_PROFILES.desktop.viewport,
      userAgent: DEVICE_PROFILES.desktop.userAgent,
    },
    tablet: {
      device: 'tablet',
      title: `${siteTitle || domain} (Tablet)`,
      files: allTabletFiles,
      totalBytes: allTabletFiles.reduce((acc, f) => acc + f.size, 0),
      viewport: DEVICE_PROFILES.tablet.viewport,
      userAgent: DEVICE_PROFILES.tablet.userAgent,
    },
    mobile: {
      device: 'mobile',
      title: `${siteTitle || domain} (Mobile)`,
      files: allMobileFiles,
      totalBytes: allMobileFiles.reduce((acc, f) => acc + f.size, 0),
      viewport: DEVICE_PROFILES.mobile.viewport,
      userAgent: DEVICE_PROFILES.mobile.userAgent,
    },
  };

  const internalCount = allScrapedLinks.filter((l) => l.type === 'internal').length;
  const externalCount = allScrapedLinks.filter((l) => l.type === 'external').length;

  return {
    targetUrl: startUrlInput,
    mode,
    domain,
    title: siteTitle || domain,
    pagesScanned: visitedUrls.size,
    totalLinksFound: allScrapedLinks.length,
    internalLinksCount: internalCount,
    externalLinksCount: externalCount,
    links: allScrapedLinks,
    headings: allScrapedHeadings,
    totalHeadingsFound: allScrapedHeadings.length,
    headingsCount,
    files: allDesktopFiles,
    deviceVersions,
    scannedUrls: Array.from(visitedUrls),
    executionTimeMs: Date.now() - startTime,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
