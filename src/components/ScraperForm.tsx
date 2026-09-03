import React, { useState } from 'react';
import { Search, Loader2, ArrowRight, ArrowLeft, Globe, Layers, FileCode2 } from 'lucide-react';
import { Language, CrawlMode } from '../types.js';
import { translations, isRtlLanguage } from '../i18n.js';

interface ScraperFormProps {
  language: Language;
  onScrape: (url: string, mode: CrawlMode, maxPages: number) => void;
  isLoading: boolean;
}

export const ScraperForm: React.FC<ScraperFormProps> = ({ language, onScrape, isLoading }) => {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<CrawlMode>('single');
  const [maxPages, setMaxPages] = useState<number>(8);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];
  const isRtl = isRtlLanguage(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError(t.formErrorEmptyUrl);
      return;
    }

    try {
      const testUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      new URL(testUrl);
      onScrape(testUrl, mode, maxPages);
    } catch {
      setError(t.formErrorInvalidUrl);
    }
  };

  const sampleUrls = [
    'https://example.com',
    'https://news.ycombinator.com',
    'https://quotes.toscrape.com',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/25">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input */}
        <div>
          <label htmlFor="target-url-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t.urlLabel}
          </label>
          <div className="relative">
            <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-500`}>
              <Search className="w-5 h-5" />
            </div>
            <input
              id="target-url-input"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t.urlPlaceholder}
              dir="ltr"
              disabled={isLoading}
              className={`w-full rounded-xl border border-slate-700 bg-slate-950 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors ${
                isRtl ? 'pr-11 pl-4 text-left' : 'pl-11 pr-4'
              }`}
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 mt-2 font-medium">{error}</p>
          )}

          {/* Quick samples */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap text-xs text-slate-500">
            <span className="text-slate-400">{t.demoUrls}</span>
            {sampleUrls.map((sUrl) => (
              <button
                key={sUrl}
                type="button"
                onClick={() => setUrl(sUrl)}
                className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 hover:text-indigo-400 text-slate-400 border border-slate-700/60 transition font-mono text-[11px] cursor-pointer"
              >
                {sUrl.replace(/^https?:\/\//, '')}
              </button>
            ))}
          </div>
        </div>

        {/* Radio options: Only this page vs All links on the site */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            {t.fetchScopeTitle}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Option 1: Single Page */}
            <label
              htmlFor="mode-single-radio"
              className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                mode === 'single'
                  ? 'border-indigo-500 bg-indigo-950/40 text-slate-100 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-800/40 text-slate-300'
              }`}
            >
              <input
                id="mode-single-radio"
                type="radio"
                name="crawl-mode"
                checked={mode === 'single'}
                onChange={() => setMode('single')}
                disabled={isLoading}
                className="mt-1 h-4 w-4 text-indigo-500 border-slate-700 focus:ring-indigo-500 cursor-pointer accent-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-100 flex-wrap">
                  <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{t.fetchSinglePage}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                    {t.formZeroFoldersBadge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {t.fetchSinglePageDesc}
                </p>
              </div>
            </label>

            {/* Option 2: All links on the site */}
            <label
              htmlFor="mode-all-radio"
              className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                mode === 'all'
                  ? 'border-indigo-500 bg-indigo-950/40 text-slate-100 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/50'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-800/40 text-slate-300'
              }`}
            >
              <input
                id="mode-all-radio"
                type="radio"
                name="crawl-mode"
                checked={mode === 'all'}
                onChange={() => setMode('all')}
                disabled={isLoading}
                className="mt-1 h-4 w-4 text-indigo-500 border-slate-700 focus:ring-indigo-500 cursor-pointer accent-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-100 flex-wrap">
                  <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{t.fetchAllLinks}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 font-semibold">
                    {t.formDedicatedFoldersBadge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {t.fetchAllLinksDesc}
                </p>
              </div>
            </label>
          </div>

          {/* If Mode is All: optional pages selector */}
          {mode === 'all' && (
            <div className="mt-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-400 font-medium">{t.maxPagesLabel}</span>
              <div className="flex items-center gap-2">
                {[5, 8, 12, 15].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setMaxPages(count)}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer text-xs ${
                      maxPages === count
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                        : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {count} {t.formPagesCountSuffix}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit button */}
        <div>
          <button
            id="start-scrape-button"
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.scrapingInProgress}</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>{t.startScraping}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
