import React from 'react';
import {
  Layers,
  Link2,
  ExternalLink,
  FileCode,
  Clock,
  Heading,
  Laptop,
  Tablet,
  Smartphone,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ScrapeResult, Language, DeviceType } from '../types.js';
import { translations } from '../i18n.js';

interface StatsBarProps {
  result: ScrapeResult;
  language: Language;
}

export const StatsBar: React.FC<StatsBarProps> = ({ result, language }) => {
  const t = translations[language];

  const stats = [
    {
      id: 'stat-pages',
      label: t.statPages,
      value: result.pagesScanned,
      icon: Layers,
      color: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/30',
    },
    {
      id: 'stat-total-links',
      label: t.statTotalLinks,
      value: result.totalLinksFound,
      icon: Link2,
      color: 'text-sky-400 bg-sky-950/60 border-sky-500/30',
    },
    {
      id: 'stat-headings',
      label: t.statHeadings,
      value: result.totalHeadingsFound ?? result.headings?.length ?? 0,
      icon: Heading,
      color: 'text-rose-400 bg-rose-950/60 border-rose-500/30',
    },
    {
      id: 'stat-internal',
      label: t.statInternal,
      value: result.internalLinksCount,
      icon: Link2,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
    },
    {
      id: 'stat-external',
      label: t.statExternal,
      value: result.externalLinksCount,
      icon: ExternalLink,
      color: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
    },
    {
      id: 'stat-files',
      label: t.statFiles,
      value: result.files.length,
      icon: FileCode,
      color: 'text-purple-400 bg-purple-950/60 border-purple-500/30',
    },
    {
      id: 'stat-time',
      label: t.statExecutionTime,
      value: `${(result.executionTimeMs / 1000).toFixed(1)}s`,
      icon: Clock,
      color: 'text-slate-400 bg-slate-800 border-slate-700',
    },
  ];

  const dv = result.deviceVersions;
  const dc = result.deviceComparison;

  return (
    <div className="space-y-3">
      {/* 7 Core Scrape Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md shadow-black/20 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-400 truncate">
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 font-mono text-xl font-bold text-slate-100">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Device Emulation Breakdown (Desktop / Tablet / Mobile) */}
      {dv && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800/80 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                {language === 'fa'
                  ? 'تفکیک دقیق داده‌های استخراج‌شده بر اساس دستگاه (شبیه‌سازی کامل)'
                  : 'Separated Device Extraction Metrics (Full Emulation)'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Sec-CH-UA + Viewport Emulated
              </span>
            </div>
            {dc?.differencesDetected ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-300 bg-amber-950/40 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" />
                <span>
                  {language === 'fa'
                    ? 'تفاوت ساختاری میان دستگاه‌ها شناسایی شد!'
                    : 'Device-specific responses detected!'}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" />
                <span>
                  {language === 'fa'
                    ? 'پوشش یکپارچه در تمامی دستگاه‌ها'
                    : 'Consistent coverage across all devices'}
                </span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Desktop Card */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-sky-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-sky-300">
                  <Laptop className="w-4 h-4 text-sky-400" />
                  <span>{language === 'fa' ? 'نسخه دسکتاپ' : 'Desktop Version'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">1920×1080</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center font-mono">
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{t.tabLinks}</div>
                  <div className="text-sm font-bold text-sky-400">
                    {dv.desktop.links?.length ?? dv.desktop.totalLinksFound ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{t.tabHeadings}</div>
                  <div className="text-sm font-bold text-rose-400">
                    {dv.desktop.headings?.length ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{language === 'fa' ? 'فایل‌ها' : 'Files'}</div>
                  <div className="text-sm font-bold text-purple-400">
                    {dv.desktop.files.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Tablet Card */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-300">
                  <Tablet className="w-4 h-4 text-amber-400" />
                  <span>{language === 'fa' ? 'نسخه تبلت' : 'Tablet Version'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">768×1024</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center font-mono">
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{t.tabLinks}</div>
                  <div className="text-sm font-bold text-amber-400">
                    {dv.tablet.links?.length ?? dv.tablet.totalLinksFound ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{t.tabHeadings}</div>
                  <div className="text-sm font-bold text-rose-400">
                    {dv.tablet.headings?.length ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{language === 'fa' ? 'فایل‌ها' : 'Files'}</div>
                  <div className="text-sm font-bold text-purple-400">
                    {dv.tablet.files.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Card */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-rose-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-rose-300">
                  <Smartphone className="w-4 h-4 text-rose-400" />
                  <span>{language === 'fa' ? 'نسخه موبایل' : 'Mobile Version'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">390×844</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center font-mono">
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{t.tabLinks}</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {dv.mobile.links?.length ?? dv.mobile.totalLinksFound ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{t.tabHeadings}</div>
                  <div className="text-sm font-bold text-rose-400">
                    {dv.mobile.headings?.length ?? 0}
                  </div>
                </div>
                <div className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">{language === 'fa' ? 'فایل‌ها' : 'Files'}</div>
                  <div className="text-sm font-bold text-purple-400">
                    {dv.mobile.files.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
