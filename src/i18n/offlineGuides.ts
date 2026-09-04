import { Language } from '../types.js';

export interface OfflineGuideContent {
  lang: Language;
  filename: string;
  folderFilename: string;
  title: string;
  content: string;
  folderContent: string;
}

export const OFFLINE_GUIDES: Record<Language, OfflineGuideContent> = {
  fa: {
    lang: 'fa',
    filename: 'راهنمای_اجرای_آفلاین.txt',
    folderFilename: 'راهنمای_ساختار_فولدرها.txt',
    title: 'راهنمای جامع اجرای ۱۰۰٪ آفلاین وبسایت',
    content: `راهنمای جامع اجرای ۱۰۰٪ آفلاین وبسایت (Zero-Internet Execution)
=============================================================
این پکیج به صورت کاملاً مستقل و خودکفا بدون کوچکترین وابستگی به اینترنت یا سرور اصلی تولید شده است.

۱. نحوه اجرای سایت:
- فایل index.html (یا standalone_offline.html) را به طور مستقیم با دو بار کلیک در مرورگر (گوگل کروم، فایرفاکس، مایکروسافت اج، سافاری) باز کنید.
- حتی در صورت قطع کامل اینترنت (حالت پرواز / Airplane Mode)، وبسایت با همان ظاهر و استایل‌های اصلی به صورت کامل لود می‌شود.

۲. ساختار فایل‌ها در این بسته:
- index.html: صفحه اصلی سایت با پیوند به فایل‌های استایل و اسکریپت محلی.
- standalone_offline.html: نسخه تک‌فایلی که تمامی استایل‌ها، فونت‌ها و تصاویر به صورت Base64 درون آن تجمیع شده‌اند.
- styles.css: شیوه نامه جامع CSS شامل تمام کدهای استایل استخراج‌شده و تصحیح‌شده.
- scripts.js: کدهای جاوااسکریپت کاربردی و سپر امنیتی آفلاین (Air-Gap Shield).
- pages/: شامل صفحات استخراج‌شده با تفکیک پوشه‌بندی در حالت خزش چندصفحه‌ای.
- reports/: شامل گزارش گرافیکی لینک‌ها (links_report.html) و خروجی داده‌ها.
- assets/: شامل تمام تصاویر، مدیا و مانیفست دارایی‌های آفلاین (assets_manifest.json).
- guides/: راهنمای اجرای آفلاین به ۲۰ زبان زنده دنیا.

۳. ویژگی سپر هوایی آفلاین (Air-Gap Shield):
کلیه درخواست‌های ریموت مرورگر مسدود و در صورت نیاز از حافظه محلی شبیه‌سازی می‌شوند تا هیچ خطای لود نشدن یا قطعی شبکه رخ ندهد.
`,
    folderContent: `پکیج آفلاین کامل سایت با تفکیک پوشه‌بندی لینک‌ها
================================================
در این پکیج، تمامی لینک‌ها و صفحات سایت به صورت منظم در پوشه‌های مجزا تفکیک شده‌اند:

📁 ساختار پوشه‌بندی:
├── index.html                    <-- صفحه اصلی سایت
├── styles.css                    <-- فایل استایل کامل (CSS)
├── scripts.js                    <-- فایل کدهای اسکریپت (JS)
├── standalone_offline.html       <-- نسخه مستقل تک‌فایلی
│
├── pages/                        <-- پوشه تفکیک اختصاصی تمام لینک‌ها و صفحات
│   ├── index.html                <-- فهرست و منوی راهنمای تمام صفحات
│   ├── 01_home/                  <-- پوشه صفحه اصلی (شامل html, css, js)
│   └── ...                       <-- سایر لینک‌های استخراج‌شده
│
└── reports/                      <-- پوشه گزارشات لینک‌ها و تیترها
    ├── links_report.html         <-- گزارش گرافیکی تمام لینک‌ها
    ├── links.json                <-- داده‌های خروجی لینک‌ها
    └── headings.json             <-- داده‌های ساختار تیترها
`,
  },

  en: {
    lang: 'en',
    filename: 'OFFLINE_EXECUTION_GUIDE.txt',
    folderFilename: 'FOLDER_STRUCTURE_GUIDE.txt',
    title: 'Comprehensive 100% Offline Website Execution Guide',
    content: `Comprehensive 100% Offline Website Execution Guide (Zero-Internet)
================================================================
This package was generated to run 100% independently without any internet connection or reliance on the original remote server.

1. How to Run the Website Offline:
- Double click index.html (or standalone_offline.html) directly in any modern browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
- Even with internet completely disconnected (Airplane Mode), the web page will render with full CSS fidelity, embedded fonts, and responsive layout.

2. Package File Structure:
- index.html: Main webpage linked to local modular styles.css and scripts.js.
- standalone_offline.html: Single-file version with all images, webfonts, and styles inlined as Base64.
- styles.css: Complete bundled CSS stylesheets with remote dependencies resolved.
- scripts.js: Bundled JavaScript and the early Air-Gap Shield protection layer.
- pages/: Sub-pages organized into dedicated directories in domain-crawl mode.
- reports/: Visual links report (links_report.html), CSV data summary, and JSON datasets.
- assets/: Downloaded images, media, and assets_manifest.json for offline verification.
- guides/: Offline execution manuals translated into 20 world languages.

3. Air-Gap Shield Technology:
Network fetch calls and remote scripts are intercepted and gracefully handled locally, completely preventing ERR_INTERNET_DISCONNECTED and ERR_FILE_NOT_FOUND errors.
`,
    folderContent: `Full Website Offline Package with Dedicated Page Folders
=========================================================
In this package, internal pages and links are organized into structured directories:

📁 Directory Layout:
├── index.html                    <-- Primary root website page
├── styles.css                    <-- Complete bundled CSS stylesheet
├── scripts.js                    <-- Complete offline JavaScript bundle
├── standalone_offline.html       <-- Fully inlined self-contained single file
│
├── pages/                        <-- Dedicated directory for crawled pages
│   ├── index.html                <-- Table of contents and navigation index
│   ├── 01_home/                  <-- Root page files (html, css, js)
│   └── ...                       <-- Additional crawled internal links
│
└── reports/                      <-- Audit reports & structured data
    ├── links_report.html         <-- Visual links and assets audit report
    ├── links.json                <-- Structured links dataset
    └── headings.json             <-- Semantic headings tree (H1-H6)
`,
  },

  ar: {
    lang: 'ar',
    filename: 'دليل_التشغيل_بدون_إنترنت.txt',
    folderFilename: 'دليل_هيكل_المجلدات.txt',
    title: 'دليل التشغيل الكامل للموقع بدون اتصال بالإنترنت',
    content: `دليل التشغيل الكامل للموقع بدون اتصال بالإنترنت (100% أوفلاين)
=============================================================
تم إنشاء هذه الحزمة للعمل باستقلالية تامة دون الحاجة إلى شبكة الإنترنت أو خوادم الموقع الأصلي.

١. طريقة تشغيل الموقع:
- انقر نقراً مزدوجاً فوق index.html (أو standalone_offline.html) في أي متصفح حديث (Chrome، Firefox، Edge، Safari).
- سيعمل الموقع بكامل استايلاته وخطوطه حتى في وضع عدم الاتصال بالإنترنت (وضع الطيران).

٢. محتويات الحزمة:
- index.html: الصفحة الرئيسية المرتبطة بملفات CSS و JS المحلية.
- standalone_offline.html: نسخة مستقلة مدمجة بالكامل بتنسيق Base64.
- styles.css: جميع ملفات التنسيق مجمعة ومحسنة للعمل المحلي.
- scripts.js: الشفرات البرمجية مع درع الأوفلاين الواقي.
- pages/: المجلد المخصص لتنظيم الصفحات والروابط المستخرجة.
- reports/: تقرير الروابط التفاعلي (links_report.html) والبيانات المنظمة.
- assets/: جميع الصور والوسائط وملف مانيفرست الأصول (assets_manifest.json).
- guides/: دليل التشغيل مترجم إلى 20 لغة عالمية.
`,
    folderContent: `حزمة الموقع بدون إنترنت مع تنظيم المجلدات
===========================================
📁 هيكل المجلدات:
├── index.html                    <-- الصفحة الرئيسية
├── styles.css                    <-- ملف الاستايل الكامل
├── scripts.js                    <-- ملف الأكواد البرمجية
├── standalone_offline.html       <-- نسخة الملف الواحد المستقل
│
├── pages/                        <-- مجلد الصفحات المفهرسة
│   ├── index.html                <-- فهرس ودليل جميع الصفحات
│   └── ...                       <-- مجلدات الروابط المستخرجة
│
└── reports/                      <-- مجلد التقارير
    ├── links_report.html         <-- تقرير فحص الروابط
    └── links.json                <-- بيانات الروابط المصدرة
`,
  },

  de: {
    lang: 'de',
    filename: 'OFFLINE_ANLEITUNG.txt',
    folderFilename: 'ORDNERSTRUKTUR_ANLEITUNG.txt',
    title: 'Vollständige Anleitung zur 100% Offline-Nutzung',
    content: `Vollständige Anleitung zur 100% Offline-Nutzung (Ohne Internet)
===================================================================
Dieses Paket wurde so erstellt, dass es vollkommen unabhängig ohne Internetverbindung oder Zugriff auf den Originalserver ausgeführt werden kann.

1. So starten Sie die Website:
- Öffnen Sie index.html (oder standalone_offline.html) per Doppelklick in Ihrem Browser (Chrome, Firefox, Edge, Safari).
- Auch bei komplett getrennter Internetverbindung (Flugmodus) bleibt das Originaldesign inklusive CSS, Schriftarten und Bildern vollständig erhalten.

2. Paketstruktur:
- index.html: Hauptseite verknüpft mit lokalen styles.css und scripts.js.
- standalone_offline.html: Einzelseitenversion mit allen Bildern und Schriftarten als Base64 eingebettet.
- styles.css: Vollständige CSS-Stylesheets ohne externe Abhängigkeiten.
- scripts.js: JavaScript-Code mit integriertem Air-Gap-Schutzschild.
- pages/: Dedizierte Unterordner für gecrawlte Seiten.
- reports/: Grafischer Linkbericht (links_report.html) und JSON-Daten.
- assets/: Alle Bilder, Medien und das Asset-Manifest.
- guides/: Anleitungen in 20 Weltsprachen.
`,
    folderContent: `Vollständiges Offline-Paket mit eigener Ordnerstruktur
======================================================
📁 Ordnerübersicht:
├── index.html                    <-- Hauptseite der Website
├── styles.css                    <-- Komplettes CSS-Stylesheet
├── scripts.js                    <-- Vollständige JavaScript-Datei
├── standalone_offline.html       <-- Vollständig eingebettete Einzeldatei
│
├── pages/                        <-- Eigene Ordner für jede gecrawlte Seite
│   ├── index.html                <-- Inhaltsverzeichnis aller Seiten
│   └── ...                       <-- Extrahierte Unterseiten
│
└── reports/                      <-- Berichtsordner
    ├── links_report.html         <-- Grafischer Link- und Asset-Bericht
    └── links.json                <-- Strukturierte Linkdaten
`,
  },

  es: {
    lang: 'es',
    filename: 'GUIA_EJECUCION_OFFLINE.txt',
    folderFilename: 'GUIA_ESTRUCTURA_CARPETAS.txt',
    title: 'Guía Completa de Ejecución 100% Offline',
    content: `Guía Completa de Ejecución 100% Offline (Sin Conexión a Internet)
=======================================================================
Este paquete ha sido generado para funcionar de forma 100% independiente sin requerir conexión a internet ni contacto con el servidor original.

1. Cómo abrir y ejecutar el sitio web:
- Haga doble clic en index.html (o en standalone_offline.html) en su navegador preferido (Chrome, Firefox, Edge, Safari).
- Incluso con el modo avión activado, el diseño, los estilos CSS y las fuentes se mostrarán de forma idéntica a la web original.

2. Estructura de archivos:
- index.html: Página principal enlazada a styles.css y scripts.js locales.
- standalone_offline.html: Versión de archivo único con todas las imágenes y estilos incrustados en Base64.
- styles.css: Hojas de estilo CSS completas y corregidas.
- scripts.js: Código JavaScript con escudo protector Air-Gap Shield.
- pages/: Directorios organizados para cada enlace rastreado.
- reports/: Informe visual de enlaces (links_report.html) y datos JSON/CSV.
- assets/: Imágenes, multimedia y assets_manifest.json.
- guides/: Guías de ejecución traducidas a 20 idiomas mundiales.
`,
    folderContent: `Paquete Offline Completo con Carpetas Dedicadas por Página
=========================================================
📁 Distribución de Carpetas:
├── index.html                    <-- Página principal del sitio
├── styles.css                    <-- Hoja de estilos CSS completa
├── scripts.js                    <-- Archivo de scripts JavaScript
├── standalone_offline.html       <-- Archivo único autónomo
│
├── pages/                        <-- Directorio de páginas rastreadas
│   ├── index.html                <-- Índice y menú de navegación
│   └── ...                       <-- Carpetas de páginas individuales
│
└── reports/                      <-- Informes y datos estructurados
    ├── links_report.html         <-- Informe gráfico de enlaces
    └── links.json                <-- Datos de enlaces extraídos
`,
  },

  zh: {
    lang: 'zh',
    filename: '离线运行完整指南.txt',
    folderFilename: '文件夹结构指南.txt',
    title: '100% 完全离线网页运行指南',
    content: `100% 完全离线网页运行指南（零网络依赖）
==============================================
本离线包已实现全部资源的本地序列化与内联，无需任何网络连接或远程服务器即可完整运行。

一、如何离线打开网站：
- 直接在任何现代浏览器（Chrome、Firefox、Edge、Safari）中双击 index.html（或 standalone_offline.html）。
- 即使完全断开网络或开启飞行模式，页面的全部 CSS 样式、字体和排版均可完美呈现。

二、文件结构说明：
- index.html: 网站主入口，引用本地 styles.css 和 scripts.js。
- standalone_offline.html: 单文件完全自包含版本，所有图片与字体均转换为 Base64 嵌入。
- styles.css: 整合后的完整 CSS 样式表。
- scripts.js: 离线 JavaScript 脚本与 Air-Gap 隔离防护代码。
- pages/: 整站抓取模式下各个独立页面的分类目录。
- reports/: 链接可视化报告 (links_report.html) 及 JSON/CSV 数据集。
- assets/: 本地化存储的图片、多媒体与资源清单 (assets_manifest.json)。
- guides/: 包含全球 20 种语言的离线运行指南。
`,
    folderContent: `整站离线包与独立页面目录结构指南
==============================================
📁 目录布局：
├── index.html                    <-- 网站主页
├── styles.css                    <-- 完整内联 CSS 样式表
├── scripts.js                    <-- 完整 JavaScript 离线脚本
├── standalone_offline.html       <-- 单文件全内嵌版本
│
├── pages/                        <-- 抓取的所有独立页面文件夹
│   ├── index.html                <-- 页面索引与导航菜单
│   └── ...                       <-- 各子页面文件夹
│
└── reports/                      <-- 报告与数据集
    ├── links_report.html         <-- 链接与资源可视化审计报告
    └── links.json                <-- 结构化链接数据
`,
  },

  fr: {
    lang: 'fr',
    filename: 'GUIDE_EXECUTION_HORS_LIGNE.txt',
    folderFilename: 'GUIDE_STRUCTURE_DOSSIERS.txt',
    title: 'Guide d’Exécution Hors-Ligne à 100%',
    content: `Guide d’Exécution Hors-Ligne à 100% (Zéro Connexion Internet)
==================================================================
Ce package est entièrement autonome et ne nécessite aucune connexion Internet ni accès au serveur d’origine.

1. Comment lancer le site hors-ligne :
- Double-cliquez sur index.html (ou standalone_offline.html) dans votre navigateur (Chrome, Firefox, Edge, Safari).
- Même en mode avion sans connexion, les styles CSS, les polices et la mise en page responsive s'affichent fidèlement.

2. Structure des fichiers :
- index.html : Page d'accueil liée aux fichiers styles.css et scripts.js locaux.
- standalone_offline.html : Fichier unique tout-en-un avec images et polices intégrées en Base64.
- styles.css : Feuilles de style CSS complètes sans dépendances externes.
- scripts.js : Scripts JavaScript avec bouclier protecteur Air-Gap Shield.
- pages/ : Dossiers dédiés pour chaque page explorée du domaine.
- reports/ : Rapport visuel des liens (links_report.html) et fichiers JSON/CSV.
- assets/ : Images téléchargées et manifeste des ressources (assets_manifest.json).
- guides/ : Guides traduits dans 20 langues mondiales.
`,
    folderContent: `Package Hors-Ligne avec Dossiers Dédiés par Page
===================================================
📁 Organisation des dossiers :
├── index.html                    <-- Page principale du site
├── styles.css                    <-- Feuille de style CSS intégrée
├── scripts.js                    <-- Fichier de scripts JavaScript
├── standalone_offline.html       <-- Fichier autonome unique
│
├── pages/                        <-- Dossier des pages explorées
│   ├── index.html                <-- Table des matières et menu
│   └── ...                       <-- Dossiers de pages spécifiques
│
└── reports/                      <-- Rapports d'analyse
    ├── links_report.html         <-- Rapport graphique d'audit
    └── links.json                <-- Données brutes des liens
`,
  },

  ru: {
    lang: 'ru',
    filename: 'ИНСТРУКЦИЯ_ОФЛАЙН_ЗАПУСКА.txt',
    folderFilename: 'ИНСТРУКЦИЯ_СТРУКТУРЫ_ПАПОК.txt',
    title: 'Полное руководство по 100% офлайн-запуску сайта',
    content: `Полное руководство по 100% офлайн-запуску сайта (Без Интернета)
=================================================================
Данный архив полностью автономен и не требует подключения к интернету или исходному серверу.

1. Как открыть сайт офлайн:
- Дважды кликните по index.html (или standalone_offline.html) в любом современном браузере (Chrome, Firefox, Edge, Safari).
- Даже при полном отключении сети (в режиме полета) оформление, CSS-стили, шрифты и адаптивная верстка отображаются без сбоев.

2. Содержимое архива:
- index.html: Главная страница, подключенная к локальным styles.css и scripts.js.
- standalone_offline.html: Единый автономный файл со всеми стилями и изображениями в формате Base64.
- styles.css: Полный сборник таблиц стилей CSS.
- scripts.js: Офлайн-скрипты с защитным щитом Air-Gap Shield.
- pages/: Отдельные папки для каждой страницы при многостраничном обходе.
- reports/: Графический отчет по ссылкам (links_report.html) и таблицы CSV/JSON.
- assets/: Загруженные медиафайлы и манифест (assets_manifest.json).
- guides/: Инструкции на 20 языках мира.
`,
    folderContent: `Офлайн-пакет сайта со структурированными папками страниц
=========================================================
📁 Структура папок:
├── index.html                    <-- Главная страница сайта
├── styles.css                    <-- Полная таблица стилей CSS
├── scripts.js                    <-- Скрипты JavaScript
├── standalone_offline.html       <-- Автономный единый файл
│
├── pages/                        <-- Папки отдельных страниц сайта
│   ├── index.html                <-- Индекс и каталог страниц
│   └── ...                       <-- Папки страниц с ресурсами
│
└── reports/                      <-- Отчеты и выгрузки данных
    ├── links_report.html         <-- Визуальный отчет по ссылкам
    └── links.json                <-- Структурированный файл ссылок
`,
  },

  pt: {
    lang: 'pt',
    filename: 'GUIA_EXECUCAO_OFFLINE.txt',
    folderFilename: 'GUIA_ESTRUTURA_PASTAS.txt',
    title: 'Guia Completo de Execução 100% Offline',
    content: `Guia Completo de Execução 100% Offline (Sem Conexão à Internet)
=====================================================================
Este pacote foi projetado para rodar com autonomia total sem depender da internet ou do servidor original.

1. Como executar o site offline:
- Dê um duplo clique em index.html (ou standalone_offline.html) no navegador (Chrome, Firefox, Edge, Safari).
- Mesmo no modo avião sem rede, o layout, os estilos CSS e as fontes permanecem 100% intactos.

2. Estrutura do pacote:
- index.html: Página principal com links para styles.css e scripts.js locais.
- standalone_offline.html: Versão autônoma em arquivo único com imagens e fontes em Base64.
- styles.css: Folhas de estilo completas sem links remotos quebrados.
- scripts.js: Scripts e escudo de proteção Air-Gap.
- pages/: Pastas individuais para páginas rastreadas.
- reports/: Relatório visual (links_report.html) e dados JSON/CSV.
- assets/: Imagens, mídias e manifesto (assets_manifest.json).
- guides/: Manuais em 20 idiomas internacionais.
`,
    folderContent: `Pacote Offline Completo com Pastas Individuais por Página
=========================================================
📁 Estrutura de Pastas:
├── index.html                    <-- Página principal
├── styles.css                    <-- Folha de estilos CSS completa
├── scripts.js                    <-- Scripts JavaScript locais
├── standalone_offline.html       <-- Arquivo único autônomo
│
├── pages/                        <-- Diretório das páginas rastreadas
│   ├── index.html                <-- Índice de navegação
│   └── ...                       <-- Pastas dedicadas
│
└── reports/                      <-- Relatórios de links e títulos
    ├── links_report.html         <-- Relatório gráfico de auditoria
    └── links.json                <-- Dados estruturados de links
`,
  },

  ja: {
    lang: 'ja',
    filename: '完全オフライン実行ガイド.txt',
    folderFilename: 'フォルダ構造ガイド.txt',
    title: '100% 完全オフライン実行ガイド',
    content: `100% 完全オフライン実行ガイド（インターネット接続不要）
=========================================================
本パッケージは、インターネット接続や元のWebサーバーに一切依存せず、単独で完全動作するように作成されています。

1. オフラインでの開き方：
- 任意のモダンブラウザ（Chrome、Firefox、Edge、Safari）で index.html（または standalone_offline.html）をダブルクリックしてください。
- 機内モードなどの完全オフライン環境でも、CSSスタイル、Webフォント、レイアウトが崩れることなく忠実に表示されます。

2. ファイル構成：
- index.html: ローカルの styles.css および scripts.js を読み込むメインページ。
- standalone_offline.html: すべての画像やフォントを Base64 形式で埋め込んだ単一ファイル版。
- styles.css: 外部依存を解消した完全な CSS スタイルシート。
- scripts.js: オフライン保護シールド（Air-Gap Shield）を内蔵したスクリプト。
- pages/: ドメイン巡回モードで取得した個別ページの専用フォルダ群。
- reports/: リンク検証レポート (links_report.html) および JSON / CSV 出力。
- assets/: 収集された画像、メディア、アセットマニフェスト (assets_manifest.json)。
- guides/: 世界20言語に対応した実行ガイド。
`,
    folderContent: `個別ページ専用フォルダ付き完全オフラインパッケージ
=========================================================
📁 フォルダ構成：
├── index.html                    <-- サイトのメインページ
├── styles.css                    <-- 完全統合 CSS スタイルシート
├── scripts.js                    <-- オフライン JavaScript スクリプト
├── standalone_offline.html       <-- 完全内蔵型シングルファイル版
│
├── pages/                        <-- 収集された各ページの個別フォルダ
│   ├── index.html                <-- ページ一覧と目次ナビゲーション
│   └── ...                       <-- 各ページごとのフォルダ
│
└── reports/                      <-- 各種レポート・データ
    ├── links_report.html         <-- リンク監査ビジュアルレポート
    └── links.json                <-- 構造化リンクデータ
`,
  },

  hi: {
    lang: 'hi',
    filename: 'ऑफलाइन_संचालन_मार्गदर्शिका.txt',
    folderFilename: 'फ़ोल्डर_संरचना_मार्गदर्शिका.txt',
    title: '100% पूर्ण ऑफ़लाइन वेबसाइट संचालन मार्गदर्शिका',
    content: `100% पूर्ण ऑफ़लाइन वेबसाइट संचालन मार्गदर्शिका (शून्य इंटरनेट निर्भरता)
======================================================================
यह पैकेज पूरी तरह से स्वतंत्र है और इसे मूल सर्वर या इंटरनेट कनेक्शन के बिना स्थानीय रूप से चलाने के लिए तैयार किया गया है।

1. वेबसाइट को ऑफ़लाइन कैसे खोलें:
- किसी भी आधुनिक ब्राउज़र (Chrome, Firefox, Edge, Safari) में index.html (या standalone_offline.html) पर डबल क्लिक करें।
- हवाई जहाज मोड (Airplane Mode) में भी, सभी CSS शैलियाँ, फोंट और उत्तरदायी लेआउट मूल वेबसाइट की तरह प्रदर्शित होंगे।

2. पैकेज फ़ाइल संरचना:
- index.html: स्थानीय styles.css और scripts.js से जुड़ी मुख्य वेबसाइट फ़ाइल।
- standalone_offline.html: एकल-फ़ाइल संस्करण जिसमें सभी छवियां और शैलियाँ Base64 में एम्बेडेड हैं।
- styles.css: पूर्ण एकीकृत CSS स्टाइलशीट।
- scripts.js: एयर-गैप शील्ड (Air-Gap Shield) युक्त जावास्क्रिप्ट कोड।
- pages/: क्रॉल किए गए आंतरिक पृष्ठों के समर्पित फ़ोल्डर।
- reports/: लिंक रिपोर्ट (links_report.html) और संरचित JSON/CSV डेटा।
- assets/: डाउनलोड किए गए मीडिया और एसेट मेनिफेस्ट।
- guides/: 20 विश्व भाषाओं में अनुवादित संचालन मार्गदर्शिकाएँ।
`,
    folderContent: `समर्पित पृष्ठ फ़ोल्डरों के साथ पूर्ण ऑफ़लाइन पैकेज
==================================================
📁 फ़ोल्डर लेआउट:
├── index.html                    <-- मुख्य पृष्ठ
├── styles.css                    <-- पूर्ण CSS स्टाइलशीट
├── scripts.js                    <-- पूर्ण जावास्क्रिप्ट कोड
├── standalone_offline.html       <-- एकल-फ़ाइल ऑफ़लाइन संस्करण
│
├── pages/                        <-- पृष्ठों की समर्पित निर्देशिका
│   ├── index.html                <-- पृष्ठ अनुक्रमणिका और मेनू
│   └── ...                       <-- अलग-अलग पृष्ठ फ़ोल्डर
│
└── reports/                      <-- रिपोर्ट और डेटा
    ├── links_report.html         <-- विज़ुअल लिंक रिपोर्ट
    └── links.json                <-- संरचित लिंक डेटा
`,
  },

  it: {
    lang: 'it',
    filename: 'GUIDA_ESECUZIONE_OFFLINE.txt',
    folderFilename: 'GUIDA_STRUTTURA_CARTELLE.txt',
    title: 'Guida Completa all’Esecuzione 100% Offline',
    content: `Guida Completa all’Esecuzione 100% Offline (Zero Connessione Internet)
========================================================================
Questo pacchetto è completamente autonomo e non richiede alcuna connessione internet né accesso al server originale.

1. Come avviare il sito offline:
- Fare doppio clic su index.html (o standalone_offline.html) in qualsiasi browser moderno (Chrome, Firefox, Edge, Safari).
- Anche in modalità aereo, la grafica, gli stili CSS, i font e le immagini vengono riprodotti fedelmente.

2. Struttura dei file:
- index.html: Pagina principale collegata ai file locali styles.css e scripts.js.
- standalone_offline.html: File singolo con stili, font e immagini incorporati in formato Base64.
- styles.css: Fogli di stile CSS completi privi di dipendenze remote.
- scripts.js: Script JavaScript con scudo di protezione offline Air-Gap Shield.
- pages/: Cartelle dedicate per ciascuna pagina scansionata nel dominio.
- reports/: Report visivo dei link (links_report.html) e dati strutturati in JSON/CSV.
- assets/: Risorse multimediali e manifesto degli asset (assets_manifest.json).
- guides/: Guide d'uso tradotte in 20 lingue del mondo.
`,
    folderContent: `Pacchetto Offline Completo con Cartelle Dedicate per Pagina
=========================================================
📁 Struttura Cartelle:
├── index.html                    <-- Pagina principale del sito
├── styles.css                    <-- Foglio di stile CSS completo
├── scripts.js                    <-- Script JavaScript
├── standalone_offline.html       <-- File singolo autosufficiente
│
├── pages/                        <-- Cartelle delle pagine scansionate
│   ├── index.html                <-- Indice e menu di navigazione
│   └── ...                       <-- Sottopagine estratte
│
└── reports/                      <-- Reportistica e dataset
    ├── links_report.html         <-- Report grafico dei link
    └── links.json                <-- Dataset strutturato dei link
`,
  },

  tr: {
    lang: 'tr',
    filename: 'CEVRIMDISI_CALISTIRMA_KILAVUZU.txt',
    folderFilename: 'KLASOR_YAPISI_KILAVUZU.txt',
    title: '100% Çevrimdışı Web Sitesi Çalıştırma Kılavuzu',
    content: `100% Çevrimdışı Web Sitesi Çalıştırma Kılavuzu (Sıfır İnternet)
================================================================
Bu paket, internet bağlantısı veya orijinal sunucuya ihtiyaç duymadan tamamen bağımsız çalışacak şekilde üretilmiştir.

1. Web Sitesini Çevrimdışı Açma:
- index.html (veya standalone_offline.html) dosyasını herhangi bir modern tarayıcıda (Chrome, Firefox, Edge, Safari) çift tıklayarak açın.
- Uçak modunda veya internet bağlantısı tamamen kesik olsa dahi tüm CSS stilleri, web yazı tipleri ve duyarlı düzen sorunsuz şekilde çalışır.

2. Paket Dosya Yapısı:
- index.html: Yerel styles.css ve scripts.js dosyalarına bağlı ana web sayfası.
- standalone_offline.html: Tüm resim, yazı tipi ve stillerin Base64 olarak gömüldüğü tek dosyalık sürüm.
- styles.css: Harici bağımlılıkları çözülmüş tam CSS stil dosyası.
- scripts.js: Çevrimdışı güvenlik kalkanı (Air-Gap Shield) içeren JavaScript kodları.
- pages/: Alan adı taramasında bulunan sayfaların ayrılmış özel klasörleri.
- reports/: Bağlantı denetim raporu (links_report.html) ve JSON/CSV veri setleri.
- assets/: İndirilen medya varlıkları ve varlık manifestosu (assets_manifest.json).
- guides/: 20 dünya diline çevrilmiş çevrimdışı kullanım kılavuzları.
`,
    folderContent: `Sayfa Başına Özel Klasörlerle Tam Çevrimdışı Paket
=====================================================
📁 Klasör Düzeni:
├── index.html                    <-- Ana web sayfası
├── styles.css                    <-- Eksiksiz CSS stil dosyası
├── scripts.js                    <-- Çevrimdışı JavaScript kodları
├── standalone_offline.html       <-- Bağımsız tek dosyalık sürüm
│
├── pages/                        <-- Taranan sayfaların klasörleri
│   ├── index.html                <-- Sayfa dizini ve gezinme menüsü
│   └── ...                       <-- Çıkarılan alt sayfalar
│
└── reports/                      <-- Raporlar ve veriler
    ├── links_report.html         <-- Görsel bağlantı raporu
    └── links.json                <-- Yapılandırılmış bağlantı verileri
`,
  },

  ko: {
    lang: 'ko',
    filename: '오프라인_실행_가이드.txt',
    folderFilename: '폴더_구조_가이드.txt',
    title: '100% 완전 오프라인 웹사이트 실행 가이드',
    content: `100% 완전 오프라인 웹사이트 실행 가이드 (인터넷 연결 불필요)
============================================================
이 패키지는 원본 원격 서버나 인터넷 연결에 전혀 의존하지 않고 로컬 컴퓨터에서 100% 완전하게 독립 실행되도록 제작되었습니다.

1. 웹사이트 오프라인 실행 방법:
- 브라우저(Chrome, Firefox, Edge, Safari)에서 index.html(또는 standalone_offline.html) 파일을 더블 클릭하여 엽니다.
- 비행기 탑승 모드나 네트워크 연결 해제 상태에서도 CSS 스타일, 웹폰트 및 반응형 레이아웃이 원본 웹사이트와 동일하게 유지됩니다.

2. 패키지 파일 구성:
- index.html: 로컬 styles.css 및 scripts.js와 연결된 메인 웹페이지.
- standalone_offline.html: 모든 이미지, 폰트, 스타일이 Base64로 인라인 처리된 단일 파일 버전.
- styles.css: 외부 네트워크 의존성을 제거한 완전한 CSS 스타일시트.
- scripts.js: 오프라인 에어갭 보호 쉴드(Air-Gap Shield)가 포함된 자바스크립트 코드.
- pages/: 다중 페이지 크롤링 모드에서 수집된 페이지별 전용 디렉터리.
- reports/: 시각적 링크 보고서(links_report.html) 및 JSON/CSV 데이터셋.
- assets/: 수집된 미디어 자산 및 자산 매니페스트(assets_manifest.json).
- guides/: 전 세계 20개 언어로 번역된 오프라인 실행 가이드 모음.
`,
    folderContent: `페이지별 전용 폴더가 포함된 전체 오프라인 패키지
==================================================
📁 폴더 디렉터리 구조:
├── index.html                    <-- 웹사이트 메인 페이지
├── styles.css                    <-- 통합 CSS 스타일시트
├── scripts.js                    <-- 오프라인 자바스크립트 스크립트
├── standalone_offline.html       <-- 단일 파일 독립 버전
│
├── pages/                        <-- 크롤링된 페이지별 디렉터리
│   ├── index.html                <-- 전체 페이지 목차 및 내비게이션
│   └── ...                       <-- 개별 페이지 폴더들
│
└── reports/                      <-- 분석 보고서 및 데이터
    ├── links_report.html         <-- 시각적 링크 감사 보고서
    └── links.json                <-- 구조화된 링크 데이터
`,
  },

  nl: {
    lang: 'nl',
    filename: 'OFFLINE_HANDLEIDING.txt',
    folderFilename: 'MAPSTRUCTUUR_HANDLEIDING.txt',
    title: 'Volledige Handleiding voor 100% Offline Gebruik',
    content: `Volledige Handleiding voor 100% Offline Gebruik (Zonder Internet)
======================================================================
Dit pakket is ontworpen om volledig autonoom te functioneren zonder internetverbinding of toegang tot de originele server.

1. De website offline openen:
- Dubbelklik op index.html (of standalone_offline.html) in uw browser (Chrome, Firefox, Edge, Safari).
- Zelfs in de vliegtuigmodus blijft de lay-out inclusief CSS-stijlen, lettertypen en afbeeldingen perfect bewaard.

2. Pakketstructuur:
- index.html: Hoofdpagina gekoppeld aan lokale styles.css en scripts.js.
- standalone_offline.html: Enkelvoudig bestand met alle afbeeldingen en stijlen ingesloten als Base64.
- styles.css: Volledige CSS-stylesheets zonder externe afhankelijkheden.
- scripts.js: JavaScript-code voorzien van het Air-Gap Shield beveiligingssysteem.
- pages/: Mappen per pagina in domeindoorzoekingsmodus.
- reports/: Visueel linkrapport (links_report.html) en JSON/CSV-bestanden.
- assets/: Gedownloade media en het activamanifest (assets_manifest.json).
- guides/: Handleidingen vertaald in 20 wereldtalen.
`,
    folderContent: `Volledig Offline Pakket met Aparte Mappen per Pagina
===================================================
📁 Mapstructuur:
├── index.html                    <-- Hoofdpagina van de website
├── styles.css                    <-- Volledig CSS-stylesheet
├── scripts.js                    <-- Lokale JavaScript-bestanden
├── standalone_offline.html       <-- Enkelvoudig zelfstandig bestand
│
├── pages/                        <-- Mappen van doorzochte pagina's
│   ├── index.html                <-- Inhoudsopgave en navigatie
│   └── ...                       <-- Afzonderlijke paginamappen
│
└── reports/                      <-- Rapporten en gegevens
    ├── links_report.html         <-- Visueel linkrapport
    └── links.json                <-- Gestructureerde linkgegevens
`,
  },

  pl: {
    lang: 'pl',
    filename: 'INSTRUKCJA_URUCHOMIENIA_OFFLINE.txt',
    folderFilename: 'INSTRUKCJA_STRUKTURY_FOLDEROW.txt',
    title: 'Kompletny Przewodnik po Uruchamianiu Witryny 100% Offline',
    content: `Kompletny Przewodnik po Uruchamianiu Witryny 100% Offline (Bez Internetu)
===========================================================================
Ten pakiet został przygotowany do całkowicie autonomicznego działania bez konieczności łączenia się z internetem lub serwerem źródłowym.

1. Jak otworzyć witrynę w trybie offline:
- Kliknij dwukrotnie plik index.html (lub standalone_offline.html) w dowolnej nowoczesnej przeglądarce (Chrome, Firefox, Edge, Safari).
- Nawet przy wyłączonym dostępie do sieci (tryb samolotowy) wygląd, style CSS i czcionki ładują się identycznie jak na żywej stronie.

2. Struktura plików w archiwum:
- index.html: Strona główna połączona z lokalnymi plikami styles.css i scripts.js.
- standalone_offline.html: Samodzielna wersja jednoplikowa z osadzonymi obrazami i stylami Base64.
- styles.css: Kompletny arkusz stylów CSS bez zewnętrznych zależności sieciowych.
- scripts.js: Skrypty JavaScript z tarczą ochronną Air-Gap Shield.
- pages/: Dedykowane foldery dla podstron zaindeksowanych w trybie indeksowania domeny.
- reports/: Raport graficzny linków (links_report.html) oraz dane JSON/CSV.
- assets/: Pobrane multimedia oraz manifest zasobów (assets_manifest.json).
- guides/: Instrukcje przetłumaczone na 20 języków świata.
`,
    folderContent: `Kompletny Pakiet Offline z Dedykowanymi Folderami dla Stron
==========================================================
📁 Układ Folderów:
├── index.html                    <-- Strona główna witryny
├── styles.css                    <-- Kompletny arkusz stylów CSS
├── scripts.js                    <-- Plik skryptów JavaScript
├── standalone_offline.html       <-- Samodzielny plik uniwersalny
│
├── pages/                        <-- Katalog podstron
│   ├── index.html                <-- Indeks i spis podstron
│   └── ...                       <-- Poszczególne foldery stron
│
└── reports/                      <-- Raporty i zbiory danych
    ├── links_report.html         <-- Wizualny raport linków
    └── links.json                <-- Strukturalne dane linków
`,
  },

  id: {
    lang: 'id',
    filename: 'PANDUAN_EKSEKUSI_OFFLINE.txt',
    folderFilename: 'PANDUAN_STRUKTUR_FOLDER.txt',
    title: 'Panduan Lengkap Menjalankan Situs Web 100% Offline',
    content: `Panduan Lengkap Menjalankan Situs Web 100% Offline (Bebas Internet)
====================================================================
Paket ini dirancang agar dapat berjalan secara mandiri tanpa memerlukan koneksi internet atau kontak ke server asli.

1. Cara membuka situs web secara offline:
- Klik ganda index.html (atau standalone_offline.html) di peramban web modern Anda (Chrome, Firefox, Edge, Safari).
- Meskipun dalam mode pesawat tanpa jaringan, seluruh tata letak, gaya CSS, dan font akan dirender secara identik.

2. Struktur berkas paket:
- index.html: Halaman utama yang terhubung ke styles.css dan scripts.js lokal.
- standalone_offline.html: Versi berkas tunggal yang menyematkan seluruh gambar dan gaya sebagai Base64.
- styles.css: Lembar gaya CSS lengkap tanpa dependensi jarak jauh.
- scripts.js: Kode JavaScript dengan perisai pelindung Air-Gap Shield.
- pages/: Direktori khusus untuk halaman yang dirayapi.
- reports/: Laporan visual tautan (links_report.html) dan data JSON/CSV.
- assets/: Gambar, media, dan manifes aset (assets_manifest.json).
- guides/: Panduan yang diterjemahkan ke dalam 20 bahasa dunia.
`,
    folderContent: `Paket Offline Lengkap dengan Folder Khusus per Halaman
======================================================
📁 Susunan Direktori:
├── index.html                    <-- Halaman utama situs
├── styles.css                    <-- Lembar gaya CSS lengkap
├── scripts.js                    <-- Berkas skrip JavaScript
├── standalone_offline.html       <-- Berkas tunggal mandiri
│
├── pages/                        <-- Direktori halaman yang dirayapi
│   ├── index.html                <-- Daftar isi dan navigasi
│   └── ...                       <-- Folder halaman terpisah
│
└── reports/                      <-- Laporan dan dataset
    ├── links_report.html         <-- Laporan audit tautan
    └── links.json                <-- Data terstruktur tautan
`,
  },

  vi: {
    lang: 'vi',
    filename: 'HUONG_DAN_CHAY_OFFLINE.txt',
    folderFilename: 'HUONG_DAN_CAU_TRUC_THU_MUC.txt',
    title: 'Hướng Dẫn Toàn Diện Chạy Trang Web 100% Ngoại Tuyến',
    content: `Hướng Dẫn Toàn Diện Chạy Trang Web 100% Ngoại Tuyến (Không Cần Internet)
============================================================================
Gói lưu trữ này được xây dựng để hoạt động hoàn toàn độc lập mà không cần bất kỳ kết nối mạng hoặc máy chủ từ xa nào.

1. Cách mở trang web khi ngoại tuyến:
- Nhấp đúp vào index.html (hoặc standalone_offline.html) trong bất kỳ trình duyệt hiện đại nào (Chrome, Firefox, Edge, Safari).
- Ngay cả khi ngắt kết nối mạng hoàn toàn hoặc bật chế độ máy bay, kiểu dáng CSS, phông chữ và bố cục vẫn hiển thị chính xác.

2. Cấu trúc tệp tin:
- index.html: Trang chính liên kết với styles.css và scripts.js nội bộ.
- standalone_offline.html: Phiên bản tệp đơn nhúng toàn bộ hình ảnh và phông chữ dưới dạng Base64.
- styles.css: Bảng kiểu CSS hoàn chỉnh không còn phụ thuộc từ xa.
- scripts.js: Mã nguồn JavaScript kèm tấm khiên bảo vệ Air-Gap Shield.
- pages/: Thư mục chuyên dụng cho từng trang được thu thập.
- reports/: Báo cáo liên kết trực quan (links_report.html) và tập dữ liệu JSON/CSV.
- assets/: Hình ảnh, tệp đa phương tiện và tệp kê khai (assets_manifest.json).
- guides/: Bản hướng dẫn được dịch sang 20 ngôn ngữ thế giới.
`,
    folderContent: `Gói Ngoại Tuyến Hoàn Chỉnh với Thư Mục Riêng cho Từng Trang
=============================================================
📁 Cấu trúc thư mục:
├── index.html                    <-- Trang chính của trang web
├── styles.css                    <-- Bảng kiểu CSS hoàn chỉnh
├── scripts.js                    <-- Tệp mã kịch bản JavaScript
├── standalone_offline.html       <-- Phiên bản tệp đơn tự vận hành
│
├── pages/                        <-- Thư mục chứa các trang đã thu thập
│   ├── index.html                <-- Mục lục và điều hướng các trang
│   └── ...                       <-- Thư mục riêng từng trang
│
└── reports/                      <-- Báo cáo và tập dữ liệu
    ├── links_report.html         <-- Báo cáo kiểm tra liên kết
    └── links.json                <-- Dữ liệu liên kết có cấu trúc
`,
  },

  ur: {
    lang: 'ur',
    filename: 'آف_لائن_چلانے_کی_ہدایات.txt',
    folderFilename: 'فولڈر_ڈھانچے_کی_ہدایات.txt',
    title: '100% آف لائن ویب سائٹ چلانے کی جامع گائیڈ',
    content: `100% آف لائن ویب سائٹ چلانے کی جامع گائیڈ (انٹرنیٹ کے بغیر)
=======================================================
یہ پیکیج اصل سرور یا انٹرنیٹ کنکشن پر انحصار کیے بغیر مکمل طور پر خود مختار چلانے کے لیے تیار کیا گیا ہے۔

۱. ویب سائٹ کو آف لائن کیسے کھولیں:
- کسی بھی جدید براؤزر (Chrome، Firefox، Edge، Safari) میں index.html (یا standalone_offline.html) پر ڈبل کلک کریں۔
- ایئرپلین موڈ یا انٹرنیٹ مکمل طور پر منقطع ہونے کی صورت میں بھی، ویب سائٹ کے تمام CSS اسٹائلز اور لے آؤٹس بالکل اصل کی طرح ظاہر ہوں گے۔

۲. پیکیج میں موجود فائلز:
- index.html: مقامی styles.css اور scripts.js سے منسلک مرکزی صفحہ۔
- standalone_offline.html: سنگل فائل ورژن جس میں تمام تصاویر اور فونٹس Base64 میں سرایت شدہ ہیں۔
- styles.css: بیرونی انحصار سے پاک مکمل CSS اسٹائل شیٹس۔
- scripts.js: جاوا اسکرپٹ کوڈز مع ایئر گیپ شیلڈ (Air-Gap Shield)۔
- pages/: ملٹی پیج کرالنگ موڈ میں ہر صفحے کے لیے مخصوص فولڈرز۔
- reports/: لنکس کی بصری رپورٹ (links_report.html) اور JSON/CSV ڈیٹا۔
- assets/: ڈاؤن لوڈ کردہ میڈیا فائلز اور مینی فیسٹ (assets_manifest.json)۔
- guides/: دنیا کی 20 زبانوں میں ترجمہ شدہ رہنما کتابچے۔
`,
    folderContent: `مخصوص صفحہ فولڈرز کے ساتھ مکمل آف لائن پیکیج
=============================================
📁 فولڈرز کا ڈھانچہ:
├── index.html                    <-- ویب سائٹ کا مرکزی صفحہ
├── styles.css                    <-- مکمل CSS اسٹائل شیٹ
├── scripts.js                    <-- آف لائن جاوا اسکرپٹ فائل
├── standalone_offline.html       <-- سنگل فائل خود مختار ورژن
│
├── pages/                        <-- کرال کیے گئے صفحات کا فولڈر
│   ├── index.html                <-- فہرست اور نیویگیشن مینو
│   └── ...                       <-- مخصوص صفحات کے فولڈرز
│
└── reports/                      <-- رپورٹس اور ڈیٹا
    ├── links_report.html         <-- لنکس کی بصری رپورٹ
    └── links.json                <-- لنکس کا ڈیٹا سیٹ
`,
  },

  bn: {
    lang: 'bn',
    filename: 'অফলাইন_চালানোর_নির্দেশিকা.txt',
    folderFilename: 'ফোল্ডার_কাঠামোর_নির্দেশিকা.txt',
    title: '১০০% সম্পূর্ণ অফলাইন ওয়েবসাইট পরিচালনার নির্দেশিকা',
    content: `১০০% সম্পূর্ণ অফলাইন ওয়েবসাইট পরিচালনার নির্দেশিকা (শূন্য ইন্টারনেট নির্ভরতা)
========================================================================
এই প্যাকেজটি সম্পূর্ণ স্বয়ংসম্পূর্ণ এবং মূল সার্ভার বা কোনো ইন্টারনেট সংযোগ ছাড়াই স্থানীয়ভাবে কার্যকর করার জন্য প্রস্তুত করা হয়েছে।

১. অফলাইনে ওয়েবসাইটটি যেভাবে খুলবেন:
- যেকোনো আধুনিক ব্রাউজারে (Chrome, Firefox, Edge, Safari) index.html (অথবা standalone_offline.html) ফাইলে ডাবল ক্লিক করুন।
- বিমান মোড বা ইন্টারনেট সংযোগ বিচ্ছিন্ন থাকলেও ওয়েবপৃষ্ঠাটি সমস্ত CSS শৈলী, ফন্ট এবং বিন্যাস অক্ষুণ্ন রেখে দৃশ্যমান হবে।

২. প্যাকেজ ফাইল কাঠামো:
- index.html: স্থানীয় styles.css এবং scripts.js এর সাথে সংযুক্ত মূল ওয়েবপৃষ্ঠা।
- standalone_offline.html: একক ফাইল সংস্করণ যেখানে সমস্ত ছবি ও শৈলী Base64 আকারে এম্বেড করা আছে।
- styles.css: দূরবর্তী নির্ভরতামুক্ত সম্পূর্ণ CSS স্টাইলশীট।
- scripts.js: এয়ার-গ্যাপ শিল্ড (Air-Gap Shield) সুরক্ষা স্তরযুক্ত জাভাস্ক্রিপ্ট কোড।
- pages/: একাধিক পৃষ্ঠা ক্রল মোডে প্রতিটি পৃষ্ঠার জন্য নিবেদিত ফোল্ডার।
- reports/: ভিজ্যুয়াল লিঙ্ক রিপোর্ট (links_report.html) এবং JSON/CSV ডেটাসেট।
- assets/: ডাউনলোড করা মিডিয়া ও সম্পদ ম্যানিফেস্ট (assets_manifest.json)।
- guides/: বিশ্বের ২০টি ভাষায় অনূদিত অফলাইন ব্যবহারের নির্দেশিকা।
`,
    folderContent: `প্রতিটি পৃষ্ঠার জন্য আলাদা ফোল্ডারসহ সম্পূর্ণ অফলাইন প্যাকেজ
=========================================================
📁 ফোল্ডারের কাঠামো:
├── index.html                    <-- ওয়েবসাইটের মূল পৃষ্ঠা
├── styles.css                    <-- সম্পূর্ণ CSS স্টাইলশীট
├── scripts.js                    <-- সম্পূর্ণ জাভাস্ক্রিপ্ট স্ক্রিপ্ট
├── standalone_offline.html       <-- সম্পূর্ণ স্বয়ংসম্পূর্ণ একক ফাইল
│
├── pages/                        <-- ক্রল করা পৃষ্ঠাগুলির ফোল্ডার
│   ├── index.html                <-- সূচিপত্র ও নেভিগেশন তালিকা
│   └── ...                       <-- পৃথক পৃষ্ঠার ফোল্ডারসমূহ
│
└── reports/                      <-- রিপোর্ট ও ডেটাসেট
    ├── links_report.html         <-- ভিজ্যুয়াল লিঙ্ক রিপোর্ট
    └── links.json                <-- কাঠামোগত লিঙ্ক ডেটা
`,
  },
};
