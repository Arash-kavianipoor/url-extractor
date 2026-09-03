export type Language =
  | 'en' // English
  | 'fa' // Persian (فارسی)
  | 'es' // Spanish (Español)
  | 'zh' // Chinese (简体中文)
  | 'ar' // Arabic (العربية)
  | 'hi' // Hindi (हिन्दी)
  | 'fr' // French (Français)
  | 'de' // German (Deutsch)
  | 'ru' // Russian (Русский)
  | 'pt' // Portuguese (Português)
  | 'ja' // Japanese (日本語)
  | 'ko' // Korean (한국어)
  | 'it' // Italian (Italiano)
  | 'tr' // Turkish (Türkçe)
  | 'nl' // Dutch (Nederlands)
  | 'pl' // Polish (Polski)
  | 'id' // Indonesian (Bahasa Indonesia)
  | 'vi' // Vietnamese (Tiếng Việt)
  | 'ur' // Urdu (اردو)
  | 'bn'; // Bengali (বাংলা)

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  locale: string;
}

export type CrawlMode = 'single' | 'all';

export type LinkType = 'internal' | 'external' | 'asset' | 'anchor' | 'mailto' | 'other';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface ScrapedHeading {
  id: string;
  level: HeadingLevel;
  text: string;
  sourceUrl: string;
  pageTitle?: string;
  index: number;
}

export interface ScrapedLink {
  id: string;
  url: string;
  text: string;
  type: LinkType;
  sourceUrl: string;
}

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface DeviceVersion {
  device: DeviceType;
  title: string;
  files: ExtractedFile[];
  totalBytes: number;
  viewport: string;
  userAgent: string;
}

export interface ExtractedFile {
  id: string;
  name: string;
  type: 'html' | 'css' | 'javascript' | 'json';
  content: string;
  size: number;
  sourceUrl?: string;
  description?: string;
}

export interface ScrapeResult {
  targetUrl: string;
  mode: CrawlMode;
  domain: string;
  title: string;
  pagesScanned: number;
  totalLinksFound: number;
  internalLinksCount: number;
  externalLinksCount: number;
  links: ScrapedLink[];
  headings: ScrapedHeading[];
  totalHeadingsFound: number;
  headingsCount: Record<HeadingLevel, number>;
  files: ExtractedFile[];
  deviceVersions?: Record<DeviceType, DeviceVersion>;
  scannedUrls: string[];
  executionTimeMs: number;
}
