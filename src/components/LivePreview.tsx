import React, { useState, useMemo } from 'react';
import { RefreshCw, ExternalLink, Monitor, Laptop, Tablet, Smartphone } from 'lucide-react';
import { ExtractedFile, Language, DeviceType } from '../types.js';
import { translations } from '../i18n.js';

interface LivePreviewProps {
  files: ExtractedFile[];
  language: Language;
  currentDevice?: DeviceType;
  onDeviceChange?: (device: DeviceType) => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  files,
  language,
  currentDevice = 'desktop',
  onDeviceChange,
}) => {
  const [key, setKey] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<DeviceType>(currentDevice);
  const t = translations[language];

  const activeDev = onDeviceChange ? currentDevice : previewDevice;

  const handleDeviceClick = (dev: DeviceType) => {
    setPreviewDevice(dev);
    if (onDeviceChange) {
      onDeviceChange(dev);
    }
  };

  // Combine HTML with extracted styles and scripts
  const compiledDoc = useMemo(() => {
    // Find main HTML file or default to index.html
    const htmlFile = files.find((f) => f.name === 'index.html') || files.find((f) => f.type === 'html') || files[0];
    const cssFile = files.find((f) => f.name === 'styles.css');
    const jsFile = files.find((f) => f.name === 'scripts.js');

    let baseHtml = htmlFile ? htmlFile.content : '<html><body>No HTML available</body></html>';

    // Inject or update styles
    if (cssFile && cssFile.content) {
      if (baseHtml.includes('id="offline-bundle-styles"')) {
        baseHtml = baseHtml.replace(
          /<style id="offline-bundle-styles">[\s\S]*?<\/style>/i,
          `<style id="offline-bundle-styles">\n${cssFile.content}\n</style>`
        );
      } else if (baseHtml.includes('</head>')) {
        baseHtml = baseHtml.replace('</head>', `<style id="offline-bundle-styles">\n${cssFile.content}\n</style>\n</head>`);
      } else {
        baseHtml = `<style id="offline-bundle-styles">\n${cssFile.content}\n</style>\n` + baseHtml;
      }
    }

    // Inject scripts
    if (jsFile && jsFile.content) {
      if (baseHtml.includes('</body>')) {
        baseHtml = baseHtml.replace('</body>', `<script>\n${jsFile.content}\n</script>\n</body>`);
      } else {
        baseHtml = baseHtml + `\n<script>\n${jsFile.content}\n</script>`;
      }
    }

    return baseHtml;
  }, [files]);

  const handleOpenNewWindow = () => {
    const blob = new Blob([compiledDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getContainerMaxWidth = () => {
    switch (activeDev) {
      case 'mobile':
        return 'max-w-[390px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'max-w-full';
    }
  };

  const getResolutionText = () => {
    switch (activeDev) {
      case 'mobile':
        return '390 × 844 (Mobile)';
      case 'tablet':
        return '768 × 1024 (Tablet)';
      case 'desktop':
      default:
        return '1920 × 1080 (Desktop)';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/25 overflow-hidden">
      {/* Top controls */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Monitor className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-medium">{t.previewNotice}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline-block">
            {getResolutionText()}
          </span>
        </div>

        {/* Device Switcher Pills */}
        <div className="flex items-center justify-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            id="preview-device-desktop"
            onClick={() => handleDeviceClick('desktop')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeDev === 'desktop'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop Mode (1920×1080)"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>{t.deviceDesktop}</span>
          </button>

          <button
            id="preview-device-tablet"
            onClick={() => handleDeviceClick('tablet')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeDev === 'tablet'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet Mode (768×1024)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>{t.deviceTablet}</span>
          </button>

          <button
            id="preview-device-mobile"
            onClick={() => handleDeviceClick('mobile')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeDev === 'mobile'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile Mode (390×844)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t.deviceMobile}</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.refreshPreview}</span>
          </button>
          <button
            onClick={handleOpenNewWindow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.openNewTab}</span>
          </button>
        </div>
      </div>

      {/* Sandboxed iframe container */}
      <div className="relative bg-[#090d16] p-2 sm:p-4 flex items-center justify-center min-h-[580px] overflow-x-auto">
        <div
          className={`w-full ${getContainerMaxWidth()} transition-all duration-300 ease-out bg-white rounded-xl border border-slate-800 shadow-2xl overflow-hidden h-[550px] relative`}
        >
          <iframe
            key={`${key}-${activeDev}`}
            srcDoc={compiledDoc}
            title={`Live Preview Sandbox - ${activeDev}`}
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
