import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  FileJson,
  Link2,
  Heading,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { ScrapedLink, ScrapedHeading, HeadingLevel, Language, LinkType } from '../types.js';
import { translations, isRtlLanguage } from '../i18n.js';
import { exportLinksToCsv, exportHeadingsToCsv, exportCustomJson } from '../utils/exporter.js';

interface LinksTableProps {
  links: ScrapedLink[];
  headings?: ScrapedHeading[];
  language: Language;
  initialSubTab?: 'links' | 'headings';
}

export const LinksTable: React.FC<LinksTableProps> = ({
  links,
  headings = [],
  language,
  initialSubTab = 'links',
}) => {
  const [activeSection, setActiveSection] = useState<'links' | 'headings'>(initialSubTab);

  // Links filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | LinkType>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Headings filter state
  const [headingSearchTerm, setHeadingSearchTerm] = useState('');
  const [headingLevelFilter, setHeadingLevelFilter] = useState<'all' | HeadingLevel>('all');
  const [headingCurrentPage, setHeadingCurrentPage] = useState(1);

  // JSON Export Modal State
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [exportIncludeLinks, setExportIncludeLinks] = useState(true);
  const [exportIncludeHeadings, setExportIncludeHeadings] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<Record<HeadingLevel, boolean>>({
    h1: true,
    h2: true,
    h3: true,
    h4: true,
    h5: true,
    h6: true,
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const itemsPerPage = 25;

  const t = translations[language];
  const isRtl = isRtlLanguage(language);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSection(initialSubTab);
    }
  }, [initialSubTab]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesSearch =
        searchTerm === '' ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.sourceUrl.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || link.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [links, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage) || 1;
  const paginatedLinks = filteredLinks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filtered headings
  const filteredHeadings = useMemo(() => {
    return headings.filter((h) => {
      const matchesSearch =
        headingSearchTerm === '' ||
        h.text.toLowerCase().includes(headingSearchTerm.toLowerCase()) ||
        h.level.toLowerCase().includes(headingSearchTerm.toLowerCase()) ||
        h.sourceUrl.toLowerCase().includes(headingSearchTerm.toLowerCase());

      const matchesLevel = headingLevelFilter === 'all' || h.level === headingLevelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [headings, headingSearchTerm, headingLevelFilter]);

  const totalHeadingPages = Math.ceil(filteredHeadings.length / itemsPerPage) || 1;
  const paginatedHeadings = filteredHeadings.slice(
    (headingCurrentPage - 1) * itemsPerPage,
    headingCurrentPage * itemsPerPage
  );

  // Heading counts by level
  const headingCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: headings.length,
      h1: 0,
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0,
    };
    headings.forEach((h) => {
      if (counts[h.level] !== undefined) {
        counts[h.level]++;
      }
    });
    return counts;
  }, [headings]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllLinks = () => {
    const allUrls = filteredLinks.map((l) => l.url).join('\n');
    navigator.clipboard.writeText(allUrls);
    setCopiedId('all-urls');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllHeadings = () => {
    const textLines = filteredHeadings
      .map((h) => `[${h.level.toUpperCase()}] ${h.text}`)
      .join('\n');
    navigator.clipboard.writeText(textLines);
    setCopiedId('all-headings');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExecuteJsonExport = () => {
    const activeLevels = (Object.keys(selectedLevels) as HeadingLevel[]).filter(
      (lvl) => selectedLevels[lvl]
    );

    exportCustomJson(
      links,
      headings,
      {
        includeLinks: exportIncludeLinks,
        includeHeadings: exportIncludeHeadings,
        selectedHeadingLevels: activeLevels,
      },
      'extracted_website_data.json'
    );
    setIsJsonModalOpen(false);
  };

  const getHeadingBadgeClass = (level: HeadingLevel) => {
    switch (level) {
      case 'h1':
        return 'bg-rose-950/70 text-rose-300 border-rose-500/50 font-bold';
      case 'h2':
        return 'bg-amber-950/70 text-amber-300 border-amber-500/50 font-bold';
      case 'h3':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 font-semibold';
      case 'h4':
        return 'bg-sky-950/70 text-sky-300 border-sky-500/50 font-semibold';
      case 'h5':
        return 'bg-purple-950/70 text-purple-300 border-purple-500/50 font-medium';
      case 'h6':
        return 'bg-slate-800 text-slate-300 border-slate-600 font-medium';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getTypeBadgeClass = (type: LinkType) => {
    switch (type) {
      case 'internal':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
      case 'external':
        return 'bg-amber-950/60 text-amber-400 border-amber-500/30';
      case 'asset':
        return 'bg-purple-950/60 text-purple-400 border-purple-500/30';
      case 'anchor':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      default:
        return 'bg-sky-950/60 text-sky-400 border-sky-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/25 overflow-hidden">
      {/* Search & Actions Bar (Targeted Element) */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 space-y-3.5">
        {/* Section Switcher + Actions Row */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Sub-view Switcher: Links vs Headings (H1-H6) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              id="switcher-links-btn"
              onClick={() => setActiveSection('links')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSection === 'links'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/70'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.viewLinks}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950/70 text-indigo-300 border border-indigo-500/30 font-bold">
                {links.length}
              </span>
            </button>

            <button
              id="switcher-headings-btn"
              onClick={() => setActiveSection('headings')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSection === 'headings'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/70'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Heading className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.viewHeadings}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950/70 text-rose-300 border border-rose-500/30 font-bold">
                {headings.length}
              </span>
            </button>
          </div>

          {/* Search input for the active view */}
          <div className="relative flex-1 max-w-lg">
            <div
              className={`absolute inset-y-0 ${
                isRtl ? 'right-0 pr-3' : 'left-0 pl-3'
              } flex items-center pointer-events-none text-slate-500`}
            >
              <Search className="w-4 h-4" />
            </div>
            {activeSection === 'links' ? (
              <input
                id="links-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t.searchLinksPlaceholder}
                className={`w-full rounded-xl border border-slate-700 bg-slate-950 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition ${
                  isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            ) : (
              <input
                id="headings-search-input"
                type="text"
                value={headingSearchTerm}
                onChange={(e) => {
                  setHeadingSearchTerm(e.target.value);
                  setHeadingCurrentPage(1);
                }}
                placeholder={t.searchHeadingsPlaceholder}
                className={`w-full rounded-xl border border-slate-700 bg-slate-950 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition ${
                  isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            )}
          </div>

          {/* Action buttons (Copy, CSV, JSON) */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeSection === 'links' ? (
              <button
                id="copy-all-links-btn"
                onClick={handleCopyAllLinks}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                {copiedId === 'all-urls' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">{t.copiedAlert}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.copyAllLinks}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                id="copy-all-headings-btn"
                onClick={handleCopyAllHeadings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                {copiedId === 'all-headings' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">{t.copiedAlert}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t.copyAllHeadings}</span>
                  </>
                )}
              </button>
            )}

            {/* CSV Export Button */}
            {activeSection === 'links' ? (
              <button
                id="export-csv-btn"
                onClick={() => exportLinksToCsv(filteredLinks)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Download CSV of Links"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.exportCsv}</span>
              </button>
            ) : (
              <button
                id="export-headings-csv-btn"
                onClick={() => exportHeadingsToCsv(filteredHeadings)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Download CSV of Headings H1-H6"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.exportCsv} (H1-H6)</span>
              </button>
            )}

            {/* JSON Export Button with Checkbox Selection */}
            <button
              id="export-json-btn"
              onClick={() => {
                if (activeSection === 'headings') {
                  setExportIncludeHeadings(true);
                }
                setIsJsonModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 transition cursor-pointer shadow-sm"
              title="Download JSON with selectable Heading checkboxes"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.exportJson}</span>
              <SlidersHorizontal className="w-3 h-3 text-indigo-400/70" />
            </button>
          </div>
        </div>

        {/* Filter Pills based on active view */}
        {activeSection === 'links' ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setTypeFilter('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-800/50 border border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterAll} ({links.length})
            </button>
            <button
              onClick={() => {
                setTypeFilter('internal');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                typeFilter === 'internal'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30'
              }`}
            >
              {t.filterInternal} ({links.filter((l) => l.type === 'internal').length})
            </button>
            <button
              onClick={() => {
                setTypeFilter('external');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                typeFilter === 'external'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-950/30 border border-amber-500/30 text-amber-400 hover:bg-amber-900/30'
              }`}
            >
              {t.filterExternal} ({links.filter((l) => l.type === 'external').length})
            </button>
            <button
              onClick={() => {
                setTypeFilter('asset');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                typeFilter === 'asset'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-950/30 border border-purple-500/30 text-purple-400 hover:bg-purple-900/30'
              }`}
            >
              {t.filterAsset} ({links.filter((l) => l.type === 'asset').length})
            </button>
            <button
              onClick={() => {
                setTypeFilter('anchor');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                typeFilter === 'anchor'
                  ? 'bg-slate-600 text-white shadow-sm'
                  : 'bg-slate-800/50 border border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterAnchor} ({links.filter((l) => l.type === 'anchor').length})
            </button>
          </div>
        ) : (
          /* Headings Filter Pills: All, H1, H2, H3, H4, H5, H6 */
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setHeadingLevelFilter('all');
                setHeadingCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                headingLevelFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-800/50 border border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.filterAll} ({headingCounts.all})
            </button>

            {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as HeadingLevel[]).map((lvl) => {
              const count = headingCounts[lvl] || 0;
              const isSelected = headingLevelFilter === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    setHeadingLevelFilter(lvl);
                    setHeadingCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-sm border border-rose-400/40'
                      : 'bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="uppercase">{lvl}</span> ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Table Content: Links or Headings */}
      <div className="overflow-x-auto custom-scrollbar">
        {activeSection === 'links' ? (
          /* Links Table */
          filteredLinks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">{t.noLinksFound}</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">{t.colIndex}</th>
                  <th className="py-3 px-3.5 min-w-[180px]">{t.colText}</th>
                  <th className="py-3 px-3.5 min-w-[280px]">{t.colUrl}</th>
                  <th className="py-3 px-3.5 w-24 text-center">{t.colType}</th>
                  <th className="py-3 px-3.5 min-w-[160px] hidden md:table-cell">{t.colSource}</th>
                  <th className="py-3 px-3.5 w-20 text-center">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedLinks.map((link, idx) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={link.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-center text-slate-500">
                        {globalIndex}
                      </td>
                      <td
                        className="py-2.5 px-3.5 font-medium text-slate-200 max-w-[220px] truncate"
                        title={link.text}
                      >
                        {link.text}
                      </td>
                      <td
                        className="py-2.5 px-3.5 font-mono text-[11px] text-slate-400 max-w-[340px] truncate"
                        dir="ltr"
                        title={link.url}
                      >
                        {link.url}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getTypeBadgeClass(
                            link.type
                          )}`}
                        >
                          {link.type}
                        </span>
                      </td>
                      <td
                        className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500 max-w-[180px] truncate hidden md:table-cell"
                        dir="ltr"
                        title={link.sourceUrl}
                      >
                        {link.sourceUrl.replace(/^https?:\/\//, '')}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleCopy(link.url, link.id)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer"
                            title="Copy URL"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
                            title="Open Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          /* Headings Table (H1 - H6) */
          filteredHeadings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">{t.noHeadingsFound}</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">{t.colIndex}</th>
                  <th className="py-3 px-3.5 w-20 text-center">{t.colHeadingLevel}</th>
                  <th className="py-3 px-3.5 min-w-[280px]">{t.colHeadingText}</th>
                  <th className="py-3 px-3.5 min-w-[180px] hidden md:table-cell">{t.colSource}</th>
                  <th className="py-3 px-3.5 w-20 text-center">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedHeadings.map((heading, idx) => {
                  const globalIndex =
                    (headingCurrentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr
                      key={heading.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-mono text-center text-slate-500">
                        {globalIndex}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] uppercase border ${getHeadingBadgeClass(
                            heading.level
                          )}`}
                        >
                          {heading.level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-100">
                        <div
                          className={`leading-snug ${
                            heading.level === 'h1'
                              ? 'text-sm font-bold text-white'
                              : heading.level === 'h2'
                              ? 'text-xs font-semibold text-slate-100'
                              : 'text-xs text-slate-200'
                          }`}
                        >
                          {heading.text}
                        </div>
                      </td>
                      <td
                        className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500 max-w-[220px] truncate hidden md:table-cell"
                        dir="ltr"
                        title={heading.sourceUrl}
                      >
                        {heading.sourceUrl.replace(/^https?:\/\//, '')}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleCopy(heading.text, heading.id)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer"
                            title="Copy Heading Text"
                          >
                            {copiedId === heading.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Pagination Bar */}
      {activeSection === 'links' ? (
        totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              {t.paginationShowing} {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredLinks.length)} {t.paginationOf}{' '}
              {filteredLinks.length} {t.paginationLinks}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {t.pagePrev}
              </button>
              <span className="font-medium px-1 text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {t.pageNext}
              </button>
            </div>
          </div>
        )
      ) : (
        totalHeadingPages > 1 && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              {t.paginationShowing} {(headingCurrentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(headingCurrentPage * itemsPerPage, filteredHeadings.length)} {t.paginationOf}{' '}
              {filteredHeadings.length} {t.paginationHeadings}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setHeadingCurrentPage((p) => Math.max(1, p - 1))}
                disabled={headingCurrentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {t.pagePrev}
              </button>
              <span className="font-medium px-1 text-slate-300">
                {headingCurrentPage} / {totalHeadingPages}
              </span>
              <button
                onClick={() => setHeadingCurrentPage((p) => Math.min(totalHeadingPages, p + 1))}
                disabled={headingCurrentPage === totalHeadingPages}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {t.pageNext}
              </button>
            </div>
          </div>
        )
      )}

      {/* Modal: JSON Export with Selectable Heading Checkboxes */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-indigo-400" />
                  <span>{t.jsonModalTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t.jsonModalDesc}
                </p>
              </div>
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-3">
              {/* Links Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <input
                  id="json-checkbox-links"
                  type="checkbox"
                  checked={exportIncludeLinks}
                  onChange={(e) => setExportIncludeLinks(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      {t.includeLinksCheckbox}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-indigo-300/80 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/20">
                    {links.length} {t.itemsCount}
                  </span>
                </div>
              </label>

              {/* Headings Checkbox (Explicitly requested by user) */}
              <div className="rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition p-3 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="json-checkbox-headings"
                    type="checkbox"
                    checked={exportIncludeHeadings}
                    onChange={(e) => setExportIncludeHeadings(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heading className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-semibold text-slate-200">
                        {t.includeHeadingsCheckbox}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-rose-300/80 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-500/20">
                      {headings.length} {t.itemsCount}
                    </span>
                  </div>
                </label>

                {/* Sub-level Checkboxes for Headings H1 to H6 */}
                {exportIncludeHeadings && (
                  <div className="pl-7 pt-1 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                      {t.selectHeadingLevels}
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as HeadingLevel[]).map((lvl) => (
                        <label
                          key={lvl}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                            selectedLevels[lvl]
                              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLevels[lvl]}
                            onChange={(e) =>
                              setSelectedLevels((prev) => ({
                                ...prev,
                                [lvl]: e.target.checked,
                              }))
                            }
                            className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-700 cursor-pointer"
                          />
                          <span className="font-mono font-bold uppercase">{lvl}</span>
                          <span className="text-[10px] opacity-70">({headingCounts[lvl] || 0})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="px-3.5 py-2 text-xs rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                id="modal-confirm-download-json"
                onClick={handleExecuteJsonExport}
                disabled={!exportIncludeLinks && !exportIncludeHeadings}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <FileJson className="w-4 h-4" />
                <span>{t.downloadJsonBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
