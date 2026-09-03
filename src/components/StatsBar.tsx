import React from 'react';
import { Layers, Link2, ExternalLink, FileCode, Clock, Heading } from 'lucide-react';
import { ScrapeResult, Language } from '../types.js';
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

  return (
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
  );
};
