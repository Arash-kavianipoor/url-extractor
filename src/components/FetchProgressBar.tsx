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
  Timer
} from 'lucide-react';
import { Language, CrawlMode } from '../types.js';
import { translations } from '../i18n.js';

interface FetchProgressBarProps {
  isLoading: boolean;
  targetUrl: string;
  mode: CrawlMode;
  language: Language;
}

export const FetchProgressBar: React.FC<FetchProgressBarProps> = ({
  isLoading,
  targetUrl,
  mode,
  language,
}) => {
  const t = translations[language];
  const [progress, setProgress] = useState(5);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const steps = [
    { id: 1, label: t.progressStep1, icon: Globe, threshold: 20 },
    { id: 2, label: t.progressStep2, icon: FileCode2, threshold: 45 },
    { id: 3, label: t.progressStep3, icon: Palette, threshold: 70 },
    { id: 4, label: t.progressStep4, icon: Link2, threshold: 90 },
    { id: 5, label: t.progressStep5, icon: PackageCheck, threshold: 100 },
  ];

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      setActiveStepIndex(4);
      return;
    }

    setProgress(8);
    setElapsedSeconds(0);
    setActiveStepIndex(0);

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 500);

    // Realistic progressive increments
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 20) {
          return prev + Math.random() * 4 + 2;
        } else if (prev < 45) {
          return prev + Math.random() * 3 + 1.5;
        } else if (prev < 70) {
          return prev + Math.random() * 2 + 1;
        } else if (prev < 88) {
          return prev + Math.random() * 1.5 + 0.5;
        } else if (prev < 96) {
          return prev + 0.3;
        }
        return prev;
      });
    }, 280);

    return () => {
      clearInterval(timerInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  // Determine current active step based on percentage
  useEffect(() => {
    if (progress < 22) setActiveStepIndex(0);
    else if (progress < 48) setActiveStepIndex(1);
    else if (progress < 72) setActiveStepIndex(2);
    else if (progress < 92) setActiveStepIndex(3);
    else setActiveStepIndex(4);
  }, [progress]);

  if (!isLoading) return null;

  const currentStep = steps[activeStepIndex] || steps[0];
  const StepIcon = currentStep.icon;

  return (
    <div
      id="fetch-progress-container"
      className="w-full my-6 bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Background ambient glow effect */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-indigo-400 opacity-30" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <StepIcon className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {t.progressTitle}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {mode === 'all' ? t.badgeCrawlMode : t.badgeSinglePage}
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5 truncate max-w-xs sm:max-w-md">
              {currentStep.label}
            </p>
          </div>
        </div>

        {/* Right metrics: Percentage & Elapsed Timer */}
        <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-slate-300">
            <Timer className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{elapsedSeconds}s</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              {Math.min(99, Math.round(progress))}%
            </span>
          </div>
        </div>
      </div>

      {/* The Main Animated Progress Bar Track */}
      <div className="relative w-full h-3.5 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner z-10">
        <div
          id="fetch-progress-bar-fill"
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 ease-out relative overflow-hidden shadow-lg shadow-indigo-500/50"
          style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
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
            <span className="text-indigo-300 truncate">{targetUrl}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 shrink-0">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{t.speedRating}</span>
          </div>
        </div>
      )}

      {/* 5 Step Pills on wider screens */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {steps.map((step, idx) => {
          const isDone = progress >= step.threshold;
          const isCurrent = activeStepIndex === idx;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                isDone
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                  : isCurrent
                  ? 'border-indigo-500/50 bg-indigo-950/40 text-indigo-200 ring-1 ring-indigo-500/40'
                  : 'border-slate-800/60 bg-slate-950/30 text-slate-500'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[9px] font-mono shrink-0">
                  {idx + 1}
                </span>
              )}
              <span className="truncate text-[11px] font-medium leading-tight">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
