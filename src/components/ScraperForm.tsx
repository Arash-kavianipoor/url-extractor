import React, { useState, useEffect } from 'react';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Globe,
  FileCode2,
  Zap,
  Puzzle,
  CheckCircle2,
  Image,
  Film,
  AlertCircle
} from 'lucide-react';
import { Language, CrawlMode, ScrapeResult } from '../types.js';
import { translations, isRtlLanguage } from '../i18n.js';
import { downloadExtensionZip } from '../utils/extensionGenerator.js';

interface ScraperFormProps {
  language: Language;
  onScrape: (url: string, mode: CrawlMode, maxPages: number, customHtml?: string) => void;
  onExtensionResult?: (result: ScrapeResult) => void;
  isLoading: boolean;
}

export const ScraperForm: React.FC<ScraperFormProps> = ({
  language,
  onScrape,
  onExtensionResult,
  isLoading,
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingExt, setIsDownloadingExt] = useState<string | null>(null);
  const [extensionReady, setExtensionReady] = useState<boolean>(false);
  const [extensionBrowser, setExtensionBrowser] = useState<string>('');
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);
  const [isExtractingWithExt, setIsExtractingWithExt] = useState<boolean>(false);

  const t = translations[language];
  const isRtl = isRtlLanguage(language);

  // Bi-directional listener for extension communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (
        event.data.type === 'EXTENSION_READY' ||
        (event.data.type === 'EXTENSION_STATUS' &&
          (event.data.message === 'I am ready' || event.data.status === 'ready'))
      ) {
        setExtensionReady(true);
        if (event.data.browser) {
          setExtensionBrowser(event.data.browser);
        }
      }

      // Extension completed full extraction of all files (HTML, CSS, JS, Media, Assets)
      if (
        (event.data.type === 'EXTRACTION_COMPLETE' ||
          event.data.type === 'EXTENSION_EXTRACTION_COMPLETE') &&
        event.data.data
      ) {
        setIsExtractingWithExt(false);
        const data = event.data.data;
        if (onExtensionResult) {
          onExtensionResult(data);
        } else {
          onScrape(data.targetUrl, 'single', 1, data.files?.[0]?.content);
        }
      }

      if (
        event.data.type === 'EXTRACTION_ERROR' ||
        event.data.type === 'EXTENSION_EXTRACTION_ERROR'
      ) {
        setIsExtractingWithExt(false);
        setError(event.data.error || 'Extension extraction encountered an issue.');
      }
    };

    window.addEventListener('message', handleMessage);

    // Initial pings to extension
    window.postMessage({ type: 'EXTENSION_PING' }, '*');
    window.postMessage({ type: 'PING_EXTENSION' }, '*');
    const pingTimer = setInterval(() => {
      window.postMessage({ type: 'EXTENSION_PING' }, '*');
      window.postMessage({ type: 'PING_EXTENSION' }, '*');
    }, 2000);

    if ((window as any).__WEB_SCRAPER_EXTENSION_READY__) {
      setExtensionReady(true);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pingTimer);
    };
  }, [onExtensionResult, onScrape]);

  const handleDownloadExtension = async (browserType: 'chrome' | 'firefox' | 'all') => {
    setIsDownloadingExt(browserType);
    try {
      await downloadExtensionZip(browserType);
    } catch (e) {
      console.error('Failed to generate extension zip:', e);
    } finally {
      setIsDownloadingExt(null);
    }
  };

  const validateUrl = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError(t.formErrorEmptyUrl);
      return null;
    }
    let fullUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      new URL(fullUrl);
      return fullUrl;
    } catch {
      setError(t.formErrorInvalidUrl);
      return null;
    }
  };

  // Triggered when user clicks the standalone "استخراج کامل" button outside the form
  const handleFullExtractionClick = () => {
    setError(null);
    const validUrl = validateUrl(url);
    if (!validUrl) return;

    // 100% Extraction is handled by the browser extension
    if (extensionReady) {
      setIsExtractingWithExt(true);
      const reqId = 'req_' + Date.now();
      window.postMessage(
        {
          type: 'START_EXTRACTION',
          requestId: reqId,
          targetUrl: validUrl,
          devices: ['desktop', 'tablet', 'mobile'],
        },
        '*'
      );
      window.postMessage(
        {
          type: 'REQUEST_FULL_URL_EXTRACTION',
          targetUrl: validUrl,
        },
        '*'
      );
    }
    // Inform parent App component to initiate tracking and progress view
    onScrape(validUrl, 'single', 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFullExtractionClick();
  };

  const sampleUrls = [
    'https://example.com',
    'https://news.ycombinator.com',
    'https://quotes.toscrape.com',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/25">
      {/* Top Bar: Extension Status & 1-Click Activation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {extensionReady ? (
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs font-semibold shadow-lg shadow-emerald-950/40">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="font-mono text-sm font-bold tracking-tight">I am ready</span>
              <span className="text-slate-400 font-normal">
                ({language === 'fa' ? `اکستنشن متصل است${extensionBrowser ? ` - ${extensionBrowser}` : ''}` : `Connected${extensionBrowser ? ` - ${extensionBrowser}` : ''}`})
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-xs">
              <Puzzle className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                {language === 'fa'
                  ? 'استخراج تمام فایل‌ها تماماً برعهده اکستنشن است:'
                  : 'All file extraction is handled by the extension:'}
              </span>
            </div>
          )}
        </div>

        {/* Quick Download Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleDownloadExtension('firefox')}
            disabled={isDownloadingExt !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-orange-950/50 border border-slate-700 hover:border-orange-600/50 text-slate-200 hover:text-orange-300 transition cursor-pointer disabled:opacity-50"
          >
            <span>🦊</span>
            <span>{isDownloadingExt === 'firefox' ? '...' : (language === 'fa' ? 'افزونه فایرفاکس' : 'Firefox Add-on')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadExtension('chrome')}
            disabled={isDownloadingExt !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-sky-950/50 border border-slate-700 hover:border-sky-600/50 text-slate-200 hover:text-sky-300 transition cursor-pointer disabled:opacity-50"
          >
            <span>🌐</span>
            <span>{isDownloadingExt === 'chrome' ? '...' : (language === 'fa' ? 'اکستنشن کروم' : 'Chrome Extension')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInstallGuide(!showInstallGuide)}
            className="text-[11px] text-slate-400 hover:text-indigo-300 underline underline-offset-4 px-1 py-1 transition cursor-pointer"
          >
            {showInstallGuide ? (language === 'fa' ? 'بستن راهنما' : 'Close Guide') : (language === 'fa' ? 'راهنمای ۱۰ ثانیه‌ای' : '10s Guide')}
          </button>
        </div>
      </div>

      {/* Guide Panel */}
      {showInstallGuide && (
        <div className="mb-5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-indigo-400">
            {language === 'fa' ? 'فعال‌سازی اکستنشن (فقط یک‌بار):' : 'Activating the extension (one-time):'}
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
            <li>
              {language === 'fa'
                ? 'فایل ZIP بالا را دانلود و پوشه آن را باز کنید.'
                : 'Download the ZIP above and extract the folder.'}
            </li>
            <li>
              {language === 'fa'
                ? 'در کروم به chrome://extensions رفته، Developer mode را روشن کرده و دکمه Load unpacked را بزنید.'
                : 'In Chrome, go to chrome://extensions, enable Developer mode, and click Load unpacked.'}
            </li>
            <li>
              {language === 'fa'
                ? 'در پنجره اکستنشن فقط «I am ready» نمایش می‌یابد و اگر در سایت دیگری باشید خودکار خاموش می‌شود.'
                : 'The popup only shows "I am ready" on this site and turns OFF when on other sites.'}
            </li>
          </ol>
        </div>
      )}

      {/* Notice if extension not installed yet */}
      {!extensionReady && (
        <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            {language === 'fa'
              ? 'یادآوری: استخراج تمام فایل‌ها (HTML, CSS, JS, Media) تماماً برعهده اکستنشن است؛ با فعال کردن آن استخراج بدون محدودیت انجام می‌شود.'
              : 'Reminder: All file extraction (HTML, CSS, JS, Media) is handled by the companion extension.'}
          </span>
        </div>
      )}

      {/* THE FORM: Contains ONLY the URL input field */}
      <form id="url-input-form" onSubmit={handleSubmit} className="mb-4">
        <label htmlFor="target-url-input" className="block text-xs font-semibold text-slate-300 mb-2">
          {language === 'fa'
            ? 'آدرس اینترنتی وب‌سایت برای استخراج تمام فایل‌ها (URL):'
            : 'Target Website URL for Full Extraction:'}
        </label>

        <div className="relative flex items-center">
          <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-slate-500">
            <Globe className="w-5 h-5 text-indigo-400" />
          </div>

          <input
            id="target-url-input"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="https://example.com"
            dir="ltr"
            disabled={isLoading || isExtractingWithExt}
            className="w-full ps-11 pe-4 py-3.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-60"
          />
        </div>

        {error && (
          <p className="mt-2 text-xs text-rose-400 font-medium">{error}</p>
        )}
      </form>

      {/* DEDICATED BUTTON: STRICTLY OUTSIDE THE FORM */}
      <div className="pt-1 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          id="btn-start-full-extraction"
          onClick={handleFullExtractionClick}
          disabled={isLoading || isExtractingWithExt}
          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 active:scale-[0.98] text-slate-950 font-extrabold rounded-xl text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-50"
        >
          {isLoading || isExtractingWithExt ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
              <span>{language === 'fa' ? 'اکستنشن در حال استخراج تمام فایل‌ها...' : 'Extension Extracting All Files...'}</span>
            </>
          ) : (
            <>
              <span>{language === 'fa' ? 'استخراج کامل' : 'Full Extract'}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4 text-slate-950" /> : <ArrowRight className="w-4 h-4 text-slate-950" />}
            </>
          )}
        </button>

        {/* Extraction status badges */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {extensionReady
              ? (language === 'fa' ? 'استخراج مستقیم توسط اکستنشن' : 'Direct Extension Extraction')
              : (language === 'fa' ? 'استخراج خودکار بدون کپی-پیست' : 'Zero-Copy Direct Scraping')}
          </span>
        </div>
      </div>

      {/* Feature Highlights: What is extracted */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
          <FileCode2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{language === 'fa' ? 'تمام استایل‌ها (CSS)' : 'All CSS Styles'}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{language === 'fa' ? 'تمام کدهای جاوااسکریپت (JS)' : 'All JavaScript (JS)'}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
          <Image className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{language === 'fa' ? 'تمام Assetها و تصاویر' : 'All Images & Assets'}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
          <Film className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{language === 'fa' ? 'مدیاها، آیکون‌ها و فونت‌ها' : 'Media, SVGs & Fonts'}</span>
        </div>
      </div>

      {/* Samples & Quick Links */}
      <div className="flex items-center gap-2 flex-wrap text-xs pt-3 text-slate-500">
        <span className="text-[11px] text-slate-400">{language === 'fa' ? 'نمونه‌ها:' : 'Samples:'}</span>
        {sampleUrls.map((sUrl) => (
          <button
            key={sUrl}
            type="button"
            onClick={() => {
              setUrl(sUrl);
              setError(null);
            }}
            className="text-[11px] font-mono text-slate-400 hover:text-indigo-300 underline underline-offset-2 transition cursor-pointer"
          >
            {sUrl.replace('https://', '')}
          </button>
        ))}
      </div>
    </div>
  );
};
