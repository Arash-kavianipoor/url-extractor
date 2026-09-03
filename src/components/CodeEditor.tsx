import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  FileSpreadsheet, 
  Download, 
  Archive, 
  RotateCcw, 
  Save, 
  Check, 
  Copy, 
  Sparkles,
  Code2,
  FileText
} from 'lucide-react';
import { ExtractedFile, Language, CrawlMode } from '../types.js';
import { translations } from '../i18n.js';
import { formatBytes, downloadFile, downloadZip } from '../utils/exporter.js';

interface CodeEditorProps {
  files: ExtractedFile[];
  originalFiles: ExtractedFile[];
  onUpdateFileContent: (fileId: string, newContent: string) => void;
  onResetFileContent: (fileId: string) => void;
  language: Language;
  mode?: CrawlMode;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  originalFiles,
  onUpdateFileContent,
  onResetFileContent,
  language,
  mode = 'single' as CrawlMode,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || '');
  const [editContent, setEditContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const t = translations[language];

  const currentFile = files.find((f) => f.id === selectedFileId) || files[0];
  const originalFile = originalFiles.find((f) => f.id === selectedFileId);

  // Sync content when switching files
  useEffect(() => {
    if (currentFile) {
      setEditContent(currentFile.content);
      setHasUnsavedChanges(false);
    }
  }, [currentFile?.id]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditContent(val);
    setHasUnsavedChanges(val !== currentFile?.content);
  };

  const handleApplyChanges = () => {
    if (currentFile) {
      onUpdateFileContent(currentFile.id, editContent);
      setHasUnsavedChanges(false);
      showToast(t.changesAppliedAlert);
    }
  };

  const handleResetToOriginal = () => {
    if (originalFile && window.confirm(t.resetConfirm)) {
      setEditContent(originalFile.content);
      onResetFileContent(originalFile.id);
      setHasUnsavedChanges(false);
      showToast(t.toastResetSuccess);
    }
  };

  const handleDownloadCurrentFile = () => {
    if (!currentFile) return;
    let mime = 'text/plain';
    if (currentFile.name.endsWith('.html')) mime = 'text/html';
    else if (currentFile.name.endsWith('.css')) mime = 'text/css';
    else if (currentFile.name.endsWith('.js')) mime = 'application/javascript';
    else if (currentFile.name.endsWith('.json')) mime = 'application/json';

    downloadFile(currentFile.name, editContent, mime);
    showToast(`${t.toastFileDownloaded}: ${currentFile.name}`);
  };

  const handleDownloadAllZip = async () => {
    try {
      setIsZipping(true);
      // Make sure the current file's latest edits are saved into files before zipping
      if (hasUnsavedChanges && currentFile) {
        onUpdateFileContent(currentFile.id, editContent);
      }
      await downloadZip(files, 'extracted_web_content.zip', mode);
      showToast(t.toastZipSuccess);
    } catch (err: any) {
      alert(`Error creating zip: ${err.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editContent);
    showToast(t.copiedAlert);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Support Tab key indentation inside code editor
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newContent = editContent.substring(0, start) + '  ' + editContent.substring(end);
      setEditContent(newContent);
      setHasUnsavedChanges(true);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Line count
  const lines = editContent.split('\n');
  const lineNumbers = lines.map((_, i) => i + 1);

  const getFileBadgeColor = (type: string) => {
    switch (type) {
      case 'html':
        return 'text-orange-400 bg-orange-950/60 border-orange-500/30';
      case 'css':
        return 'text-sky-400 bg-sky-950/60 border-sky-500/30';
      case 'javascript':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/30';
      case 'json':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-between text-xs font-semibold animate-fade-in border border-emerald-500/30">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/25 overflow-hidden">
        {/* Top Control Bar with File Selection & ZIP Download */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* File selector pill buttons */}
          <div className="flex-1 overflow-x-auto pb-1 -mb-1">
            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              {t.selectFileToEdit}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {files.map((file) => {
                const isSelected = file.id === selectedFileId;
                return (
                  <button
                    key={file.id}
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        handleApplyChanges();
                      }
                      setSelectedFileId(file.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500/80 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                        : 'border-slate-700/70 bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{file.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {formatBytes(file.size)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Download ZIP and Export Options */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              id="download-zip-btn"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              <Archive className="w-4 h-4" />
              <span>{t.downloadZip}</span>
            </button>
          </div>
        </div>

        {/* Selected File Details Bar */}
        {currentFile && (
          <div className="px-4 sm:px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] border ${getFileBadgeColor(currentFile.type)}`}>
                {currentFile.type}
              </span>
              <span className="font-mono font-semibold text-slate-200 text-sm">
                {currentFile.name}
              </span>
              {currentFile.description && (
                <span className="text-slate-400 hidden md:inline">
                  • {currentFile.description}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-950/60 border border-amber-500/30 text-amber-300 animate-pulse">
                  {t.changesSavedBadge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Stats: lines & chars */}
              <div className="text-slate-400 text-[11px] font-mono mr-2">
                {lines.length} {t.linesCount} | {editContent.length} {t.charsCount}
              </div>

              {/* Copy Code */}
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Copy Content"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {/* Reset to Original */}
              <button
                onClick={handleResetToOriginal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title={t.resetFile}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.resetFile}</span>
              </button>

              {/* Apply / Save */}
              <button
                onClick={handleApplyChanges}
                disabled={!hasUnsavedChanges}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  hasUnsavedChanges
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t.saveFileChanges}</span>
              </button>

              {/* Download this file alone */}
              <button
                id="download-single-btn"
                onClick={handleDownloadCurrentFile}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold border border-indigo-500/30 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.downloadSingle}</span>
              </button>
            </div>
          </div>
        )}

        {/* Editor Window with Gutter */}
        <div className="relative flex bg-[#090d16] text-slate-200 font-mono text-xs overflow-hidden min-h-[460px] max-h-[640px]">
          {/* Line Numbers Gutter */}
          <div
            className="w-12 py-3 bg-[#060910] text-slate-600 text-right pr-3 select-none shrink-0 overflow-hidden border-r border-slate-800/80"
            aria-hidden="true"
          >
            {lineNumbers.slice(0, 1000).map((n) => (
              <div key={n} className="leading-5 h-5">
                {n}
              </div>
            ))}
          </div>

          {/* Code Textarea */}
          <textarea
            id="code-editor-textarea"
            value={editContent}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            dir="ltr"
            spellCheck={false}
            className="flex-1 w-full bg-[#090d16] text-slate-200 p-3 leading-5 font-mono text-xs focus:outline-none resize-none overflow-y-auto selection:bg-indigo-600 selection:text-white"
            placeholder="Edit code here..."
          />
        </div>
      </div>
    </div>
  );
};
