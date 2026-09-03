import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X, Sun, Moon } from 'lucide-react';
import { Language } from '../types.js';
import { translations, SUPPORTED_LANGUAGES, getLanguageInfo } from '../i18n.js';
import { CountryFlag } from './CountryFlag.js';
import siteLogo from '../assets/logo.webp';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  theme = 'dark',
  onToggleTheme,
}) => {
  const t = translations[language];
  const currentLang = getLanguageInfo(language);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.nativeName.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    );
  });

  const handleSelectLanguage = (langCode: Language) => {
    onLanguageChange(langCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Brand Icon & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-slate-800/80 border border-slate-700/60 shadow-lg shadow-indigo-500/10 shrink-0">
            <img src={siteLogo} alt="Site Logo" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-none truncate">
              {t.appTitle}
            </h1>
            <p className="text-xs text-slate-400 mt-1 hidden md:block truncate max-w-xl">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Theme Switcher & Full 20 World Languages Selector Dropdown */}
        <div className="flex items-center gap-2.5 shrink-0" ref={dropdownRef}>
          {/* Dark / Light Mode Switch */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            title={
              theme === 'light'
                ? language === 'fa'
                  ? 'تغییر به حالت تاریک'
                  : 'Switch to Dark Mode'
                : language === 'fa'
                ? 'تغییر به حالت روشن'
                : 'Switch to Light Mode'
            }
            aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-medium hidden sm:inline">
                  {language === 'fa' ? 'روشن' : 'Light'}
                </span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-medium hidden sm:inline">
                  {language === 'fa' ? 'تاریک' : 'Dark'}
                </span>
              </>
            )}
          </button>

          {/* Full 20 World Languages Selector Dropdown */}
          <div className="relative">
            <button
              id="language-selector-dropdown-btn"
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              aria-expanded={isOpen}
              aria-haspopup="true"
            >
              <span className="inline-flex items-center justify-center shrink-0 drop-shadow-sm">
                <CountryFlag language={language} size="sm" />
              </span>
              <span className="font-medium">{currentLang.nativeName}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-indigo-400' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Modal */}
            {isOpen && (
              <div
                id="language-selector-menu"
                className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
              >
                {/* Search Bar inside Language Menu */}
                <div className="px-3 pb-2 border-b border-slate-800">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-2.5 pointer-events-none" />
                    <input
                      id="language-search-input"
                      type="text"
                      autoFocus
                      placeholder={t.searchLanguage || 'Search 20 world languages...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/90 border border-slate-700/80 rounded-lg pl-8 pr-7 rtl:pl-7 rtl:pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 rtl:right-auto rtl:left-2 top-2 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 20 Languages List */}
                <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                  {filteredLanguages.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-500">
                      No matching language found
                    </div>
                  ) : (
                    filteredLanguages.map((item) => {
                      const isSelected = language === item.code;
                      return (
                        <button
                          key={item.code}
                          id={`select-lang-${item.code}`}
                          type="button"
                          onClick={() => handleSelectLanguage(item.code)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/90 text-white font-semibold shadow-md shadow-indigo-950/50'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="inline-flex items-center justify-center shrink-0 drop-shadow-sm">
                              <CountryFlag language={item.code} size="sm" />
                            </span>
                            <div className="text-left rtl:text-right min-w-0">
                              <div className="truncate font-medium">{item.nativeName}</div>
                              <div className="text-[10px] text-slate-400 truncate opacity-80">
                                {item.name}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-white shrink-0 ml-2 rtl:ml-0 rtl:mr-2" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer Count Note */}
                <div className="px-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>20 World Languages</span>
                  <span className="text-emerald-400 font-mono">0ms switch</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
