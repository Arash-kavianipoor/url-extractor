import React, { useState } from 'react';
import { 
  Download, 
  Chrome, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  FolderArchive, 
  Terminal, 
  Play, 
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Language } from '../types.js';
import { downloadVerifiedExtensionZip } from '../utils/extensionDownloader';

interface ExtensionDownloadHeroProps {
  language: Language;
  onLaunchPreview: () => void;
  isPreviewOpen: boolean;
}

export const ExtensionDownloadHero: React.FC<ExtensionDownloadHeroProps> = ({
  language,
  onLaunchPreview,
  isPreviewOpen
}) => {
  const [activeBrowserTab, setActiveBrowserTab] = useState<'chrome' | 'firefox'>('chrome');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadStatusMsg, setDownloadStatusMsg] = useState<string>('');

  const isFa = language === 'fa';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(false);
    setDownloadStatusMsg(isFa ? 'در حال آماده‌سازی و دانلود بسته کامل (۵۶ کیلوبایت)...' : 'Preparing complete verified package (~56 KB)...');

    try {
      const res = await downloadVerifiedExtensionZip((msg) => {
        setDownloadStatusMsg(msg);
      });
      if (res.success) {
        setDownloadSuccess(true);
        setDownloadStatusMsg(
          isFa
            ? `✓ دانلود کامل با موفقیت انجام شد (${Math.round(res.size / 1024)} کیلوبایت - بسته کاملاً سالم)`
            : `✓ Downloaded successfully (${Math.round(res.size / 1024)} KB - verified complete package)`
        );
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadStatusMsg(isFa ? 'خطا در بارگیری، لطفاً مجدداً تلاش کنید.' : 'Download error, please retry.');
    } finally {
      setIsDownloading(false);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 7000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Primary Hero Section - Dedicated Extension Download Hub */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950 border border-indigo-500/25 p-6 sm:p-10 shadow-2xl shadow-indigo-950/20 backdrop-blur-xl">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {isFa
                ? 'نسخه جدید افزونه مرورگر (کروم و موزیلا فایرفاکس) | Manifest V3'
                : 'New Browser Extension (Chrome & Mozilla Firefox) | Manifest V3'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            {isFa ? (
              <>
                دانلود اکستنشن مرورگر{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
                  وب اسکرپر و استخراج آفلاین
                </span>
              </>
            ) : (
              <>
                Download Browser Extension{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
                  Web Scraper & Offline Extractor
                </span>
              </>
            )}
          </h1>

          {/* Core Subtitle & Architecture Statement */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mb-8 leading-relaxed">
            {isFa
              ? 'تمامی عملیات استخراج، کشف پیوندها، ساختار تیترها (H1-H6) و تولید فایل‌های اکسل و پکیج زیپ ۱۰۰٪ بر روی سیستم خود شما در مرورگر اجرا می‌شود؛ بدون کوچک‌ترین بار روی سرور و بدون محدودیت‌های کلودفلر.'
              : 'All link parsing, heading audits (H1-H6), structured Excel CSV generation, and offline ZIP bundling run 100% locally on your own machine. Zero server load and zero Cloudflare rate limits.'}
          </p>

          {/* The Single Primary Download Action */}
          <div className="w-full max-w-md flex flex-col items-center gap-3">
            <button
              id="btn-primary-download-extension"
              onClick={handleDownload}
              disabled={isDownloading}
              className={`w-full group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 shadow-xl cursor-pointer disabled:opacity-80 ${
                downloadSuccess
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 active:scale-[0.98] shadow-indigo-600/30 hover:shadow-indigo-600/50'
              }`}
            >
              {downloadSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />
              ) : (
                <Download className={`w-5 h-5 text-white shrink-0 ${isDownloading ? 'animate-bounce' : 'group-hover:translate-y-0.5 transition-transform'}`} />
              )}
              <span className="text-lg">
                {isDownloading
                  ? isFa ? 'در حال آماده‌سازی و دانلود...' : 'Downloading Package...'
                  : downloadSuccess
                    ? isFa ? 'دانلود کامل انجام شد' : 'Download Completed'
                    : isFa ? 'دانلود اکستنشن (نسخه کروم و موزیلا)' : 'Download Extension (Chrome & Firefox)'}
              </span>
            </button>

            {/* Live Status notification when downloading or finished */}
            {downloadStatusMsg && (
              <div className={`text-xs px-3.5 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                downloadSuccess 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                  : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
              }`}>
                {downloadSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                )}
                <span className="font-medium">{downloadStatusMsg}</span>
              </div>
            )}

            {/* Sub details: version, size, format */}
            <div className="flex items-center justify-center gap-3 text-xs text-slate-400 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <FolderArchive className="w-3.5 h-3.5 text-slate-500" />
                <span>web-scraper-pro-extension.zip</span>
              </span>
              <span>•</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-emerald-300 font-mono text-[11px] font-semibold border border-slate-700">
                {isFa ? 'حجم واقعی: ۵۶ کیلوبایت' : 'Real Size: ~56 KB'}
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                {isFa ? '۱۰۰٪ کامل و آماده نصب (Unpacked)' : '100% Complete & Unpacked'}
              </span>
            </div>
          </div>

          {/* Quick Architecture Benefit Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-10 pt-10 border-t border-slate-800/80 text-right">
            {/* Benefit 1 */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3.5 hover:border-indigo-500/30 transition">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200 mb-1">
                  {isFa ? 'حذف ۱۰۰٪ فشار سرور' : '100% Client-Side'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'تمامی ورکرها و عملیات با پردازنده و حافظه رایانه شما اجرا می‌شوند.'
                    : 'Workers run using your own browser runtime with zero backend resource consumption.'}
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3.5 hover:border-emerald-500/30 transition">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200 mb-1">
                  {isFa ? 'بدون خطای ۵۰۳ و محدودیت' : 'Zero 503 & Rate Limits'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'بدون سقف ۵۰ ساب‌ریکوئست کلودفلر؛ هر تعداد پیوند بدون محدودیت استخراج می‌شود.'
                    : 'Bypass Cloudflare worker subrequest limits and proxy timeout bottlenecks.'}
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3.5 hover:border-sky-500/30 transition">
              <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200 mb-1">
                  {isFa ? 'استخراج مستقیم DOM زنده' : 'Live DOM Extraction'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'نیازی به شبیه‌ساز نیست؛ کدهای رندرشده، صفحات SPA و استایل‌ها مستقیماً خوانده می‌شوند.'
                    : 'Access live hydrated React/Vue DOM and real computed styles with no headless emulator.'}
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3.5 hover:border-purple-500/30 transition">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200 mb-1">
                  {isFa ? 'پشتیبانی از صفحات لاگین' : 'Authenticated Pages'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'امکان استخراج داشبوردها و صفحات خصوصی حساب شما با نشست فعال مرورگر.'
                    : 'Extract private logged-in portals and internal accounts safely using your session.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Installation Guide */}
      <section className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <span>{isFa ? 'راهنمای گام‌به‌گام نصب در مرورگر' : 'Step-by-Step Installation Guide'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isFa
                ? 'فقط ۳ مرحله ساده در کمتر از ۳۰ ثانیه برای فعال‌سازی کامل در کروم و فایرفاکس:'
                : 'Follow these 3 simple steps in under 30 seconds to load the extension into your browser:'}
            </p>
          </div>

          {/* Browser Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 border border-slate-700/60 rounded-xl shrink-0">
            <button
              onClick={() => setActiveBrowserTab('chrome')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeBrowserTab === 'chrome'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Chrome className="w-4 h-4 text-amber-400" />
              <span>Google Chrome / Edge / Brave</span>
            </button>

            <button
              onClick={() => setActiveBrowserTab('firefox')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeBrowserTab === 'firefox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-[9px] font-bold text-white">
                F
              </span>
              <span>Mozilla Firefox</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Chrome / Edge / Brave / Opera Instructions */}
        {activeBrowserTab === 'chrome' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm mb-3">
                  ۱
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {isFa ? 'استخراج فایل فشرده (Unzip)' : 'Extract ZIP Archive'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'فایل دانلودی (web-scraper-pro-extension.zip) را باز کرده و محتویات آن را با راست‌کلیک و انتخاب Extract All در یک پوشه قرار دهید.'
                    : 'Unpack the downloaded web-scraper-pro-extension.zip into a permanent folder on your computer.'}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm mb-3">
                  ۲
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {isFa ? 'باز کردن بخش افزونه‌ها و Developer mode' : 'Open Extensions & Developer mode'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {isFa
                    ? 'در نوار آدرس مرورگر آدرس زیر را وارد کنید و کلید Developer mode (بالا راست) را فعال کنید:'
                    : 'Open the following internal page in Chrome and toggle on "Developer mode" in the top right:'}
                </p>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-sky-300">
                  <span className="truncate">chrome://extensions</span>
                  <button
                    onClick={() => handleCopy('chrome://extensions')}
                    className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                    title={isFa ? 'کپی آدرس' : 'Copy'}
                  >
                    {copiedUrl === 'chrome://extensions' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm mb-3">
                  ۳
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {isFa ? 'کلیک روی Load unpacked' : 'Click "Load unpacked"'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'در گوشه بالا سمت چپ روی دکمه Load unpacked کلیک کنید و پوشه استخراج‌شده را انتخاب کنید. افزونه فوراً فعال می‌شود!'
                    : 'Click "Load unpacked" in the top left and select the unzipped directory. The extension is now instantly ready!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Firefox Instructions */}
        {activeBrowserTab === 'firefox' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm mb-3">
                  ۱
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {isFa ? 'استخراج فایل زیپ' : 'Unzip the Archive'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'فایل web-scraper-pro-extension.zip را در یک پوشه از حالت فشرده خارج کنید.'
                    : 'Extract the contents of web-scraper-pro-extension.zip into a local folder.'}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm mb-3">
                  ۲
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {isFa ? 'باز کردن دیباگ فایرفاکس' : 'Open Firefox Debugging'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {isFa
                    ? 'در نوار آدرس فایرفاکس عبارت زیر را وارد کرده و Enter بزنید:'
                    : 'Navigate to Firefox internal add-on debugging page:'}
                </p>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-sky-300">
                  <span className="truncate">about:debugging#/runtime/this-firefox</span>
                  <button
                    onClick={() => handleCopy('about:debugging#/runtime/this-firefox')}
                    className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                    title={isFa ? 'کپی آدرس' : 'Copy'}
                  >
                    {copiedUrl === 'about:debugging#/runtime/this-firefox' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm mb-3">
                  ۳
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {isFa ? 'انتخاب Load Temporary Add-on' : 'Load Temporary Add-on'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isFa
                    ? 'روی دکمه Load Temporary Add-on کلیک کرده و فایل manifest.json درون پوشه اکستنشن را انتخاب کنید.'
                    : 'Click "Load Temporary Add-on..." and select the manifest.json file inside the extension folder.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Interactive Toggle for the In-Browser Extension Workspace */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-indigo-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
            <Play className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">
              {isFa ? 'پیش‌نمایش زنده امکانات اکستنشن در مرورگر' : 'Live In-Browser Extension Simulator'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa
                ? 'مشاهده تمام قابلیت‌هایی که پس از نصب اکستنشن در مرورگر دریافت می‌کنید (جدول پیوندها، تیترهای H1-H6، اکسل و بسته آفلاین)'
                : 'Preview the full workspace (Links table, H1-H6 headings, structured Excel CSV, and offline ZIP packager) directly here.'}
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-extension-preview"
          onClick={onLaunchPreview}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            isPreviewOpen
              ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/40'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>
            {isPreviewOpen
              ? isFa ? 'بستن پیش‌نمایش محیط اکستنشن' : 'Collapse Workspace Simulator'
              : isFa ? 'مشاهده و تست محیط کار اکستنشن' : 'Test & Preview Extension Workspace'}
          </span>
        </button>
      </div>
    </div>
  );
};
