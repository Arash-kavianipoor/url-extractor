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
  DeviceProfileInfo,
  DeviceComparison,
} from '../src/types.js';

// Realistic Device Profiles for authentic 3-way Browser Emulation
export const DEVICE_PROFILES: Record<DeviceType, DeviceProfileInfo> = {
  desktop: {
    name: 'Desktop',
    nameFa: 'دسکتاپ (ویندوز / مک / لینوکس)',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    secChUa: '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    secChUaMobile: '?0',
    secChUaPlatform: '"Windows"',
    secChUaPlatformVersion: '"15.0.0"',
    viewport: 'width=device-width, initial-scale=1.0',
    resolution: '1920×1080',
    previewWidth: 1280,
    previewHeight: 800,
    dpr: 1,
  },
  tablet: {
    name: 'Tablet',
    nameFa: 'تبلت (آیپد / تبلت اندروید)',
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    secChUa: '"Not(A:Brand";v="99", "Apple Safari";v="17", "WebKit";v="605"',
    secChUaMobile: '?1',
    secChUaPlatform: '"macOS"',
    secChUaPlatformVersion: '"17.4.0"',
    viewport: 'width=768, initial-scale=1.0, maximum-scale=2.0',
    resolution: '768×1024',
    previewWidth: 768,
    previewHeight: 1024,
    dpr: 2,
  },
  mobile: {
    name: 'Mobile',
    nameFa: 'موبایل هوشمند (اندروید / iOS)',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
    secChUa: '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    secChUaMobile: '?1',
    secChUaPlatform: '"Android"',
    secChUaPlatformVersion: '"14.0.0"',
    secChUaModel: '"Pixel 8"',
    viewport: 'width=390, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes',
    resolution: '390×844',
    previewWidth: 390,
    previewHeight: 844,
    dpr: 3,
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
    'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-Ch-Ua': profile.secChUa,
    'Sec-Ch-Ua-Mobile': profile.secChUaMobile,
    'Sec-Ch-Ua-Platform': profile.secChUaPlatform,
  };

  if (profile.secChUaPlatformVersion) {
    headers['Sec-Ch-Ua-Platform-Version'] = profile.secChUaPlatformVersion;
  }
  if (profile.secChUaModel) {
    headers['Sec-Ch-Ua-Model'] = profile.secChUaModel;
  }
  headers['Sec-Ch-Viewport-Width'] = String(profile.previewWidth);
  headers['Sec-Ch-Dpr'] = String(profile.dpr);
  headers['Sec-Ch-Ua-Form-Factors'] =
    device === 'desktop' ? '"Desktop"' : device === 'tablet' ? '"Tablet"' : '"Mobile"';

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
 * Generates an ultra-lightweight, 100% offline self-contained SVG fallback image
 * so no broken image icons or remote HTTP requests appear when offline.
 */
function generateOfflineImageFallback(alt = '', width = 400, height = 260): string {
  const cleanAlt = (alt || 'Offline Visual Asset').slice(0, 45).replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#1e293b"/>
  <rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="6,4"/>
  <g fill="#64748b">
    <circle cx="${Math.round(width / 2)}" cy="${Math.round(height / 2) - 14}" r="16" fill="#334155"/>
    <path d="M${Math.round(width / 2) - 28} ${Math.round(height / 2) + 22} L${Math.round(width / 2)} ${Math.round(height / 2) - 6} L${Math.round(width / 2) + 28} ${Math.round(height / 2) + 22} Z" fill="#475569"/>
  </g>
  <text x="50%" y="${Math.round(height / 2) + 42}" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" text-anchor="middle">${cleanAlt}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * The Offline Air-gap Runtime Shield:
 * Injected at the top of <head> to silently intercept and mock all runtime fetch,
 * XMLHttpRequest, WebSocket, and EventSource calls, preventing unhandled network
 * errors and keeping menus, modals, and tabs responsive without an active internet connection.
 */
function getOfflineRuntimeShield(): string {
  return `  <script id="offline-airgap-shield">
/* ========================================================================
   OFFLINE AIR-GAP RUNTIME SHIELD & ZERO-NETWORK MOCK ENGINE
   - Intercepts and safely resolves fetch & XMLHttpRequest to prevent crashes
   - Universal CMS/Framework stubs (WordPress, Elementor, Analytics)
   - Universal jQuery shim & callback queue for zero reference errors
   - Dynamic script element neutralizer (blocks remote script injection)
   - Stubs WebSocket and EventSource gracefully
   - Suppresses unhandled network rejection errors
   - Rescues broken runtime images with zero external dependencies
======================================================================== */
(function() {
  'use strict';

  // 1. Silent Safe Mock for fetch API
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) ? input.url : '';
    if (url.startsWith('data:') || url.startsWith('blob:') || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//'))) {
      if (origFetch) {
        return origFetch(input, init).catch(function() {
          return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
        });
      }
    }
    return Promise.resolve(new Response('{}', {
      status: 200,
      statusText: 'OK (Air-Gapped Offline Mode)',
      headers: { 'Content-Type': 'application/json' }
    }));
  };

  // 2. Silent Safe Mock for XMLHttpRequest
  var origXHR = window.XMLHttpRequest;
  if (origXHR) {
    var origOpen = origXHR.prototype.open;
    var origSend = origXHR.prototype.send;
    origXHR.prototype.open = function(method, url) {
      this._url = url;
      this._isRemote = typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'));
      try {
        return origOpen.apply(this, arguments);
      } catch (e) {}
    };
    origXHR.prototype.send = function(data) {
      if (this._isRemote) {
        var self = this;
        setTimeout(function() {
          try {
            Object.defineProperty(self, 'readyState', { value: 4, writable: true });
            Object.defineProperty(self, 'status', { value: 200, writable: true });
            Object.defineProperty(self, 'statusText', { value: 'OK (Offline)', writable: true });
            Object.defineProperty(self, 'responseText', { value: '{}', writable: true });
            Object.defineProperty(self, 'response', { value: '{}', writable: true });
            if (typeof self.onreadystatechange === 'function') self.onreadystatechange();
            if (typeof self.onload === 'function') self.onload();
          } catch (e) {}
        }, 10);
        return;
      }
      try {
        return origSend.apply(this, arguments);
      } catch (e) {
        var self = this;
        setTimeout(function() {
          if (typeof self.onload === 'function') self.onload();
        }, 10);
      }
    };
  }

  // 3. Dynamic Script Element Neutralizer: blocks dynamic remote script tags from trying to load offline
  var origCreateElement = document.createElement;
  document.createElement = function(tagName, options) {
    var elem = origCreateElement.call(document, tagName, options);
    if (tagName && String(tagName).toLowerCase() === 'script') {
      var origSetAttr = elem.setAttribute;
      elem.setAttribute = function(name, val) {
        if (name && name.toLowerCase() === 'src' && typeof val === 'string' && (val.indexOf('//') !== -1 || val.indexOf('http') === 0)) {
          return origSetAttr.call(elem, 'data-blocked-offline-src', val);
        }
        return origSetAttr.call(elem, name, val);
      };
    }
    return elem;
  };

  // 4. Universal CMS and Framework Stubs (WP, Elementor, Analytics, GTag)
  window.wp = window.wp || {};
  window.wp.i18n = window.wp.i18n || {
    setLocaleData: function() {},
    __: function(s) { return s; },
    _x: function(s) { return s; },
    _n: function(s, p, n) { return n === 1 ? s : p; },
    isRtl: function() { return true; }
  };
  window.wp.hooks = window.wp.hooks || {
    addAction: function() {},
    doAction: function() {},
    addFilter: function() {},
    applyFilters: function(hook, val) { return val; },
    removeAction: function() {},
    removeFilter: function() {}
  };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function() {};
  window.fbq = window.fbq || function() {};
  window.ga = window.ga || function() {};
  window.elementorFrontendConfig = window.elementorFrontendConfig || {};
  window.ElementorProFrontendConfig = window.ElementorProFrontendConfig || {};

  // 5. Universal jQuery Shim & Callback Queue
  // If inline scripts parse before jQuery is initialized, queue callbacks safely without throwing ReferenceError
  if (typeof window.jQuery === 'undefined' && typeof window.$ === 'undefined') {
    var _jqQ = [];
    var jqStub = function(arg) {
      if (typeof arg === 'function') {
        if (document.readyState === 'complete') {
          setTimeout(function() { try { if (window.jQuery && window.jQuery !== jqStub) window.jQuery(arg); else arg(jqStub); } catch(e){} }, 1);
        } else {
          _jqQ.push(arg);
        }
        return jqStub;
      }
      var dummy = {
        length: 0,
        on: function() { return dummy; },
        off: function() { return dummy; },
        bind: function() { return dummy; },
        unbind: function() { return dummy; },
        ready: function(fn) { jqStub(fn); return dummy; },
        hide: function() { return dummy; },
        show: function() { return dummy; },
        css: function() { return dummy; },
        attr: function() { return ''; },
        addClass: function() { return dummy; },
        removeClass: function() { return dummy; },
        find: function() { return dummy; },
        each: function() { return dummy; },
        val: function() { return ''; },
        html: function() { return ''; },
        text: function() { return ''; },
        trigger: function() { return dummy; }
      };
      return dummy;
    };
    jqStub.fn = jqStub.prototype = {};
    jqStub.ready = function(fn) { jqStub(fn); };
    jqStub.ajax = function() { return Promise.resolve({}); };
    jqStub.extend = function() {
      var t = arguments[0] || {};
      for (var i = 1; i < arguments.length; i++) {
        var s = arguments[i];
        if (s) for (var k in s) t[k] = s[k];
      }
      return t;
    };
    window.jQuery = window.$ = jqStub;
    window.__flushJqQueue = function() {
      var realJq = window.jQuery;
      while (_jqQ.length) {
        var fn = _jqQ.shift();
        try { if (realJq && realJq !== jqStub) realJq(fn); else fn(realJq); } catch(e) {}
      }
    };
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        if (typeof window.__flushJqQueue === 'function') window.__flushJqQueue();
      }, 50);
    });
  }

  // 6. Prevent WebSocket / EventSource runtime crashes
  if (typeof window.WebSocket !== 'undefined') {
    try {
      window.WebSocket = function() {
        return {
          send: function() {},
          close: function() {},
          addEventListener: function() {},
          removeEventListener: function() {},
          readyState: 3
        };
      };
    } catch(e) {}
  }
  if (typeof window.EventSource !== 'undefined') {
    try {
      window.EventSource = function() {
        return {
          close: function() {},
          addEventListener: function() {},
          removeEventListener: function() {},
          readyState: 2
        };
      };
    } catch(e) {}
  }

  // 7. Runtime broken image fallback & script error suppressor
  window.addEventListener('error', function(e) {
    if (e && e.target && e.target.tagName === 'SCRIPT') {
      e.preventDefault();
      return;
    }
    if (e && e.target && e.target.tagName === 'IMG') {
      var img = e.target;
      if (!img.getAttribute('data-offline-rescued')) {
        img.setAttribute('data-offline-rescued', 'true');
        img.src = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22180%22%20viewBox%3D%220%200%20300%20180%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%231e293b%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2213%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EOffline%20Asset%3C%2Ftext%3E%3C%2Fsvg%3E';
      }
    }
  }, true);

  // 8. Suppress Unhandled Rejection caused by offline network drops
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && (event.reason.name === 'TypeError' || String(event.reason).includes('fetch') || String(event.reason).includes('Network'))) {
      event.preventDefault();
    }
  });
})();
  </script>\n`;
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

  // Sort distinct assets: prioritize webfonts first, then embeddable images
  distinctAssetPaths.sort((a, b) => {
    const aIsFont = /\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(a);
    const bIsFont = /\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(b);
    if (aIsFont && !bIsFont) return -1;
    if (!aIsFont && bIsFont) return 1;
    return 0;
  });

  // Pre-fetch key fonts and images with concurrency pooling (up to 40 priority assets)
  await runWithConcurrency(distinctAssetPaths.slice(0, 40), 8, async (assetPath) => {
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
            2400,
            tracker,
            cssBaseUrl,
            cookieJar,
            isFont ? 'font' : 'image'
          );
          if (binary && binary.buffer.byteLength <= 3 * 1024 * 1024) {
            const b64 = binary.buffer.toString('base64');
            const dataUri = `data:${binary.mimeType};base64,${b64}`;
            assetCache.set(resolvedAssetUrl, dataUri);
          }
        }
      }
    } catch {}
  });

  // 3. Single-pass URL rewriting: replace with Base64 Data URI or keep valid resolved URL
  processed = processed.replace(
    /url\(\s*(['"]?)([^'"()]+)\1\s*\)/gi,
    (fullMatch, _quote, rawUrl) => {
      const trimmed = (rawUrl || '').trim();
      if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('#') || trimmed.startsWith('blob:')) {
        return fullMatch;
      }
      try {
        const resolved = new URL(trimmed, cssBaseUrl).href;
        const cached = assetCache.get(resolved);
        if (cached) {
          return `url("${cached}")`;
        }
        // Always preserve syntactically valid resolved absolute URL (never output illegal local("sans-serif"))
        return `url("${resolved}")`;
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
  device: DeviceType = 'desktop',
  combinedJs = '',
  isStandalone = false
): Promise<string> {
  const $ = cheerio.load(rawHtml);

  // Remove <base> tag to allow local file:/// resolution
  $('base').remove();

  // Remove ALL remote stylesheet links and remote preconnect/dns-prefetch/preload links
  $('link').each((_, elem) => {
    const rel = ($(elem).attr('rel') || '').toLowerCase();
    const as = ($(elem).attr('as') || '').toLowerCase();
    const type = ($(elem).attr('type') || '').toLowerCase();
    const href = $(elem).attr('href') || $(elem).attr('data-href') || '';

    if (isStylesheetLink(rel, as, type, href)) {
      $(elem).remove();
      return;
    }

    if (
      ['preconnect', 'dns-prefetch', 'preload', 'prerender', 'prefetch', 'subresource'].includes(rel)
    ) {
      $(elem).remove();
      return;
    }
  });

  // Clean out analytics, tracking scripts, and remove remote/relative <script src="..."> tags
  // because remote scripts stall or fail in offline mode (their content is already compiled in scripts.js)
  $('script').each((_, elem) => {
    const src = $(elem).attr('src') || $(elem).attr('data-src') || '';
    const content = $(elem).html() || '';
    const isTracker = TRACKER_DOMAINS.some(
      (trackerDomain) => src.includes(trackerDomain) || content.includes(trackerDomain)
    );
    if (isTracker) {
      $(elem).remove();
      return;
    }

    // Strip WordPress emoji script and third-party trackers
    if (
      content.includes('_wpemojiSettings') ||
      content.includes('wp-emoji-loader') ||
      content.includes('gtag(') ||
      content.includes('google-analytics') ||
      content.includes('fbq(') ||
      content.includes('beacon.min.js')
    ) {
      $(elem).remove();
      return;
    }

    // Remove any external or relative script tag because its code is in scripts.js
    if (
      src &&
      (src.startsWith('http://') ||
        src.startsWith('https://') ||
        src.startsWith('//') ||
        src.startsWith('/') ||
        src.includes('.js'))
    ) {
      $(elem).remove();
      return;
    }

    // Clean integrity / crossorigin attributes that can trigger SRI hash mismatches offline
    $(elem).removeAttr('integrity');
    $(elem).removeAttr('crossorigin');
  });

  // Neutralize remote iframes (e.g. YouTube, Maps) so no grey "No Internet" iframe error shows up
  $('iframe').each((_, elem) => {
    const src = $(elem).attr('src') || '';
    if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//'))) {
      $(elem).replaceWith(
        '<div style="background:#1e293b; color:#94a3b8; border:1px dashed #334155; border-radius:8px; padding:1.2rem; text-align:center; font-family:sans-serif; font-size:12px; margin:0.8rem 0;">📦 Embedded Widget (Safely neutralized for 100% offline viewing)</div>'
      );
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

      // If no cached Data URI, generate a clean, completely self-contained SVG fallback Data URI
      // so zero network requests are made offline and no broken icon boxes appear
      if (!finalSrc && target.urlCandidates.length > 0) {
        const alt = $elem.attr('alt') || '';
        const width = parseInt($elem.attr('width') || '', 10) || 400;
        const height = parseInt($elem.attr('height') || '', 10) || 260;
        finalSrc = generateOfflineImageFallback(alt, Math.min(width, 800), Math.min(height, 500));
      } else if (!finalSrc) {
        finalSrc = generateOfflineImageFallback($elem.attr('alt') || '', 400, 260);
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
          const cached = assetCache.get(resolved);
          $elem.attr('srcset', cached || generateOfflineImageFallback('', 400, 260));
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
            const replacement = assetCache.get(resolved);
            if (replacement) return `url("${replacement}")`;
            return `url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%2F%3E")`;
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
          const replacement = assetCache.get(resolved);
          if (replacement) {
            currentStyle += `; background-image: url("${replacement}") !important;`;
          }
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
          const replacement = assetCache.get(resolved) || generateOfflineImageFallback('', 200, 200);
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
          const replacement = assetCache.get(resolved) || generateOfflineImageFallback('Video Poster', 480, 270);
          $elem.attr('poster', replacement);
        } catch {}
      }
    } else if (target.type === 'favicon') {
      const first = target.urlCandidates[0];
      if (first) {
        try {
          const resolved = new URL(first, pageUrl).href;
          const replacement = assetCache.get(resolved) || generateOfflineImageFallback('Favicon', 32, 32);
          $elem.attr('href', replacement);
        } catch {}
      }
    }
  }

  // Remove all original document <style> blocks (except SVG defs/styles)
  // because all CSS rules have already been compiled and Base64-inlined into styles.css (or embedded offline style)
  $('head style, body style, :not(svg) > style').remove();

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

  // Inject Offline Air-Gap Runtime Shield at the very top of <head>
  // This mocks window.fetch and XMLHttpRequest to prevent network error exceptions offline.
  $('head').prepend(getOfflineRuntimeShield());

  // Ensure UTF-8 charset and responsive viewport are in <head>
  if ($('meta[charset]').length === 0) {
    $('head').prepend('<meta charset="UTF-8">\n');
  }
  // Ensure device-specific viewport is in <head>
  $('meta[name="viewport"]').remove();
  const profile = DEVICE_PROFILES[device] || DEVICE_PROFILES.desktop;
  $('head').append(`  <meta name="viewport" content="${profile.viewport}">\n`);
  $('head').append(`  <meta name="target-device" content="${device}">\n`);

  // 1. Link to local styles.css and scripts.js in <head> if not in standalone mode
  if (!isStandalone) {
    $('head').append('  <link rel="stylesheet" href="styles.css">\n');
    $('head').append('  <script src="scripts.js"></script>\n');
  } else {
    // 2. In standalone single-file mode, embed the complete CSS and JS directly inside <head>
    const safeCss = combinedCss.replace(/<\/style>/gi, '<\\/style>');
    $('head').append(
      `  <style id="offline-standalone-styles">\n/* =========================================================\n   100% OFFLINE STANDALONE EMBEDDED STYLESHEET\n========================================================= */\n${safeCss}\n  </style>\n`
    );
    if (combinedJs) {
      const safeJs = combinedJs.replace(/<\/script>/gi, '<\\/script>');
      $('head').append(`  <script id="offline-standalone-scripts">\n${safeJs}\n  </script>\n`);
    }
  }

  // Ensure <body> exists
  if ($('body').length === 0) {
    $('html').append('<body></body>');
  }

  let finalHtml = $.html();
  // Strip any leading XML declaration, comments, or whitespace before <!DOCTYPE html>
  finalHtml = finalHtml.replace(/^[\s\S]*?(<!doctype\s+html[^>]*>)/i, '$1');
  // Ensure standard mode doctype is always present
  if (!/^<!doctype\s+html/i.test(finalHtml.trim())) {
    finalHtml = '<!DOCTYPE html>\n' + finalHtml;
  }

  return finalHtml;
}

/**
 * Extracts links from an HTML document string with deduplication
 */
function extractLinksFromHtml(
  html: string,
  currentUrl: string,
  baseOrigin: string,
  devicePrefix = 'link'
): ScrapedLink[] {
  const $ = cheerio.load(html);
  const links: ScrapedLink[] = [];
  const seen = new Set<string>();

  $('a').each((_, elem) => {
    const href = $(elem).attr('href');
    if (!href) return;
    const text =
      $(elem).text().replace(/\s+/g, ' ').trim() ||
      $(elem).attr('title')?.trim() ||
      $(elem).attr('aria-label')?.trim() ||
      '[No anchor text]';
    const { resolvedUrl, type } = classifyLink(href, currentUrl, baseOrigin);
    const key = `${type}:${resolvedUrl}:${text}`;
    if (!seen.has(key)) {
      seen.add(key);
      links.push({
        id: `${devicePrefix}-${links.length + 1}`,
        url: resolvedUrl,
        text: text.slice(0, 200),
        type,
        sourceUrl: currentUrl,
      });
    }
  });
  return links;
}

/**
 * Extracts H1-H6 headings from an HTML document string
 */
function extractHeadingsFromHtml(
  html: string,
  currentUrl: string,
  pageTitle: string,
  devicePrefix = 'heading'
): ScrapedHeading[] {
  const $ = cheerio.load(html);
  const headings: ScrapedHeading[] = [];

  $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
    const tagName = (((elem as any).tagName || (elem as any).name || '') as string).toLowerCase() as HeadingLevel;
    const headingText = $(elem).text().replace(/\s+/g, ' ').trim();
    if (headingText) {
      headings.push({
        id: `${devicePrefix}-${headings.length + 1}`,
        level: tagName,
        text: headingText.slice(0, 500),
        sourceUrl: currentUrl,
        pageTitle,
        index: headings.length + 1,
      });
    }
  });
  return headings;
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

  // Raw extracted lists per device profile
  const desktopLinksRaw: ScrapedLink[] = [];
  const tabletLinksRaw: ScrapedLink[] = [];
  const mobileLinksRaw: ScrapedLink[] = [];

  const desktopHeadingsRaw: ScrapedHeading[] = [];
  const tabletHeadingsRaw: ScrapedHeading[] = [];
  const mobileHeadingsRaw: ScrapedHeading[] = [];

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

      // 1. Discover all links <a> for desktop
      const pageDesktopLinks = extractLinksFromHtml(html, currentUrl, baseOrigin, 'desktop');
      for (const link of pageDesktopLinks) {
        desktopLinksRaw.push(link);
        if (mode === 'all' && link.type === 'internal' && link.url.startsWith(baseOrigin)) {
          const cleanUrl = link.url.split('#')[0];
          if (!visitedUrls.has(cleanUrl) && !toVisitQueue.includes(cleanUrl)) {
            if (!/\.(png|jpe?g|gif|svg|pdf|zip|css|js|xml|json|mp4|mp3)$/i.test(cleanUrl)) {
              toVisitQueue.push(cleanUrl);
            }
          }
        }
      }

      // 2. Discover all headings (H1 to H6) for desktop
      const pageDesktopHeadings = extractHeadingsFromHtml(html, currentUrl, pageTitle, 'desktop');
      for (const h of pageDesktopHeadings) {
        desktopHeadingsRaw.push(h);
      }

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

        // Extract tablet-specific links & headings
        tabletLinksRaw.push(...extractLinksFromHtml(tabRes.text, pageUrl, baseOrigin, 'tablet'));
        tabletHeadingsRaw.push(...extractHeadingsFromHtml(tabRes.text, pageUrl, rawData.title, 'tablet'));

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
        tabletLinksRaw.push(...extractLinksFromHtml(rawData.rawHtml, pageUrl, baseOrigin, 'tablet'));
        tabletHeadingsRaw.push(...extractHeadingsFromHtml(rawData.rawHtml, pageUrl, rawData.title, 'tablet'));
      }
    } catch {
      rawPagesMapTablet.set(pageUrl, { ...rawData });
      tabletLinksRaw.push(...extractLinksFromHtml(rawData.rawHtml, pageUrl, baseOrigin, 'tablet'));
      tabletHeadingsRaw.push(...extractHeadingsFromHtml(rawData.rawHtml, pageUrl, rawData.title, 'tablet'));
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

        // Extract mobile-specific links & headings
        mobileLinksRaw.push(...extractLinksFromHtml(mobRes.text, pageUrl, baseOrigin, 'mobile'));
        mobileHeadingsRaw.push(...extractHeadingsFromHtml(mobRes.text, pageUrl, rawData.title, 'mobile'));

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
        mobileLinksRaw.push(...extractLinksFromHtml(rawData.rawHtml, pageUrl, baseOrigin, 'mobile'));
        mobileHeadingsRaw.push(...extractHeadingsFromHtml(rawData.rawHtml, pageUrl, rawData.title, 'mobile'));
      }
    } catch {
      rawPagesMapMobile.set(pageUrl, { ...rawData });
      mobileLinksRaw.push(...extractLinksFromHtml(rawData.rawHtml, pageUrl, baseOrigin, 'mobile'));
      mobileHeadingsRaw.push(...extractHeadingsFromHtml(rawData.rawHtml, pageUrl, rawData.title, 'mobile'));
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

  // Fetch external scripts prioritized to foundational UI libraries
  const scriptUrlList = Array.from(discoveredScriptUrls).filter((url) => {
    return !TRACKER_DOMAINS.some((t) => url.includes(t));
  });

  // Sort so jQuery and core dependencies run first
  scriptUrlList.sort((a, b) => {
    const aLow = a.toLowerCase();
    const bLow = b.toLowerCase();
    const aScore =
      (aLow.includes('jquery.min') || aLow.includes('jquery-core') ? -20 : 0) +
      (aLow.includes('jquery') ? -10 : 0) +
      (aLow.includes('migrate') ? -8 : 0) +
      (aLow.includes('core') ? -5 : 0) +
      (aLow.includes('hooks') ? -4 : 0) +
      (aLow.includes('i18n') ? -3 : 0);
    const bScore =
      (bLow.includes('jquery.min') || bLow.includes('jquery-core') ? -20 : 0) +
      (bLow.includes('jquery') ? -10 : 0) +
      (bLow.includes('migrate') ? -8 : 0) +
      (bLow.includes('core') ? -5 : 0) +
      (bLow.includes('hooks') ? -4 : 0) +
      (bLow.includes('i18n') ? -3 : 0);
    return aScore - bScore;
  });

  const scriptsToFetch = scriptUrlList.slice(0, 35);
  const fetchedScripts = new Map<string, string>();

  await runWithConcurrency(scriptsToFetch, 6, async (jsUrl) => {
    if (!tracker.canFetch()) return;
    try {
      const jsRes = await fetchWithTimeout(
        jsUrl,
        7000,
        tracker,
        'script',
        parsedStartUrl.href,
        cookieJar
      );
      if (jsRes.ok && jsRes.text && jsRes.text.length < 1500000) {
        fetchedScripts.set(jsUrl, jsRes.text);
      }
    } catch {}
  });

  for (const jsUrl of scriptsToFetch) {
    const code = fetchedScripts.get(jsUrl);
    if (code) {
      jsSections.push(
        `// --- Script from ${jsUrl} ---\ntry {\n${code}\n} catch(e){ console.warn("Offline script note [${jsUrl}]:", e); }\n`
      );
    }
  }

  // Flush any jQuery ready handlers queued by early inline scripts
  jsSections.push(
    `\n// Flush any early-queued jQuery callbacks\nif (typeof window.__flushJqQueue === 'function') {\n  try { window.__flushJqQueue(); } catch(e) {}\n}\n`
  );

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
      'desktop',
      combinedJs,
      false
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

    // Also generate single-file standalone offline version for the main page
    if (rawData.filename === 'index.html' || filesDesktop.length === 1) {
      const standaloneHtml = await processHtmlForOffline(
        rawData.rawHtml,
        pageUrl,
        combinedCss,
        pageMapping,
        assetCache,
        tracker,
        cookieJar,
        'desktop',
        combinedJs,
        true
      );
      filesDesktop.push({
        id: 'file-html-standalone-desktop',
        name: 'standalone_offline.html',
        type: 'html',
        content: standaloneHtml,
        size: Buffer.byteLength(standaloneHtml, 'utf-8'),
        sourceUrl: pageUrl,
        description: 'Single-File 100% Self-Contained Offline Webpage (Open directly anywhere with 2 clicks, zero dependencies)',
      });
    }
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
      'tablet',
      combinedJs,
      false
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

    if (rawData.filename === 'index.html' || filesTablet.length === 1) {
      const standaloneHtml = await processHtmlForOffline(
        rawData.rawHtml,
        pageUrl,
        combinedCss,
        pageMapping,
        assetCache,
        tracker,
        cookieJar,
        'tablet',
        combinedJs,
        true
      );
      filesTablet.push({
        id: 'file-html-standalone-tablet',
        name: 'standalone_offline.html',
        type: 'html',
        content: standaloneHtml,
        size: Buffer.byteLength(standaloneHtml, 'utf-8'),
        sourceUrl: pageUrl,
        description: 'Single-File 100% Self-Contained Offline Tablet Webpage (Zero dependencies)',
      });
    }
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
      'mobile',
      combinedJs,
      false
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

    if (rawData.filename === 'index.html' || filesMobile.length === 1) {
      const standaloneHtml = await processHtmlForOffline(
        rawData.rawHtml,
        pageUrl,
        combinedCss,
        pageMapping,
        assetCache,
        tracker,
        cookieJar,
        'mobile',
        combinedJs,
        true
      );
      filesMobile.push({
        id: 'file-html-standalone-mobile',
        name: 'standalone_offline.html',
        type: 'html',
        content: standaloneHtml,
        size: Buffer.byteLength(standaloneHtml, 'utf-8'),
        sourceUrl: pageUrl,
        description: 'Single-File 100% Self-Contained Offline Mobile Webpage (Zero dependencies)',
      });
    }
  }

  // Common styles, scripts, and reports
  // ==========================================================
  // CORRELATE AND CATEGORIZE LINKS & HEADINGS ACROSS DEVICES
  // ==========================================================
  const linkCorrelationMap = new Map<string, { link: ScrapedLink; devices: Set<DeviceType> }>();
  const addLinkToCorrelation = (link: ScrapedLink, dev: DeviceType) => {
    const key = `${link.type}:::${link.url}:::${link.text}`;
    const entry = linkCorrelationMap.get(key);
    if (entry) {
      entry.devices.add(dev);
    } else {
      linkCorrelationMap.set(key, {
        link: { ...link },
        devices: new Set([dev]),
      });
    }
  };

  for (const l of desktopLinksRaw) addLinkToCorrelation(l, 'desktop');
  for (const l of tabletLinksRaw) addLinkToCorrelation(l, 'tablet');
  for (const l of mobileLinksRaw) addLinkToCorrelation(l, 'mobile');

  // Master unique list of all scraped links across all devices
  const allScrapedLinks: ScrapedLink[] = [];
  for (const [_, entry] of linkCorrelationMap.entries()) {
    allScrapedLinks.push({
      ...entry.link,
      id: `link-${allScrapedLinks.length + 1}`,
      devices: Array.from(entry.devices),
    });
  }

  // Device-specific deduplicated link lists with device tags
  const prepareDeviceLinks = (rawList: ScrapedLink[]) => {
    const seen = new Set<string>();
    const list: ScrapedLink[] = [];
    for (const item of rawList) {
      const key = `${item.type}:::${item.url}:::${item.text}`;
      if (!seen.has(key)) {
        seen.add(key);
        const devices = linkCorrelationMap.get(key)
          ? Array.from(linkCorrelationMap.get(key)!.devices)
          : [];
        list.push({
          ...item,
          id: `link-${list.length + 1}`,
          devices,
        });
      }
    }
    return list;
  };

  const linksDesktop = prepareDeviceLinks(desktopLinksRaw);
  const linksTablet = prepareDeviceLinks(tabletLinksRaw);
  const linksMobile = prepareDeviceLinks(mobileLinksRaw);

  // Correlate headings across devices
  const headingCorrelationMap = new Map<string, { heading: ScrapedHeading; devices: Set<DeviceType> }>();
  const addHeadingToCorrelation = (h: ScrapedHeading, dev: DeviceType) => {
    const key = `${h.level}:::${h.text}:::${h.sourceUrl}`;
    const entry = headingCorrelationMap.get(key);
    if (entry) {
      entry.devices.add(dev);
    } else {
      headingCorrelationMap.set(key, {
        heading: { ...h },
        devices: new Set([dev]),
      });
    }
  };

  for (const h of desktopHeadingsRaw) addHeadingToCorrelation(h, 'desktop');
  for (const h of tabletHeadingsRaw) addHeadingToCorrelation(h, 'tablet');
  for (const h of mobileHeadingsRaw) addHeadingToCorrelation(h, 'mobile');

  // Master unique list of all headings
  const allScrapedHeadings: ScrapedHeading[] = [];
  for (const [_, entry] of headingCorrelationMap.entries()) {
    allScrapedHeadings.push({
      ...entry.heading,
      id: `heading-${allScrapedHeadings.length + 1}`,
      devices: Array.from(entry.devices),
    });
  }

  const prepareDeviceHeadings = (rawList: ScrapedHeading[]) => {
    const seen = new Set<string>();
    const list: ScrapedHeading[] = [];
    for (const item of rawList) {
      const key = `${item.level}:::${item.text}:::${item.sourceUrl}`;
      if (!seen.has(key)) {
        seen.add(key);
        const devices = headingCorrelationMap.get(key)
          ? Array.from(headingCorrelationMap.get(key)!.devices)
          : [];
        list.push({
          ...item,
          id: `heading-${list.length + 1}`,
          devices,
        });
      }
    }
    return list;
  };

  const headingsDesktop = prepareDeviceHeadings(desktopHeadingsRaw);
  const headingsTablet = prepareDeviceHeadings(tabletHeadingsRaw);
  const headingsMobile = prepareDeviceHeadings(mobileHeadingsRaw);

  const getHeadingsCount = (list: ScrapedHeading[]): Record<HeadingLevel, number> => ({
    h1: list.filter((h) => h.level === 'h1').length,
    h2: list.filter((h) => h.level === 'h2').length,
    h3: list.filter((h) => h.level === 'h3').length,
    h4: list.filter((h) => h.level === 'h4').length,
    h5: list.filter((h) => h.level === 'h5').length,
    h6: list.filter((h) => h.level === 'h6').length,
  });

  const headingsCountDesktop = getHeadingsCount(headingsDesktop);
  const headingsCountTablet = getHeadingsCount(headingsTablet);
  const headingsCountMobile = getHeadingsCount(headingsMobile);
  const headingsCount = getHeadingsCount(allScrapedHeadings);

  // Common styles & scripts
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

  // Enhanced links_report.html with device breakdown & badges
  const linksReportHtml = `<!DOCTYPE html>
<html lang="en" dir="auto">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extracted Links Report - ${escapeHtml(siteTitle || domain)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 2rem; background: #0f172a; color: #e2e8f0; }
    .container { max-width: 1200px; margin: 0 auto; background: #1e293b; padding: 2rem; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); }
    h1 { margin-top: 0; color: #f8fafc; font-size: 1.75rem; }
    .meta { display: flex; gap: 1.5rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #334155; font-size: 0.9rem; color: #94a3b8; flex-wrap: wrap; }
    .meta-box { background: #0f172a; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #334155; }
    .badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-right: 4px; }
    .badge-internal { background: #064e3b; color: #34d399; border: 1px solid #059669; }
    .badge-external { background: #78350f; color: #fbbf24; border: 1px solid #d97706; }
    .badge-asset { background: #312e81; color: #a5b4fc; border: 1px solid #6366f1; }
    .badge-anchor { background: #334155; color: #cbd5e1; border: 1px solid #475569; }
    .badge-other { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
    .dev-badge { display: inline-flex; align-items: center; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.7rem; font-weight: 500; margin: 1px; }
    .dev-desktop { background: #1e3a8a; color: #93c5fd; border: 1px solid #2563eb; }
    .dev-tablet { background: #581c87; color: #d8b4fe; border: 1px solid #7e22ce; }
    .dev-mobile { background: #064e3b; color: #6ee7b7; border: 1px solid #059669; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
    th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #334155; vertical-align: top; }
    th { background: #0f172a; color: #94a3b8; font-weight: 600; }
    a { color: #60a5fa; text-decoration: none; word-break: break-all; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Extracted Links Report & Multi-Device Breakdown</h1>
    <div class="meta">
      <div class="meta-box"><strong>Target:</strong> ${escapeHtml(startUrlInput)}</div>
      <div class="meta-box"><strong>Desktop Links:</strong> ${linksDesktop.length}</div>
      <div class="meta-box"><strong>Tablet Links:</strong> ${linksTablet.length}</div>
      <div class="meta-box"><strong>Mobile Links:</strong> ${linksMobile.length}</div>
      <div class="meta-box"><strong>Total Unique Links:</strong> ${allScrapedLinks.length}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 45px;">#</th>
          <th>Link Text</th>
          <th>Target URL</th>
          <th style="width: 90px;">Type</th>
          <th>Found on Devices</th>
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
          <td>
            ${(link.devices || ['desktop'])
              .map(
                (d) =>
                  `<span class="dev-badge dev-${d}">${
                    d === 'desktop' ? '💻 Desktop' : d === 'tablet' ? '📱 Tablet' : '📱 Mobile'
                  }</span>`
              )
              .join(' ')}
          </td>
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
    description: 'Self-contained interactive HTML report of all extracted links with device tags',
  };

  // Helper to generate device-tailored links.json
  const createDeviceJsonLinks = (dev: DeviceType, linksList: ScrapedLink[]) => {
    const json = JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        device: dev,
        profile: DEVICE_PROFILES[dev],
        targetUrl: startUrlInput,
        domain,
        offlineReady: true,
        pagesScanned: Array.from(visitedUrls),
        totalLinks: linksList.length,
        internalLinks: linksList.filter((l) => l.type === 'internal').length,
        externalLinks: linksList.filter((l) => l.type === 'external').length,
        exclusiveToDevice: linksList.filter((l) => l.devices?.length === 1).length,
        links: linksList,
      },
      null,
      2
    );
    return {
      id: `file-json-links-${dev}`,
      name: 'links.json',
      type: 'json' as const,
      content: json,
      size: Buffer.byteLength(json, 'utf-8'),
      description: `Structured JSON file containing ${linksList.length} links for ${DEVICE_PROFILES[dev].name}`,
    };
  };

  // Helper to generate device-tailored headings.json
  const createDeviceJsonHeadings = (
    dev: DeviceType,
    headingsList: ScrapedHeading[],
    counts: Record<HeadingLevel, number>
  ) => {
    const json = JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        device: dev,
        profile: DEVICE_PROFILES[dev],
        targetUrl: startUrlInput,
        domain,
        totalHeadings: headingsList.length,
        counts,
        headings: headingsList,
      },
      null,
      2
    );
    return {
      id: `file-json-headings-${dev}`,
      name: 'headings.json',
      type: 'json' as const,
      content: json,
      size: Buffer.byteLength(json, 'utf-8'),
      description: `Structured JSON file with ${headingsList.length} extracted H1-H6 headings for ${DEVICE_PROFILES[dev].name}`,
    };
  };

  // Device comparison metrics
  const deviceComparison: DeviceComparison = {
    totalLinks: {
      desktop: linksDesktop.length,
      tablet: linksTablet.length,
      mobile: linksMobile.length,
    },
    totalHeadings: {
      desktop: headingsDesktop.length,
      tablet: headingsTablet.length,
      mobile: headingsMobile.length,
    },
    totalPayloadBytes: {
      desktop: 0,
      tablet: 0,
      mobile: 0,
    },
    uniqueLinksCount: {
      desktop: linksDesktop.filter((l) => l.devices?.length === 1).length,
      tablet: linksTablet.filter((l) => l.devices?.length === 1).length,
      mobile: linksMobile.filter((l) => l.devices?.length === 1).length,
    },
    commonLinksCount: allScrapedLinks.filter((l) => l.devices?.length === 3).length,
    differencesDetected:
      linksDesktop.length !== linksMobile.length ||
      headingsDesktop.length !== headingsMobile.length ||
      linksDesktop.some((l) => l.devices?.length !== 3) ||
      linksMobile.some((l) => l.devices?.length !== 3),
  };

  const deviceComparisonJson = JSON.stringify(
    {
      scrapedAt: new Date().toISOString(),
      targetUrl: startUrlInput,
      domain,
      profiles: DEVICE_PROFILES,
      comparison: deviceComparison,
    },
    null,
    2
  );

  const fileJsonDeviceComparison: ExtractedFile = {
    id: 'file-json-device-comparison',
    name: 'device_comparison.json',
    type: 'json',
    content: deviceComparisonJson,
    size: Buffer.byteLength(deviceComparisonJson, 'utf-8'),
    description: 'Detailed cross-device comparison metrics and breakdown (Desktop vs Tablet vs Mobile)',
  };

  const offlineGuideFaContent = `========================================================================
 راهنمای اجرای ۱۰۰٪ آفلاین وب‌سایت استخراج شده (بدون نیاز به اینترنت)
========================================================================
دامنه اصلی: ${domain}
آدرس منبع: ${startUrlInput}
تاریخ استخراج: ${new Date().toLocaleString('fa-IR')}

کاربر گرامی، این وب‌سایت با معماری خودکفا (Air-Gapped & Offline-Resilient)
استخراج شده است تا بدون نیاز به اتصال به اینترنت، دقیقاً مانند وب‌سایت اصلی
در سیستم شما نمایش داده شود.

------------------------------------------------------------------------
روش‌های اجرای وب‌سایت:
------------------------------------------------------------------------
روش اول (سریع‌ترین و مطمئن‌ترین حالت - فقط با ۱ کلیک):
۱. روی فایل "standalone_offline.html" دوبار کلیک کنید.
   این فایل تمام استایل‌ها، فونت‌ها، تصاویر و اسکریپت‌ها را درون خود دارد
   و حتی اگر به تنهایی با فلش‌مموری منتقل شود، بدون هیچ وابستگی خارجی اجرا می‌شود.

روش دوم (حالت استاندارد وب):
۱. تمام فایل‌ها را از حالت فشرده (ZIP) خارج کنید.
۲. روی فایل "index.html" دوبار کلیک کنید.
   صفحه اصلی همراه با styles.css و scripts.js به شکل آفلاین باز خواهد شد.

------------------------------------------------------------------------
ویژگی‌های محافظتی تعبیه شده در نسخه آفلاین:
------------------------------------------------------------------------
✓ شیلد محافظتی آفلاین (Offline Air-gap Shield):
  تمام درخواست‌های شبکه (fetch/XHR) را به صورت خودکار ایمن‌سازی می‌کند تا هیچ
  خطایی در مرورگر رخ ندهد و منوها، پاپ‌آپ‌ها و تب‌ها کاملاً روان کار کنند.

✓ رفع کامل وابستگی‌های اینترنتی:
  هیچ تصویر یا فونتی به وب‌سایت اصلی متصل نیست و به صورت امن ذخیره شده است.

✓ باز کردن بخش‌های فوتر و انیمیشن‌ها:
  تمامی بخش‌هایی که به اسکرول وابسته بوده‌اند، در حالت آفلاین به صورت کاملاً
  نمایان و مرتب تنظیم شده‌اند.

========================================================================`;

  const offlineGuideEnContent = `========================================================================
 OFFLINE EXECUTION GUIDE (100% AIR-GAPPED & ZERO INTERNET REQUIRED)
========================================================================
Original Domain: ${domain}
Source URL: ${startUrlInput}
Scraped Date: ${new Date().toISOString()}

HOW TO RUN OFFLINE:
Option 1 (Easiest - Single Self-Contained File):
- Double click on "standalone_offline.html".
  This file embeds all CSS, webfonts, images, and runtime shields directly.
  It works completely standalone anywhere without any dependencies.

Option 2 (Standard Folder Structure):
- Extract the downloaded ZIP archive.
- Double click on "index.html" in any modern browser (Chrome, Firefox, Edge, Safari).

OFFLINE ENHANCEMENTS INCLUDED:
✓ Offline Runtime Air-Gap Shield: Intercepts runtime network calls to prevent console errors.
✓ Self-contained styles and resilient fallbacks for 100% offline stability.
✓ All bottom containers, lazy-loaded sections, and footers are immediately unveiled.
========================================================================`;

  const fileOfflineGuideFa: ExtractedFile = {
    id: 'file-offline-guide-fa',
    name: 'راهنمای_اجرای_آفلاین.txt',
    type: 'html',
    content: offlineGuideFaContent,
    size: Buffer.byteLength(offlineGuideFaContent, 'utf-8'),
    description: 'راهنمای جامع فارسی جهت اجرای ۱۰۰٪ آفلاین وب‌سایت در سیستم کاربر',
  };

  const fileOfflineGuideEn: ExtractedFile = {
    id: 'file-offline-guide-en',
    name: 'README_OFFLINE.txt',
    type: 'html',
    content: offlineGuideEnContent,
    size: Buffer.byteLength(offlineGuideEnContent, 'utf-8'),
    description: 'Instructions for running the offline website package with zero internet connection',
  };

  // Assemble device file bundles
  const allDesktopFiles: ExtractedFile[] = [
    ...filesDesktop,
    fileCssMain,
    fileJsMain,
    fileReportHtml,
    createDeviceJsonLinks('desktop', linksDesktop),
    createDeviceJsonHeadings('desktop', headingsDesktop, headingsCountDesktop),
    fileJsonDeviceComparison,
    fileOfflineGuideFa,
    fileOfflineGuideEn,
  ];

  const allTabletFiles: ExtractedFile[] = [
    ...filesTablet,
    fileCssMain,
    fileJsMain,
    fileReportHtml,
    createDeviceJsonLinks('tablet', linksTablet),
    createDeviceJsonHeadings('tablet', headingsTablet, headingsCountTablet),
    fileJsonDeviceComparison,
    fileOfflineGuideFa,
    fileOfflineGuideEn,
  ];

  const allMobileFiles: ExtractedFile[] = [
    ...filesMobile,
    fileCssMain,
    fileJsMain,
    fileReportHtml,
    createDeviceJsonLinks('mobile', linksMobile),
    createDeviceJsonHeadings('mobile', headingsMobile, headingsCountMobile),
    fileJsonDeviceComparison,
    fileOfflineGuideFa,
    fileOfflineGuideEn,
  ];

  deviceComparison.totalPayloadBytes = {
    desktop: allDesktopFiles.reduce((acc, f) => acc + f.size, 0),
    tablet: allTabletFiles.reduce((acc, f) => acc + f.size, 0),
    mobile: allMobileFiles.reduce((acc, f) => acc + f.size, 0),
  };

  const deviceVersions: Record<DeviceType, DeviceVersion> = {
    desktop: {
      device: 'desktop',
      title: `${siteTitle || domain} (Desktop)`,
      files: allDesktopFiles,
      totalBytes: deviceComparison.totalPayloadBytes.desktop,
      viewport: DEVICE_PROFILES.desktop.viewport,
      userAgent: DEVICE_PROFILES.desktop.userAgent,
      profileInfo: DEVICE_PROFILES.desktop,
      links: linksDesktop,
      headings: headingsDesktop,
      headingsCount: headingsCountDesktop,
      totalLinksFound: linksDesktop.length,
      internalLinksCount: linksDesktop.filter((l) => l.type === 'internal').length,
      externalLinksCount: linksDesktop.filter((l) => l.type === 'external').length,
      uniqueLinksCount: linksDesktop.filter((l) => l.devices?.length === 1).length,
    },
    tablet: {
      device: 'tablet',
      title: `${siteTitle || domain} (Tablet)`,
      files: allTabletFiles,
      totalBytes: deviceComparison.totalPayloadBytes.tablet,
      viewport: DEVICE_PROFILES.tablet.viewport,
      userAgent: DEVICE_PROFILES.tablet.userAgent,
      profileInfo: DEVICE_PROFILES.tablet,
      links: linksTablet,
      headings: headingsTablet,
      headingsCount: headingsCountTablet,
      totalLinksFound: linksTablet.length,
      internalLinksCount: linksTablet.filter((l) => l.type === 'internal').length,
      externalLinksCount: linksTablet.filter((l) => l.type === 'external').length,
      uniqueLinksCount: linksTablet.filter((l) => l.devices?.length === 1).length,
    },
    mobile: {
      device: 'mobile',
      title: `${siteTitle || domain} (Mobile)`,
      files: allMobileFiles,
      totalBytes: deviceComparison.totalPayloadBytes.mobile,
      viewport: DEVICE_PROFILES.mobile.viewport,
      userAgent: DEVICE_PROFILES.mobile.userAgent,
      profileInfo: DEVICE_PROFILES.mobile,
      links: linksMobile,
      headings: headingsMobile,
      headingsCount: headingsCountMobile,
      totalLinksFound: linksMobile.length,
      internalLinksCount: linksMobile.filter((l) => l.type === 'internal').length,
      externalLinksCount: linksMobile.filter((l) => l.type === 'external').length,
      uniqueLinksCount: linksMobile.filter((l) => l.devices?.length === 1).length,
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
    deviceComparison,
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
