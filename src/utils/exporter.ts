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

export async function downloadZip(
  files: ExtractedFile[],
  zipName = 'offline_website_package.zip',
  mode: CrawlMode = 'single'
) {
  const zip = new JSZip();

  if (mode === 'single') {
    // Single page mode: strictly NO folders at all, all files at the root of the ZIP
    for (const file of files) {
      const cleanName = file.name.replace(/^.*[\\/]/, '');
      zip.file(cleanName, file.content);
    }
  } else {
    // Multi-page crawl mode ('all'): Maintain dedicated folder structure for each page
    const stylesFile = files.find((f) => f.name === 'styles.css');
    const scriptsFile = files.find((f) => f.name === 'scripts.js');
    const htmlPages = files.filter((f) => f.type === 'html' && f.name !== 'links_report.html');

    // 1. Root files: index.html, styles.css, scripts.js for instant multi-page preview & execution
    for (const file of files) {
      const cleanName = file.name.replace(/^.*[\\/]/, '');
      zip.file(cleanName, file.content);
    }

    // 2. Dedicated folder for EACH scanned page: pages/01_home/, pages/02_about/, etc.
    htmlPages.forEach((file, index) => {
      const pageIndex = (index + 1).toString().padStart(2, '0');
      let baseSlug = file.name.replace(/\.html$/i, '').replace(/^.*[\\/]/, '');
      if (baseSlug === 'index' || index === 0) {
        baseSlug = 'home';
      }
      const pageFolderName = `pages/${pageIndex}_${baseSlug}`;

      // Place the page's HTML inside its dedicated folder
      zip.file(`${pageFolderName}/index.html`, file.content);

      // Include styles and scripts in each page folder so that each page is 100% self-contained
      if (stylesFile) {
        zip.file(`${pageFolderName}/styles.css`, stylesFile.content);
      }
      if (scriptsFile) {
        zip.file(`${pageFolderName}/scripts.js`, scriptsFile.content);
      }
    });

    // 3. Dedicated reports folder
    const reports = files.filter(
      (f) => f.name === 'links_report.html' || f.name.endsWith('.json')
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
  const zip = new JSZip();

  const devices: DeviceType[] = ['desktop', 'tablet', 'mobile'];
  for (const dev of devices) {
    const devData = deviceVersions[dev];
    if (!devData || !devData.files) continue;
    const folder = dev;
    for (const file of devData.files) {
      const cleanName = file.name.replace(/^.*[\\/]/, '');
      zip.file(`${folder}/${cleanName}`, file.content);
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

export function exportLinksToCsv(links: ScrapedLink[], filename = 'links.csv') {
  const headers = ['Index', 'Text', 'URL', 'Type', 'Source URL'];
  const rows = links.map((l, i) => [
    i + 1,
    `"${(l.text || '').replace(/"/g, '""')}"`,
    `"${(l.url || '').replace(/"/g, '""')}"`,
    l.type,
    `"${(l.sourceUrl || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
}

export function exportHeadingsToCsv(headings: ScrapedHeading[], filename = 'headings.csv') {
  const headers = ['Index', 'Level', 'Heading Text', 'Source URL'];
  const rows = headings.map((h, i) => [
    i + 1,
    h.level.toUpperCase(),
    `"${(h.text || '').replace(/"/g, '""')}"`,
    `"${(h.sourceUrl || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
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
