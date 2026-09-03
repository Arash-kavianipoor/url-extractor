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
} from '../types.js';

// Realistic Device Profiles
export const CLIENT_DEVICE_PROFILES: Record<
  DeviceType,
  {
    name: string;
    viewport: string;
    width: number;
    height: number;
    userAgent: string;
  }
> = {
  desktop: {
    name: 'Desktop',
    viewport: 'width=device-width, initial-scale=1.0',
    width: 1280,
    height: 800,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  },
  tablet: {
    name: 'Tablet',
    viewport: 'width=768, initial-scale=1.0, maximum-scale=2.0',
    width: 768,
    height: 1024,
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  },
  mobile: {
    name: 'Mobile',
    viewport: 'width=390, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes',
    width: 390,
    height: 844,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36',
  },
};

/**
 * Parses raw HTML directly inside the user's browser using the native DOMParser.
 * If deviceHtmlMap is provided, each device (desktop, tablet, mobile) gets parsed
 * from its own realistically fetched HTML, extracting distinct mobile vs desktop links & headings.
 */
export function parseHtmlInBrowser(
  rawHtml: string,
  targetUrl: string,
  mode: CrawlMode = 'single',
  deviceHtmlMap?: Partial<Record<DeviceType, string>>
): ScrapeResult {
  const startTime = performance.now();
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  let baseUrlObj: URL;
  try {
    baseUrlObj = new URL(targetUrl);
  } catch {
    baseUrlObj = new URL('https://example.com');
  }

  const domain = baseUrlObj.hostname;

  // Title extraction
  const pageTitle =
    doc.querySelector('title')?.textContent?.trim() ||
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
    domain;

  // 1. Extract All Links
  const links: ScrapedLink[] = [];
  const seenUrls = new Set<string>();

  const anchorElements = Array.from(doc.querySelectorAll('a[href], area[href]'));

  anchorElements.forEach((el, index) => {
    const rawHref = el.getAttribute('href')?.trim() || '';
    if (!rawHref || rawHref.startsWith('javascript:')) return;

    let fullUrl = rawHref;
    let type: LinkType = 'other';

    if (rawHref.startsWith('#')) {
      type = 'anchor';
      fullUrl = `${targetUrl.split('#')[0]}${rawHref}`;
    } else if (rawHref.startsWith('mailto:')) {
      type = 'mailto';
    } else if (rawHref.startsWith('tel:')) {
      type = 'other';
    } else {
      try {
        const resolved = new URL(rawHref, targetUrl);
        fullUrl = resolved.href;

        const extMatch = resolved.pathname.match(/\.(png|jpe?g|gif|svg|webp|pdf|zip|rar|tar|gz|mp4|mp3|docx?|xlsx?)$/i);
        if (extMatch) {
          type = 'asset';
        } else if (resolved.hostname === domain || resolved.hostname.endsWith(`.${domain}`)) {
          type = 'internal';
        } else {
          type = 'external';
        }
      } catch {
        fullUrl = rawHref;
        type = 'other';
      }
    }

    if (!seenUrls.has(fullUrl)) {
      seenUrls.add(fullUrl);
      const text =
        el.textContent?.replace(/\s+/g, ' ').trim() ||
        el.getAttribute('title') ||
        el.getAttribute('aria-label') ||
        '[No Anchor Text]';

      links.push({
        id: `link-${index + 1}`,
        url: fullUrl,
        text,
        type,
        sourceUrl: targetUrl,
      });
    }
  });

  const internalLinksCount = links.filter((l) => l.type === 'internal').length;
  const externalLinksCount = links.filter((l) => l.type === 'external').length;

  // 2. Extract Headings (H1 to H6)
  const headings: ScrapedHeading[] = [];
  const headingsCount: Record<HeadingLevel, number> = {
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
  };

  const headingEls = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  headingEls.forEach((el, idx) => {
    const tagName = el.tagName.toLowerCase() as HeadingLevel;
    const text = el.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (text) {
      headingsCount[tagName] = (headingsCount[tagName] || 0) + 1;
      headings.push({
        id: `heading-${idx + 1}`,
        level: tagName,
        text,
        sourceUrl: targetUrl,
        pageTitle,
        index: idx + 1,
      });
    }
  });

  // 3. Extract Styles (Inline & Tags)
  const styleElements = Array.from(doc.querySelectorAll('style'));
  const extractedStyles: string[] = [];
  styleElements.forEach((s) => {
    if (s.textContent?.trim()) {
      extractedStyles.push(s.textContent.trim());
    }
  });

  // Extract linked CSS hrefs
  const linkCssEls = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'));
  const externalCssUrls = linkCssEls.map((el) => {
    try {
      return new URL(el.getAttribute('href')!, targetUrl).href;
    } catch {
      return el.getAttribute('href')!;
    }
  });

  // 4. Extract Scripts
  const scriptElements = Array.from(doc.querySelectorAll('script'));
  const extractedScripts: string[] = [];
  scriptElements.forEach((sc) => {
    const code = sc.textContent?.trim();
    if (code && !sc.getAttribute('src')) {
      // Inline script
      extractedScripts.push(code);
    }
  });

  // Build clean offline CSS bundle
  const combinedCss = [
    `/* Extracted CSS from ${targetUrl} */`,
    `/* Total Inline Styles: ${styleElements.length} | External Stylesheets: ${externalCssUrls.length} */`,
    externalCssUrls.length > 0
      ? `/* External Stylesheet References:\n${externalCssUrls.map((u) => ` * @import url("${u}");`).join('\n')}\n */`
      : '',
    ...extractedStyles,
  ]
    .filter(Boolean)
    .join('\n\n');

  // Build clean offline JS bundle
  const combinedJs = [
    `/* Extracted JavaScript from ${targetUrl} */`,
    `console.log("Offline page initialized - Extracted via Client-Side Engine");`,
    ...extractedScripts,
  ].join('\n\n');

  // Prepare normalized HTML with relative asset resolution & base tag
  let sanitizedHtml = rawHtml;
  // Ensure <base> tag is present so images and relative URLs load reliably
  if (!sanitizedHtml.includes('<base ') && sanitizedHtml.includes('<head>')) {
    sanitizedHtml = sanitizedHtml.replace(
      '<head>',
      `<head>\n  <base href="${baseUrlObj.origin}/" />`
    );
  }

  // 5. Generate Extracted Files
  const files: ExtractedFile[] = [
    {
      id: 'file-html-index',
      name: 'index.html',
      type: 'html',
      content: sanitizedHtml,
      size: new Blob([sanitizedHtml]).size,
      sourceUrl: targetUrl,
      description: 'Main HTML Document with localized base references',
    },
    {
      id: 'file-css-main',
      name: 'styles.css',
      type: 'css',
      content: combinedCss,
      size: new Blob([combinedCss]).size,
      sourceUrl: targetUrl,
      description: 'Extracted Stylesheets and Inline CSS definitions',
    },
    {
      id: 'file-js-main',
      name: 'scripts.js',
      type: 'javascript',
      content: combinedJs,
      size: new Blob([combinedJs]).size,
      sourceUrl: targetUrl,
      description: 'Extracted inline JavaScript routines and helpers',
    },
    {
      id: 'file-json-metadata',
      name: 'metadata.json',
      type: 'json',
      content: JSON.stringify(
        {
          targetUrl,
          domain,
          pageTitle,
          extractedAt: new Date().toISOString(),
          stats: {
            totalLinks: links.length,
            internalLinks: internalLinksCount,
            externalLinks: externalLinksCount,
            totalHeadings: headings.length,
            headingsBreakdown: headingsCount,
          },
        },
        null,
        2
      ),
      size: 0,
      description: 'JSON structured audit report of all extracted links & headings',
    },
  ];

  // Update size for metadata.json
  files[3].size = new Blob([files[3].content]).size;

  // 6. Generate Realistic Multi-Device Viewport Versions (Desktop, Tablet, Mobile)
  const desktopRaw = deviceHtmlMap?.desktop || sanitizedHtml;
  const tabletRaw = deviceHtmlMap?.tablet || sanitizedHtml;
  const mobileRaw = deviceHtmlMap?.mobile || sanitizedHtml;

  const deviceVersions: Record<DeviceType, DeviceVersion> = {
    desktop: createRealisticDeviceVersion('desktop', desktopRaw, combinedCss, combinedJs, targetUrl, domain),
    tablet: createRealisticDeviceVersion('tablet', tabletRaw, combinedCss, combinedJs, targetUrl, domain),
    mobile: createRealisticDeviceVersion('mobile', mobileRaw, combinedCss, combinedJs, targetUrl, domain),
  };

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    targetUrl,
    mode,
    domain,
    title: pageTitle,
    pagesScanned: 1,
    totalLinksFound: links.length,
    internalLinksCount,
    externalLinksCount,
    links,
    headings,
    totalHeadingsFound: headings.length,
    headingsCount,
    files,
    deviceVersions,
    scannedUrls: [targetUrl],
    executionTimeMs,
  };
}

/**
 * Creates a realistic device-specific HTML & CSS version tailored for the specified viewport.
 * If distinct HTML was fetched for mobile or tablet, it parses the device-specific links & headings.
 */
function createRealisticDeviceVersion(
  device: DeviceType,
  deviceSourceHtml: string,
  baseCss: string,
  baseJs: string,
  targetUrl: string,
  domain: string
): DeviceVersion {
  const profile = CLIENT_DEVICE_PROFILES[device];
  const parser = new DOMParser();
  const doc = parser.parseFromString(deviceSourceHtml, 'text/html');

  // Tailor viewport meta tag
  let deviceHtml = deviceSourceHtml;
  const viewportRegex = /<meta\s+name=["']viewport["'][^>]*>/i;
  const newViewportTag = `<meta name="viewport" content="${profile.viewport}">`;

  if (viewportRegex.test(deviceHtml)) {
    deviceHtml = deviceHtml.replace(viewportRegex, newViewportTag);
  } else if (deviceHtml.includes('</head>')) {
    deviceHtml = deviceHtml.replace('</head>', `  ${newViewportTag}\n</head>`);
  }

  // Extract device-specific links (mobile menus, drawers, different DOM trees)
  const deviceLinks: ScrapedLink[] = [];
  const seenUrls = new Set<string>();
  const anchorElements = Array.from(doc.querySelectorAll('a[href], area[href]'));

  anchorElements.forEach((el, index) => {
    const rawHref = el.getAttribute('href')?.trim() || '';
    if (!rawHref || rawHref.startsWith('javascript:')) return;

    let fullUrl = rawHref;
    let type: LinkType = 'other';

    if (rawHref.startsWith('#')) {
      type = 'anchor';
      fullUrl = `${targetUrl.split('#')[0]}${rawHref}`;
    } else if (rawHref.startsWith('mailto:')) {
      type = 'mailto';
    } else if (rawHref.startsWith('tel:')) {
      type = 'other';
    } else {
      try {
        const resolved = new URL(rawHref, targetUrl);
        fullUrl = resolved.href;

        const extMatch = resolved.pathname.match(/\.(png|jpe?g|gif|svg|webp|pdf|zip|rar|tar|gz|mp4|mp3|docx?|xlsx?)$/i);
        if (extMatch) {
          type = 'asset';
        } else if (resolved.hostname === domain || resolved.hostname.endsWith(`.${domain}`)) {
          type = 'internal';
        } else {
          type = 'external';
        }
      } catch {
        fullUrl = rawHref;
        type = 'other';
      }
    }

    if (!seenUrls.has(fullUrl)) {
      seenUrls.add(fullUrl);
      const text =
        el.textContent?.replace(/\s+/g, ' ').trim() ||
        el.getAttribute('title') ||
        el.getAttribute('aria-label') ||
        `[${profile.name} Link]`;

      deviceLinks.push({
        id: `${device}-link-${index + 1}`,
        url: fullUrl,
        text,
        type,
        sourceUrl: targetUrl,
      });
    }
  });

  // Extract device-specific headings
  const deviceHeadings: ScrapedHeading[] = [];
  const deviceHeadingsCount: Record<HeadingLevel, number> = {
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
  };

  const headingEls = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  headingEls.forEach((el, idx) => {
    const tagName = el.tagName.toLowerCase() as HeadingLevel;
    const text = el.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (text) {
      deviceHeadingsCount[tagName] = (deviceHeadingsCount[tagName] || 0) + 1;
      deviceHeadings.push({
        id: `${device}-heading-${idx + 1}`,
        level: tagName,
        text,
        sourceUrl: targetUrl,
        index: idx + 1,
      });
    }
  });

  // Inject device-specific layout adjustments
  let deviceCss = baseCss;
  if (device === 'mobile') {
    deviceCss += `\n\n/* Mobile Optimization Rules (${profile.width}px) */\n@media (max-width: 480px) {\n  body { -webkit-text-size-adjust: 100%; word-break: break-word; }\n  img, video { max-width: 100% !important; height: auto !important; }\n}`;
  } else if (device === 'tablet') {
    deviceCss += `\n\n/* Tablet Optimization Rules (${profile.width}px) */\n@media (min-width: 481px) and (max-width: 1024px) {\n  body { -webkit-text-size-adjust: 100%; }\n  img, video { max-width: 100% !important; height: auto !important; }\n}`;
  } else {
    deviceCss += `\n\n/* Desktop Optimization Rules (${profile.width}px) */\n@media (min-width: 1025px) {\n  body { margin: 0 auto; }\n}`;
  }

  const files: ExtractedFile[] = [
    {
      id: `${device}-index-html`,
      name: 'index.html',
      type: 'html',
      content: deviceHtml,
      size: new Blob([deviceHtml]).size,
      sourceUrl: targetUrl,
      description: `${profile.name} HTML (${profile.width}×${profile.height}) - ${deviceLinks.length} links`,
    },
    {
      id: `${device}-styles-css`,
      name: 'styles.css',
      type: 'css',
      content: deviceCss,
      size: new Blob([deviceCss]).size,
      sourceUrl: targetUrl,
      description: `${profile.name} tailored CSS styling rules`,
    },
    {
      id: `${device}-scripts-js`,
      name: 'scripts.js',
      type: 'javascript',
      content: baseJs,
      size: new Blob([baseJs]).size,
      sourceUrl: targetUrl,
      description: `${profile.name} JavaScript bundle`,
    },
  ];

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return {
    device,
    title: `${profile.name} Version (${profile.width}×${profile.height})`,
    files,
    totalBytes,
    viewport: profile.viewport,
    userAgent: profile.userAgent,
    links: deviceLinks,
    headings: deviceHeadings,
    headingsCount: deviceHeadingsCount,
    rawHtml: deviceHtml,
  };
}

/**
 * Client-Side multi-gateway fetcher with realistic device headers:
 * Tries local pass-through proxy with device headers -> direct fetch -> public CORS gateways.
 * Eliminates 503 Cloudflare Worker CPU/subrequest errors entirely.
 */
export async function fetchTargetHtmlInBrowser(
  targetUrl: string,
  device: DeviceType = 'desktop',
  onProgress?: (status: string, percent: number) => void
): Promise<string> {
  const cleanUrl = targetUrl.trim();
  const profile = CLIENT_DEVICE_PROFILES[device];

  // Strategy 1: Local Pass-through Proxy endpoint with realistic device User-Agent & Headers
  try {
    onProgress?.(`اتصال به عنوان ${profile.name} (${profile.width}×${profile.height})...`, 25);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const localProxyUrl = `/api/proxy?url=${encodeURIComponent(cleanUrl)}&device=${device}`;
    const localRes = await fetch(localProxyUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (localRes.ok) {
      const html = await localRes.text();
      if (html && html.length > 50 && html.includes('<')) {
        onProgress?.(`دریافت موفق نسخه ${profile.name}!`, 95);
        return html;
      }
    }
  } catch {
    // fallback to direct/gateways
  }

  // Strategy 2: Direct Browser Fetch (Fastest if site allows CORS)
  try {
    onProgress?.(`دریافت مستقیم مرورگر (${profile.name})...`, 40);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const directRes = await fetch(cleanUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (directRes.ok) {
      const html = await directRes.text();
      if (html && html.includes('<')) {
        onProgress?.(`دریافت مستقیم نسخه ${profile.name}!`, 95);
        return html;
      }
    }
  } catch {
    // Expected if target doesn't allow cross-origin requests; fallback to gateways
  }

  // Strategy 3: Fast Public CORS Gateway (allorigins.win raw)
  try {
    onProgress?.(`اتصال از طریق درگاه پرسرعت AllOrigins (${profile.name})...`, 55);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const gatewayUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`;
    const gatewayRes = await fetch(gatewayUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (gatewayRes.ok) {
      const html = await gatewayRes.text();
      if (html && html.length > 50 && html.includes('<')) {
        onProgress?.(`دریافت موفق از درگاه AllOrigins (${profile.name})!`, 95);
        return html;
      }
    }
  } catch {
    // fallback to next
  }

  // Strategy 4: Fast Public CORS Gateway (corsproxy.io)
  try {
    onProgress?.(`اتصال از طریق درگاه جایگزین CorsProxy (${profile.name})...`, 70);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const gatewayUrl = `https://corsproxy.io/?url=${encodeURIComponent(cleanUrl)}`;
    const gatewayRes = await fetch(gatewayUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (gatewayRes.ok) {
      const html = await gatewayRes.text();
      if (html && html.length > 50 && html.includes('<')) {
        onProgress?.(`دریافت موفق از CorsProxy (${profile.name})!`, 95);
        return html;
      }
    }
  } catch {
    // fallback to next
  }

  // Strategy 5: Codetabs CORS gateway
  try {
    onProgress?.(`اتصال از طریق درگاه CodeTabs (${profile.name})...`, 85);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const gatewayUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`;
    const gatewayRes = await fetch(gatewayUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (gatewayRes.ok) {
      const html = await gatewayRes.text();
      if (html && html.length > 50 && html.includes('<')) {
        onProgress?.(`دریافت موفق از CodeTabs (${profile.name})!`, 95);
        return html;
      }
    }
  } catch {
    // all failed
  }

  throw new Error(
    `امکان واکشی مستقیم نسخه ${profile.name} به دلیل محدودیت CORS یا سیستم ضد ربات سایت وجود ندارد.`
  );
}

/**
 * Concurrently fetches realistic device-specific HTML for Desktop, Tablet, and Mobile.
 * Since modern websites return different HTML/DOM for mobile versus desktop,
 * this gives each viewport its genuine extracted content.
 */
export async function fetchMultiDeviceHtmlInBrowser(
  targetUrl: string,
  onDeviceProgress?: (device: DeviceType, status: string, percent: number) => void
): Promise<Record<DeviceType, string>> {
  const devices: DeviceType[] = ['desktop', 'tablet', 'mobile'];
  const results: Partial<Record<DeviceType, string>> = {};

  const fetchPromises = devices.map(async (dev) => {
    try {
      const html = await fetchTargetHtmlInBrowser(targetUrl, dev, (status, pct) => {
        onDeviceProgress?.(dev, status, pct);
      });
      results[dev] = html;
      return { device: dev, html, success: true };
    } catch (err: any) {
      return { device: dev, error: err.message, success: false };
    }
  });

  const settled = await Promise.all(fetchPromises);
  const successful = settled.filter((s) => s.success && (s as any).html);

  if (successful.length === 0) {
    throw new Error(
      'امکان واکشی خودکار آدرس به دلیل محدودیت CORS یا سیستم ضد ربات (Cloudflare Captcha) سایت هدف وجود ندارد. لطفاً از تب «سورس مستقیم / ChromeDriver» در بالای فرم استفاده کنید و سورس صفحه را مستقیماً Paste نمایید تا بلافاصله بدون هیچ خطایی استخراج شود.'
    );
  }

  // If one device succeeded (e.g. desktop), share it with any device that might have failed
  const fallbackHtml = (successful[0] as any).html;
  return {
    desktop: results.desktop || fallbackHtml,
    tablet: results.tablet || fallbackHtml,
    mobile: results.mobile || fallbackHtml,
  };
}
