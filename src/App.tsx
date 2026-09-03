import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Link2, 
  FileCode, 
  Eye, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Download,
  Archive,
  Heading,
  Laptop,
  Tablet,
  Smartphone
} from 'lucide-react';
import { Language, CrawlMode, ScrapeResult, ExtractedFile, DeviceType } from './types.js';
import { translations, isRtlLanguage } from './i18n.js';
import { Header } from './components/Header.js';
import { ScraperForm } from './components/ScraperForm.js';
import { StatsBar } from './components/StatsBar.js';
import { LinksTable } from './components/LinksTable.js';
import { CodeEditor } from './components/CodeEditor.js';
import { LivePreview } from './components/LivePreview.js';
import { FetchProgressBar } from './components/FetchProgressBar.js';
import { downloadZip, downloadAllDevicesBundle } from './utils/exporter.js';
import { updateDocumentSeo } from './seo/seoManager.js';
import { SEO_LANGUAGES } from './seo/seoConfig.js';

export default function App() {
  // Initialize language from URL query (?lang=xx), or localStorage, or default 'fa'
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang') as Language;
      if (urlLang && urlLang in SEO_LANGUAGES) {
        return urlLang;
      }
      const savedLang = localStorage.getItem('app_language') as Language;
      if (savedLang && savedLang in SEO_LANGUAGES) {
        return savedLang;
      }
    } catch {
      // ignore
    }
    return 'fa';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('app_theme') as 'dark' | 'light';
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeScrapeUrl, setActiveScrapeUrl] = useState<string>('');
  const [activeScrapeMode, setActiveScrapeMode] = useState<CrawlMode>('single');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');
  const [editedFiles, setEditedFiles] = useState<ExtractedFile[]>([]);
  const [originalFiles, setOriginalFiles] = useState<ExtractedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'links' | 'headings' | 'editor' | 'preview'>('links');
  const [isZippingAll, setIsZippingAll] = useState<boolean>(false);

  const t = translations[language];
  const isRtl = isRtlLanguage(language);

  // Sync document SEO tags, hreflangs, canonical, JSON-LD, html lang and dir
  useEffect(() => {
    updateDocumentSeo(language);
  }, [language]);

  // Sync theme with localStorage and document root
  useEffect(() => {
    try {
      localStorage.setItem('app_theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('app_language', newLang);
      const url = new URL(window.location.href);
      if (newLang === 'en') {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', newLang);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore in constrained contexts
    }
  };

  const handleScrape = async (url: string, mode: CrawlMode, maxPages: number) => {
    setIsLoading(true);
    setActiveScrapeUrl(url);
    setActiveScrapeMode(mode);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, mode, maxPages }),
      });

      if (!response.ok) {
        let errMessage = '';
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const errorJson = await response.json();
            errMessage = errorJson.error;
          } catch {
            errMessage = `HTTP ${response.status}: Failed to scrape target URL.`;
          }
        } else {
          // Cloudflare HTML error pages (e.g., 503 Worker subrequest/CPU limit)
          if (response.status === 503) {
            errMessage =
              language === 'fa'
                ? 'خطای ۵۰۳ سرویس کلودفلر: ورکر به محدودیت ۵۰ ریکوئست یا زمان پردازش CPU رسید یا سایت هدف دسترسی ربات را مسدود کرده است.'
                : 'Cloudflare 503 Service Unavailable: The worker exceeded subrequest/CPU limits or the target site blocked access.';
          } else {
            errMessage = `HTTP ${response.status} (${response.statusText || 'Server Error'})`;
          }
        }
        throw new Error(errMessage || 'Failed to fetch the target URL.');
      }

      const data = await response.json();

      setResult(data);
      // Select desktop by default and load desktop files
      setSelectedDevice('desktop');
      const initialFiles = data.deviceVersions?.desktop?.files || data.files || [];
      setOriginalFiles(JSON.parse(JSON.stringify(initialFiles)));
      setEditedFiles(JSON.parse(JSON.stringify(initialFiles)));
      setActiveTab('links');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDevice = (dev: DeviceType) => {
    setSelectedDevice(dev);
    if (result?.deviceVersions?.[dev]?.files) {
      const devFiles = result.deviceVersions[dev].files;
      setOriginalFiles(JSON.parse(JSON.stringify(devFiles)));
      setEditedFiles(JSON.parse(JSON.stringify(devFiles)));
    }
  };

  const handleUpdateFileContent = (fileId: string, newContent: string) => {
    setEditedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, content: newContent, size: new Blob([newContent]).size } : f))
    );
  };

  const handleResetFileContent = (fileId: string) => {
    const original = originalFiles.find((f) => f.id === fileId);
    if (original) {
      setEditedFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...original } : f))
      );
    }
  };

  const handleDownloadSingleDevice = async (dev: DeviceType) => {
    if (!result) return;
    const devFiles = result.deviceVersions?.[dev]?.files || editedFiles;
    if (!devFiles.length) return;
    try {
      setIsZippingAll(true);
      const domain = result.domain || 'website';
      const zipName = `${domain}_${dev}_version.zip`;
      await downloadZip(devFiles, zipName, result.mode || 'single');
    } catch (err: any) {
      alert(`Error creating ${dev} zip: ${err.message}`);
    } finally {
      setIsZippingAll(false);
    }
  };

  const handleGlobalZipDownload = async () => {
    if (!result) return;
    try {
      setIsZippingAll(true);
      const domain = result.domain || 'offline_site';
      if (result.deviceVersions) {
        const zipName = `${domain}_all_3_devices_bundle.zip`;
        await downloadAllDevicesBundle(result.deviceVersions, zipName, result.mode || 'single', domain);
      } else {
        const zipName = `${domain}_offline_site.zip`;
        await downloadZip(editedFiles, zipName, result.mode || 'single');
      }
    } catch (err: any) {
      alert(`Error creating zip: ${err.message}`);
    } finally {
      setIsZippingAll(false);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        theme === 'light' ? 'bg-slate-50 text-slate-900 light' : 'bg-[#0f172a] text-slate-200 dark'
      }`}
    >
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Scraper Input Panel */}
        <ScraperForm
          language={language}
          onScrape={handleScrape}
          isLoading={isLoading}
        />

        {/* Live Fetching Progress Bar */}
        <FetchProgressBar
          isLoading={isLoading}
          targetUrl={activeScrapeUrl}
          mode={activeScrapeMode}
          language={language}
        />

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-start gap-3 text-xs sm:text-sm shadow-md">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold mb-0.5">{t.errorTitle}</strong>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Scrape Results Section */}
        {result ? (
          <div className="space-y-6">
            {/* Stats Dashboard */}
            <StatsBar result={result} language={language} />

            {/* 100% Offline Readiness & 3-Device Emulation Hub Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900 border border-emerald-500/30 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-xl shadow-black/25">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-emerald-200">{t.deviceVersionTitle}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {t.badgeZeroInternet}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      {t.badgeDeviceEmulation}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {result.mode === 'all' ? t.bannerDedicatedFolders : t.bannerFlatFiles}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                    {t.deviceVersionDesc}
                  </p>
                </div>
              </div>

              {/* 3 Dedicated Download Buttons (Desktop, Tablet, Mobile) + All 3 Bundle */}
              <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto">
                <button
                  id="btn-download-desktop"
                  onClick={() => handleDownloadSingleDevice('desktop')}
                  disabled={isZippingAll}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 transition cursor-pointer disabled:opacity-50"
                  title={t.downloadDesktopZip}
                >
                  <Laptop className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t.downloadDesktopZip}</span>
                </button>

                <button
                  id="btn-download-tablet"
                  onClick={() => handleDownloadSingleDevice('tablet')}
                  disabled={isZippingAll}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 transition cursor-pointer disabled:opacity-50"
                  title={t.downloadTabletZip}
                >
                  <Tablet className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.downloadTabletZip}</span>
                </button>

                <button
                  id="btn-download-mobile"
                  onClick={() => handleDownloadSingleDevice('mobile')}
                  disabled={isZippingAll}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 transition cursor-pointer disabled:opacity-50"
                  title={t.downloadMobileZip}
                >
                  <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.downloadMobileZip}</span>
                </button>

                <button
                  id="banner-download-zip"
                  onClick={handleGlobalZipDownload}
                  disabled={isZippingAll}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition cursor-pointer shadow-md shadow-emerald-900/40 disabled:opacity-50"
                  title={t.downloadAllDevicesZip}
                >
                  <Archive className="w-4 h-4" />
                  <span>{isZippingAll ? '...' : t.downloadAllDevicesZip}</span>
                </button>
              </div>
            </div>

            {/* Quick Actions & Navigation Tabs */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              {/* Tab Selection */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
                <button
                  id="tab-links-btn"
                  onClick={() => setActiveTab('links')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'links'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Link2 className="w-4 h-4 text-indigo-400" />
                  <span>{t.tabLinks}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-950/70 text-indigo-300 border border-indigo-500/30 font-bold">
                    {result.totalLinksFound}
                  </span>
                </button>

                <button
                  id="tab-headings-btn"
                  onClick={() => setActiveTab('headings')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'headings'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Heading className="w-4 h-4 text-rose-400" />
                  <span>{t.tabHeadings}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-950/70 text-rose-300 border border-rose-500/30 font-bold">
                    {result.totalHeadingsFound ?? result.headings?.length ?? 0}
                  </span>
                </button>

                <button
                  id="tab-editor-btn"
                  onClick={() => setActiveTab('editor')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'editor'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span>{t.tabFiles}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-950/70 text-purple-300 border border-purple-500/30 font-bold">
                    {editedFiles.length}
                  </span>
                </button>

                <button
                  id="tab-preview-btn"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>{t.tabPreview}</span>
                </button>
              </div>

              {/* Device Selector for Active Editor & Preview View */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
                <span className="text-[11px] text-slate-400 px-2 font-medium hidden lg:inline-block">
                  {t.activeDeviceLabel}:
                </span>
                <button
                  id="tab-device-desktop"
                  onClick={() => handleSelectDevice('desktop')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedDevice === 'desktop'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Desktop (1920×1080)"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>{t.deviceDesktop}</span>
                </button>

                <button
                  id="tab-device-tablet"
                  onClick={() => handleSelectDevice('tablet')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedDevice === 'tablet'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tablet (768×1024)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>{t.deviceTablet}</span>
                </button>

                <button
                  id="tab-device-mobile"
                  onClick={() => handleSelectDevice('mobile')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedDevice === 'mobile'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Mobile (390×844)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{t.deviceMobile}</span>
                </button>
              </div>
            </div>

            {/* Tab View Container */}
            <div>
              {(activeTab === 'links' || activeTab === 'headings') && (
                <LinksTable
                  links={result.links}
                  headings={result.headings}
                  language={language}
                  initialSubTab={activeTab === 'headings' ? 'headings' : 'links'}
                />
              )}

              {activeTab === 'editor' && (
                <CodeEditor
                  files={editedFiles}
                  originalFiles={originalFiles}
                  onUpdateFileContent={handleUpdateFileContent}
                  onResetFileContent={handleResetFileContent}
                  language={language}
                  mode={result.mode}
                />
              )}

              {activeTab === 'preview' && (
                <LivePreview
                  files={editedFiles}
                  language={language}
                  currentDevice={selectedDevice}
                  onDeviceChange={handleSelectDevice}
                />
              )}
            </div>
          </div>
        ) : (
          /* Empty Initial State / Guides */
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 sm:p-12 text-center shadow-xl shadow-black/20">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 mb-4 shadow-lg shadow-indigo-950/50">
              <Globe className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">
              {t.emptyStateTitle}
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
              {t.emptyStateDesc}
            </p>

            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 font-semibold text-xs text-slate-200 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.tipLinkExtraction}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.quickTip1}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 font-semibold text-xs text-slate-200 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{t.tipAssetsSourceCode}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.quickTip2}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 font-semibold text-xs text-slate-200 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{t.tipLiveEditorZip}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.quickTip3}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-400">
        <p>
          Website designed by{' '}
          <a
            href="https://sorena-it.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 transition-colors"
          >
            Sorena-IT
          </a>
        </p>
      </footer>
    </div>
  );
}
