import React, { useState, useMemo, useRef } from 'react';
import {
  RefreshCw,
  ExternalLink,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Layers,
  Lock,
  Eye,
  CheckCircle2,
  Sparkles
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
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>(currentDevice);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const t = translations[language];
  const hasContent = Boolean(files && files.length > 0 && files.some((f) => f.content && f.content.length > 15));

  const handleDeviceSelect = (device: DeviceType) => {
    setSelectedDevice(device);
    onDeviceChange?.(device);
  };

  // Helper to compile HTML, CSS and JS into a clean visual document
  const activeDocument = useMemo(() => {
    const devFiles = deviceVersions?.[selectedDevice]?.files || files;

    const htmlFile =
      devFiles.find((f) => f.name === 'index.html') ||
      devFiles.find((f) => f.type === 'html') ||
      devFiles[0];
    const cssFile = devFiles.find((f) => f.name === 'styles.css');
    const jsFile = devFiles.find((f) => f.name === 'scripts.js');

    let baseHtml = htmlFile ? htmlFile.content : '<html><body><p>No content</p></body></html>';

    // Inject combined stylesheet
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
  }, [files, deviceVersions, selectedDevice]);

  const handleOpenNewWindow = () => {
    const blob = new Blob([activeDocument], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Clean hostname for browser mock URL bar
  let displayDomain = 'website.com';
  try {
    displayDomain = new URL(targetUrl).hostname;
  } catch {
    // fallback
  }

  // Standby placeholder: Pure visual card, zero code shown
  const renderStandbyScreen = () => {
    return (
      <div className="w-full h-full min-h-[520px] bg-[#0d1117] text-slate-200 flex flex-col items-center justify-center p-8 select-none font-sans text-center border-0">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
          <Eye className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          {language === 'fa' ? 'پیش‌نمایش زنده وب‌سایت' : 'Live Website Visual Preview'}
        </h3>
        <p className="text-xs text-indigo-300 font-mono mb-4 px-3 py-1 bg-indigo-950/60 rounded-full border border-indigo-800/40 inline-block">
          {selectedDevice === 'desktop'
            ? 'Desktop Viewport (1280 × 800)'
            : selectedDevice === 'tablet'
            ? 'Tablet iPad Viewport (768 × 1024)'
            : 'Mobile Phone Viewport (390 × 844)'}
        </p>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          {language === 'fa'
            ? 'پس از کلیک بر روی دکمه «استخراج کامل»، ساختار بصری، مدیاها، انیمیشن‌ها و استایل‌های وب‌سایت در این کادر نمایش داده می‌شوند.'
            : 'After clicking "Full Extract", the website layout, media, and styles will be rendered visually in this frame.'}
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
        </div>
      </div>
    );
  };

  // Loading indicator: Pure visual spinner & progress
  const renderLoadingScreen = () => {
    const currentProg = deviceProgress?.[selectedDevice];
    return (
      <div className="w-full h-full min-h-[520px] bg-[#090d16] text-slate-200 flex flex-col items-center justify-center p-8 select-none font-sans text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
          <RefreshCw className="w-7 h-7 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">
          {language === 'fa' ? 'در حال استخراج و ساخت پیش‌نمایش بصری...' : 'Extracting & Rendering Visual Preview...'}
        </h3>
        <p className="text-xs text-slate-400 font-mono mb-4">
          {currentProg?.status || (language === 'fa' ? 'واکشی فایل‌ها و استایل‌ها...' : 'Fetching assets & styles...')}
        </p>
        <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${currentProg?.percent || 45}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
      {/* Top Header: Device Switcher & Controls */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Left: Device Mode Switcher (Desktop, Tablet, Mobile) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/90 border border-slate-800 rounded-xl">
          <button
            id="btn-preview-device-desktop"
            onClick={() => handleDeviceSelect('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              selectedDevice === 'desktop'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop (1280 × 800)"
          >
            <Laptop className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.deviceDesktop}</span>
          </button>

          <button
            id="btn-preview-device-tablet"
            onClick={() => handleDeviceSelect('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              selectedDevice === 'tablet'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet (768 × 1024)"
          >
            <Tablet className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.deviceTablet}</span>
          </button>

          <button
            id="btn-preview-device-mobile"
            onClick={() => handleDeviceSelect('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              selectedDevice === 'mobile'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile (390 × 844)"
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.deviceMobile}</span>
          </button>
        </div>

        {/* Right: Actions (Refresh & Open in New Tab) */}
        <div className="flex items-center gap-2">
          {/* Dimension Tag */}
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
            {selectedDevice === 'desktop'
              ? '1280 × 800'
              : selectedDevice === 'tablet'
              ? '768 × 1024'
              : '390 × 844'}
          </span>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer font-medium"
            title={t.refreshPreview}
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t.refreshPreview}</span>
          </button>

          <button
            onClick={handleOpenNewWindow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer font-medium"
            title={t.openNewTab}
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t.openNewTab}</span>
          </button>
        </div>
      </div>

      {/* Main Preview Stage: Renders ONE single iframe with device frame */}
      <div className="relative bg-[#060911] p-3 sm:p-6 min-h-[600px] flex items-center justify-center overflow-x-auto">
        <div
          className={`w-full transition-all duration-300 ease-out bg-slate-950 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden ${
            selectedDevice === 'mobile'
              ? 'max-w-[400px]'
              : selectedDevice === 'tablet'
              ? 'max-w-[780px]'
              : 'max-w-full'
          }`}
        >
          {/* Mock Browser Top Header Bar */}
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
            {/* Window Dots */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="font-bold text-slate-300 ms-2">
                {selectedDevice === 'desktop'
                  ? t.deviceDesktop
                  : selectedDevice === 'tablet'
                  ? t.deviceTablet
                  : t.deviceMobile}
              </span>
            </div>

            {/* Address Bar Display */}
            <div className="flex-1 max-w-sm mx-3 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-400 truncate">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate font-mono">{displayDomain}</span>
            </div>

            {/* Device Dimension Badge */}
            <div className="text-[10px] text-slate-500 font-mono">
              {selectedDevice === 'desktop'
                ? 'Desktop (Chrome)'
                : selectedDevice === 'tablet'
                ? 'Tablet (Safari)'
                : 'Mobile (iOS)'}
            </div>
          </div>

          {/* Iframe Viewport: Strictly renders the visual website, NEVER raw code */}
          <div
            className={`w-full bg-white relative ${
              selectedDevice === 'mobile'
                ? 'h-[720px]'
                : selectedDevice === 'tablet'
                ? 'h-[750px]'
                : 'h-[680px]'
            }`}
          >
            {isLoading ? (
              renderLoadingScreen()
            ) : hasContent ? (
              <iframe
                ref={iframeRef}
                key={`iframe-${selectedDevice}-${refreshKey}`}
                srcDoc={activeDocument}
                title={`Live Preview - ${selectedDevice}`}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                className="w-full h-full border-0 bg-white"
              />
            ) : (
              renderStandbyScreen()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
