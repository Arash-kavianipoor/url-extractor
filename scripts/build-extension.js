import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

// Icon generator - generates valid PNG bytes
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA7SURBVHhe7cExAQAAAMKg9U9tCy8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIB3A2WAAAFd4f8EAAAAAElFTkSuQmCC';

const extensionDir = path.resolve(process.cwd(), 'public/extension');
const iconsDir = path.resolve(extensionDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write icons if they don't exist
const pngBuffer = Buffer.from(TINY_PNG_BASE64, 'base64');
['icon16.png', 'icon48.png', 'icon128.png'].forEach((iconName) => {
  const iconPath = path.resolve(iconsDir, iconName);
  if (!fs.existsSync(iconPath)) {
    fs.writeFileSync(iconPath, pngBuffer);
  }
});

// Installation guides
const guideMd = `# راهنمای نصب افزونه Web Scraper & Offline Extractor Pro
## برای گوگل کروم، مایکروسافت اج، بریو و موزیلا فایرفاکس

این اکستنشن به صورت ۱۰۰٪ محلی در مرورگر خود شما اجرا می‌شود؛ به همین دلیل هیچ‌گونه محدودیت ۵۰ ریکوئست، خطای ۵۰۳ کلودفلر، یا قطعی سرور وجود ندارد.
همچنین شامل موتور پیشرفته استخراج ۱۰۰٪ آفلاین (Air-Gap Zero-Network Shield) است که تمام صفحات را حتی پس از قطع کامل اینترنت بدون نقص نمایش می‌دهد.

---

### ۱. نحوه نصب در گوگل کروم (Google Chrome) و مرورگرهای Chromium (Edge, Brave, Opera):
1. فایل زیپ را از حالت فشرده خارج (Extract) کنید.
2. مرورگر کروم را باز کرده و در نوار آدرس عبارت زیر را وارد کنید و Enter بزنید:
   chrome://extensions
3. در گوشه بالا سمت راست، کلید Developer mode (حالت برنامه‌نویس) را روشن کنید.
4. در گوشه بالا سمت چپ، روی دکمه Load unpacked کلیک کنید.
5. پوشه اکستنشن را انتخاب کنید.
6. تمام شد! افزونه فعال شد.

---

### ۲. نحوه نصب در موزیلا فایرفاکس (Mozilla Firefox):
1. فایل زیپ را از حالت فشرده خارج کنید.
2. مرورگر فایرفاکس را باز کرده و در نوار آدرس عبارت زیر را وارد کنید:
   about:debugging#/runtime/this-firefox
3. در بخش Temporary Extensions روی دکمه Load Temporary Add-on... کلیک کنید.
4. فایل manifest.json درون پوشه اکستنشن را انتخاب کنید.
5. افزونه فعال شد!
`;

fs.writeFileSync(path.resolve(extensionDir, 'INSTALLATION_GUIDE.md'), guideMd);
fs.writeFileSync(path.resolve(extensionDir, 'راهنمای_نصب.txt'), guideMd);

console.log('Packaging extension files from public/extension into zip...');
const zip = new JSZip();

function addDirToZip(dirPath, zipFolder) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.resolve(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const subFolder = zipFolder.folder(file);
      addDirToZip(fullPath, subFolder);
    } else {
      const content = fs.readFileSync(fullPath);
      zipFolder.file(file, content);
    }
  }
}

addDirToZip(extensionDir, zip);

zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }).then((buffer) => {
  const publicOut = path.resolve(process.cwd(), 'public/web-scraper-extension.zip');
  fs.writeFileSync(publicOut, buffer);
  console.log(`Successfully created ${publicOut} (${buffer.length} bytes)`);

  const distDir = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    const distOut = path.resolve(distDir, 'web-scraper-extension.zip');
    fs.writeFileSync(distOut, buffer);
    console.log(`Successfully copied to ${distOut}`);
  }
});
