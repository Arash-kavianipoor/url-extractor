import JSZip from 'jszip';
import { ExtractedFile, ScrapedLink, ScrapedHeading, HeadingLevel, CrawlMode, DeviceType, DeviceVersion } from '../types.js';

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function downloadFile(filename: string, content: string, mimeType = 'text/plain') {
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

// Helper to safely instantiate JSZip across all bundlers (Vite, Rollup, Cloudflare Pages)
function createZipInstance() {
  const ctor = (JSZip as any)?.default || JSZip;
  return new ctor();
}

export async function downloadZip(
  files: ExtractedFile[],
  zipName = 'offline_website_package.zip',
  mode: CrawlMode = 'single'
) {
  const zip = createZipInstance();

  if (mode === 'single') {
    // Single page mode: Root MUST contain HTML, CSS, JS completely and cleanly!
    const htmlFile =
      files.find((f) => f.name === 'index.html') ||
      files.find((f) => f.type === 'html' && f.name !== 'links_report.html' && f.name !== 'standalone_offline.html');
    const cssFile = files.find((f) => f.name === 'styles.css');
    const jsFile = files.find((f) => f.name === 'scripts.js');

    if (htmlFile) {
      zip.file('index.html', htmlFile.content);
    }
    if (cssFile) {
      zip.file('styles.css', cssFile.content);
    }
    if (jsFile) {
      zip.file('scripts.js', jsFile.content);
    }

    // Include standalone offline single-file HTML (100% inlined with Base64 media & embedded styles/scripts)
    const inlinedStandalone = generateFullyInlinedHtml(files);
    zip.file('standalone_offline.html', inlinedStandalone);

    // Reports and JSON data separated into reports/
    const reports = files.filter(
      (f) =>
        f.name === 'links_report.html' ||
        f.name.endsWith('.json') ||
        (f.name.endsWith('.txt') && !f.name.includes('README'))
    );
    for (const report of reports) {
      const cleanName = report.name.replace(/^.*[\\/]/, '');
      zip.file(`reports/${cleanName}`, report.content);
    }

    // Include all other files (assets, images, fonts, media, etc.)
    const otherFiles = files.filter(
      (f) =>
        f.name !== 'index.html' &&
        f.name !== 'styles.css' &&
        f.name !== 'scripts.js' &&
        f.name !== 'standalone_offline.html' &&
        !reports.includes(f)
    );
    for (const file of otherFiles) {
      zip.file(file.name, file.content);
    }
  } else {
    // Multi-page crawl mode ('all'): Maintain dedicated, separated folder structure for each page/link
    const stylesFile = files.find((f) => f.name === 'styles.css');
    const scriptsFile = files.find((f) => f.name === 'scripts.js');
    const htmlPages = files.filter(
      (f) => f.type === 'html' && f.name !== 'links_report.html' && f.name !== 'standalone_offline.html'
    );

    // 1. Root files: all HTML pages (index.html, page_1.html, etc.), styles.css, scripts.js
    htmlPages.forEach((file) => {
      zip.file(file.name, file.content);
    });
    if (stylesFile) {
      zip.file('styles.css', stylesFile.content);
    }
    if (scriptsFile) {
      zip.file('scripts.js', scriptsFile.content);
    }
    const standalone = files.find((f) => f.name === 'standalone_offline.html');
    if (standalone) {
      zip.file('standalone_offline.html', standalone.content);
    }

    // 2. Dedicated folder for EACH scanned page/link: pages/01_home/, pages/02_about/, etc.
    htmlPages.forEach((file, index) => {
      const pageIndex = (index + 1).toString().padStart(2, '0');
      let baseSlug = file.name.replace(/\.html$/i, '').replace(/^.*[\\/]/, '');
      if (baseSlug === 'index' || index === 0) {
        baseSlug = 'home';
      }
      const pageFolderName = `pages/${pageIndex}_${baseSlug}`;

      // Place the page's HTML inside its dedicated folder
      zip.file(`${pageFolderName}/index.html`, file.content);

      // Include self-contained styles and scripts in each page folder
      if (stylesFile) {
        zip.file(`${pageFolderName}/styles.css`, stylesFile.content);
      }
      if (scriptsFile) {
        zip.file(`${pageFolderName}/scripts.js`, scriptsFile.content);
      }
    });

    // 3. Dedicated visual Page Directory (pages/index.html) to navigate all separated links
    const pagesDirectoryHtml = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extracted Pages Directory</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; margin: 0; direction: ltr; text-align: left; }
    .container { max-width: 800px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 2rem; border: 1px solid #334155; }
    h1 { color: #38bdf8; font-size: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid #334155; padding-bottom: 1rem; }
    .page-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .page-item { display: flex; align-items: center; justify-content: space-between; background: #0f172a; padding: 1rem 1.25rem; border-radius: 10px; border: 1px solid #334155; }
    .page-link { color: #f8fafc; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 0.75rem; }
    .btn { background: #38bdf8; color: #0f172a; padding: 0.45rem 1.1rem; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.85rem; }
    .btn:hover { background: #7dd3fc; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Extracted Pages Directory</h1>
    <ul class="page-list">
      ${htmlPages
        .map((file, index) => {
          const pageIndex = (index + 1).toString().padStart(2, '0');
          let baseSlug = file.name.replace(/\.html$/i, '').replace(/^.*[\\/]/, '');
          if (baseSlug === 'index' || index === 0) baseSlug = 'home';
          const folder = `${pageIndex}_${baseSlug}`;
          return `<li class="page-item">
            <span class="page-link">📁 Folder ${pageIndex} : ${baseSlug}</span>
            <a class="btn" href="./${folder}/index.html">View Page</a>
          </li>`;
        })
        .join('\n      ')}
    </ul>
    <p style="margin-top: 2rem; font-size: 0.85rem; color: #94a3b8; text-align: center;">
      All pages and extracted links have been packaged into structured folders with full local CSS and JS assets.
    </p>
  </div>
</body>
</html>`;
    zip.file('pages/index.html', pagesDirectoryHtml);

    // 4. Dedicated reports folder
    const reports = files.filter(
      (f) =>
        f.name === 'links_report.html' ||
        f.name.endsWith('.json') ||
        f.name.endsWith('.txt')
    );
    for (const report of reports) {
      const cleanName = report.name.replace(/^.*[\\/]/, '');
      zip.file(`reports/${cleanName}`, report.content);
    }
  }

  // Maximum ZIP compression (DEFLATE level 9)
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadAllDevicesBundle(
  deviceVersions: Record<DeviceType, DeviceVersion>,
  zipName = 'all_devices_bundle.zip',
  mode: CrawlMode = 'single',
  domain = 'website'
) {
  const zip = createZipInstance();

  const devices: DeviceType[] = ['desktop', 'tablet', 'mobile'];
  for (const dev of devices) {
    const devData = deviceVersions[dev];
    if (!devData || !devData.files) continue;
    const folder = dev;
    const files = devData.files;

    const stylesFile = files.find((f) => f.name === 'styles.css');
    const scriptsFile = files.find((f) => f.name === 'scripts.js');
    const htmlFiles = files.filter((f) => f.type === 'html' && f.name !== 'links_report.html' && f.name !== 'standalone_offline.html');
    const homeHtml = files.find((f) => f.name === 'index.html') || htmlFiles[0];

    // Always include index.html, styles.css, scripts.js at the root of the device folder
    if (homeHtml) {
      zip.file(`${folder}/index.html`, homeHtml.content);
    }
    if (stylesFile) {
      zip.file(`${folder}/styles.css`, stylesFile.content);
    }
    if (scriptsFile) {
      zip.file(`${folder}/scripts.js`, scriptsFile.content);
    }

    const inlinedStandalone = generateFullyInlinedHtml(files, domain);
    zip.file(`${folder}/standalone_offline.html`, inlinedStandalone);

    if (mode === 'all') {
      // Full site mode: create separated folders for each page
      htmlFiles.forEach((file, index) => {
        const pageIndex = (index + 1).toString().padStart(2, '0');
        let baseSlug = file.name.replace(/\.html$/i, '').replace(/^.*[\\/]/, '');
        if (baseSlug === 'index' || index === 0) baseSlug = 'home';
        const pageFolderName = `${folder}/pages/${pageIndex}_${baseSlug}`;

        zip.file(`${pageFolderName}/index.html`, file.content);
        if (stylesFile) zip.file(`${pageFolderName}/styles.css`, stylesFile.content);
        if (scriptsFile) zip.file(`${pageFolderName}/scripts.js`, scriptsFile.content);
      });
    }
  }

  // Reports folder from available device files
  const baseFiles = deviceVersions.desktop?.files || deviceVersions.mobile?.files || [];
  const reports = baseFiles.filter(
    (f) => f.name === 'links_report.html' || f.name.endsWith('.json')
  );
  for (const report of reports) {
    const cleanName = report.name.replace(/^.*[\\/]/, '');
    zip.file(`reports/${cleanName}`, report.content);
  }

  // Generate Hub index.html at root of the ZIP
  const launcherHtml = `<!DOCTYPE html>
<html lang="en" dir="auto">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Hub - ${domain} (Desktop, Tablet, Mobile)</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #151d30;
      --border: #23304e;
      --text: #f1f5f9;
      --subtext: #94a3b8;
      --primary: #38bdf8;
      --accent: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      line-height: 1.5;
    }
    .hub-container {
      max-width: 960px;
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
    }
    .header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .badge {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.85rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }
    p.desc {
      color: var(--subtext);
      font-size: 0.95rem;
      max-width: 600px;
      margin: 0 auto;
    }
    .devices-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .device-card {
      background: #0d1322;
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 1.75rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
    }
    .device-card:hover {
      transform: translateY(-4px);
      border-color: var(--primary);
      box-shadow: 0 12px 24px -6px rgba(56, 189, 248, 0.2);
    }
    .device-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .device-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.25rem;
    }
    .device-spec {
      font-size: 0.8rem;
      font-family: monospace;
      color: var(--primary);
      margin-bottom: 0.75rem;
    }
    .device-desc {
      font-size: 0.825rem;
      color: var(--subtext);
      margin-bottom: 1.5rem;
      flex-grow: 1;
    }
    .open-btn {
      width: 100%;
      padding: 0.65rem 1.25rem;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 0.15s;
    }
    .device-card:hover .open-btn {
      background: #38bdf8;
      color: #0f172a;
      border-color: #38bdf8;
    }
    .footer-note {
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      font-size: 0.825rem;
      color: var(--subtext);
    }
    .reports-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      margin-inline-start: 0.5rem;
    }
    .reports-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="hub-container">
    <div class="header">
      <div class="badge">100% OFFLINE STANDALONE HUB</div>
      <h1>${domain}</h1>
      <p class="desc">Select a device version below to view the site as rendered by authentic Desktop, Tablet, and Mobile browser engines with zero internet connection.</p>
    </div>

    <div class="devices-grid">
      <!-- Desktop -->
      <a href="./desktop/index.html" class="device-card">
        <div class="device-icon">💻</div>
        <div class="device-title">Desktop Version</div>
        <div class="device-spec">Viewport: 1920 × 1080 (Chrome)</div>
        <div class="device-desc">Full desktop navigation, mega-menus, expanded grids and high-resolution media.</div>
        <div class="open-btn">Open Desktop Version &rarr;</div>
      </a>

      <!-- Tablet -->
      <a href="./tablet/index.html" class="device-card">
        <div class="device-icon">📱</div>
        <div class="device-title">Tablet Version</div>
        <div class="device-spec">Viewport: 768 × 1024 (iPadOS)</div>
        <div class="device-desc">Adaptive tablet touch layout, 2-column grids and balanced responsive components.</div>
        <div class="open-btn">Open Tablet Version &rarr;</div>
      </a>

      <!-- Mobile -->
      <a href="./mobile/index.html" class="device-card">
        <div class="device-icon">📲</div>
        <div class="device-title">Mobile Version</div>
        <div class="device-spec">Viewport: 390 × 844 (Android / Pixel)</div>
        <div class="device-desc">Mobile-first touch design, collapsed drawer navigation, and compact mobile assets.</div>
        <div class="open-btn">Open Mobile Version &rarr;</div>
      </a>
    </div>

    <div class="footer-note">
      Extracted offline package &bull; Zero external requests &bull;
      <a href="./reports/links_report.html" class="reports-link">View Links Report &rarr;</a>
    </div>
  </div>
</body>
</html>`;

  zip.file('index.html', launcherHtml);

  // Maximum ZIP compression (DEFLATE level 9)
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface StructuredCsvOptions {
  exportTarget: 'combined' | 'links' | 'headings';
  includeDevices?: boolean;
  selectedHeadingLevels?: HeadingLevel[];
  sourceDomain?: string;
}

// Helper to escape and format a CSV cell safely with RFC 4180 rules
function formatCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportStructuredCsv(
  links: ScrapedLink[],
  headings: ScrapedHeading[],
  options: StructuredCsvOptions,
  filename?: string
) {
  const bom = '\uFEFF'; // UTF-8 Byte Order Mark for Microsoft Excel & Google Sheets compatibility
  const includeDevices = options.includeDevices !== false;
  const target = options.exportTarget || 'combined';

  let finalFilename = filename;
  const rows: string[][] = [];

  if (target === 'combined') {
    if (!finalFilename) finalFilename = 'website_structured_dataset.csv';

    // Header row for combined dataset
    const headers = [
      'Record Type',
      'Record ID',
      'Type / Tag',
      'Text / Content',
      'Target URL',
      ...(includeDevices ? ['Devices', 'Device Exclusivity'] : []),
      'Found On (Source)',
      'Extracted At',
    ];
    rows.push(headers);

    const now = new Date().toISOString();

    // 1. Add all links
    links.forEach((l, idx) => {
      const devs = l.devices && l.devices.length > 0 ? l.devices : ['desktop'];
      const exclusivity = devs.length === 1 ? `${devs[0]} exclusive` : 'Universal';
      rows.push([
        'Link',
        String(idx + 1),
        l.type.toUpperCase(),
        l.text || '(empty anchor)',
        l.url,
        ...(includeDevices ? [devs.join('; '), exclusivity] : []),
        l.sourceUrl || '',
        now,
      ]);
    });

    // 2. Add all selected headings
    const filteredHeadings =
      options.selectedHeadingLevels && options.selectedHeadingLevels.length > 0
        ? headings.filter((h) => options.selectedHeadingLevels!.includes(h.level))
        : headings;

    filteredHeadings.forEach((h, idx) => {
      const devs = h.devices && h.devices.length > 0 ? h.devices : ['desktop'];
      const exclusivity = devs.length === 1 ? `${devs[0]} exclusive` : 'Universal';
      rows.push([
        'Heading',
        String(idx + 1),
        h.level.toUpperCase(),
        h.text || '(empty heading)',
        '', // No destination URL for heading
        ...(includeDevices ? [devs.join('; '), exclusivity] : []),
        h.sourceUrl || '',
        now,
      ]);
    });
  } else if (target === 'links') {
    if (!finalFilename) finalFilename = 'structured_links.csv';
    const headers = [
      'Index',
      'Anchor Text',
      'Destination URL',
      'Link Type',
      ...(includeDevices ? ['Devices', 'Device Exclusivity'] : []),
      'Found On (Source URL)',
    ];
    rows.push(headers);

    links.forEach((l, idx) => {
      const devs = l.devices && l.devices.length > 0 ? l.devices : ['desktop'];
      const exclusivity = devs.length === 1 ? `${devs[0]} exclusive` : 'Universal';
      rows.push([
        String(idx + 1),
        l.text || '',
        l.url,
        l.type,
        ...(includeDevices ? [devs.join('; '), exclusivity] : []),
        l.sourceUrl || '',
      ]);
    });
  } else {
    // target === 'headings'
    if (!finalFilename) finalFilename = 'structured_headings.csv';
    const headers = [
      'Index',
      'Heading Level',
      'Heading Text',
      ...(includeDevices ? ['Devices', 'Device Exclusivity'] : []),
      'Found On (Source URL)',
    ];
    rows.push(headers);

    const filteredHeadings =
      options.selectedHeadingLevels && options.selectedHeadingLevels.length > 0
        ? headings.filter((h) => options.selectedHeadingLevels!.includes(h.level))
        : headings;

    filteredHeadings.forEach((h, idx) => {
      const devs = h.devices && h.devices.length > 0 ? h.devices : ['desktop'];
      const exclusivity = devs.length === 1 ? `${devs[0]} exclusive` : 'Universal';
      rows.push([
        String(idx + 1),
        h.level.toUpperCase(),
        h.text || '',
        ...(includeDevices ? [devs.join('; '), exclusivity] : []),
        h.sourceUrl || '',
      ]);
    });
  }

  const csvContent =
    bom +
    rows
      .map((row) => row.map((cell) => formatCsvCell(cell)).join(','))
      .join('\r\n');

  downloadFile(finalFilename, csvContent, 'text/csv;charset=utf-8;');
}

export function exportLinksToCsv(links: ScrapedLink[], filename = 'links.csv') {
  exportStructuredCsv(
    links,
    [],
    {
      exportTarget: 'links',
      includeDevices: true,
    },
    filename
  );
}

export function exportHeadingsToCsv(headings: ScrapedHeading[], filename = 'headings.csv') {
  exportStructuredCsv(
    [],
    headings,
    {
      exportTarget: 'headings',
      includeDevices: true,
    },
    filename
  );
}

export interface JsonExportOptions {
  includeLinks: boolean;
  includeHeadings: boolean;
  selectedHeadingLevels?: HeadingLevel[];
}

export function exportCustomJson(
  links: ScrapedLink[],
  headings: ScrapedHeading[],
  options: JsonExportOptions,
  filename = 'extracted_data.json'
) {
  const payload: Record<string, any> = {
    exportedAt: new Date().toISOString(),
  };

  if (options.includeLinks) {
    payload.totalLinks = links.length;
    payload.links = links;
  }

  if (options.includeHeadings) {
    const filteredHeadings =
      options.selectedHeadingLevels && options.selectedHeadingLevels.length > 0
        ? headings.filter((h) => options.selectedHeadingLevels!.includes(h.level))
        : headings;
    payload.totalHeadings = filteredHeadings.length;
    payload.headings = filteredHeadings;
  }

  const jsonStr = JSON.stringify(payload, null, 2);
  downloadFile(filename, jsonStr, 'application/json');
}

/**
 * Directly downloads the 100% self-contained single-file HTML version
 * with ZERO dependencies, Base64 inlined assets, and ZERO internet requirements.
 */
export function downloadSingleFileStandalone(
  files: ExtractedFile[],
  domain = 'website',
  device = 'desktop'
): boolean {
  if (!files || files.length === 0) return false;
  const inlinedHtml = generateFullyInlinedHtml(files, domain);
  const filename = `${domain}_${device}_offline_standalone.html`;
  downloadFile(filename, inlinedHtml, 'text/html;charset=utf-8');
  return true;
}

/**
 * Helper to generate an offline SVG data URI placeholder.
 * Guarantees zero network calls and eliminates ERR_INTERNET_DISCONNECTED.
 */
export function generateOfflineImageFallback(label = '', width = 200, height = 200): string {
  const safeLabel = (label || 'Offline Asset').replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 30);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#1e293b"/>
    <text x="50%" y="50%" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="12" text-anchor="middle" dominant-baseline="middle">${safeLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Air-Gap Runtime Shield for 100% Inlined Standalone HTML.
 * Stubs fetch, XMLHttpRequest, jQuery, Elementor, WordPress and catches unhandled rejections.
 */
export const OFFLINE_AIRGAP_EARLY_CODE = `(function() {
  'use strict';
  // 1. Safe Mock for fetch API
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    return new Promise(function(resolve) {
      if (url.includes('.json') || (init && init.headers && String(init.headers['Accept'] || '').includes('json'))) {
        resolve(new Response(JSON.stringify({ status: 'ok', offline: true, data: [] }), {
          status: 200,
          statusText: 'OK (Offline Air-Gap)',
          headers: { 'Content-Type': 'application/json' }
        }));
      } else {
        resolve(new Response('', {
          status: 200,
          statusText: 'OK (Offline Air-Gap)',
          headers: { 'Content-Type': 'text/plain' }
        }));
      }
    });
  };

  // 2. Mock XMLHttpRequest
  if (typeof window.XMLHttpRequest !== 'undefined') {
    var OrigXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      var xhr = new OrigXHR();
      var _open = xhr.open;
      xhr.open = function() { try { return _open.apply(xhr, arguments); } catch(e){} };
      xhr.send = function() {
        setTimeout(function() {
          try {
            Object.defineProperty(xhr, 'readyState', { value: 4, writable: true });
            Object.defineProperty(xhr, 'status', { value: 200, writable: true });
            Object.defineProperty(xhr, 'statusText', { value: 'OK (Offline Air-Gap)', writable: true });
            Object.defineProperty(xhr, 'responseText', { value: '{}', writable: true });
            Object.defineProperty(xhr, 'response', { value: '{}', writable: true });
            if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
            if (typeof xhr.onload === 'function') xhr.onload();
          } catch(e){}
        }, 1);
      };
      return xhr;
    };
  }

  // 3. Dynamic Script Element Neutralizer: blocks dynamic remote script tags from trying to load offline
  var origCreateElement = document.createElement;
  document.createElement = function(tagName, options) {
    var elem = origCreateElement.call(document, tagName, options);
    var tag = (tagName || '').toLowerCase();
    if (tag === 'script') {
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

  // 4. Universal CMS and Framework Stubs (WP, Elementor, Analytics, GTag, WooCommerce)
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
  window.elementorFrontendConfig = window.elementorFrontendConfig || { isEditMode: false, isMobile: false, environmentMode: { edit: false, wpPreview: false } };
  window.ElementorProFrontendConfig = window.ElementorProFrontendConfig || {};
  window.woocommerce_params = window.woocommerce_params || { ajax_url: '#' };
  window.wc_cart_fragments_params = window.wc_cart_fragments_params || { ajax_url: '#' };

  // 5. Universal jQuery Instant Engine & Callback Queue
  if (typeof window.jQuery === 'undefined' && typeof window.$ === 'undefined') {
    var _readyCallbacks = [];
    var jq = function(selector) {
      if (typeof selector === 'function') {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setTimeout(function() { try { selector(window.jQuery || jq); } catch(e){} }, 1);
        } else {
          _readyCallbacks.push(selector);
        }
        return jq;
      }
      var elements = [];
      if (typeof selector === 'string') {
        try { elements = Array.prototype.slice.call(document.querySelectorAll(selector)); } catch(e){}
      } else if (selector && selector.nodeType) {
        elements = [selector];
      } else if (Array.isArray(selector)) {
        elements = selector;
      }
      var instance = Object.create(jq.fn);
      for (var i = 0; i < elements.length; i++) instance[i] = elements[i];
      instance.length = elements.length;
      return instance;
    };
    jq.fn = jq.prototype = {
      length: 0,
      ready: function(fn) { return jq(fn); },
      each: function(cb) { for(var i=0; i<this.length; i++) { cb.call(this[i], i, this[i]); } return this; },
      on: function(evt, sel, handler) {
        var h = typeof sel === 'function' ? sel : handler;
        if (h) {
          this.each(function() {
            var names = (evt || '').split(' ');
            var el = this;
            names.forEach(function(n) { if (n) el.addEventListener(n, h); });
          });
        }
        return this;
      },
      click: function(fn) { return fn ? this.on('click', fn) : this; },
      find: function(sel) {
        var found = [];
        this.each(function() {
          try {
            var res = this.querySelectorAll(sel);
            for(var j=0; j<res.length; j++) found.push(res[j]);
          } catch(e){}
        });
        return jq(found);
      },
      addClass: function(c) {
        return this.each(function() {
          if (this.classList && c) {
            c.split(' ').forEach(function(cls) { if (cls) this.classList.add(cls); }.bind(this));
          }
        });
      },
      removeClass: function(c) {
        return this.each(function() {
          if (this.classList && c) {
            c.split(' ').forEach(function(cls) { if (cls) this.classList.remove(cls); }.bind(this));
          }
        });
      },
      css: function(p, v) {
        if (typeof p === 'string' && v !== undefined) {
          return this.each(function() { this.style[p] = v; });
        }
        if (typeof p === 'object') {
          return this.each(function() { for (var k in p) this.style[k] = p[k]; });
        }
        return this;
      },
      attr: function(k, v) {
        if (v !== undefined) {
          return this.each(function() { this.setAttribute(k, v); });
        }
        return this[0] ? this[0].getAttribute(k) : undefined;
      },
      data: function(k, v) {
        var attrName = 'data-' + k;
        if (v !== undefined) {
          return this.each(function() { this.setAttribute(attrName, typeof v === 'object' ? JSON.stringify(v) : v); });
        }
        var raw = this[0] ? this[0].getAttribute(attrName) : undefined;
        try { return JSON.parse(raw); } catch(e) { return raw; }
      },
      text: function(txt) {
        if (txt !== undefined) {
          return this.each(function() { this.textContent = txt; });
        }
        return this[0] ? this[0].textContent : '';
      },
      html: function(h) {
        if (h !== undefined) {
          return this.each(function() { this.innerHTML = h; });
        }
        return this[0] ? this[0].innerHTML : '';
      },
      show: function() { return this.each(function() { this.style.display = ''; }); },
      hide: function() { return this.each(function() { this.style.display = 'none'; }); },
      trigger: function(evtName) {
        return this.each(function() {
          var evt = document.createEvent('HTMLEvents');
          evt.initEvent(evtName, true, false);
          this.dispatchEvent(evt);
        });
      }
    };
    window.jQuery = window.$ = jq;
    document.addEventListener('DOMContentLoaded', function() {
      while (_readyCallbacks.length > 0) {
        var cb = _readyCallbacks.shift();
        try { cb(window.jQuery || jq); } catch(e){}
      }
    });
  }
})();`;

/**
 * Identifies all external CSS, JS, and image dependencies and performs complete inlining
 * (Base64 for images/fonts, content embedding for scripts/styles) within the HTML file.
 * Removes all external network dependencies and completely prevents ERR_INTERNET_DISCONNECTED errors.
 */
export function generateFullyInlinedHtml(
  files: ExtractedFile[],
  domain = 'website'
): string {
  // 1. Locate base HTML file
  const baseHtmlFile =
    files.find((f) => f.name === 'standalone_offline.html') ||
    files.find((f) => f.name === 'index.html') ||
    files.find((f) => f.type === 'html' && f.name !== 'links_report.html') ||
    files[0];

  const rawHtml = baseHtmlFile ? baseHtmlFile.content : '<!DOCTYPE html><html><head></head><body></body></html>';

  // 2. Locate CSS and JS files
  const cssFile = files.find((f) => f.name === 'styles.css' || f.type === 'css');
  const jsFile = files.find((f) => f.name === 'scripts.js' || f.type === 'js' || f.type === 'javascript');

  // 3. Build Asset DataURI Dictionary from files array
  const assetDataUriMap = new Map<string, string>();

  function registerAsset(key: string, dataUri: string) {
    if (!key || !dataUri) return;
    assetDataUriMap.set(key, dataUri);
    const cleanKey = key.split('?')[0].split('#')[0];
    assetDataUriMap.set(cleanKey, dataUri);
    const baseName = cleanKey.replace(/^.*[\\/]/, '');
    assetDataUriMap.set(baseName, dataUri);
    // Normalized stripped name (e.g. 1_logo.png -> logo.png)
    const stripped = baseName.replace(/^\d+_/, '');
    assetDataUriMap.set(stripped, dataUri);
  }

  function cleanKey(k: string) {
    return k.split('?')[0].split('#')[0];
  }

  files.forEach((f) => {
    if (f.name === 'index.html' || f.name === 'styles.css' || f.name === 'scripts.js' || f.name === 'standalone_offline.html' || f.name === 'links_report.html') {
      return;
    }
    let dataUri = '';
    const nameLower = f.name.toLowerCase();
    let mime = 'image/png';
    if (nameLower.endsWith('.svg')) mime = 'image/svg+xml';
    else if (nameLower.endsWith('.webp')) mime = 'image/webp';
    else if (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) mime = 'image/jpeg';
    else if (nameLower.endsWith('.gif')) mime = 'image/gif';
    else if (nameLower.endsWith('.ico')) mime = 'image/x-icon';
    else if (nameLower.endsWith('.woff2')) mime = 'font/woff2';
    else if (nameLower.endsWith('.woff')) mime = 'font/woff';
    else if (nameLower.endsWith('.ttf')) mime = 'font/ttf';
    else if (nameLower.endsWith('.mp4')) mime = 'video/mp4';

    if (f.content.startsWith('data:')) {
      dataUri = f.content;
    } else if (f.name.endsWith('.svg') && f.content.includes('<svg')) {
      dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(f.content)}`;
    } else if (/^[A-Za-z0-9+/=\s]+$/.test(f.content.trim()) && f.content.trim().length > 20) {
      dataUri = `data:${mime};base64,${f.content.trim()}`;
    }

    if (dataUri) {
      registerAsset(f.name, dataUri);
      if (f.sourceUrl) registerAsset(f.sourceUrl, dataUri);
    }
  });

  // 4. Inlining CSS & fonts:
  let compiledCss = cssFile ? cssFile.content : '';
  // Strip remote @import
  compiledCss = compiledCss.replace(/@import\s+(?:url\(['"]?[^'")]+['"]?\)|['"][^'"]+['"])[^;]*;/gi, '/* Remote @import removed for air-gap isolation */');

  // Replace url(...) inside CSS with Base64 data URIs
  compiledCss = compiledCss.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, rawUrl) => {
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('#') || rawUrl.startsWith('blob:')) {
      return match;
    }
    const cleanUrl = rawUrl.split('?')[0].split('#')[0];
    const baseName = cleanUrl.replace(/^.*[\\/]/, '');
    const stripped = baseName.replace(/^\d+_/, '');

    const foundDataUri =
      assetDataUriMap.get(rawUrl) ||
      assetDataUriMap.get(cleanKey(rawUrl)) ||
      assetDataUriMap.get(baseName) ||
      assetDataUriMap.get(stripped);

    if (foundDataUri) {
      return `url("${foundDataUri}")`;
    }

    // If font and not found, provide empty font or system fallback
    if (cleanUrl.endsWith('.woff2') || cleanUrl.endsWith('.woff') || cleanUrl.endsWith('.ttf')) {
      return `local('Arial')`;
    }

    // Remote image url fallback to SVG data URI
    if (rawUrl.startsWith('http') || rawUrl.startsWith('//')) {
      const fallback = generateOfflineImageFallback('Background', 100, 100);
      return `url("${fallback}")`;
    }

    return match;
  });

  // 5. Inlining JS:
  let compiledJs = OFFLINE_AIRGAP_EARLY_CODE + '\n';
  if (jsFile && jsFile.content) {
    const cleanJs = jsFile.content.replace(OFFLINE_AIRGAP_EARLY_CODE, '');
    compiledJs += `\n/* ================= Inlined Application Scripts ================= */\ntry {\n${cleanJs}\n} catch(e) { console.warn('Script execution caught:', e); }\n`;
  }

  // 6. DOM-Level Inlining
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');

      // A. Remove remote stylesheets, preloads, and preconnects
      doc.querySelectorAll('link').forEach((link) => {
        const rel = (link.getAttribute('rel') || '').toLowerCase();
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (
          rel === 'stylesheet' ||
          rel === 'preload' ||
          rel === 'prefetch' ||
          rel === 'preconnect' ||
          rel === 'dns-prefetch' ||
          href.endsWith('.css')
        ) {
          link.remove();
        }
      });
      doc.querySelectorAll('base').forEach((b) => b.remove());

      // B. Remove all existing document <style> blocks (except inside SVG)
      doc.querySelectorAll('head style, body style, :not(svg) > style').forEach((s) => {
        if (!cssFile && s.textContent) {
          compiledCss += '\n' + s.textContent;
        }
        s.remove();
      });

      // C. Ensure <head> exists
      let head = doc.querySelector('head');
      if (!head) {
        head = doc.createElement('head');
        doc.documentElement.insertBefore(head, doc.body || null);
      }

      // Prepend Early Air-Gap Shield script as FIRST child of <head>
      const earlyScript = doc.createElement('script');
      earlyScript.id = 'airgap-early-shield';
      earlyScript.textContent = OFFLINE_AIRGAP_EARLY_CODE;
      head.insertBefore(earlyScript, head.firstChild);

      // Append fully consolidated, inlined Base64 stylesheet
      const embeddedStyle = doc.createElement('style');
      embeddedStyle.id = 'offline-standalone-styles';
      embeddedStyle.textContent = `/* =========================================================
   100% OFFLINE STANDALONE INLINED STYLESHEET
   Zero Remote Network Dependencies | Base64 Fonts & Images
========================================================= */\n${compiledCss}`;
      head.appendChild(embeddedStyle);

      // Append fully consolidated, inlined scripts
      const embeddedScript = doc.createElement('script');
      embeddedScript.id = 'offline-standalone-scripts';
      embeddedScript.textContent = compiledJs;
      head.appendChild(embeddedScript);

      // D. Remove remote scripts from DOM
      const trackerRegex = /(googletagmanager|google-analytics|analytics\.js|recaptcha|facebook\.net|clarity\.ms|hotjar|yandex|doubleclick|pixel|cdn-cgi|rbtools|rs6\.min\.js)/i;
      doc.querySelectorAll('script').forEach((scr) => {
        if (scr.id === 'airgap-early-shield' || scr.id === 'offline-standalone-scripts') return;
        const src = scr.getAttribute('src');
        if (src) {
          scr.remove();
        } else {
          const content = scr.textContent || '';
          if (trackerRegex.test(content) || content.includes('_wpemojiSettings')) {
            scr.remove();
          } else {
            scr.textContent = `try {\n${content}\n} catch(e) { console.warn('Inline script error suppressed:', e); }`;
          }
        }
      });

      // E. Resolve and inline ALL <img> tags to Base64
      doc.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src') || '';
        const dataSrc =
          img.getAttribute('data-src') ||
          img.getAttribute('data-lazy-src') ||
          img.getAttribute('data-original') ||
          img.getAttribute('nitro-lazy-src') ||
          src;

        const candidate = dataSrc || src;
        if (candidate) {
          const baseName = candidate.split('?')[0].split('#')[0].replace(/^.*[\\/]/, '');
          const stripped = baseName.replace(/^\d+_/, '');
          const found =
            assetDataUriMap.get(candidate) ||
            assetDataUriMap.get(cleanKey(candidate)) ||
            assetDataUriMap.get(baseName) ||
            assetDataUriMap.get(stripped);

          if (found) {
            img.setAttribute('src', found);
          } else if (candidate.startsWith('data:')) {
            img.setAttribute('src', candidate);
          } else {
            const alt = img.getAttribute('alt') || 'Image';
            img.setAttribute('src', generateOfflineImageFallback(alt, 200, 200));
          }
        }
        img.removeAttribute('srcset');
        img.removeAttribute('data-srcset');
        img.removeAttribute('sizes');
        img.removeAttribute('loading');
        img.removeAttribute('decoding');
      });

      // F. Resolve and inline <picture> <source>, <video>, <audio>
      doc.querySelectorAll('picture source').forEach((s) => {
        const srcset = s.getAttribute('srcset') || s.getAttribute('data-srcset');
        if (srcset) {
          const candidate = srcset.split(',')[0].trim().split(/\s+/)[0];
          const baseName = candidate.split('?')[0].replace(/^.*[\\/]/, '');
          const found = assetDataUriMap.get(candidate) || assetDataUriMap.get(baseName);
          if (found) {
            s.setAttribute('srcset', found);
          } else {
            s.remove();
          }
        }
      });

      doc.querySelectorAll('video, audio, source').forEach((media) => {
        ['src', 'poster'].forEach((attr) => {
          const val = media.getAttribute(attr);
          if (val) {
            const baseName = val.split('?')[0].replace(/^.*[\\/]/, '');
            const found = assetDataUriMap.get(val) || assetDataUriMap.get(baseName);
            if (found) {
              media.setAttribute(attr, found);
            } else if (val.startsWith('http') || val.startsWith('//')) {
              if (attr === 'poster') {
                media.setAttribute('poster', generateOfflineImageFallback('Video Poster', 480, 270));
              } else {
                media.removeAttribute(attr);
              }
            }
          }
        });
      });

      // G. Resolve and inline favicons
      doc.querySelectorAll('link[rel*="icon"]').forEach((ico) => {
        const href = ico.getAttribute('href');
        if (href) {
          const baseName = href.split('?')[0].replace(/^.*[\\/]/, '');
          const found = assetDataUriMap.get(href) || assetDataUriMap.get(baseName);
          if (found) {
            ico.setAttribute('href', found);
          } else {
            ico.setAttribute('href', generateOfflineImageFallback('Favicon', 32, 32));
          }
        }
      });

      // H. Resolve inline background styles [style*="url("]
      doc.querySelectorAll('[style*="url("]').forEach((el) => {
        const styleAttr = el.getAttribute('style') || '';
        const inlinedStyle = styleAttr.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, rawUrl) => {
          if (rawUrl.startsWith('data:') || rawUrl.startsWith('#')) return match;
          const baseName = rawUrl.split('?')[0].replace(/^.*[\\/]/, '');
          const found = assetDataUriMap.get(rawUrl) || assetDataUriMap.get(baseName);
          if (found) return `url("${found}")`;
          if (rawUrl.startsWith('http') || rawUrl.startsWith('//')) {
            return `url("${generateOfflineImageFallback('', 100, 100)}")`;
          }
          return match;
        });
        el.setAttribute('style', inlinedStyle);
      });

      // I. Un-hide scroll-triggered and lazyloaded elements
      doc.querySelectorAll('[class*="opacity-0"], [class*="invisible"], [data-aos], .aos-animate, .lazyload').forEach((elem) => {
        let cls = elem.getAttribute('class') || '';
        cls = cls.replace(/\bopacity-0\b/g, '').replace(/\binvisible\b/g, '').replace(/\blazyload\b/g, 'lazyloaded').replace(/\s+/g, ' ').trim();
        elem.setAttribute('class', cls);
        elem.removeAttribute('data-aos');
      });

      let finalHtml = doc.documentElement.outerHTML;
      if (!/^<!doctype\s+html/i.test(finalHtml.trim())) {
        finalHtml = '<!DOCTYPE html>\n' + finalHtml;
      }
      return finalHtml;
    } catch {
      // Fallback
    }
  }

  // Regex string fallback inliner:
  let inlined = rawHtml;
  inlined = inlined.replace(/<link[^>]+rel=["']?(?:stylesheet|preload|preconnect|dns-prefetch)["']?[^>]*>/gi, '');
  inlined = inlined.replace(/<script[^>]+src=["']?(?:https?:)?\/\/[^"'>]+["'][^>]*><\/script>/gi, '');
  inlined = inlined.replace(/<script[^>]+src=["']?scripts\.js["'][^>]*><\/script>/gi, '');

  const styleBlock = `<style id="offline-standalone-styles">\n${compiledCss}\n</style>`;
  const scriptBlock = `<script id="offline-standalone-scripts">\n${compiledJs}\n</script>`;

  if (inlined.includes('</head>')) {
    inlined = inlined.replace('</head>', `${styleBlock}\n${scriptBlock}\n</head>`);
  } else {
    inlined = styleBlock + '\n' + scriptBlock + '\n' + inlined;
  }

  if (!/^<!doctype\s+html/i.test(inlined.trim())) {
    inlined = '<!DOCTYPE html>\n' + inlined;
  }

  return inlined;
}
