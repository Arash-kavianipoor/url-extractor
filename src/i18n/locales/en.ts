export interface DeviceTranslations {
  downloadDesktopZip?: string;
  downloadTabletZip?: string;
  downloadMobileZip?: string;
  downloadAllDevicesZip?: string;
  deviceDesktop?: string;
  deviceTablet?: string;
  deviceMobile?: string;
  deviceAll?: string;
  deviceVersionTitle?: string;
  deviceVersionDesc?: string;
  activeDeviceLabel?: string;
  badgeDeviceEmulation?: string;
  deviceZipDownloaded?: string;
}

const enBase = {
  appTitle: 'Web Link & Code Extractor',
  appSubtitle: 'Extract web links, complete CSS stylesheets, HTML & JS with zero-internet offline execution and ZIP export',
  urlLabel: 'Target Webpage URL',
  urlPlaceholder: 'https://example.com/page...',
  fetchScopeTitle: 'Fetch Scope Option',
  fetchSinglePage: 'Only this page (Single Page)',
  fetchSinglePageDesc: 'Scans the single URL and saves flat files directly into ZIP root (zero folders)',
  fetchAllLinks: 'All links on the site (Crawl Domain)',
  fetchAllLinksDesc: 'Discovers & crawls internal domain links with dedicated folder structure for each page',
  maxPagesLabel: 'Max pages to crawl:',
  startScraping: 'Extract Links & Code',
  scrapingInProgress: 'Scraping, Inlining CSS & Preparing Offline Assets...',
  errorTitle: 'Extraction Error',
  demoUrls: 'Try sample URLs:',
  
  // Stats
  statPages: 'Pages Scanned',
  statTotalLinks: 'Total Links',
  statInternal: 'Internal Links',
  statExternal: 'External Links',
  statFiles: 'Extracted Files',
  statHeadings: 'Headings (H1-H6)',
  statExecutionTime: 'Time Elapsed',
  statOffline: 'Offline Status',
  statOfflineVal: '100% Standalone',

  // Offline Banner
  offlineBannerTitle: 'Zero-Internet Offline Ready',
  offlineBannerDesc: 'All CSS stylesheets, @import rules, webfonts, and background media are fully extracted and embedded. Open index.html directly on your computer with NO internet connection — it renders identically to the original live website!',
  
  // Tabs
  tabLinks: 'Links Directory',
  tabHeadings: 'Headings (H1-H6)',
  tabFiles: 'Code Manager & Editor',
  tabPreview: 'Live Sandbox Preview',

  // Switcher
  viewLinks: 'Links',
  viewHeadings: 'Headings (H1-H6)',

  // Links & Headings View
  searchLinksPlaceholder: 'Search by URL, anchor text, or domain...',
  searchHeadingsPlaceholder: 'Search headings by text or level...',
  filterAll: 'All Links',
  filterInternal: 'Internal',
  filterExternal: 'External',
  filterAsset: 'Assets / Media',
  filterAnchor: 'Page Anchors',
  copyAllLinks: 'Copy All URLs',
  copyAllHeadings: 'Copy All Headings',
  exportCsv: 'Export CSV',
  exportJson: 'Export JSON',
  exportOptions: 'Export Options',
  copiedAlert: 'Copied to clipboard!',
  colIndex: '#',
  colText: 'Anchor Text',
  colUrl: 'Destination URL',
  colType: 'Type',
  colSource: 'Found On',
  colActions: 'Actions',
  colHeadingLevel: 'Tag',
  colHeadingText: 'Heading Text',
  noLinksFound: 'No links match your search or filter criteria.',
  noHeadingsFound: 'No headings match your search or filter criteria.',

  // JSON Export Modal
  jsonModalTitle: 'Export JSON Data',
  jsonModalDesc: 'Select which items to include in your downloadable JSON file:',
  includeLinksCheckbox: 'Include Scraped Links',
  includeHeadingsCheckbox: 'Include Headings (H1 to H6)',
  selectHeadingLevels: 'Filter specific heading levels:',
  downloadJsonBtn: 'Download JSON',
  cancelBtn: 'Cancel',

  // Code Editor View
  selectFileToEdit: 'Select a file to inspect and edit:',
  resetFile: 'Reset to Original',
  saveFileChanges: 'Apply Changes',
  downloadSingle: 'Download File',
  downloadZip: 'Download Offline Package (ZIP)',
  fileTypeBadge: 'Type',
  fileSizeBadge: 'Size',
  linesCount: 'lines',
  charsCount: 'chars',
  changesSavedBadge: 'Unsaved changes',
  changesAppliedAlert: 'File modifications applied successfully!',
  resetConfirm: 'Reset this file to original scraped content?',
  
  // Preview
  previewNotice: 'Live sandbox rendering of edited HTML with 100% self-contained offline CSS & JavaScript.',
  refreshPreview: 'Refresh Preview',
  openNewTab: 'Open in New Window',
  
  // Empty state
  emptyStateTitle: 'Ready to Extract',
  emptyStateDesc: 'Enter a website URL above to scrape its links, fully extract all CSS stylesheets without internet dependency, and export offline packages.',
  quickTip1: 'Extracts all anchor links, internal routes, and external references.',
  quickTip2: 'Pulls full HTML, resolves all @import CSS rules, and embeds fonts/images as data URIs.',
  quickTip3: 'Downloaded ZIP and HTML files run 100% offline on your computer without internet, exactly like the original site.',

  // Progress Bar
  progressTitle: 'Live Fetching & Inlining Pipeline',
  progressStep1: 'Resolving Target Host & Handshake',
  progressStep2: 'Parsing DOM Tree & Headings',
  progressStep3: 'Inlining CSS, Webfonts & Media Data URIs',
  progressStep4: 'Discovering Internal & External Links',
  progressStep5: 'Packaging Offline Standalone Bundle',
  timeElapsed: 'Elapsed',
  speedRating: 'High-speed buffer',
  selectLanguage: 'Select Language',
  searchLanguage: 'Search 20 world languages...',

  // Newly localized elements (tips, badges, toasts, and form validation)
  tipLinkExtraction: 'Link Extraction',
  tipAssetsSourceCode: 'Assets & Source Code',
  tipLiveEditorZip: 'Live Editor & ZIP',
  bannerDedicatedFolders: 'Dedicated Page Folders',
  bannerFlatFiles: 'Zero Folders (Flat Files)',
  formErrorEmptyUrl: 'Please enter a valid website URL.',
  formErrorInvalidUrl: 'Invalid URL format. Example: https://example.com',
  formZeroFoldersBadge: 'Zero Folders (Flat)',
  formDedicatedFoldersBadge: 'Dedicated Page Folders',
  formPagesCountSuffix: 'pages',
  toastResetSuccess: 'Reset to original version',
  toastFileDownloaded: 'Downloaded file successfully',
  toastZipSuccess: 'ZIP archive generated & downloaded!',
  badgeZeroInternet: 'ZERO INTERNET',
  badgeCrawlMode: 'CRAWL MODE',
  badgeSinglePage: 'SINGLE PAGE',
  itemsCount: 'items',
  pagePrev: 'Previous',
  pageNext: 'Next',
  paginationShowing: 'Showing',
  paginationOf: 'of',
  paginationLinks: 'links',
  paginationHeadings: 'headings',
};

export const en: typeof enBase & DeviceTranslations = {
  ...enBase,
  downloadDesktopZip: 'Download Desktop (ZIP)',
  downloadTabletZip: 'Download Tablet (ZIP)',
  downloadMobileZip: 'Download Mobile (ZIP)',
  downloadAllDevicesZip: 'Download All 3 Versions (Complete Bundle)',
  deviceDesktop: 'Desktop',
  deviceTablet: 'Tablet',
  deviceMobile: 'Mobile',
  deviceAll: 'All 3 Devices',
  deviceVersionTitle: '3 Device Versions Available',
  deviceVersionDesc: 'Fetched with authentic Desktop, Tablet, and Mobile browser emulation to capture responsive layouts, media, and navigation.',
  activeDeviceLabel: 'Current Device View',
  badgeDeviceEmulation: '3x DEVICE EMULATION',
  deviceZipDownloaded: 'Device package downloaded successfully!',
};

export type TranslationType = typeof enBase & DeviceTranslations;
