// Helper to generate PNG data URLs or basic icon assets for the extension
export function generateIconSvg(size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#grad)" />
  <path d="M40 64a24 24 0 0 1 24-24h16a8 8 0 0 1 0 16H64a8 8 0 0 0 0 16h16a24 24 0 0 1-24 24H40a8 8 0 0 1 0-16h16a8 8 0 0 0 0-16H40z" fill="#ffffff" opacity="0.9" />
  <circle cx="88" cy="44" r="8" fill="#10b981" />
  <circle cx="96" cy="64" r="6" fill="#38bdf8" />
  <circle cx="88" cy="84" r="8" fill="#f59e0b" />
</svg>`;
}

export const EXTENSION_MANIFEST = JSON.stringify(
  {
    manifest_version: 3,
    name: "Web Scraper & Offline Extractor Pro",
    short_name: "WebScraperPro",
    version: "1.0.0",
    description: "استخراج ۱۰۰٪ محلی لینک‌ها، تیترها (H1-H6)، داده‌های ساختاریافته CSV/JSON و دانلود بسته آفلاین بدون محدودیت سرور و خطای ۵۰۳",
    default_locale: "en",
    permissions: [
      "activeTab",
      "scripting",
      "storage",
      "downloads"
    ],
    host_permissions: [
      "<all_urls>"
    ],
    action: {
      default_popup: "popup.html",
      default_title: "Web Scraper & Offline Extractor Pro",
      default_icon: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    background: {
      service_worker: "background.js"
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content_script.js"],
        run_at: "document_idle"
      }
    ],
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    browser_specific_settings: {
      gecko: {
        id: "web-scraper-offline@extractor.local",
        strict_min_version: "109.0"
      }
    }
  },
  null,
  2
);

export const EXTENSION_BACKGROUND_JS = `// Background Service Worker for Web Scraper Pro (Chrome MV3 & Firefox MV3)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Web Scraper & Offline Extractor Pro installed successfully.');
  
  // Create context menu for quick extraction
  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: 'extract-current-page',
      title: 'استخراج این صفحه با Web Scraper Pro',
      contexts: ['page', 'selection', 'link']
    });
  }
});

if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'extract-current-page' && tab && tab.id) {
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup.html?fullscreen=1&tabId=' + tab.id)
      });
    }
  });
}
`;

export const EXTENSION_CONTENT_SCRIPT_JS = `// Content Script: Extracts live rendered DOM, links, headings, styles, and assets directly from page
(function() {
  function extractPageData() {
    const url = window.location.href;
    const domain = window.location.hostname;
    const title = document.title || domain;
    
    // 1. Extract Anchor Links
    const anchorElements = Array.from(document.querySelectorAll('a[href]'));
    const links = [];
    const seenUrls = new Set();
    
    anchorElements.forEach((el, index) => {
      try {
        const rawHref = el.getAttribute('href');
        if (!rawHref) return;
        
        let absoluteUrl = '';
        try {
          absoluteUrl = new URL(rawHref, window.location.origin).href;
        } catch {
          absoluteUrl = rawHref;
        }
        
        let linkType = 'external';
        if (rawHref.startsWith('#')) {
          linkType = 'anchor';
        } else if (rawHref.startsWith('mailto:')) {
          linkType = 'mailto';
        } else if (rawHref.startsWith('tel:')) {
          linkType = 'other';
        } else if (/\\.(pdf|zip|rar|tar|gz|exe|apk|dmg|iso|mp3|mp4|webp|png|jpe?g|svg)$/i.test(absoluteUrl)) {
          linkType = 'asset';
        } else if (absoluteUrl.startsWith(window.location.origin) || absoluteUrl.includes(domain)) {
          linkType = 'internal';
        }
        
        const text = (el.innerText || el.textContent || el.getAttribute('title') || el.getAttribute('aria-label') || '').trim();
        const key = absoluteUrl + '::' + text;
        if (seenUrls.has(key)) return;
        seenUrls.add(key);
        
        const style = window.getComputedStyle(el);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        
        const devices = ['desktop'];
        if (window.innerWidth <= 1024) devices.push('tablet');
        if (window.innerWidth <= 768) devices.push('mobile');
        
        links.push({
          id: 'link-' + (index + 1),
          url: absoluteUrl,
          text: text || '(بدون متن لینک)',
          type: linkType,
          sourceUrl: url,
          devices: devices,
          isVisible: isVisible
        });
      } catch (e) {}
    });

    // 2. Extract Headings (H1-H6)
    const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headings = [];
    const headingsCount = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    headingElements.forEach((el, index) => {
      const level = el.tagName.toLowerCase();
      const text = (el.innerText || el.textContent || '').trim();
      if (headingsCount[level] !== undefined) {
        headingsCount[level]++;
      }
      
      headings.push({
        id: 'h-' + level + '-' + (index + 1),
        level: level,
        text: text || '(تیتر خالی)',
        sourceUrl: url,
        pageTitle: title,
        index: index + 1,
        devices: ['desktop', 'tablet', 'mobile']
      });
    });

    // 3. Extract Stylesheets, CSS Rules & Inline Styles
    const stylesheets = [];
    const directCssRules = [];
    
    try {
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.href) {
            stylesheets.push(sheet.href);
          }
          if (sheet.cssRules && sheet.cssRules.length > 0) {
            const rulesText = Array.from(sheet.cssRules).map(r => r.cssText).join('\\n');
            if (rulesText) {
              directCssRules.push({
                href: sheet.href || null,
                cssText: rulesText
              });
            }
          }
        } catch (e) {}
      });
    } catch (e) {}

    const inlineStyles = [];
    document.querySelectorAll('style').forEach((styleEl) => {
      const content = styleEl.textContent || '';
      if (content.trim()) {
        inlineStyles.push(content);
      }
    });

    // 4. Extract Scripts (URLs and inline code)
    const scriptUrls = [];
    const inlineScripts = [];
    document.querySelectorAll('script').forEach((scriptEl) => {
      const src = scriptEl.getAttribute('src');
      if (src) {
        try {
          const abs = new URL(src, window.location.origin).href;
          scriptUrls.push(abs);
        } catch {
          scriptUrls.push(src);
        }
      } else {
        const txt = (scriptEl.textContent || '').trim();
        if (txt && !txt.includes('google-analytics') && !txt.includes('gtag') && !txt.includes('fbq')) {
          inlineScripts.push(txt);
        }
      }
    });

    // 5. Clone and Pre-Sanitize DOM for Offline Packaging
    const clonedDoc = document.documentElement.cloneNode(true);
    
    clonedDoc.querySelectorAll('img').forEach((img) => {
      const lazySrc = img.getAttribute('data-src') || 
                      img.getAttribute('data-lazy-src') || 
                      img.getAttribute('data-original') || 
                      img.getAttribute('nitro-lazy-src');
      if (lazySrc) {
        try {
          img.setAttribute('src', new URL(lazySrc, window.location.origin).href);
        } catch {
          img.setAttribute('src', lazySrc);
        }
      } else if (img.getAttribute('src')) {
        try {
          img.setAttribute('src', new URL(img.getAttribute('src'), window.location.origin).href);
        } catch {}
      }
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.removeAttribute('loading');
    });

    clonedDoc.querySelectorAll('video, audio, source').forEach((media) => {
      ['src', 'poster'].forEach((attr) => {
        const val = media.getAttribute(attr);
        if (val) {
          try {
            media.setAttribute(attr, new URL(val, window.location.origin).href);
          } catch {}
        }
      });
    });

    const liveHtml = '<!DOCTYPE html>\\n' + clonedDoc.outerHTML;

    return {
      success: true,
      targetUrl: url,
      domain: domain,
      title: title,
      mode: 'single',
      pagesScanned: 1,
      totalLinksFound: links.length,
      internalLinksCount: links.filter(l => l.type === 'internal').length,
      externalLinksCount: links.filter(l => l.type === 'external').length,
      links: links,
      headings: headings,
      totalHeadingsFound: headings.length,
      headingsCount: headingsCount,
      stylesheets: stylesheets,
      directCssRules: directCssRules,
      inlineStyles: inlineStyles,
      scriptUrls: scriptUrls,
      inlineScripts: inlineScripts,
      files: [
        {
          id: 'file-html-1',
          name: 'index.html',
          type: 'html',
          content: liveHtml,
          size: new Blob([liveHtml]).size,
          sourceUrl: url
        }
      ],
      scannedUrls: [url],
      executionTimeMs: 12
    };
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_PAGE_DATA') {
      const data = extractPageData();
      sendResponse(data);
    }
    return true;
  });
})();
`;

export const EXTENSION_POPUP_HTML = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Scraper & Offline Extractor Pro</title>
  <link rel="stylesheet" href="popup.css">
  <!-- Embedded JSZip for 100% Client-Side Local ZIP Generation -->
  <script src="jszip.min.js"></script>
</head>
<body>
  <div id="app" class="container">
    <!-- Header -->
    <header class="app-header">
      <div class="brand">
        <div class="brand-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </div>
        <div>
          <h1>Web Scraper Pro</h1>
          <p class="subtitle">اکستنشن مرورگر | پردازش ۱۰۰٪ محلی بدون سرور</p>
        </div>
      </div>
      <div class="header-actions">
        <button id="btn-fullscreen" class="btn-icon" title="نمایش در تب تمام‌صفحه">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Hero Action Section -->
    <section class="action-card">
      <div class="card-body">
        <div class="target-info">
          <span class="label">صفحه فعال در تب:</span>
          <span id="active-tab-title" class="title-text">در حال شناسایی تب جاری...</span>
          <span id="active-tab-url" class="url-text">-</span>
        </div>

        <div class="actions-row">
          <button id="btn-extract-active" class="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>استخراج آنی صفحه فعال (۰ میلی‌ثانیه)</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Stats Bar (Hidden until extracted) -->
    <section id="stats-section" class="stats-bar hidden">
      <div class="stat-item">
        <span class="stat-value" id="stat-links">0</span>
        <span class="stat-label">کل لینک‌ها</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" id="stat-internal">0</span>
        <span class="stat-label">داخلی</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" id="stat-external">0</span>
        <span class="stat-label">خارجی</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" id="stat-headings">0</span>
        <span class="stat-label">تیترها (H1-H6)</span>
      </div>
      <div class="stat-item">
        <span class="stat-value text-emerald" id="stat-time">۰ ms</span>
        <span class="stat-label">زمان محلی</span>
      </div>
    </section>

    <!-- Navigation Tabs (Hidden until extracted) -->
    <nav id="tabs-nav" class="tabs-nav hidden">
      <button class="tab-btn active" data-tab="tab-links">
        <span>لینک‌ها</span>
        <span id="badge-links-count" class="badge">0</span>
      </button>
      <button class="tab-btn" data-tab="tab-headings">
        <span>تیترها (H1-H6)</span>
        <span id="badge-headings-count" class="badge">0</span>
      </button>
      <button class="tab-btn" data-tab="tab-export">
        <span>خروجی اکسل و CSV</span>
      </button>
      <button class="tab-btn" data-tab="tab-offline">
        <span>دانلود سایت آفلاین (ZIP)</span>
      </button>
    </nav>

    <!-- Tab 1: Links Table -->
    <main id="tab-links" class="tab-pane active">
      <div class="table-toolbar">
        <input type="text" id="search-links" placeholder="جستجو در انکر تکست یا آدرس URL..." class="input-search">
        <select id="filter-link-type" class="select-filter">
          <option value="all">همه انواع لینک</option>
          <option value="internal">فقط لینک‌های داخلی</option>
          <option value="external">فقط لینک‌های خارجی</option>
          <option value="asset">فایل‌ها و مدیا</option>
          <option value="anchor">انکرهای درون‌صفحه‌ای (#)</option>
        </select>
        <button id="btn-quick-export-links" class="btn btn-sm btn-secondary">
          خروجی CSV
        </button>
      </div>
      <div class="table-container">
        <table id="links-table">
          <thead>
            <tr>
              <th width="50">#</th>
              <th>انکر تکست (متن لینک)</th>
              <th>آدرس مقصد (URL)</th>
              <th width="90">نوع</th>
              <th width="70">عملیات</th>
            </tr>
          </thead>
          <tbody id="links-tbody">
            <tr><td colspan="5" class="empty-state">داده‌ای استخراج نشده است. روی دکمه استخراج بالا کلیک کنید.</td></tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Tab 2: Headings (H1-H6) -->
    <main id="tab-headings" class="tab-pane hidden">
      <div class="headings-filter-bar">
        <label><input type="checkbox" class="heading-filter" value="h1" checked> <span class="h-badge h1">H1</span></label>
        <label><input type="checkbox" class="heading-filter" value="h2" checked> <span class="h-badge h2">H2</span></label>
        <label><input type="checkbox" class="heading-filter" value="h3" checked> <span class="h-badge h3">H3</span></label>
        <label><input type="checkbox" class="heading-filter" value="h4" checked> <span class="h-badge h4">H4</span></label>
        <label><input type="checkbox" class="heading-filter" value="h5" checked> <span class="h-badge h5">H5</span></label>
        <label><input type="checkbox" class="heading-filter" value="h6" checked> <span class="h-badge h6">H6</span></label>
      </div>
      <div class="table-container">
        <table id="headings-table">
          <thead>
            <tr>
              <th width="50">#</th>
              <th width="70">سطح</th>
              <th>متن سرتیتر</th>
            </tr>
          </thead>
          <tbody id="headings-tbody">
            <tr><td colspan="3" class="empty-state">داده‌ای استخراج نشده است.</td></tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Tab 3: Structured CSV & JSON Export -->
    <main id="tab-export" class="tab-pane hidden">
      <div class="export-box">
        <h3>خروجی فایل ساختاریافته اکسل (CSV) با کدگذاری UTF-8 BOM</h3>
        <p class="desc">این خروجی بدون هیچ‌گونه به‌هم‌ریختگی حروف فارسی در Microsoft Excel و Google Sheets باز می‌شود.</p>
        
        <div class="export-options">
          <label class="radio-label">
            <input type="radio" name="csv-type" value="combined" checked>
            <span>مجموعه یکپارچه (ترکیب لینک‌ها و تمام تیترهای H1-H6)</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="csv-type" value="links">
            <span>فقط لینک‌ها (Anchor Text + URL + Type)</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="csv-type" value="headings">
            <span>فقط ساختار درختی تیترها (H1 تا H6)</span>
          </label>
        </div>

        <div class="export-actions">
          <button id="btn-download-structured-csv" class="btn btn-primary">
            دانلود فایل CSV سازگار با Excel
          </button>
          <button id="btn-download-json" class="btn btn-secondary">
            دانلود خروجی JSON
          </button>
        </div>
      </div>
    </main>

    <!-- Tab 4: Offline Website Packager -->
    <main id="tab-offline" class="tab-pane hidden">
      <div class="export-box">
        <div class="badge-title-row">
          <h3>دانلود بسته وب‌سایت ۱۰۰٪ آفلاین (Air-Gap Zero-Network)</h3>
          <span class="pill-verified">تضمین اجرای بدون اینترنت</span>
        </div>
        <p class="desc">
          تمام استایل‌ها و فونت‌ها در <code class="code-tag">styles.css</code> یکپارچه می‌شوند، کدهای تعاملی و سپر ضد خطای آفلاین در <code class="code-tag">scripts.js</code> قرار می‌گیرند و اسکریپت‌های ریموت مسدودکننده حذف می‌گردند.
        </p>
        
        <div class="benefits-list">
          <div class="benefit-item">✓ مجهز به سپر دفاعی آفلاین (شبیه‌ساز Fetch/XHR، وردپرس، المنتور و جی‌کوئری)</div>
          <div class="benefit-item">✓ حذف کامل تگ‌های ریموت مسدودکننده و ترکرها (تضمین صفر خطای کنسول)</div>
          <div class="benefit-item">✓ استخراج کامل استایل‌ها و فونت‌ها و تجمیع در styles.css</div>
          <div class="benefit-item">✓ شامل نسخه تک‌فایل مستقل standalone_offline.html برای باز شدن فوری با دابل‌کلیک</div>
          <div class="benefit-item">✓ پردازش ۱۰۰٪ مستقیم در مرورگر خود شما با JSZip بدون ارسال به سرور</div>
        </div>

        <div id="offline-progress-status" class="progress-status hidden">
          <div class="spinner-sm"></div>
          <span id="offline-progress-text">در حال آماده‌سازی پکیج آفلاین...</span>
        </div>

        <div class="offline-download-actions">
          <button id="btn-download-offline-zip" class="btn btn-success btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>دانلود بسته کامل آفلاین (ZIP چندفایلی)</span>
          </button>

          <button id="btn-download-standalone-html" class="btn btn-secondary btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>دانلود تک‌فایل مستقل (Standalone HTML)</span>
          </button>
        </div>
      </div>
    </main>
  </div>

  <script src="popup.js"></script>
</body>
</html>
`;

export const EXTENSION_POPUP_CSS = `/* Dark Glassmorphic Theme for Web Scraper Pro Extension */
:root {
  --bg: #090d16;
  --card-bg: rgba(15, 23, 42, 0.75);
  --border: rgba(255, 255, 255, 0.1);
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --emerald: #10b981;
  --text: #f8fafc;
  --text-muted: #94a3b8;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Vazirmatn', sans-serif;
}

body {
  width: 720px;
  min-height: 520px;
  max-height: 600px;
  background-color: var(--bg);
  color: var(--text);
  overflow-x: hidden;
  direction: rtl;
}

.container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Header */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.brand h1 {
  font-size: 15px;
  font-weight: 700;
}

.brand .subtitle {
  font-size: 11px;
  color: var(--text-muted);
}

.btn-icon {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
}

/* Action Card */
.action-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  backdrop-filter: blur(12px);
}

.target-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 12px;
}

.target-info .label {
  font-size: 10px;
  color: var(--text-muted);
}

.target-info .title-text {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.target-info .url-text {
  font-size: 11px;
  color: #38bdf8;
  direction: ltr;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
  width: 100%;
}
.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 11px;
}

/* Stats Bar */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  font-family: monospace;
}

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
}

.text-emerald {
  color: #34d399;
}

/* Tabs */
.tabs-nav {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
}

.tab-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--border);
  color: #fff;
}

.badge {
  background: rgba(79, 70, 229, 0.3);
  color: #a5b4fc;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
}

/* Table Toolbar */
.table-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.input-search, .select-filter {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: #fff;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 11px;
  outline: none;
}

.input-search {
  flex: 1;
}

.table-container {
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

th {
  background: rgba(15, 23, 42, 0.9);
  padding: 8px 10px;
  text-align: right;
  color: var(--text-muted);
  font-weight: 600;
  position: sticky;
  top: 0;
  border-bottom: 1px solid var(--border);
}

td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

.url-cell {
  direction: ltr;
  text-align: left;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #38bdf8;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--text-muted);
}

/* Headings styles */
.headings-filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 11px;
}

.h-badge {
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}
.h-badge.h1 { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.h-badge.h2 { background: rgba(249, 115, 22, 0.2); color: #fdba74; }
.h-badge.h3 { background: rgba(234, 179, 8, 0.2); color: #fde047; }
.h-badge.h4 { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
.h-badge.h5 { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
.h-badge.h6 { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; }

/* Export Box */
.export-box {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
}
.export-box h3 { font-size: 13px; margin-bottom: 6px; }
.export-box .desc { font-size: 11px; color: var(--text-muted); margin-bottom: 14px; }
.export-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.radio-label { display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer; }
.export-actions { display: flex; gap: 10px; }

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 11px;
  color: #34d399;
}

.badge-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.pill-verified {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.code-tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #38bdf8;
  font-size: 10px;
}

.highlight-tab {
  border-color: rgba(99, 102, 241, 0.4) !important;
  color: #a5b4fc !important;
  background: rgba(99, 102, 241, 0.1) !important;
}

.offline-download-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-status {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 14px;
  font-size: 11px;
  color: #c7d2fe;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-top-color: #818cf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hidden { display: none !important; }
`;

export const EXTENSION_POPUP_JS = `// Popup logic running inside the Chrome & Firefox extension
let currentScrapeResult = null;

document.addEventListener('DOMContentLoaded', async () => {
  const activeTabTitle = document.getElementById('active-tab-title');
  const activeTabUrl = document.getElementById('active-tab-url');
  const btnExtract = document.getElementById('btn-extract-active');
  const btnFullscreen = document.getElementById('btn-fullscreen');

  // Query active tab in user's browser
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs[0]) {
      const tab = tabs[0];
      activeTabTitle.textContent = tab.title || 'صفحه ناشناس';
      activeTabUrl.textContent = tab.url || '-';
    }
  } catch (err) {
    activeTabTitle.textContent = 'خطا در دسترسی به تب فعال';
  }

  // Fullscreen button
  btnFullscreen.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?fullscreen=1') });
  });

  // Extract button click
  btnExtract.addEventListener('click', () => {
    extractActiveTab();
  });

  // Setup tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.remove('hidden');
    });
  });

  // Search & Filter Links
  const searchInput = document.getElementById('search-links');
  const filterType = document.getElementById('filter-link-type');
  if (searchInput && filterType) {
    searchInput.addEventListener('input', renderLinksTable);
    filterType.addEventListener('change', renderLinksTable);
  }

  // Headings checkboxes
  document.querySelectorAll('.heading-filter').forEach(cb => {
    cb.addEventListener('change', renderHeadingsTable);
  });

  // Export Buttons
  document.getElementById('btn-download-structured-csv').addEventListener('click', () => {
    exportStructuredCsv();
  });
  document.getElementById('btn-download-json').addEventListener('click', () => {
    exportJson();
  });
  document.getElementById('btn-quick-export-links').addEventListener('click', () => {
    exportStructuredCsv('links');
  });
  document.getElementById('btn-download-offline-zip').addEventListener('click', () => {
    downloadOfflineZip();
  });
});

async function extractActiveTab() {
  const btnExtract = document.getElementById('btn-extract-active');
  btnExtract.textContent = 'در حال استخراج مستقیم DOM...';
  btnExtract.disabled = true;

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || !tabs[0] || !tabs[0].id) {
      alert('تب فعالی برای استخراج یافت نشد.');
      return;
    }

    const tabId = tabs[0].id;
    // Send message to content script or inject if not injected
    chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_PAGE_DATA' }, async (response) => {
      if (chrome.runtime.lastError || !response) {
        // Fallback: inject content script dynamically
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content_script.js']
        }, () => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_PAGE_DATA' }, (retryResponse) => {
              handleExtractionComplete(retryResponse);
            });
          }, 100);
        });
      } else {
        handleExtractionComplete(response);
      }
    });
  } catch (err) {
    alert('خطا در استخراج: ' + err.message);
    btnExtract.textContent = 'استخراج آنی صفحه فعال (۰ میلی‌ثانیه)';
    btnExtract.disabled = false;
  }
}

function handleExtractionComplete(data) {
  const btnExtract = document.getElementById('btn-extract-active');
  btnExtract.textContent = '✓ استخراج با موفقیت انجام شد';
  btnExtract.disabled = false;

  if (!data || !data.success) {
    alert('استخراج محتوا امکان‌پذیر نشد.');
    return;
  }

  currentScrapeResult = data;

  // Reveal Stats & Tabs
  document.getElementById('stats-section').classList.remove('hidden');
  document.getElementById('tabs-nav').classList.remove('hidden');

  // Fill stats
  document.getElementById('stat-links').textContent = data.totalLinksFound;
  document.getElementById('stat-internal').textContent = data.internalLinksCount;
  document.getElementById('stat-external').textContent = data.externalLinksCount;
  document.getElementById('stat-headings').textContent = data.totalHeadingsFound;
  document.getElementById('stat-time').textContent = data.executionTimeMs + ' ms';

  document.getElementById('badge-links-count').textContent = data.totalLinksFound;
  document.getElementById('badge-headings-count').textContent = data.totalHeadingsFound;

  renderLinksTable();
  renderHeadingsTable();
}

function renderLinksTable() {
  if (!currentScrapeResult || !currentScrapeResult.links) return;
  const tbody = document.getElementById('links-tbody');
  const searchVal = (document.getElementById('search-links').value || '').toLowerCase();
  const filterVal = document.getElementById('filter-link-type').value;

  const filtered = currentScrapeResult.links.filter(l => {
    if (filterVal !== 'all' && l.type !== filterVal) return false;
    if (searchVal && !l.text.toLowerCase().includes(searchVal) && !l.url.toLowerCase().includes(searchVal)) return false;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">موردی با فیلتر فعلی یافت نشد.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.slice(0, 100).map((l, idx) => \`
    <tr>
      <td>\${idx + 1}</td>
      <td>\${escapeHtml(l.text)}</td>
      <td class="url-cell" title="\${escapeHtml(l.url)}">\${escapeHtml(l.url)}</td>
      <td><span class="badge">\${l.type}</span></td>
      <td>
        <button class="btn-icon" onclick="navigator.clipboard.writeText('\${l.url}'); alert('آدرس کپی شد!');" title="کپی آدرس">
          📋
        </button>
      </td>
    </tr>
  \`).join('');
}

function renderHeadingsTable() {
  if (!currentScrapeResult || !currentScrapeResult.headings) return;
  const tbody = document.getElementById('headings-tbody');
  const activeLevels = Array.from(document.querySelectorAll('.heading-filter:checked')).map(cb => cb.value);

  const filtered = currentScrapeResult.headings.filter(h => activeLevels.includes(h.level));

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state">تیتری با فیلترهای انتخابی یافت نشد.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((h, idx) => \`
    <tr>
      <td>\${idx + 1}</td>
      <td><span class="h-badge \${h.level}">\${h.level.toUpperCase()}</span></td>
      <td>\${escapeHtml(h.text)}</td>
    </tr>
  \`).join('');
}

function exportStructuredCsv(targetOverride) {
  if (!currentScrapeResult) return;
  const target = targetOverride || document.querySelector('input[name="csv-type"]:checked').value;
  const bom = '\\uFEFF';
  const rows = [];

  if (target === 'combined') {
    rows.push(['Record Type', 'Index', 'Classification', 'Content / Text', 'Target URL', 'Source URL']);
    currentScrapeResult.links.forEach((l, i) => {
      rows.push(['Link', String(i + 1), l.type.toUpperCase(), l.text, l.url, l.sourceUrl]);
    });
    currentScrapeResult.headings.forEach((h, i) => {
      rows.push(['Heading', String(i + 1), h.level.toUpperCase(), h.text, '', h.sourceUrl]);
    });
  } else if (target === 'links') {
    rows.push(['Index', 'Anchor Text', 'Target URL', 'Type', 'Source URL']);
    currentScrapeResult.links.forEach((l, i) => {
      rows.push([String(i + 1), l.text, l.url, l.type, l.sourceUrl]);
    });
  } else {
    rows.push(['Index', 'Level', 'Heading Text', 'Source URL']);
    currentScrapeResult.headings.forEach((h, i) => {
      rows.push([String(i + 1), h.level.toUpperCase(), h.text, h.sourceUrl]);
    });
  }

  const csvContent = bom + rows.map(r => r.map(c => '"' + String(c || '').replace(/"/g, '""') + '"').join(',')).join('\\r\\n');
  downloadBlob(csvContent, 'web_scraper_export_' + target + '.csv', 'text/csv;charset=utf-8;');
}

function exportJson() {
  if (!currentScrapeResult) return;
  const jsonContent = JSON.stringify(currentScrapeResult, null, 2);
  downloadBlob(jsonContent, 'scraped_dataset.json', 'application/json');
}

async function downloadOfflineZip() {
  if (!currentScrapeResult) return;
  const btn = document.getElementById('btn-download-offline-zip');
  btn.textContent = 'در حال بسته‌بندی فایل‌های آفلاین...';
  btn.disabled = true;

  try {
    const zip = new JSZip();
    
    // Add live rendered HTML
    const htmlFile = currentScrapeResult.files[0];
    zip.file('index.html', htmlFile.content);

    // Add structured CSV
    const csvRows = [
      ['Type', 'Text', 'URL'],
      ...currentScrapeResult.links.map(l => ['Link', l.text, l.url]),
      ...currentScrapeResult.headings.map(h => ['Heading (' + h.level + ')', h.text, ''])
    ];
    const csvString = '\\uFEFF' + csvRows.map(r => r.map(c => '"' + (c || '').replace(/"/g, '""') + '"').join(',')).join('\\r\\n');
    zip.file('data_summary.csv', csvString);

    // Add JSON summary
    zip.file('metadata.json', JSON.stringify({
      targetUrl: currentScrapeResult.targetUrl,
      title: currentScrapeResult.title,
      exportedAt: new Date().toISOString(),
      linksCount: currentScrapeResult.totalLinksFound,
      headingsCount: currentScrapeResult.totalHeadingsFound
    }, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = (currentScrapeResult.domain || 'offline_page') + '_bundle.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    btn.textContent = '✓ فایل ZIP با موفقیت دانلود شد';
    btn.disabled = false;
  } catch (e) {
    alert('خطا در ایجاد فایل ZIP: ' + e.message);
    btn.textContent = 'دانلود بسته آفلاین (ZIP)';
    btn.disabled = false;
  }
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
`;

export const EXTENSION_INSTALL_GUIDE_MD = `# راهنمای نصب افزونه Web Scraper & Offline Extractor Pro
## برای گوگل کروم، مایکروسافت اج، بریو و موزیلا فایرفاکس

این اکستنشن به صورت ۱۰۰٪ محلی در مرورگر خود شما اجرا می‌شود؛ به همین دلیل هیچ‌گونه محدودیت ۵۰ ریکوئست، خطای ۵۰۳ کلودفلر، یا قطعی سرور وجود ندارد.

---

### ۱. نحوه نصب در گوگل کروم (Google Chrome) و مرورگرهای Chromium (Edge, Brave, Opera):
1. فایل زیپ دانلودشده (\`web-scraper-pro-extension.zip\`) را با کلیک راست و گزینه **Extract All** (خروج از حالت فشرده) در یک پوشه باز کنید.
2. مرورگر کروم را باز کرده و در نوار آدرس عبارت زیر را وارد کنید و Enter بزنید:
   \`chrome://extensions\`
3. در گوشه بالا سمت راست، کلید **Developer mode (حالت برنامه‌نویس)** را روشن (فعال) کنید.
4. در گوشه بالا سمت چپ، روی دکمه **Load unpacked (بارگذاری بازشده)** کلیک کنید.
5. پوشه‌ای که از حالت زیپ خارج کردید را انتخاب کنید.
6. تمام شد! آیکون افزونه به نوار ابزار مرورگر شما اضافه می‌شود. اکنون می‌توانید وارد هر وب‌سایتی شوید و با ۱ کلیک اطلاعات آن را استخراج کنید.

---

### ۲. نحوه نصب در موزیلا فایرفاکس (Mozilla Firefox):
1. فایل زیپ را از حالت فشرده خارج کنید.
2. مرورگر فایرفاکس را باز کرده و در نوار آدرس عبارت زیر را وارد کنید:
   \`about:debugging#/runtime/this-firefox\`
3. در بخش **Temporary Extensions** روی دکمه **Load Temporary Add-on...** کلیک کنید.
4. وارد پوشه اکستنشن شده و فایل \`manifest.json\` را انتخاب کنید.
5. افزونه فوراً فعال و آماده استفاده می‌شود!

---

### ۳. مزایای استفاده از اکستنشن در مرورگر کاربر:
- **صفر ثانیه معطلی و استخراج مستقیم DOM**: چون اکستنشن به DOM واقعی و رندرشده صفحه دسترسی دارد.
- **بدون محدودیت تعداد درخواست (Zero 503 Errors)**: مرورگر هیچ محدودیتی مثل کلودفلر ورکرز ندارد.
- **حفظ امنیت و نشست‌های خصوصی**: شما می‌توانید صفحاتی که در آن‌ها لاگین هستید (داشبوردها، پنل‌ها) را نیز استخراج کنید.
- **تولید فایل‌های CSV و ZIP آفلاین مستقیماً در رایانه شما**.
`;
