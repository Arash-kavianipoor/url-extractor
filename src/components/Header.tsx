import { useState, useEffect } from "react";
import { Globe, Cpu, Code2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface HeaderProps {
  onOpenCodeModal: () => void;
}

export function Header({ onOpenCodeModal }: HeaderProps) {
  const [hasGemini, setHasGemini] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHasGemini(Boolean(data.hasGeminiKey));
      })
      .catch(() => {
        setHasGemini(false);
      });
  }, []);

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-xs">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
                Web Scraper
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                DOM & AI Engine
              </span>
            </div>
            <p className="text-xs text-neutral-500 hidden sm:block">
              Extract structured web data, query CSS selectors, and export clean datasets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* AI Status Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium bg-neutral-50 border-neutral-200 text-neutral-700"
            title={hasGemini ? "Gemini 3.8 Flash AI is ready" : "Gemini API key is set or optional"}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Gemini AI:</span>
            {hasGemini === null ? (
              <span className="text-neutral-400">checking...</span>
            ) : hasGemini ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
              </span>
            ) : (
              <span className="text-neutral-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-neutral-400" /> Available
              </span>
            )}
          </div>

          {/* Scraper Code Export Button */}
          <button
            type="button"
            id="open-code-generator-btn"
            onClick={onOpenCodeModal}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 rounded-lg border border-neutral-300 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-neutral-700" />
            <span>Generate Code</span>
          </button>
        </div>
      </div>
    </header>
  );
}
