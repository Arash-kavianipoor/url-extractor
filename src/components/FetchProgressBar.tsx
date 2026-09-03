import React, { useEffect, useState } from 'react';
import {
  Globe,
  FileCode2,
  Palette,
  Link2,
  PackageCheck,
  CheckCircle2,
  Loader2,
  Zap,
  Timer,
  Laptop,
  Tablet,
  Smartphone,
  Layers
} from 'lucide-react';
import { Language, CrawlMode, ExtractionStep, DeviceType } from '../types.js';
import { translations } from '../i18n.js';

interface FetchProgressBarProps {
  isLoading: boolean;
  targetUrl: string;
  mode: CrawlMode;
  language: Language;
  currentStep?: ExtractionStep | string;
  currentPercent?: number;
  currentStatusText?: string;
  device?: DeviceType;
}

export const FetchProgressBar: React.FC<FetchProgressBarProps> = ({
  isLoading,
  targetUrl,
  mode,
  language,
  currentStep,
  currentPercent,
  currentStatusText,
  device,
}) => {
  const t = translations[language];
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // The 11 Real Extension Extraction Steps defined in architecture
  const realSteps: { step: ExtractionStep; labelFa: string; labelEn: string; icon: any }[] = [
    { step: 'Connecting', labelFa: 'اتصال به اکستنشن', labelEn: 'Connecting', icon: Globe },
    { step: 'Opening Target', labelFa: 'باز کردن تب ایزوله', labelEn: 'Opening Target', icon: Globe },
    { step: 'Rendering Desktop', labelFa: 'رندر دسکتاپ (۱۲۸۰×۸۰۰)', labelEn: 'Rendering Desktop', icon: Laptop },
    { step: 'Extracting Desktop', labelFa: 'استخراج DOM دسکتاپ', labelEn: 'Extracting Desktop', icon: FileCode2 },
    { step: 'Rendering Tablet', labelFa: 'رندر تبلت (۷۶۸×۱۰۲۴)', labelEn: 'Rendering Tablet', icon: Tablet },
    { step: 'Extracting Tablet', labelFa: 'استخراج DOM تبلت', labelEn: 'Extracting Tablet', icon: Palette },
    { step: 'Rendering Mobile', labelFa: 'رندر موبایل (۳۹۰×۸۴۴)', labelEn: 'Rendering Mobile', icon: Smartphone },
    { step: 'Extracting Mobile', labelFa: 'استخراج DOM موبایل', labelEn: 'Extracting Mobile', icon: FileCode2 },
    { step: 'Collecting Assets', labelFa: 'جمع‌آوری استایل‌ها و فونت‌ها', labelEn: 'Collecting Assets', icon: Layers },
    { step: 'Building Result', labelFa: 'ساخت پکیج ۳ دیوایس', labelEn: 'Building Result', icon: PackageCheck },
    { step: 'Completed', labelFa: 'تکمیل شد', labelEn: 'Completed', icon: CheckCircle2 },
  ];

  useEffect(() => {
    if (!isLoading) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 500);

    return () => {
      clearInterval(timerInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  const displayPercent = typeof currentPercent === 'number' ? Math.min(100, Math.max(0, currentPercent)) : 10;
  const currentStepObj = realSteps.find((s) => s.step === currentStep) || realSteps[0];
  const StepIcon = currentStepObj.icon;
  const stepLabel = language === 'fa' ? currentStepObj.labelFa : currentStepObj.labelEn;
  const statusDisplay = currentStatusText || stepLabel;

  return (
    <div
      id="fetch-progress-container"
      className="w-full my-6 bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Background ambient glow effect */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-30" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/30">
              <StepIcon className="w-5 h-5 animate-pulse text-slate-950" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {language === 'fa' ? 'موتور استخراج مرورگر واقعی (Extension)' : 'Real Browser Extension Engine'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {device ? device.toUpperCase() : 'MULTI-DEVICE'}
              </span>
            </div>
            <p className="text-xs text-emerald-300/90 mt-0.5 font-medium truncate max-w-xs sm:max-w-md">
              {statusDisplay}
            </p>
          </div>
        </div>

        {/* Right metrics: Percentage & Elapsed Timer */}
        <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-slate-300">
            <Timer className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{elapsedSeconds}s</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              {Math.round(displayPercent)}%
            </span>
          </div>
        </div>
      </div>

      {/* The Main Animated Progress Bar Track */}
      <div className="relative w-full h-3.5 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner z-10">
        <div
          id="fetch-progress-bar-fill"
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-300 ease-out relative overflow-hidden shadow-lg shadow-emerald-500/50"
          style={{ width: `${Math.min(100, Math.max(5, displayPercent))}%` }}
        >
          {/* Shimmer line passing through */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full animate-shimmer"
            style={{
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s infinite linear',
            }}
          />
        </div>
      </div>

      {/* Target URL indicator pill */}
      {targetUrl && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 truncate max-w-[75%]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-slate-500 font-sans">URL:</span>
            <span className="text-emerald-300 truncate">{targetUrl}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 shrink-0 font-mono text-[10px]">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Real DOM & Assets</span>
          </div>
        </div>
      )}

      {/* Visual Pipeline Steps on wider screens */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
        {realSteps.slice(0, 6).map((s, idx) => {
          const stepIndex = realSteps.findIndex((item) => item.step === currentStep);
          const isDone = stepIndex > idx;
          const isCurrent = stepIndex === idx;

          return (
            <div
              key={s.step}
              className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                isDone
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                  : isCurrent
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/40'
                  : 'border-slate-800/60 bg-slate-950/30 text-slate-500'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[9px] font-mono shrink-0">
                  {idx + 1}
                </span>
              )}
              <span className="truncate text-[11px] font-medium leading-tight">
                {language === 'fa' ? s.labelFa : s.labelEn}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
