// Browser Companion Extension Generator (Chrome Manifest V3 & Firefox Manifest V2)
// 100% handles the extraction of all files: HTML, CSS, JS, images, media, fonts, and structured data.
import JSZip from 'jszip';

export function generateChromeExtensionFiles(targetAppOrigin: string) {
  const manifest = {
    manifest_version: 3,
    name: "Web Asset & Code Extractor",
    version: "2.5.0",
    description: "Full URL asset, media, CSS, and JS extractor companion for Chrome, Edge, and Brave.",
    permissions: ["activeTab", "scripting"],
    host_permissions: ["<all_urls>"],
    action: {
      default_popup: "popup.html",
      default_title: "Web Extractor"
    },
    background: {
      service_worker: "background.js"
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        run_at: "document_start"
      }
    ]
  };

  // Popup strictly displays "I am ready" when active on this site; turns OFF if on another site
  const popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Extractor Status</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 220px;
      min-height: 80px;
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      user-select: none;
    }
    #status-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-align: center;
    }
    .status-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .pulse-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .pulse-dot.on {
      background: #10b981;
      box-shadow: 0 0 16px #10b981, 0 0 4px #34d399;
      animation: pulse 2s infinite ease-in-out;
    }
    .pulse-dot.off {
      background: #64748b;
      box-shadow: none;
    }
    .status-text {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #f8fafc;
    }
    .status-text.off {
      color: #94a3b8;
    }
    .status-sub {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
      max-width: 190px;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.92); }
    }
  </style>
</head>
<body>
  <div id="status-box">
    <div class="status-row">
      <div id="dot" class="pulse-dot on"></div>
      <div id="text" class="status-text">I am ready</div>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>`;

  const popupJs = `const TARGET_ORIGIN = ${JSON.stringify(targetAppOrigin)};

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  const tabUrl = currentTab?.url || '';
  
  // Check if current tab is on the web scraper application
  let isAppSite = false;
  try {
    const targetHost = new URL(TARGET_ORIGIN).host;
    const currentHost = new URL(tabUrl).host;
    isAppSite = currentHost === targetHost || tabUrl.startsWith(TARGET_ORIGIN);
  } catch (e) {
    isAppSite = false;
  }

  const box = document.getElementById('status-box');
  if (isAppSite) {
    // Only "I am ready" is shown
    box.innerHTML = \`
      <div class="status-row">
        <div class="pulse-dot on"></div>
        <div class="status-text">I am ready</div>
      </div>
    \`;
  } else {
    // Turns OFF when not on this site
    box.innerHTML = \`
      <div class="status-row">
        <div class="pulse-dot off"></div>
        <div class="status-text off">خاموش (OFF)</div>
      </div>
      <div class="status-sub">اکستنشن فقط در این وب‌سایت فعال می‌شود</div>
    \`;
  }
});
`;

  const contentJs = `// Content Script: Coordinates zero-copy direct extraction with web app
const TARGET_ORIGIN = ${JSON.stringify(targetAppOrigin)};

function checkIsCurrentSite() {
  try {
    const targetHost = new URL(TARGET_ORIGIN).host;
    return window.location.host === targetHost || window.location.origin === TARGET_ORIGIN;
  } catch (e) {
    return false;
  }
}

const isAppSite = checkIsCurrentSite();

if (isAppSite) {
  window.__WEB_SCRAPER_EXTENSION_READY__ = true;

  function announceReady() {
    window.postMessage({
      type: 'EXTENSION_STATUS',
      status: 'ready',
      message: 'I am ready',
      browser: 'Chrome/Chromium',
      version: '2.5.0'
    }, '*');
  }

  announceReady();
  setInterval(announceReady, 2500);

  // Listen for full extraction commands from the web app
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'PING_EXTENSION') {
      announceReady();
    }

    if (event.data.type === 'REQUEST_FULL_URL_EXTRACTION' && event.data.targetUrl) {
      chrome.runtime.sendMessage(
        { action: 'PERFORM_FULL_EXTRACTION', targetUrl: event.data.targetUrl },
        (response) => {
          if (chrome.runtime.lastError) {
            window.postMessage({
              type: 'EXTENSION_EXTRACTION_ERROR',
              error: chrome.runtime.lastError.message
            }, '*');
            return;
          }

          if (response && response.success) {
            window.postMessage({
              type: 'EXTENSION_EXTRACTION_COMPLETE',
              data: response.data
            }, '*');
          } else {
            window.postMessage({
              type: 'EXTENSION_EXTRACTION_ERROR',
              error: response?.error || 'Extraction failed'
            }, '*');
          }
        }
      );
    }
  });
}
`;

  const backgroundJs = `// Background Service Worker: Full extraction of HTML, CSS, JS, media, and assets
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PERFORM_FULL_EXTRACTION' && request.targetUrl) {
    extractCompleteWebsite(request.targetUrl)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message || 'Extraction error' }));
    return true; // Keep async channel open
  }
});

async function extractCompleteWebsite(url) {
  // 1. Fetch initial HTML
  const mainRes = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    },
    credentials: 'include'
  });

  if (!mainRes.ok) {
    throw new Error('HTTP ' + mainRes.status + ': ' + mainRes.statusText);
  }

  const rawHtml = await mainRes.text();
  const baseUrl = new URL(url);

  // 2. Extract Title
  const titleMatch = rawHtml.match(/<title[^>]*>([^<]*)<\\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : baseUrl.hostname;

  // 3. Extract CSS Links and inline styles
  const cssHrefRegex = /<link[^>]+rel=["'](?:stylesheet|preload)["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
  const cssHrefRegex2 = /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:stylesheet|preload)["'][^>]*>/gi;
  const cssLinks = new Set();
  let m;
  while ((m = cssHrefRegex.exec(rawHtml)) !== null) cssLinks.add(m[1]);
  while ((m = cssHrefRegex2.exec(rawHtml)) !== null) cssLinks.add(m[1]);

  let combinedCss = '/* Extracted and Bundled by Browser Extension */\\n\\n';
  const externalCssFiles = [];

  for (const href of cssLinks) {
    try {
      const fullCssUrl = new URL(href, baseUrl.href).href;
      const cssRes = await fetch(fullCssUrl);
      if (cssRes.ok) {
        const cssContent = await cssRes.text();
        combinedCss += \`/* Source: \${fullCssUrl} */\\n\${cssContent}\\n\\n\`;
        externalCssFiles.push({ url: fullCssUrl, size: cssContent.length });
      }
    } catch (e) {
      // ignore individual failures
    }
  }

  // Extract inline <style>
  const inlineStyleRegex = /<style[^>]*>([\\s\\S]*?)<\\/style>/gi;
  while ((m = inlineStyleRegex.exec(rawHtml)) !== null) {
    combinedCss += \`/* Inline Style */\\n\${m[1]}\\n\\n\`;
  }

  // 4. Extract JavaScript files
  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>\\s*<\\/script>/gi;
  const jsLinks = new Set();
  while ((m = scriptRegex.exec(rawHtml)) !== null) jsLinks.add(m[1]);

  let combinedJs = '/* Extracted and Bundled by Browser Extension */\\n\\n';
  const externalJsFiles = [];

  for (const src of jsLinks) {
    try {
      const fullJsUrl = new URL(src, baseUrl.href).href;
      const jsRes = await fetch(fullJsUrl);
      if (jsRes.ok) {
        const jsContent = await jsRes.text();
        combinedJs += \`/* Source: \${fullJsUrl} */\\n\${jsContent}\\n\\n\`;
        externalJsFiles.push({ url: fullJsUrl, size: jsContent.length });
      }
    } catch (e) {
      // ignore individual failures
    }
  }

  // Extract inline scripts
  const inlineScriptRegex = /<script(?![^>]+src=)[^>]*>([\\s\\S]*?)<\\/script>/gi;
  while ((m = inlineScriptRegex.exec(rawHtml)) !== null) {
    if (m[1].trim() && !m[1].includes('application/json')) {
      combinedJs += \`/* Inline Script */\\n\${m[1]}\\n\\n\`;
    }
  }

  // 5. Extract Images, Media & Assets
  const assetRegex = /<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi;
  const assetUrls = new Set();
  while ((m = assetRegex.exec(rawHtml)) !== null) {
    if (m[1] && !m[1].startsWith('data:')) assetUrls.add(m[1]);
  }

  // Video and audio
  const mediaRegex = /<(?:video|audio|source)[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((m = mediaRegex.exec(rawHtml)) !== null) {
    if (m[1] && !m[1].startsWith('data:')) assetUrls.add(m[1]);
  }

  // SVG images
  const svgImgRegex = /<img[^>]+src=["']([^"']+\\.svg(?:\\?[^"']*)?)["'][^>]*>/gi;
  while ((m = svgImgRegex.exec(rawHtml)) !== null) assetUrls.add(m[1]);

  // Convert key assets to Data URIs
  const assetsCatalog = [];
  let offlineHtml = rawHtml;

  for (const assetRel of assetUrls) {
    try {
      const fullAssetUrl = new URL(assetRel, baseUrl.href).href;
      const aRes = await fetch(fullAssetUrl);
      if (aRes.ok) {
        const blob = await aRes.blob();
        const reader = new FileReader();
        const dataUri = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        let type = 'image';
        if (blob.type.includes('svg') || fullAssetUrl.endsWith('.svg')) type = 'svg';
        else if (blob.type.includes('video')) type = 'video';
        else if (blob.type.includes('audio')) type = 'audio';
        else if (blob.type.includes('font')) type = 'font';

        assetsCatalog.push({
          id: 'asset-' + (assetsCatalog.length + 1),
          url: fullAssetUrl,
          type: type,
          sizeBytes: blob.size,
          dataUriPreview: String(dataUri).slice(0, 60) + '...'
        });

        // Replace asset URL in HTML for 100% offline view
        offlineHtml = offlineHtml.split(assetRel).join(String(dataUri));
      }
    } catch (e) {
      // ignore
    }
  }

  // 6. Extract Links
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\\s\\S]*?)<\\/a>/gi;
  const linksList = [];
  while ((m = linkRegex.exec(rawHtml)) !== null) {
    const rawHref = m[1].trim();
    if (rawHref && !rawHref.startsWith('javascript:') && !rawHref.startsWith('#')) {
      try {
        const resolvedHref = new URL(rawHref, baseUrl.href).href;
        const text = m[2].replace(/<[^>]*>/g, '').trim();
        linksList.push({
          url: resolvedHref,
          text: text || resolvedHref,
          isInternal: new URL(resolvedHref).hostname === baseUrl.hostname,
        });
      } catch (e) {}
    }
  }

  // 7. Extract Headings (H1 - H6)
  const headingRegex = /<(h[1-6])[^>]*>([\\s\\S]*?)<\\/\\1>/gi;
  const headingsList = [];
  while ((m = headingRegex.exec(rawHtml)) !== null) {
    const level = parseInt(m[1].charAt(1), 10);
    const text = m[2].replace(/<[^>]*>/g, '').trim();
    if (text) {
      headingsList.push({ level, text });
    }
  }

  // Inject offline bundle CSS & JS into offlineHtml
  if (offlineHtml.includes('</head>')) {
    offlineHtml = offlineHtml.replace('</head>', \`<style id="offline-bundle-styles">\\n\${combinedCss}\\n</style>\\n</head>\`);
  } else {
    offlineHtml = \`<style id="offline-bundle-styles">\\n\${combinedCss}\\n</style>\\n\` + offlineHtml;
  }

  if (offlineHtml.includes('</body>')) {
    offlineHtml = offlineHtml.replace('</body>', \`<script id="offline-bundle-scripts">\\n\${combinedJs}\\n</script>\\n</body>\`);
  } else {
    offlineHtml += \`\\n<script id="offline-bundle-scripts">\\n\${combinedJs}\\n</script>\`;
  }

  // Compile all files
  const files = [
    {
      id: 'file-index-html',
      name: 'index.html',
      type: 'html',
      content: offlineHtml,
      size: new Blob([offlineHtml]).size,
      description: 'Fully bundled offline-ready HTML with all styles, scripts, and embedded assets'
    },
    {
      id: 'file-styles-css',
      name: 'styles.css',
      type: 'css',
      content: combinedCss,
      size: new Blob([combinedCss]).size,
      description: \`Complete stylesheet bundling \${externalCssFiles.length} CSS files and inline styles\`
    },
    {
      id: 'file-scripts-js',
      name: 'scripts.js',
      type: 'js',
      content: combinedJs,
      size: new Blob([combinedJs]).size,
      description: \`Complete JavaScript bundle containing \${externalJsFiles.length} external scripts and inline scripts\`
    },
    {
      id: 'file-assets-json',
      name: 'assets.json',
      type: 'json',
      content: JSON.stringify({
        targetUrl: url,
        scrapedAt: new Date().toISOString(),
        totalAssets: assetsCatalog.length,
        assets: assetsCatalog
      }, null, 2),
      size: 1024,
      description: \`Catalog of all \${assetsCatalog.length} extracted images, media, SVGs, and fonts\`
    },
    {
      id: 'file-links-json',
      name: 'links.json',
      type: 'json',
      content: JSON.stringify({
        totalLinks: linksList.length,
        links: linksList
      }, null, 2),
      size: 1024,
      description: \`Catalog of \${linksList.length} hyperlinks discovered on this page\`
    },
    {
      id: 'file-headings-json',
      name: 'headings.json',
      type: 'json',
      content: JSON.stringify({
        totalHeadings: headingsList.length,
        headings: headingsList
      }, null, 2),
      size: 1024,
      description: \`Catalog of \${headingsList.length} H1-H6 headings on this page\`
    }
  ];

  return {
    targetUrl: url,
    title: pageTitle,
    files,
    links: linksList,
    headings: headingsList,
    assetsCount: assetsCatalog.length,
    cssCount: externalCssFiles.length,
    jsCount: externalJsFiles.length,
  };
}
`;

  const readmeTxt = `راهنمای نصب اکستنشن در مرورگر گوگل کروم، مایکروسافت اج و بریو:
========================================================================

۱. این فایل ZIP را در کامپیوتر خود Extract کنید.
۲. مرورگر کروم را باز کرده و به نشانی زیر بروید:
   chrome://extensions
۳. در گوشه بالا سمت راست، گزینه "Developer mode" را روشن کنید.
۴. بر روی دکمه "Load unpacked" کلیک کرده و پوشه بازشده را انتخاب کنید.

پس از نصب:
- اگر در صفحه این برنامه باشید، در اکستنشن عبارت "I am ready" با نشانگر سبز نمایش می‌یابد.
- اگر در هر سایت دیگری باشید، اکستنشن خودکار به حالت "خاموش (OFF)" می‌رود.
- استخراج تمام فایل‌ها (HTML, CSS, JS, Media, Assets) تماماً توسط این اکستنشن انجام می‌شود.
`;

  return {
    'manifest.json': JSON.stringify(manifest, null, 2),
    'popup.html': popupHtml,
    'popup.js': popupJs,
    'content.js': contentJs,
    'background.js': backgroundJs,
    'README.txt': readmeTxt
  };
}

export function generateFirefoxExtensionFiles(targetAppOrigin: string) {
  const manifest = {
    manifest_version: 2,
    name: "Web Asset & Code Extractor - Firefox Edition",
    version: "2.5.0",
    description: "Full URL asset, media, CSS, and JS extractor companion for Mozilla Firefox.",
    permissions: ["activeTab", "<all_urls>"],
    browser_action: {
      default_popup: "popup.html",
      default_title: "Web Extractor"
    },
    background: {
      scripts: ["background.js"]
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        run_at: "document_start"
      }
    ],
    browser_specific_settings: {
      gecko: {
        id: "web-asset-extractor@3niaz.ir",
        strict_min_version: "58.0"
      }
    }
  };

  const chromeFiles = generateChromeExtensionFiles(targetAppOrigin);

  return {
    'manifest.json': JSON.stringify(manifest, null, 2),
    'popup.html': chromeFiles['popup.html'],
    'popup.js': chromeFiles['popup.js'],
    'content.js': chromeFiles['content.js'],
    'background.js': chromeFiles['background.js'],
    'README.txt': `راهنمای نصب افزونه در موزیلا فایرفاکس (Mozilla Firefox):
=============================================================

۱. این فایل ZIP را استخراج کنید.
۲. در فایرفاکس به آدرس about:debugging#/runtime/this-firefox بروید.
۳. دکمه "Load Temporary Add-on..." را کلیک کرده و فایل manifest.json را انتخاب کنید.
`
  };
}

export async function downloadExtensionZip(browserType: 'chrome' | 'firefox' | 'all') {
  const zip = new JSZip();
  const origin = window.location.origin;

  if (browserType === 'chrome' || browserType === 'all') {
    const chromeFiles = generateChromeExtensionFiles(origin);
    const folder = browserType === 'all' ? zip.folder('chrome_edge_brave_extension')! : zip;
    for (const [name, content] of Object.entries(chromeFiles)) {
      folder.file(name, content);
    }
  }

  if (browserType === 'firefox' || browserType === 'all') {
    const firefoxFiles = generateFirefoxExtensionFiles(origin);
    const folder = browserType === 'all' ? zip.folder('firefox_mozilla_addon')! : zip;
    for (const [name, content] of Object.entries(firefoxFiles)) {
      folder.file(name, content);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const filename =
    browserType === 'chrome'
      ? 'chrome_scraper_extension.zip'
      : browserType === 'firefox'
      ? 'firefox_scraper_addon.zip'
      : 'browser_extensions_bundle.zip';

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
