import React, { useState } from 'react';
import {
  Search,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Globe,
  Layers,
  FileCode2,
  Terminal,
  Cpu,
  ShieldCheck,
  Code2,
  Copy,
  Sparkles,
  Zap
} from 'lucide-react';
import { Language, CrawlMode } from '../types.js';
import { translations, isRtlLanguage } from '../i18n.js';

interface ScraperFormProps {
  language: Language;
  onScrape: (url: string, mode: CrawlMode, maxPages: number, customHtml?: string) => void;
  isLoading: boolean;
}

export const ScraperForm: React.FC<ScraperFormProps> = ({ language, onScrape, isLoading }) => {
  const [activeInputMethod, setActiveInputMethod] = useState<'url' | 'chromedriver'>('url');
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<CrawlMode>('single');
  const [maxPages, setMaxPages] = useState<number>(8);
  const [customHtml, setCustomHtml] = useState('');
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];
  const isRtl = isRtlLanguage(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError(t.formErrorEmptyUrl);
      return;
    }

    let testUrl = trimmedUrl;
    try {
      testUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
      new URL(testUrl);
    } catch {
      setError(t.formErrorInvalidUrl);
      return;
    }

    if (activeInputMethod === 'chromedriver') {
      if (!customHtml.trim()) {
        setError(
          language === 'fa'
            ? 'لطفاً کدهای سورس HTML یا خروجی ChromeDriver را در کادر متنی وارد کنید.'
            : 'Please paste the HTML source code or ChromeDriver output into the textarea.'
        );
        return;
      }
      onScrape(testUrl, mode, maxPages, customHtml);
    } else {
      onScrape(testUrl, mode, maxPages);
    }
  };

  const sampleUrls = [
    'https://example.com',
    'https://news.ycombinator.com',
    'https://quotes.toscrape.com',
  ];

  const handleInsertSampleHtml = () => {
    setUrl('https://example-shop.com');
    setCustomHtml(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فروشگاه نمونه واکنش‌گرا</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
    header { background: #4f46e5; color: #fff; padding: 24px; border-radius: 16px; text-align: center; }
    h1 { margin: 0 0 8px 0; font-size: 28px; }
    .hero { margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    .card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    a.btn { display: inline-block; margin-top: 12px; padding: 8px 16px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <header>
    <h1>فروشگاه تست چند‌دستگاهی</h1>
    <p>استخراج مستقیم و نمایش در دسکتاپ، تبلت و موبایل بدون وابستگی به سرور</p>
  </header>
  <main class="hero">
    <div class="card">
      <h2>محصول ۱: لپ‌تاپ پرو</h2>
      <p>نمایش کامل در مانیتور دسکتاپ با وضوح بالا.</p>
      <a class="btn" href="https://example-shop.com/products/laptop">مشاهده محصول</a>
    </div>
    <div class="card">
      <h2>محصول ۲: تبلت اولترا</h2>
      <p>بهینه‌سازی لمسی با استایل اختصاصی تبلت.</p>
      <a class="btn" href="https://example-shop.com/products/tablet">مشاهده محصول</a>
    </div>
    <div class="card">
      <h2>محصول ۳: گوشی همراه</h2>
      <p>ابعاد واکنش‌گرا برای فریم گوشی هوشمند.</p>
      <a class="btn" href="https://example-shop.com/products/mobile">مشاهده محصول</a>
    </div>
  </main>
</body>
</html>`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/25">
      {/* Top Method Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            id="tab-method-url"
            onClick={() => {
              setActiveInputMethod('url');
              setError(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeInputMethod === 'url'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{language === 'fa' ? 'واکشی آنلاین با مرورگر کاربر' : 'Client Browser URL Scraping'}</span>
          </button>

          <button
            type="button"
            id="tab-method-chromedriver"
            onClick={() => {
              setActiveInputMethod('chromedriver');
              setError(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeInputMethod === 'chromedriver'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{language === 'fa' ? 'سورس مستقیم / ChromeDriver' : 'ChromeDriver / Page Source'}</span>
          </button>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl font-mono">
          <Cpu className="w-3.5 h-3.5 shrink-0" />
          <span>{language === 'fa' ? 'موتور کلاینت: پردازش ۱۰۰٪ در مرورگر (بدون خطای ۵۰۳)' : 'Client-Side Engine: 0% Server CPU (No 503 Limits)'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target URL Input */}
        <div>
          <label
            htmlFor="target-url-input"
            className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
          >
            {t.urlLabel}
          </label>
          <div className="relative">
            <div
              className={`absolute inset-y-0 ${
                isRtl ? 'right-0 pr-3.5' : 'left-0 pl-3.5'
              } flex items-center pointer-events-none text-slate-500`}
            >
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

          {error && <p className="text-xs text-rose-400 mt-2 font-medium">{error}</p>}

          {/* Quick samples (only in URL mode) */}
          {activeInputMethod === 'url' && (
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
          )}
        </div>

        {/* If ChromeDriver / Source Code Method is active: Textarea & Guidance */}
        {activeInputMethod === 'chromedriver' && (
          <div className="space-y-3 bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label
                htmlFor="custom-html-textarea"
                className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider"
              >
                <Code2 className="w-4 h-4" />
                <span>
                  {language === 'fa'
                    ? 'کدهای سورس HTML یا خروجی ChromeDriver (Page Source)'
                    : 'Raw HTML Source / ChromeDriver Output'}
                </span>
              </label>

              <button
                type="button"
                onClick={handleInsertSampleHtml}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition cursor-pointer font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'fa' ? 'درج کد نمونه تستی' : 'Insert Test HTML'}</span>
              </button>
            </div>

            <textarea
              id="custom-html-textarea"
              rows={6}
              value={customHtml}
              onChange={(e) => {
                setCustomHtml(e.target.value);
                if (error) setError(null);
              }}
              placeholder={
                language === 'fa'
                  ? 'کدهای HTML کامل صفحه (کپی‌شده از کلیک راست > View Page Source یا خروجی driver.page_source در پایتون/کروم‌درایور) را اینجا Paste کنید...'
                  : 'Paste full page HTML (copied from View Page Source or driver.page_source in Selenium/ChromeDriver) here...'
              }
              dir="ltr"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />

            {/* Quick Helper Banner */}
            <div className="p-3 bg-indigo-950/40 border border-indigo-900/50 rounded-xl text-xs text-indigo-200/90 leading-relaxed">
              <p className="font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  {language === 'fa'
                    ? 'راهنمای دور زدن سریع سایت‌های تحت کلودفلر یا کپچا:'
                    : 'Guide for Cloudflare Captcha Protected Sites:'}
                </span>
              </p>
              <p className="text-[11px] text-slate-300">
                {language === 'fa'
                  ? 'در صورتی که سایتی دارای سیستم ضد ربات (Cloudflare Turnstile/Bot Protection) باشد، سایت را در مرورگر کروم یا ChromeDriver باز کنید، کلیدهای Ctrl+U را بزنید، تمام سورس را کپی و در این کادر Paste کنید. مرورگر شما در یک لحظه تمام لینک‌ها، استایل‌ها، فونت‌ها و ۳ نمایشگر را استخراج می‌کند!'
                  : 'If a site uses Cloudflare anti-bot or CAPTCHAs, simply open it in Chrome/ChromeDriver, press Ctrl+U, copy the page source, and paste it here. Your browser will instantly parse all links, CSS, headings, and 3-screen viewports!'}
              </p>
            </div>
          </div>
        )}

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
                <Zap className="w-4 h-4 text-amber-300" />
                <span>
                  {activeInputMethod === 'chromedriver'
                    ? language === 'fa'
                      ? 'شروع استخراج فوری از کدهای داده‌شده و ساخت ۳ نمایشگر'
                      : 'Extract Source & Build 3 Viewports'
                    : t.startScraping}
                </span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
