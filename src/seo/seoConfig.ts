import { Language, LanguageInfo } from '../types.js';

export interface SeoLanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  locale: string;
  dir: 'ltr' | 'rtl';
  title: string;
  description: string;
  keywords: string[];
}

export const SEO_CONFIG = {
  siteName: 'Web Link & Code Extractor',
  defaultOrigin: 'https://ais-dev-xzukzyci74mgpqlz3x3ge7-662706210952.europe-west2.run.app',
  defaultLanguage: 'en' as Language,
  defaultImage: 'https://ais-dev-xzukzyci74mgpqlz3x3ge7-662706210952.europe-west2.run.app/og-image.png',
  twitterHandle: '@webextractor',
  author: 'Web Extractor Engineering',
};

export const SEO_LANGUAGES: Record<Language, SeoLanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    locale: 'en_US',
    dir: 'ltr',
    title: 'Web Link & Code Extractor | 100% Offline Website Scraper & ZIP Export',
    description: 'Extract all web links, inline CSS stylesheets, fonts, HTML, and JS with zero-internet offline execution. Instant ZIP export with flat files or dedicated page folder structures.',
    keywords: ['web scraper', 'link extractor', 'offline website', 'download webpage', 'inline css', 'extract html js', 'zip export'],
  },
  fa: {
    code: 'fa',
    name: 'Persian',
    nativeName: 'فارسی',
    locale: 'fa_IR',
    dir: 'rtl',
    title: 'استخراج‌کننده لینک و کدهای وب | ذخیره سایت آفلاین و دانلود ZIP بدون اینترنت',
    description: 'استخراج کامل تمام لینک‌ها، استایل‌های CSS، کدهای HTML و جاوااسکریپت با قابلیت اجرای ۱۰۰٪ آفلاین در کامپیوتر بدون نیاز به اینترنت به همراه فولدر‌بندی مجزا و فایل ZIP فشرده.',
    keywords: ['استخراج لینک', 'دانلود کامل سایت آفلاین', 'استخراج CSS', 'دانلود سایت با استایل', 'اسکرپر وب', 'پکیج آفلاین زیپ'],
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    locale: 'ar_SA',
    dir: 'rtl',
    title: 'مستخرج روابط وأكواد الويب | حفظ الموقع بدون إنترنت وتنزيل ZIP',
    description: 'استخراج جميع الروابط، وأوراق أنماط CSS، وHTML، وJS مع تشغيل كامل بدون اتصال بالإنترنت وتصدير ZIP سريع مع تنظيم المجلدات.',
    keywords: ['مستخرج روابط', 'تحميل موقع أوفلاين', 'استخراج كود الموقع', 'تنزيل css كامل', 'أداة سحب المواقع'],
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    locale: 'es_ES',
    dir: 'ltr',
    title: 'Extractor de Enlaces y Código Web | Descarga Sitios Offline en ZIP',
    description: 'Extrae todos los enlaces, hojas de estilo CSS, HTML y JS con ejecución 100% offline sin conexión a internet y exportación ZIP optimizada.',
    keywords: ['extractor de enlaces', 'descargar web offline', 'extraer css html', 'guardar pagina web', 'scraper web'],
  },
  zh: {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    locale: 'zh_CN',
    dir: 'ltr',
    title: '网页链接与代码提取器 | 100%离线网页抓取与ZIP导出',
    description: '一键提取网页所有链接、内联CSS样式表、HTML与JavaScript，无需网络连接即可本地运行并快速导出ZIP包。',
    keywords: ['网页提取器', '链接提取', '离线网页保存', 'CSS代码提取', '网页抓取工具', '导出ZIP'],
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    locale: 'fr_FR',
    dir: 'ltr',
    title: 'Extracteur de Liens & Code Web | Téléchargement de Site Web Hors-Ligne en ZIP',
    description: 'Extrayez tous les liens, feuilles de style CSS intégrées, HTML et scripts avec exécution 100% autonome hors-ligne et exportation ZIP.',
    keywords: ['extracteur de liens', 'aspirateur de site web', 'sauvegarde hors-ligne', 'extraire css html', 'export zip'],
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    locale: 'de_DE',
    dir: 'ltr',
    title: 'Web-Link & Code-Extraktor | 100% Offline-Website-Scraper & ZIP-Export',
    description: 'Extrahieren Sie alle Web-Links, Inline-CSS-Stylesheets, HTML und JS für die Offline-Ausführung ohne Internetverbindung im ZIP-Paket.',
    keywords: ['Link-Extraktor', 'Website offline speichern', 'CSS extrahieren', 'Web Scraper', 'ZIP Export'],
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    locale: 'ru_RU',
    dir: 'ltr',
    title: 'Экстрактор Ссылок и Кода Сайтов | Офлайн-Сохранение Сайта и ZIP Экспорт',
    description: 'Извлечение всех ссылок, встроенных CSS-стилей, шрифтов, HTML и JS с возможностью 100% автономного запуска без интернета и скачиванием в ZIP.',
    keywords: ['экстрактор ссылок', 'скачать сайт оффлайн', 'извлечение css', 'парсинг сайта', 'скачать zip сайта'],
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    locale: 'pt_BR',
    dir: 'ltr',
    title: 'Extrator de Links e Código Web | Baixar Site Offline e Exportar ZIP',
    description: 'Extraia todos os links, folhas de estilo CSS embutidas, fontes, HTML e JS para execução 100% offline sem internet com exportação em ZIP.',
    keywords: ['extrator de links', 'baixar site offline', 'extrair css html', 'web scraper', 'salvar site zip'],
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    locale: 'ja_JP',
    dir: 'ltr',
    title: 'ウェブリンク＆コード抽出ツール | 100%オフラインWebサイト保存＆ZIP書き出し',
    description: 'すべての内部・外部リンク、インラインCSS、Webフォント、HTML、JSを完全抽出し、ネット接続なしでローカル実行可能なZIPを作成します。',
    keywords: ['リンク抽出', 'Webサイト保存', 'オフラインWeb', 'CSS抽出', 'HTML保存', 'ZIPエクスポート'],
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    locale: 'hi_IN',
    dir: 'ltr',
    title: 'वेब लिंक और कोड निष्कर्षण टूल | 100% ऑफलाइन वेबसाइट डाउनलोड और ZIP एक्सपोर्ट',
    description: 'सभी वेब लिंक, पूर्ण CSS स्टाइलशीट, HTML और जावास्क्रिप्ट को बिना इंटरनेट ऑफ़लाइन चलाने के लिए निकालें और सुरक्षित ज़िप फ़ाइल डाउनलोड करें।',
    keywords: ['वेब लिंक एक्सट्रैक्टर', 'ऑफलाइन वेबसाइट', 'वेब स्क्रैपर', 'सीएसएस एक्सट्रैक्ट', 'ज़िप डाउनलोड'],
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    locale: 'it_IT',
    dir: 'ltr',
    title: 'Estrattore di Link e Codice Web | Salva Siti Web Offline e Scarica ZIP',
    description: 'Estrai tutti i collegamenti, fogli di stile CSS incorporati, HTML e JS con esecuzione 100% autonoma offline e pacchetto ZIP compresso.',
    keywords: ['estrattore link', 'scarica sito offline', 'estrai css html', 'web scraper italiano', 'salva in zip'],
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    locale: 'tr_TR',
    dir: 'ltr',
    title: 'Web Bağlantı ve Kod Çıkarıcı | Çevrimdışı Web Sitesi İndirme ve ZIP Dışa Aktarma',
    description: 'Tüm web bağlantılarını, CSS stillerini, HTML ve JS kodlarını internet gerektirmeden %100 çevrimdışı çalıştırmak üzere çıkarın ve ZIP olarak indirin.',
    keywords: ['link çıkarıcı', 'çevrimdışı site kaydet', 'css kod çıkarıcı', 'site kopyalama aracı', 'zip indir'],
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    locale: 'ko_KR',
    dir: 'ltr',
    title: '웹 링크 및 코드 추출기 | 100% 오프라인 웹사이트 저장 및 ZIP 내보내기',
    description: '모든 웹 링크, 인라인 CSS 스타일시트, 폰트, HTML 및 JS를 추출하여 인터넷 연결 없이 컴퓨터에서 완벽하게 오프라인 실행 가능한 ZIP 패키지로 다운로드하세요.',
    keywords: ['링크 추출기', '오프라인 웹사이트 저장', '웹 스크래퍼', 'CSS 추출', 'ZIP 내보내기'],
  },
  nl: {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    locale: 'nl_NL',
    dir: 'ltr',
    title: 'Web Link & Code Extractor | 100% Offline Website Opslaan & ZIP Export',
    description: 'Extraheer alle weblinks, CSS-stylesheets, HTML en JavaScript voor autonome offline weergave zonder internetverbinding in een gecomprimeerd ZIP-bestand.',
    keywords: ['link extractor', 'offline website opslaan', 'css html extraheren', 'website scraper', 'zip export'],
  },
  pl: {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    locale: 'pl_PL',
    dir: 'ltr',
    title: 'Ekstraktor Linków i Kodu Stron | Pobieranie Witryn Offline i Eksport ZIP',
    description: 'Wyodrębnij wszystkie linki, arkusze stylów CSS, HTML i JavaScript do w 100% autonomicznego działania offline bez dostępu do internetu w formacie ZIP.',
    keywords: ['ekstraktor linków', 'zapisywanie stron offline', 'pobieranie css', 'scraper stron', 'eksport zip'],
  },
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    locale: 'id_ID',
    dir: 'ltr',
    title: 'Pengekstrak Tautan & Kode Web | Unduh Situs Web Offline & Ekspor ZIP',
    description: 'Ekstrak semua tautan web, stylesheet CSS lengkap, HTML, dan JS untuk eksekusi offline 100% tanpa internet dan unduh paket ZIP terstruktur.',
    keywords: ['ekstrak tautan web', 'download situs offline', 'ekstrak css html', 'web scraper', 'ekspor zip'],
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    locale: 'vi_VN',
    dir: 'ltr',
    title: 'Công Cụ Trích Xuất Liên Kết & Mã Web | Tải Trang Web Offline & Xuất ZIP',
    description: 'Trích xuất tất cả liên kết, tệp CSS nội tuyến, phông chữ, HTML và JS để chạy offline 100% không cần internet và xuất gói ZIP nén tối ưu.',
    keywords: ['trích xuất liên kết', 'tải trang web offline', 'trích xuất css', 'cào dữ liệu web', 'tải file zip'],
  },
  ur: {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    locale: 'ur_PK',
    dir: 'rtl',
    title: 'ویب لنکس اور کوڈ ایکسٹریکٹر | آف لائن ویب سائٹ ڈاؤن لوڈ اور زپ فائل ایکسپورٹ',
    description: 'انٹرنیٹ کے بغیر 100% آف لائن چلانے کے لیے تمام ویب لنکس، CSS اسٹائل شیٹس، HTML اور JS نکالیں اور منظم ZIP فائل ڈاؤن لوڈ کریں۔',
    keywords: ['ویب لنک ایکسٹریکٹر', 'آف لائن ویب سائٹ', 'ویب اسکریپر', 'سی ایس ایس ایکسٹریکٹ', 'زپ ڈاؤن لوڈ'],
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    locale: 'bn_BD',
    dir: 'ltr',
    title: 'ওয়েব লিংক ও কোড এক্সট্রাক্টর | ১০০% অফলাইন ওয়েবসাইট ডাউনলোড ও জিপ এক্সপোর্ট',
    description: 'ইন্টারনেট ছাড়াই ১০০% অফলাইনে কার্যকর করতে সমস্ত ওয়েব লিংক, পূর্ণাঙ্গ CSS স্টাইলশিট, HTML ও JS বের করুন এবং দ্রুত জিপ প্যাকেজ ডাউনলোড করুন।',
    keywords: ['ওয়েব লিংক এক্সট্রাক্টর', 'অফলাইন ওয়েবসাইট সেভ', 'ওয়েব স্ক্র্যাপার', 'সিএসএস এক্সট্র্যাক্ট', 'জিপ ডাউনলোড'],
  },
};

export function buildCanonicalUrl(lang: Language, origin?: string): string {
  const base = (origin || SEO_CONFIG.defaultOrigin).replace(/\/$/, '');
  return lang === 'en' ? `${base}/` : `${base}/?lang=${lang}`;
}

export function buildHreflangLinks(origin?: string): { lang: string; url: string }[] {
  const base = (origin || SEO_CONFIG.defaultOrigin).replace(/\/$/, '');
  const links: { lang: string; url: string }[] = [];

  for (const langKey of Object.keys(SEO_LANGUAGES) as Language[]) {
    links.push({
      lang: langKey,
      url: langKey === 'en' ? `${base}/` : `${base}/?lang=${langKey}`,
    });
  }

  // x-default points to default language (English)
  links.push({
    lang: 'x-default',
    url: `${base}/`,
  });

  return links;
}
