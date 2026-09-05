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
import { translations } from '../i18n.js';
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

  const t = translations[language];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(false);
    setDownloadStatusMsg(t.extPreparingStatus);

    try {
      const res = await downloadVerifiedExtensionZip((msg) => {
        setDownloadStatusMsg(msg);
      }, language);
      if (res.success) {
        setDownloadSuccess(true);
        setDownloadStatusMsg(t.extDownloadSuccessMsg);
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadStatusMsg(t.extDownloadErrorMsg);
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
              {t.extHeroBadge}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            {t.extHeroTitlePrefix}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
              {t.extHeroTitleHighlight}
            </span>
          </h1>

          {/* Core Subtitle & Architecture Statement */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mb-8 leading-relaxed">
            {t.extHeroSubtitle}
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
                  ? t.extBtnDownloading
                  : downloadSuccess
                    ? t.extBtnCompleted
                    : t.extBtnDownload}
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
                {t.extRealSize}
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                {t.extStatusUnpacked}
              </span>
            </div>
          </div>

          {/* Quick Architecture Benefit Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-10 pt-10 border-t border-slate-800/80 text-left">
            {/* Benefit 1 */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3.5 hover:border-indigo-500/30 transition">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200 mb-1">
                  {t.extBenefit1Title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.extBenefit1Desc}
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
                  {t.extBenefit2Title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.extBenefit2Desc}
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
                  {t.extBenefit3Title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.extBenefit3Desc}
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
                  {t.extBenefit4Title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.extBenefit4Desc}
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
              <span>{t.extGuideTitle}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t.extGuideDesc}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm mb-3">
                  1
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {t.extStep1TitleChrome}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.extStep1DescChrome}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm mb-3">
                  2
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {t.extStep2TitleChrome}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {t.extStep2DescChrome}
                </p>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-sky-300">
                  <span className="truncate">chrome://extensions</span>
                  <button
                    onClick={() => handleCopy('chrome://extensions')}
                    className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                    title={copiedUrl === 'chrome://extensions' ? t.extCopiedBtn : t.extCopyBtn}
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
                  3
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {t.extStep3TitleChrome}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.extStep3DescChrome}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Firefox Instructions */}
        {activeBrowserTab === 'firefox' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm mb-3">
                  1
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {t.extStep1TitleFirefox}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.extStep1DescFirefox}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm mb-3">
                  2
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {t.extStep2TitleFirefox}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {t.extStep2DescFirefox}
                </p>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-sky-300">
                  <span className="truncate">about:debugging#/runtime/this-firefox</span>
                  <button
                    onClick={() => handleCopy('about:debugging#/runtime/this-firefox')}
                    className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                    title={copiedUrl === 'about:debugging#/runtime/this-firefox' ? t.extCopiedBtn : t.extCopyBtn}
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
                  3
                </div>
                <h4 className="font-bold text-sm text-slate-200 mb-1.5">
                  {t.extStep3TitleFirefox}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.extStep3DescFirefox}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Interactive Toggle for the In-Browser Extension Workspace */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-indigo-500/20 shadow-lg text-left">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
            <Play className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">
              {t.extSimTitle}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.extSimDesc}
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
            {isPreviewOpen ? t.extSimClose : t.extSimOpen}
          </span>
        </button>
      </div>
    </div>
  );
};
