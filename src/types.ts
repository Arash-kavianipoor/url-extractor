export type Language =
  | 'en'
  | 'fa'
  | 'ar'
  | 'es'
  | 'zh'
  | 'fr'
  | 'de'
  | 'ru'
  | 'pt'
  | 'ja'
  | 'hi'
  | 'it'
  | 'tr'
  | 'ko'
  | 'nl'
  | 'pl'
  | 'id'
  | 'vi'
  | 'ur'
  | 'bn';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  locale: string;
}

export type CrawlMode = 'single' | 'all';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type LinkType = 'internal' | 'external' | 'asset' | 'anchor' | 'mailto' | 'other';

export interface ScrapedLink {
  id: string;
  url: string;
  text: string;
  type: LinkType;
  sourceUrl: string;
  pageTitle?: string;
  devices?: DeviceType[];
  isVisible?: boolean;
}

export interface ScrapedHeading {
  id: string;
  level: HeadingLevel;
  text: string;
  sourceUrl: string;
  pageTitle?: string;
  index: number;
  devices?: DeviceType[];
}

export interface ExtractedFile {
  id: string;
  name: string;
  type: 'html' | 'css' | 'js' | 'javascript' | 'json' | 'image' | 'asset' | 'csv' | 'other';
  content: string;
  size: number;
  sourceUrl?: string;
  description?: string;
}

export interface DeviceProfileInfo {
  name: string;
  nameFa: string;
  userAgent: string;
  secChUa: string;
  secChUaMobile: string;
  secChUaPlatform: string;
  secChUaPlatformVersion: string;
  secChUaModel?: string;
  viewport: string;
  resolution: string;
  previewWidth: number;
  previewHeight: number;
  dpr: number;
}

export interface DeviceVersion {
  device: DeviceType;
  title: string;
  files: ExtractedFile[];
  totalBytes: number;
  viewport: string;
  userAgent: string;
  profileInfo: DeviceProfileInfo;
  links: ScrapedLink[];
  headings: ScrapedHeading[];
  headingsCount: Record<HeadingLevel, number>;
  totalLinksFound: number;
  internalLinksCount: number;
  externalLinksCount: number;
  uniqueLinksCount: number;
}

export interface DeviceComparison {
  totalLinks: Record<DeviceType, number>;
  totalHeadings: Record<DeviceType, number>;
  totalPayloadBytes: Record<DeviceType, number>;
  uniqueLinksCount: Record<DeviceType, number>;
  commonLinksCount: number;
  differencesDetected: boolean;
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
  deviceComparison?: DeviceComparison;
  scannedUrls: string[];
  executionTimeMs: number;
}

export type ExportFormat = 'single-html' | 'zip' | 'mhtml' | 'pwa-bundle';

export interface WebAsset {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  dataUrl: string;
  size: number;
  isInlined: boolean;
}

export interface ExportOptions {
  format: ExportFormat;
  inlineCss: boolean;
  inlineJs: boolean;
  inlineImages: boolean;
  stripTrackers: boolean;
  injectOfflineBanner: boolean;
  addServiceWorker: boolean;
  enableReaderMode: boolean;
  minify: boolean;
  titleOverride: string;
}

export interface AuditIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'network' | 'script' | 'style' | 'asset' | 'security';
  title: string;
  description: string;
  elementSnippet?: string;
  autoFixable: boolean;
}

export interface AuditReport {
  score: number;
  isOfflineReady: boolean;
  totalExternalRequests: number;
  totalAssetsCount: number;
  totalEstimatedSize: number;
  htmlSize: number;
  cssSize: number;
  jsSize: number;
  imagesSize: number;
  issues: AuditIssue[];
}
