import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  RefreshCw,
  ExternalLink,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sliders,
  Sparkles,
  Link,
  Layers,
  Lock
} from 'lucide-react';
import { ExtractedFile, Language, DeviceType, DeviceVersion } from '../types.js';
import { translations } from '../i18n.js';

interface LivePreviewProps {
  files: ExtractedFile[];
  language: Language;
  currentDevice?: DeviceType;
  onDeviceChange?: (device: DeviceType) => void;
  deviceVersions?: Record<DeviceType, DeviceVersion>;
  targetUrl?: string;
  isLoading?: boolean;
  onQuickScrape?: (url: string) => void;
  deviceProgress?: Partial<Record<DeviceType, { status: string; percent: number }>>;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  files,
  language,
  currentDevice = 'desktop',
  onDeviceChange,
  deviceVersions,
  targetUrl = 'https://example.com',
  isLoading = false,
  onQuickScrape,
  deviceProgress,
}) => {
  // View mode: 'tri-screen' (All 3 screens side by side) or 'single' (focused on 1 device)
  const [viewMode, setViewMode] = useState<'tri-screen' | 'single'>('tri-screen');
  const [selectedSingleDevice, setSelectedSingleDevice] = useState<DeviceType>(currentDevice);
  const [zoomScale, setZoomScale] = useState<number>(0.65); // Default 65% zoom for comfortable 3-screen fit
  const [desktopKey, setDesktopKey] = useState(0);
  const [tabletKey, setTabletKey] = useState(0);
  const [mobileKey, setMobileKey] = useState(0);

  const desktopIframeRef = useRef<HTMLIFrameElement>(null);
  const tabletIframeRef = useRef<HTMLIFrameElement>(null);
  const mobileIframeRef = useRef<HTMLIFrameElement>(null);

  const t = translations[language];
  const hasContent = Boolean(files && files.length > 0 && files.some((f) => f.content && f.content.length > 15));

  // Helper to compile HTML, CSS and JS for a specific device version
  const compileDocForDevice = (device: DeviceType) => {
    // Check if device-specific version files exist
    const devFiles = deviceVersions?.[device]?.files || files;

    const htmlFile =
      devFiles.find((f) => f.name === 'index.html') ||
      devFiles.find((f) => f.type === 'html') ||
      devFiles[0];
    const cssFile = devFiles.find((f) => f.name === 'styles.css');
    const jsFile = devFiles.find((f) => f.name === 'scripts.js');

    let baseHtml = htmlFile ? htmlFile.content : '<html><body><p>No content</p></body></html>';

    // Inject styles
    if (cssFile && cssFile.content) {
      if (baseHtml.includes('id="offline-bundle-styles"')) {
        baseHtml = baseHtml.replace(
          /<style id="offline-bundle-styles">[\s\S]*?<\/style>/i,
          `<style id="offline-bundle-styles">\n${cssFile.content}\n</style>`
        );
      } else if (baseHtml.includes('</head>')) {
        baseHtml = baseHtml.replace(
          '</head>',
          `  <style id="offline-bundle-styles">\n${cssFile.content}\n  </style>\n</head>`
        );
      } else {
        baseHtml = `<style id="offline-bundle-styles">\n${cssFile.content}\n</style>\n` + baseHtml;
      }
    }

    // Inject scripts
    if (jsFile && jsFile.content) {
      if (baseHtml.includes('</body>')) {
        baseHtml = baseHtml.replace('</body>', `  <script>\n${jsFile.content}\n  </script>\n</body>`);
      } else {
        baseHtml = baseHtml + `\n<script>\n${jsFile.content}\n</script>`;
      }
    }

    return baseHtml;
  };

  const desktopDoc = useMemo(() => compileDocForDevice('desktop'), [files, deviceVersions]);
  const tabletDoc = useMemo(() => compileDocForDevice('tablet'), [files, deviceVersions]);
  const mobileDoc = useMemo(() => compileDocForDevice('mobile'), [files, deviceVersions]);

  const handleOpenNewWindow = (docHtml: string) => {
    const blob = new Blob([docHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleRefreshAll = () => {
    setDesktopKey((k) => k + 1);
    setTabletKey((k) => k + 1);
    setMobileKey((k) => k + 1);
  };

  // Clean hostname for browser mock URL bar
  let displayDomain = 'website.com';
  try {
    displayDomain = new URL(targetUrl).hostname;
  } catch {
    // fallback
  }

  const renderStandbyScreen = (device: DeviceType) => {
    if (device === 'desktop') {
      return (
        <div className="w-full h-full bg-[#0d1117] text-slate-200 flex flex-col items-center justify-center p-8 select-none font-sans text-center border-0">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 shadow-lg shadow-sky-500/10">
            <Laptop className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            {language === 'fa' ? 'مرورگر دسکتاپ (Google Chrome / Windows 11)' : 'Desktop Browser (Chrome / Windows)'}
          </h3>
          <p className="text-xs text-sky-300 font-mono mb-4 px-3 py-1 bg-sky-950/60 rounded-full border border-sky-800/40 inline-block">
            Viewport: 1280 × 800 | User-Agent: Chrome/133 x64 | Sec-CH-UA-Mobile: ?0
          </p>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            {language === 'fa'
              ? 'در این نمایشگر، سورس کامل وب‌سایت با ساختار عریض، مگامنوها، سایدبارها و فایل‌های CSS نسخه دسکتاپ واکشی و رندر می‌شود.'
              : 'Extracts desktop markup, wide layout grids, mega-menus, and full CSS stylesheets.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
            <span className="text-xs text-slate-500">{language === 'fa' ? 'آدرس‌های نمونه:' : 'Samples:'}</span>
            <button
              onClick={() => onQuickScrape?.('https://example.com')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 cursor-pointer transition font-mono"
            >
              example.com
            </button>
            <button
              onClick={() => onQuickScrape?.('https://quotes.toscrape.com')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 cursor-pointer transition font-mono"
            >
              quotes.toscrape.com
            </button>
            <button
              onClick={() => onQuickScrape?.('https://en.wikipedia.org/wiki/Web_scraping')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 cursor-pointer transition font-mono"
            >
              wikipedia.org
            </button>
          </div>
        </div>
      );
    }

    if (device === 'tablet') {
      return (
        <div className="w-full h-full bg-[#0c121e] text-slate-200 flex flex-col items-center justify-center p-6 select-none font-sans text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
            <Tablet className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {language === 'fa' ? 'مرورگر تبلت (Apple iPad Safari)' : 'Tablet Browser (iPad Safari)'}
          </h3>
          <p className="text-[11px] text-amber-300 font-mono mb-4 px-3 py-0.5 bg-amber-950/60 rounded-full border border-amber-800/40 inline-block">
            Viewport: 768 × 1024 | Touch Screen Enabled
          </p>
          <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
            {language === 'fa'
              ? 'دریافت نسخه تبلت سایت با قوانین رسپانسیو میانه و پشتیبانی از لمس.'
              : 'Extracts tablet responsive layout with touch-optimized components.'}
          </p>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-amber-200/80 font-medium">
            {language === 'fa' ? 'آماده واکشی با User-Agent اختصاصی iPad' : 'Ready with iPad User-Agent'}
          </div>
        </div>
      );
    }

    // Mobile
    return (
      <div className="w-full h-full bg-[#0a0f1d] text-slate-200 flex flex-col items-center justify-center p-4 select-none font-sans text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-lg shadow-rose-500/10">
          <Smartphone className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">
          {language === 'fa' ? 'مرورگر گوشی (Mobile Safari / Chrome)' : 'Mobile Browser (iOS / Android)'}
        </h3>
        <p className="text-[10px] text-rose-300 font-mono mb-3 px-2 py-0.5 bg-rose-950/60 rounded-full border border-rose-800/40 inline-block">
          Viewport: 390 × 844 | Sec-CH-UA-Mobile: ?1
        </p>
        <p className="text-[11px] text-slate-400 max-w-[240px] mb-4 leading-relaxed">
          {language === 'fa'
            ? 'استخراج اختصاصی نسخه موبایل: منوهای کشویی، محتوای فشرده و لینک‌های اختصاصی گوشی'
            : 'Extracts mobile-specific DOM, hamburger navigation, and touch-optimized assets.'}
        </p>
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] text-rose-200/90 font-medium">
          {language === 'fa' ? 'آماده ارسال هدر واقعی موبایل' : 'Mobile Headers Ready'}
        </div>
      </div>
    );
  };

  const renderLoadingScreen = (device: DeviceType) => {
    const currentProg = deviceProgress?.[device];
    const profileName = device === 'desktop' ? 'Chrome Desktop' : device === 'tablet' ? 'iPad Safari' : 'iPhone Safari';

    return (
      <div className="w-full h-full bg-[#080d1a] text-slate-200 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="relative mb-6">
          <div
            className={`w-16 h-16 rounded-full border-2 ${
              device === 'desktop'
                ? 'border-sky-500/30 border-t-sky-400'
                : device === 'tablet'
                ? 'border-amber-500/30 border-t-amber-400'
                : 'border-rose-500/30 border-t-rose-400'
            } animate-spin flex items-center justify-center`}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            {device === 'desktop' && <Laptop className="w-6 h-6 text-sky-400" />}
            {device === 'tablet' && <Tablet className="w-6 h-6 text-amber-400" />}
            {device === 'mobile' && <Smartphone className="w-6 h-6 text-rose-400" />}
          </div>
        </div>
        <h4 className="text-base font-bold text-white mb-2">
          {language === 'fa' ? `در حال واکشی نسخه ${profileName}...` : `Fetching ${profileName} version...`}
        </h4>
        <p className="text-xs text-slate-400 max-w-xs mb-4 font-mono">
          {currentProg?.status || (language === 'fa' ? 'ارسال درخواست با هدرهای دیوایس...' : 'Sending request with device headers...')}
        </p>
        <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${
              device === 'desktop'
                ? 'from-sky-500 to-indigo-500'
                : device === 'tablet'
                ? 'from-amber-500 to-orange-500'
                : 'from-rose-500 to-pink-500'
            } transition-all duration-300`}
            style={{ width: `${currentProg?.percent || 45}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
      {/* Top Header Controls */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/95 flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs">
        {/* Title & Status */}
        <div className="flex items-center gap-2.5 text-slate-200">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm">
                {language === 'fa' ? 'نمایشگر ۳‌گانه همزمان (دسکتاپ / تبلت / موبایل)' : 'Multi-Viewport Tri-Screen Display'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {language === 'fa' ? '۳ صفحه مستقل' : '3 Live Viewports'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              {t.previewNotice}
            </p>
          </div>
        </div>

        {/* View Mode & Zoom Controls */}
        <div className="flex items-center flex-wrap gap-2.5 justify-between xl:justify-end">
          {/* Mode Switcher: Tri-Screen vs Single Device */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-xl">
            <button
              id="btn-viewmode-tri"
              onClick={() => setViewMode('tri-screen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                viewMode === 'tri-screen'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'fa' ? 'هر ۳ نمایشگر همزمان' : 'All 3 Screens'}</span>
            </button>

            <button
              id="btn-viewmode-single"
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{language === 'fa' ? 'تک نمایشگر متمرکز' : 'Single Screen'}</span>
            </button>
          </div>

          {/* If in Single Mode: Device Selector */}
          {viewMode === 'single' && (
            <div className="flex items-center gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-xl">
              <button
                onClick={() => {
                  setSelectedSingleDevice('desktop');
                  onDeviceChange?.('desktop');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  selectedSingleDevice === 'desktop'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>{t.deviceDesktop}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedSingleDevice('tablet');
                  onDeviceChange?.('tablet');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  selectedSingleDevice === 'tablet'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>{t.deviceTablet}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedSingleDevice('mobile');
                  onDeviceChange?.('mobile');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  selectedSingleDevice === 'mobile'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{t.deviceMobile}</span>
              </button>
            </div>
          )}

          {/* Zoom / Scale Level in Tri-Screen Mode */}
          {viewMode === 'tri-screen' && (
            <div className="flex items-center gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-300">
              <span className="text-[10px] text-slate-400 px-1 font-mono">
                {language === 'fa' ? 'مقیاس:' : 'Scale:'}
              </span>
              {[
                { label: '50%', scale: 0.5 },
                { label: '65%', scale: 0.65 },
                { label: '75%', scale: 0.75 },
                { label: '100%', scale: 1.0 },
              ].map((lvl) => (
                <button
                  key={lvl.label}
                  onClick={() => setZoomScale(lvl.scale)}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition cursor-pointer ${
                    zoomScale === lvl.scale
                      ? 'bg-slate-700 text-indigo-300 border border-slate-600'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          )}

          {/* Global Refresh All */}
          <button
            onClick={handleRefreshAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer font-medium"
            title={t.refreshPreview}
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t.refreshPreview}</span>
          </button>
        </div>
      </div>

      {/* Main Showcase Stage */}
      <div className="relative bg-[#060911] p-3 sm:p-6 min-h-[640px] overflow-x-auto">
        {viewMode === 'tri-screen' ? (
          /* ================= TRI-SCREEN VIEW: ALL 3 SCREENS SIDE BY SIDE ================= */
          <div className="flex flex-col xl:flex-row items-start justify-center gap-6 min-w-[320px] pb-4">
            {/* 1. DESKTOP MONITOR DISPLAY */}
            <div className="flex flex-col items-center flex-1 max-w-[620px] w-full">
              {/* Device Frame Label & Header */}
              <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 border-t border-x border-slate-700/80 rounded-t-2xl text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-sky-400 text-xs mr-2">
                    <Laptop className="w-4 h-4" />
                    <span>{t.deviceDesktop}</span>
                  </div>
                </div>

                {/* Mock Address Bar */}
                <div className="flex-1 max-w-[220px] mx-2 hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-400 truncate">
                  <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{displayDomain}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950/60 text-sky-300 border border-sky-800/40">
                    1280 × 800
                  </span>
                  <button
                    onClick={() => setDesktopKey((k) => k + 1)}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Refresh Desktop"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleOpenNewWindow(desktopDoc)}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Open Desktop in New Tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Desktop Monitor Screen Window */}
              <div
                className="w-full bg-slate-950 border-b border-x border-slate-700/80 rounded-b-2xl shadow-2xl overflow-hidden relative"
                style={{ height: `${Math.round(520 * zoomScale) + 160}px` }}
              >
                <div
                  className="origin-top-left absolute top-0 left-0"
                  style={{
                    width: '1280px',
                    height: '800px',
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  {isLoading ? (
                    renderLoadingScreen('desktop')
                  ) : hasContent ? (
                    <iframe
                      ref={desktopIframeRef}
                      key={`desktop-iframe-${desktopKey}`}
                      srcDoc={desktopDoc}
                      title="Desktop Preview"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                      className="w-full h-full bg-white border-0 shadow-inner"
                    />
                  ) : (
                    renderStandbyScreen('desktop')
                  )}
                </div>
              </div>

              {/* Desktop Device Summary Footer */}
              <div className="w-full mt-2 flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-sky-400">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>
                    {hasContent && deviceVersions?.desktop?.links
                      ? `${deviceVersions.desktop.links.length} لینک دسکتاپ`
                      : 'مرورگر دسکتاپ Chrome'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {hasContent && deviceVersions?.desktop?.headings
                    ? `${deviceVersions.desktop.headings.length} تیتر | `
                    : ''}
                  1280×800
                </div>
              </div>

              {/* Desktop Foot Stand */}
              <div className="w-24 h-3 bg-slate-800 rounded-b-lg border-b border-x border-slate-700 shadow-md"></div>
              <div className="w-40 h-1.5 bg-slate-700/80 rounded-full mt-0.5"></div>
            </div>

            {/* 2. TABLET DISPLAY */}
            <div className="flex flex-col items-center max-w-[420px] w-full">
              {/* Tablet Frame Header */}
              <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 border-t border-x border-amber-500/30 rounded-t-2xl text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Tablet className="w-4 h-4" />
                  <span>{t.deviceTablet}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/40">
                    768 × 1024
                  </span>
                  <button
                    onClick={() => setTabletKey((k) => k + 1)}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Refresh Tablet"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleOpenNewWindow(tabletDoc)}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Open Tablet in New Tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Tablet Bezel & Screen (iPad Style) */}
              <div
                className="w-full bg-slate-900 border-b border-x border-slate-700/90 p-2.5 rounded-b-3xl shadow-2xl relative overflow-hidden"
                style={{ height: `${Math.round(520 * zoomScale) + 160}px` }}
              >
                {/* Camera dot */}
                <div className="w-2 h-2 rounded-full bg-slate-800 mx-auto mb-1.5 border border-slate-700"></div>

                <div
                  className="origin-top-left absolute left-2.5 top-7 rounded-xl overflow-hidden bg-white shadow-inner"
                  style={{
                    width: '768px',
                    height: '1024px',
                    transform: `scale(${zoomScale * 0.72})`,
                    transformOrigin: 'top left',
                  }}
                >
                  {isLoading ? (
                    renderLoadingScreen('tablet')
                  ) : hasContent ? (
                    <iframe
                      ref={tabletIframeRef}
                      key={`tablet-iframe-${tabletKey}`}
                      srcDoc={tabletDoc}
                      title="Tablet Preview"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                      className="w-full h-full border-0"
                    />
                  ) : (
                    renderStandbyScreen('tablet')
                  )}
                </div>
              </div>

              {/* Tablet Device Summary Footer */}
              <div className="w-full mt-2 flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Tablet className="w-3.5 h-3.5" />
                  <span>
                    {hasContent && deviceVersions?.tablet?.links
                      ? `${deviceVersions.tablet.links.length} لینک تبلت`
                      : 'مرورگر تبلت Safari'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {hasContent && deviceVersions?.tablet?.headings
                    ? `${deviceVersions.tablet.headings.length} تیتر | `
                    : ''}
                  768×1024
                </div>
              </div>
            </div>

            {/* 3. MOBILE SMARTPHONE DISPLAY */}
            <div className="flex flex-col items-center max-w-[280px] w-full">
              {/* Mobile Frame Header */}
              <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 border-t border-x border-rose-500/30 rounded-t-2xl text-xs">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <Smartphone className="w-4 h-4" />
                  <span>{t.deviceMobile}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800/40">
                    390 × 844
                  </span>
                  <button
                    onClick={() => setMobileKey((k) => k + 1)}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Refresh Mobile"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleOpenNewWindow(mobileDoc)}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Open Mobile in New Tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Mobile Bezel & Screen (iPhone Style) */}
              <div
                className="w-full bg-slate-950 border-b border-x border-slate-700/90 p-2 rounded-b-[36px] shadow-2xl relative overflow-hidden"
                style={{ height: `${Math.round(520 * zoomScale) + 160}px` }}
              >
                {/* Dynamic Island Notch */}
                <div className="w-20 h-3.5 bg-black rounded-full mx-auto mb-1.5 border border-slate-800 flex items-center justify-end px-2 z-10 relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                </div>

                <div
                  className="origin-top-left absolute left-2 top-8 rounded-2xl overflow-hidden bg-white shadow-inner"
                  style={{
                    width: '390px',
                    height: '844px',
                    transform: `scale(${zoomScale * 0.65})`,
                    transformOrigin: 'top left',
                  }}
                >
                  {isLoading ? (
                    renderLoadingScreen('mobile')
                  ) : hasContent ? (
                    <iframe
                      ref={mobileIframeRef}
                      key={`mobile-iframe-${mobileKey}`}
                      srcDoc={mobileDoc}
                      title="Mobile Preview"
                      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                      className="w-full h-full border-0"
                    />
                  ) : (
                    renderStandbyScreen('mobile')
                  )}
                </div>

                {/* Bottom Home Bar */}
                <div className="w-20 h-1 bg-slate-700/80 rounded-full mx-auto mt-2 absolute bottom-2 left-1/2 -translate-x-1/2"></div>
              </div>

              {/* Mobile Device Summary Footer */}
              <div className="w-full mt-2 flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>
                    {hasContent && deviceVersions?.mobile?.links
                      ? `${deviceVersions.mobile.links.length} لینک موبایل`
                      : 'مرورگر گوشی Mobile'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {hasContent && deviceVersions?.mobile?.headings
                    ? `${deviceVersions.mobile.headings.length} تیتر | `
                    : ''}
                  390×844
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= SINGLE FOCUSED DEVICE VIEW ================= */
          <div className="flex flex-col items-center justify-center min-h-[580px] py-4">
            <div
              className={`w-full transition-all duration-300 ease-out bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden ${
                selectedSingleDevice === 'mobile'
                  ? 'max-w-[420px]'
                  : selectedSingleDevice === 'tablet'
                  ? 'max-w-[780px]'
                  : 'max-w-full'
              }`}
            >
              {/* Single View Header */}
              <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-slate-200 ml-2">
                    {selectedSingleDevice === 'desktop'
                      ? `${t.deviceDesktop} (1280 × 800)`
                      : selectedSingleDevice === 'tablet'
                      ? `${t.deviceTablet} (768 × 1024)`
                      : `${t.deviceMobile} (390 × 844)`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedSingleDevice === 'desktop') setDesktopKey((k) => k + 1);
                      else if (selectedSingleDevice === 'tablet') setTabletKey((k) => k + 1);
                      else setMobileKey((k) => k + 1);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t.refreshPreview}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleOpenNewWindow(
                        selectedSingleDevice === 'desktop'
                          ? desktopDoc
                          : selectedSingleDevice === 'tablet'
                          ? tabletDoc
                          : mobileDoc
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{t.openNewTab}</span>
                  </button>
                </div>
              </div>

              {/* Iframe for focused device */}
              <div className="h-[600px] w-full bg-white">
                {isLoading ? (
                  renderLoadingScreen(selectedSingleDevice)
                ) : hasContent ? (
                  <iframe
                    key={`single-${selectedSingleDevice}-${
                      selectedSingleDevice === 'desktop'
                        ? desktopKey
                        : selectedSingleDevice === 'tablet'
                        ? tabletKey
                        : mobileKey
                    }`}
                    srcDoc={
                      selectedSingleDevice === 'desktop'
                        ? desktopDoc
                        : selectedSingleDevice === 'tablet'
                        ? tabletDoc
                        : mobileDoc
                    }
                    title={`Single Live Preview - ${selectedSingleDevice}`}
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                    className="w-full h-full border-0"
                  />
                ) : (
                  renderStandbyScreen(selectedSingleDevice)
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
