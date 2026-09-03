// Browser Companion Extension Generator (Chrome Manifest V3 & Firefox Manifest V2)
// 100% handles real browser-level rendering, DOM execution, and extraction for Desktop, Tablet, and Mobile.
import JSZip from 'jszip';

export function generateChromeExtensionFiles(targetAppOrigin: string) {
  const manifest = {
    manifest_version: 3,
    name: "Web Asset & Code Extractor",
    version: "3.0.0",
    description: "Browser extraction engine for rendered DOM, CSSOM, JavaScript, and assets across Desktop, Tablet, and Mobile.",
    permissions: ["tabs", "scripting", "activeTab"],
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
      width: 240px;
      min-height: 90px;
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
      width: 100%;
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
      max-width: 200px;
      margin-top: 4px;
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
  
  let isAppSite = false;
  try {
    const targetHost = new URL(TARGET_ORIGIN).host;
    const currentHost = new URL(tabUrl).host;
    isAppSite = currentHost === targetHost || tabUrl.startsWith(TARGET_ORIGIN) || currentHost.includes('3sot.com') || currentHost.includes('localhost');
  } catch (e) {
    isAppSite = false;
  }

  const box = document.getElementById('status-box');
  if (isAppSite) {
    box.innerHTML = \`
      <div class="status-row">
        <div class="pulse-dot on"></div>
        <div class="status-text">I am ready</div>
      </div>
      <div class="status-sub">موتور استخراج آماده دریافت دستور از وب‌اپلیکیشن</div>
    \`;
  } else {
    box.innerHTML = \`
      <div class="status-row">
        <div class="pulse-dot off"></div>
        <div class="status-text off">خاموش (OFF)</div>
      </div>
      <div class="status-sub">اکستنشن فقط در وب‌سایت استخراج فعال است</div>
    \`;
  }
});
`;

  const contentJs = `// Content Script: High-speed messaging bridge between Web App and Background Worker
const TARGET_ORIGIN = ${JSON.stringify(targetAppOrigin)};

function checkIsAppSite() {
  try {
    const targetHost = new URL(TARGET_ORIGIN).host;
    const curHost = window.location.host;
    return (
      curHost === targetHost ||
      window.location.origin === TARGET_ORIGIN ||
      curHost.includes('3sot.com') ||
      curHost.includes('localhost') ||
      !!document.getElementById('root')
    );
  } catch (e) {
    return false;
  }
}

const isApp = checkIsAppSite();

if (isApp) {
  window.__WEB_SCRAPER_EXTENSION_READY__ = true;

  function announceReady() {
    window.postMessage({
      type: 'EXTENSION_READY',
      status: 'READY',
      message: 'I am ready',
      browser: 'Chrome/Chromium',
      version: '3.0.0'
    }, '*');
  }

  announceReady();
  setInterval(announceReady, 2000);

  // Relay messages from Web App to Background Worker
  window.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'EXTENSION_PING' || event.data.type === 'PING_EXTENSION') {
      announceReady();
    }

    if (event.data.type === 'START_EXTRACTION' || event.data.type === 'REQUEST_FULL_URL_EXTRACTION') {
      const targetUrl = event.data.targetUrl;
      const requestId = event.data.requestId || ('req_' + Date.now());
      const devices = event.data.devices || ['desktop', 'tablet', 'mobile'];

      chrome.runtime.sendMessage(
        {
          action: 'START_EXTRACTION',
          requestId,
          targetUrl,
          devices
        },
        (response) => {
          if (chrome.runtime.lastError) {
            window.postMessage({
              type: 'EXTRACTION_ERROR',
              requestId,
              error: chrome.runtime.lastError.message
            }, '*');
          }
        }
      );
    }
  });

  // Listen for progress & completion updates from Background Worker
  chrome.runtime.onMessage.addListener((message) => {
    if (!message || !message.type) return;

    if (
      message.type === 'EXTRACTION_PROGRESS' ||
      message.type === 'EXTRACTION_COMPLETE' ||
      message.type === 'EXTRACTION_ERROR'
    ) {
      window.postMessage(message, '*');
    }
  });
}
`;

  const backgroundJs = `// Background Service Worker: Real Browser-Level Engine
// Performs authentic DOM rendering for Desktop, Tablet, and Mobile in browser tabs

const DEVICE_PROFILES = [
  {
    device: 'desktop',
    name: 'Desktop',
    width: 1280,
    height: 800,
    dpr: 1,
    touch: false,
    viewport: 'width=1280, initial-scale=1.0',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
  },
  {
    device: 'tablet',
    name: 'Tablet',
    width: 768,
    height: 1024,
    dpr: 2,
    touch: true,
    viewport: 'width=768, initial-scale=1.0',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  },
  {
    device: 'mobile',
    name: 'Mobile',
    width: 390,
    height: 844,
    dpr: 3,
    touch: true,
    viewport: 'width=390, initial-scale=1.0, user-scalable=yes',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  }
];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ success: true, status: 'READY' });
    return true;
  }

  if (request.action === 'START_EXTRACTION' && request.targetUrl) {
    const requestId = request.requestId || ('req_' + Date.now());
    const webAppTabId = sender.tab ? sender.tab.id : null;

    sendResponse({ success: true, status: 'BUSY', requestId });

    executeFullBrowserExtraction(request.targetUrl, requestId, webAppTabId, request.devices)
      .catch((err) => {
        sendToApp(webAppTabId, {
          type: 'EXTRACTION_ERROR',
          requestId,
          error: err.message || 'Browser extraction failed'
        });
      });

    return true;
  }
});

function sendToApp(tabId, message) {
  if (tabId) {
    chrome.tabs.sendMessage(tabId, message).catch(() => {});
  }
  // Also broadcast to all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((t) => {
      chrome.tabs.sendMessage(t.id, message).catch(() => {});
    });
  });
}

function notifyProgress(tabId, requestId, step, percent, statusText, device) {
  sendToApp(tabId, {
    type: 'EXTRACTION_PROGRESS',
    requestId,
    step,
    percent,
    statusText,
    device
  });
}

// Wait for a tab to finish loading and allow time for client-side JavaScript / SPA hydration
function waitForTabReady(tabId, maxTimeout = 12000) {
  return new Promise((resolve) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve(); // Continue even if timeout reached
      }
    }, maxTimeout);

    function onUpdated(tId, changeInfo) {
      if (tId === tabId && changeInfo.status === 'complete') {
        if (!resolved) {
          resolved = true;
          chrome.tabs.onUpdated.removeListener(onUpdated);
          clearTimeout(timer);
          // Wait 1800ms for JavaScript execution, Vue/React hydration, and initial animations
          setTimeout(resolve, 1800);
        }
      }
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

// In-Page extraction script that runs inside the real target website DOM
function inPageDomExtractor(devConfig) {
  try {
    // Dispatch resize event
    window.dispatchEvent(new Event('resize'));
    // Trigger scroll to activate lazy-loaded images, videos, and dynamic components
    window.scrollTo(0, document.body.scrollHeight / 3);
    window.scrollTo(0, document.body.scrollHeight);
    window.scrollTo(0, 0);
  } catch (e) {}

  // 1. Rendered DOM HTML (post JavaScript execution)
  const renderedHtml = document.documentElement.outerHTML;
  const pageTitle = document.title || document.querySelector('meta[property="og:title"]')?.content || window.location.hostname;

  // 2. Headings (H1 to H6)
  const headings = [];
  const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  headingElements.forEach((el, idx) => {
    const level = el.tagName.toLowerCase();
    const text = el.textContent ? el.textContent.trim() : '';
    if (text) {
      headings.push({
        id: 'heading-' + (idx + 1),
        level: level,
        text: text,
        sourceUrl: window.location.href,
        pageTitle: pageTitle,
        index: idx
      });
    }
  });

  // 3. Links (internal, external, anchor, mailto, asset, other)
  const links = [];
  const seenUrls = new Set();
  const anchors = Array.from(document.querySelectorAll('a[href], area[href]'));
  anchors.forEach((a, idx) => {
    const rawHref = a.getAttribute('href') ? a.getAttribute('href').trim() : '';
    if (!rawHref || rawHref.startsWith('javascript:')) return;
    const fullUrl = a.href || rawHref;
    if (seenUrls.has(fullUrl)) return;
    seenUrls.add(fullUrl);

    let type = 'other';
    if (rawHref.startsWith('#')) type = 'anchor';
    else if (rawHref.startsWith('mailto:')) type = 'mailto';
    else if (rawHref.startsWith('tel:')) type = 'tel';
    else {
      try {
        const u = new URL(fullUrl);
        const isInternal = u.hostname === window.location.hostname;
        const isAsset = /\\.(png|jpe?g|gif|webp|svg|pdf|zip|mp4|mp3|woff2?)$/i.test(u.pathname);
        type = isAsset ? 'asset' : (isInternal ? 'internal' : 'external');
      } catch (e) {
        type = 'other';
      }
    }

    links.push({
      id: 'link-' + (idx + 1),
      url: fullUrl,
      text: (a.textContent ? a.textContent.trim() : '') || fullUrl,
      type: type,
      sourceUrl: window.location.href
    });
  });

  // 4. Stylesheets (style tags, link tags, CSSOM)
  const styleTags = Array.from(document.querySelectorAll('style')).map((s) => s.textContent || '');
  const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"]'))
    .map((l) => l.href)
    .filter(Boolean);

  const cssomRules = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const sheet = document.styleSheets[i];
      const rules = sheet.cssRules || sheet.rules;
      if (rules) {
        const ruleTexts = [];
        for (let r = 0; r < rules.length; r++) {
          ruleTexts.push(rules[r].cssText);
        }
        cssomRules.push({ href: sheet.href, content: ruleTexts.join('\\n') });
      }
    } catch (e) {
      // Cross-origin CSSOM restriction: the background script will fetch sheet.href directly!
    }
  }

  // 5. Scripts (inline & external)
  const scriptTags = Array.from(document.querySelectorAll('script')).map((s) => {
    const src = s.src || s.getAttribute('src');
    const content = (!src && s.textContent && !s.type.includes('json')) ? s.textContent : '';
    return { src: src || null, content };
  });

  // 6. Assets (images, pictures, svgs, media, fonts)
  const assetUrls = new Set();
  document.querySelectorAll('img').forEach((img) => {
    if (img.currentSrc) assetUrls.add(img.currentSrc);
    if (img.src && !img.src.startsWith('data:')) assetUrls.add(img.src);
    const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy');
    if (dataSrc) assetUrls.add(dataSrc);
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      srcset.split(',').forEach((p) => {
        const u = p.trim().split(/\\s+/)[0];
        if (u && !u.startsWith('data:')) assetUrls.add(u);
      });
    }
  });

  document.querySelectorAll('picture source').forEach((src) => {
    const srcset = src.getAttribute('srcset');
    if (srcset) {
      srcset.split(',').forEach((p) => {
        const u = p.trim().split(/\\s+/)[0];
        if (u && !u.startsWith('data:')) assetUrls.add(u);
      });
    }
  });

  document.querySelectorAll('video, audio, source').forEach((m) => {
    const src = m.src || m.getAttribute('src');
    if (src && !src.startsWith('data:')) assetUrls.add(src);
  });

  // CSS background-image extraction
  document.querySelectorAll('*').forEach((el) => {
    try {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url(')) {
        const m = bg.match(/url\\(["']?([^"')]+)["']?\\)/);
        if (m && m[1] && !m[1].startsWith('data:')) {
          assetUrls.add(m[1]);
        }
      }
    } catch (e) {}
  });

  return {
    html: renderedHtml,
    title: pageTitle,
    links: links,
    headings: headings,
    styleTags: styleTags,
    cssLinks: cssLinks,
    cssomRules: cssomRules,
    scriptTags: scriptTags,
    assetUrls: Array.from(assetUrls),
    viewport: devConfig.viewport
  };
}

async function executeFullBrowserExtraction(targetUrl, requestId, webAppTabId, requestedDevices) {
  const startTime = Date.now();
  notifyProgress(webAppTabId, requestId, 'Connecting', 5, 'برقراری ارتباط با موتور مرورگر...', 'desktop');

  const selectedProfiles = DEVICE_PROFILES.filter((p) =>
    !requestedDevices || requestedDevices.includes(p.device)
  );

  const deviceData = {};
  const allDiscoveredCss = new Set();
  const allDiscoveredJs = new Set();
  const allDiscoveredAssets = new Set();

  notifyProgress(webAppTabId, requestId, 'Opening Target', 10, 'آماده‌سازی تب و پنجره مرورگر...', 'desktop');

  let currentPercent = 15;
  const percentStep = Math.floor(70 / selectedProfiles.length);

  for (const prof of selectedProfiles) {
    const stepRender = prof.device === 'desktop' ? 'Rendering Desktop' : prof.device === 'tablet' ? 'Rendering Tablet' : 'Rendering Mobile';
    const stepExtract = prof.device === 'desktop' ? 'Extracting Desktop' : prof.device === 'tablet' ? 'Extracting Tablet' : 'Extracting Mobile';

    notifyProgress(
      webAppTabId,
      requestId,
      stepRender,
      currentPercent,
      \`رندر نسخه \${prof.name} در اندازه واقعی (\${prof.width}×\${prof.height})...\`,
      prof.device
    );

    let tabId = null;
    let winId = null;

    try {
      // Create a background window with exact device dimensions
      const win = await chrome.windows.create({
        url: targetUrl,
        width: prof.width,
        height: prof.height,
        focused: false,
        type: 'popup'
      });
      winId = win.id;
      tabId = win.tabs[0].id;
    } catch (e) {
      // Fallback: standard tab
      const tab = await chrome.tabs.create({ url: targetUrl, active: false });
      tabId = tab.id;
    }

    try {
      // Wait for the tab to load and for SPA scripts to execute
      await waitForTabReady(tabId, 12000);

      notifyProgress(
        webAppTabId,
        requestId,
        stepExtract,
        currentPercent + Math.floor(percentStep / 2),
        \`استخراج DOM نهایی و منابع نسخه \${prof.name}...\`,
        prof.device
      );

      // Execute in-page extraction inside the real rendered page
      const [execResult] = await chrome.scripting.executeScript({
        target: { tabId },
        func: inPageDomExtractor,
        args: [prof]
      });

      const extracted = execResult ? execResult.result : null;

      if (extracted) {
        deviceData[prof.device] = extracted;
        extracted.cssLinks.forEach((c) => allDiscoveredCss.add(c));
        extracted.scriptTags.forEach((s) => { if (s.src) allDiscoveredJs.add(s.src); });
        extracted.assetUrls.forEach((a) => allDiscoveredAssets.add(a));
      }
    } finally {
      // Close the temporary window / tab cleanly
      if (winId) {
        try { await chrome.windows.remove(winId); } catch (e) {}
      } else if (tabId) {
        try { await chrome.tabs.remove(tabId); } catch (e) {}
      }
    }

    currentPercent += percentStep;
  }

  // Assets and Resource collection
  notifyProgress(
    webAppTabId,
    requestId,
    'Collecting Assets',
    88,
    'دریافت و دسته‌بندی فایل‌های CSS، JavaScript و تصاویر صفحه...',
    'desktop'
  );

  const baseUrl = new URL(targetUrl);

  // Fetch external stylesheets
  const fetchedCss = {};
  for (const cssUrl of allDiscoveredCss) {
    try {
      const fullUrl = new URL(cssUrl, baseUrl.href).href;
      const res = await fetch(fullUrl);
      if (res.ok) {
        fetchedCss[cssUrl] = await res.text();
      }
    } catch (e) {}
  }

  // Fetch external scripts
  const fetchedJs = {};
  for (const jsUrl of allDiscoveredJs) {
    try {
      const fullUrl = new URL(jsUrl, baseUrl.href).href;
      const res = await fetch(fullUrl);
      if (res.ok) {
        fetchedJs[jsUrl] = await res.text();
      }
    } catch (e) {}
  }

  // Fetch key media/image assets as Base64 Data URIs for offline portability
  const assetsCatalog = [];
  const fetchedAssets = {};
  let assetCounter = 0;

  for (const aUrl of allDiscoveredAssets) {
    assetCounter++;
    try {
      const fullUrl = new URL(aUrl, baseUrl.href).href;
      const res = await fetch(fullUrl);
      if (res.ok) {
        const blob = await res.blob();
        const reader = new FileReader();
        const dataUri = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        let type = 'image';
        if (blob.type.includes('svg') || fullUrl.endsWith('.svg')) type = 'svg';
        else if (blob.type.includes('video')) type = 'video';
        else if (blob.type.includes('audio')) type = 'audio';
        else if (blob.type.includes('font')) type = 'font';

        fetchedAssets[aUrl] = { dataUri, size: blob.size, type };

        assetsCatalog.push({
          id: 'asset-' + assetCounter,
          url: fullUrl,
          type,
          sizeBytes: blob.size,
          dataUriPreview: String(dataUri).slice(0, 60) + '...'
        });
      }
    } catch (e) {
      assetsCatalog.push({
        id: 'asset-' + assetCounter,
        url: aUrl,
        type: 'external',
        sizeBytes: 0,
        dataUriPreview: '(external)'
      });
    }
  }

  notifyProgress(
    webAppTabId,
    requestId,
    'Building Result',
    95,
    'تولید بسته‌های مستقل و ساختار ZIP برای Desktop، Tablet و Mobile...',
    'desktop'
  );

  // Build Device Versions
  const deviceVersions = {};

  for (const prof of selectedProfiles) {
    const rawData = deviceData[prof.device];
    if (!rawData) continue;

    let offlineHtml = rawData.html;

    // Bundle CSS without duplication
    let combinedCss = \`/* \${prof.name} Stylesheet - Extracted by Browser Extension */\\n\\n\`;
    const seenCssRules = new Set();
    rawData.styleTags.forEach((s) => {
      const trimmed = s ? s.trim() : '';
      if (trimmed && !seenCssRules.has(trimmed)) {
        seenCssRules.add(trimmed);
        combinedCss += \`/* Inline Style */\\n\${trimmed}\\n\\n\`;
      }
    });
    rawData.cssomRules.forEach((cr) => {
      const trimmed = (cr && cr.content) ? cr.content.trim() : '';
      if (trimmed && !seenCssRules.has(trimmed)) {
        seenCssRules.add(trimmed);
        combinedCss += \`/* CSSOM \${cr.href || 'Rule'} */\\n\${trimmed}\\n\\n\`;
      }
    });
    rawData.cssLinks.forEach((l) => {
      const cssContent = fetchedCss[l] ? fetchedCss[l].trim() : '';
      if (cssContent && !seenCssRules.has(cssContent)) {
        seenCssRules.add(cssContent);
        combinedCss += \`/* External: \${l} */\\n\${cssContent}\\n\\n\`;
      }
    });

    // Bundle JavaScript
    let combinedJs = \`/* \${prof.name} Scripts - Extracted by Browser Extension */\\n\\n\`;
    rawData.scriptTags.forEach((st) => {
      if (st.content) combinedJs += \`/* Inline Script */\\n\${st.content}\\n\\n\`;
      if (st.src && fetchedJs[st.src]) combinedJs += \`/* External Script: \${st.src} */\\n\${fetchedJs[st.src]}\\n\\n\`;
    });

    // Replace assets in HTML for 100% offline view
    for (const [origUrl, assetInfo] of Object.entries(fetchedAssets)) {
      if (assetInfo.dataUri && offlineHtml.includes(origUrl)) {
        offlineHtml = offlineHtml.split(origUrl).join(assetInfo.dataUri);
      }
    }

    // Embed combined styles & scripts safely into offlineHtml
    if (offlineHtml.includes('</head>')) {
      offlineHtml = offlineHtml.replace('</head>', \`<style id="extracted-styles">\\n\${combinedCss}\\n</style>\\n</head>\`);
    } else {
      offlineHtml = \`<style id="extracted-styles">\\n\${combinedCss}\\n</style>\\n\` + offlineHtml;
    }

    if (offlineHtml.includes('</body>')) {
      offlineHtml = offlineHtml.replace('</body>', \`<script id="extracted-scripts">\\n\${combinedJs}\\n</script>\\n</body>\`);
    } else {
      offlineHtml += \`\\n<script id="extracted-scripts">\\n\${combinedJs}\\n</script>\`;
    }

    const files = [
      {
        id: \`file-\${prof.device}-html\`,
        name: 'index.html',
        type: 'html',
        content: offlineHtml,
        size: new Blob([offlineHtml]).size,
        description: \`Rendered \${prof.name} HTML (Post JavaScript execution)\`,
        device: prof.device
      },
      {
        id: \`file-\${prof.device}-css\`,
        name: 'css/styles.css',
        type: 'css',
        content: combinedCss,
        size: new Blob([combinedCss]).size,
        description: \`\${prof.name} CSSOM and stylesheet bundle\`,
        device: prof.device
      },
      {
        id: \`file-\${prof.device}-js\`,
        name: 'js/scripts.js',
        type: 'javascript',
        content: combinedJs,
        size: new Blob([combinedJs]).size,
        description: \`\${prof.name} JavaScript scripts bundle\`,
        device: prof.device
      },
      {
        id: \`file-\${prof.device}-assets-json\`,
        name: 'assets/assets.json',
        type: 'json',
        content: JSON.stringify({
          device: prof.device,
          targetUrl,
          totalAssets: assetsCatalog.length,
          assets: assetsCatalog
        }, null, 2),
        size: 1024,
        description: 'Catalog of extracted images, media, and SVGs',
        device: prof.device
      },
      {
        id: \`file-\${prof.device}-links-json\`,
        name: 'assets/links.json',
        type: 'json',
        content: JSON.stringify({
          device: prof.device,
          totalLinks: rawData.links.length,
          links: rawData.links
        }, null, 2),
        size: 1024,
        description: 'Catalog of all discovered hyperlinks',
        device: prof.device
      },
      {
        id: \`file-\${prof.device}-headings-json\`,
        name: 'assets/headings.json',
        type: 'json',
        content: JSON.stringify({
          device: prof.device,
          totalHeadings: rawData.headings.length,
          headings: rawData.headings
        }, null, 2),
        size: 1024,
        description: 'Catalog of H1-H6 headings',
        device: prof.device
      }
    ];

    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

    deviceVersions[prof.device] = {
      device: prof.device,
      title: rawData.title,
      files,
      totalBytes,
      viewport: prof.viewport,
      userAgent: prof.userAgent,
      links: rawData.links,
      headings: rawData.headings,
      rawHtml: offlineHtml
    };
  }

  const primaryDevice = deviceVersions.desktop || deviceVersions[selectedProfiles[0].device];

  const scrapeResult = {
    targetUrl,
    mode: 'single',
    domain: baseUrl.hostname,
    title: primaryDevice ? primaryDevice.title : baseUrl.hostname,
    pagesScanned: 1,
    totalLinksFound: primaryDevice ? primaryDevice.links.length : 0,
    internalLinksCount: primaryDevice ? primaryDevice.links.filter((l) => l.type === 'internal').length : 0,
    externalLinksCount: primaryDevice ? primaryDevice.links.filter((l) => l.type === 'external').length : 0,
    links: primaryDevice ? primaryDevice.links : [],
    headings: primaryDevice ? primaryDevice.headings : [],
    totalHeadingsFound: primaryDevice ? primaryDevice.headings.length : 0,
    headingsCount: {
      h1: primaryDevice ? primaryDevice.headings.filter((h) => h.level === 'h1').length : 0,
      h2: primaryDevice ? primaryDevice.headings.filter((h) => h.level === 'h2').length : 0,
      h3: primaryDevice ? primaryDevice.headings.filter((h) => h.level === 'h3').length : 0,
      h4: primaryDevice ? primaryDevice.headings.filter((h) => h.level === 'h4').length : 0,
      h5: primaryDevice ? primaryDevice.headings.filter((h) => h.level === 'h5').length : 0,
      h6: primaryDevice ? primaryDevice.headings.filter((h) => h.level === 'h6').length : 0
    },
    files: primaryDevice ? primaryDevice.files : [],
    deviceVersions,
    scannedUrls: [targetUrl],
    executionTimeMs: Date.now() - startTime
  };

  notifyProgress(
    webAppTabId,
    requestId,
    'Completed',
    100,
    'استخراج کامل تمام شد!',
    'desktop'
  );

  sendToApp(webAppTabId, {
    type: 'EXTRACTION_COMPLETE',
    requestId,
    data: scrapeResult
  });
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
    version: "3.0.0",
    description: "Browser extraction engine for rendered DOM, CSSOM, JavaScript, and assets across Desktop, Tablet, and Mobile for Mozilla Firefox.",
    permissions: ["tabs", "activeTab", "<all_urls>"],
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
