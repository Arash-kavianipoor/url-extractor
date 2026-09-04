// Content Script: Extracts live rendered DOM, links, headings, styles, and assets directly from page
(function() {
  function extractPageData() {
    const url = window.location.href;
    const domain = window.location.hostname;
    const title = document.title || domain;
    
    // 1. Extract Anchor Links
    const anchorElements = Array.from(document.querySelectorAll('a[href]'));
    const links = [];
    const seenUrls = new Set();
    
    anchorElements.forEach((el, index) => {
      try {
        const rawHref = el.getAttribute('href');
        if (!rawHref) return;
        
        let absoluteUrl = '';
        try {
          absoluteUrl = new URL(rawHref, window.location.origin).href;
        } catch {
          absoluteUrl = rawHref;
        }
        
        let linkType = 'external';
        if (rawHref.startsWith('#')) {
          linkType = 'anchor';
        } else if (rawHref.startsWith('mailto:')) {
          linkType = 'mailto';
        } else if (rawHref.startsWith('tel:')) {
          linkType = 'other';
        } else if (/\.(pdf|zip|rar|tar|gz|exe|apk|dmg|iso|mp3|mp4|webp|png|jpe?g|svg)$/i.test(absoluteUrl)) {
          linkType = 'asset';
        } else if (absoluteUrl.startsWith(window.location.origin) || absoluteUrl.includes(domain)) {
          linkType = 'internal';
        }
        
        const text = (el.innerText || el.textContent || el.getAttribute('title') || el.getAttribute('aria-label') || '').trim();
        const key = absoluteUrl + '::' + text;
        if (seenUrls.has(key)) return;
        seenUrls.add(key);
        
        const style = window.getComputedStyle(el);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        
        const devices = ['desktop'];
        if (window.innerWidth <= 1024) devices.push('tablet');
        if (window.innerWidth <= 768) devices.push('mobile');
        
        links.push({
          id: 'link-' + (index + 1),
          url: absoluteUrl,
          text: text || '(بدون متن لینک)',
          type: linkType,
          sourceUrl: url,
          devices: devices,
          isVisible: isVisible
        });
      } catch (e) {}
    });

    // 2. Extract Headings (H1-H6)
    const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headings = [];
    const headingsCount = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    headingElements.forEach((el, index) => {
      const level = el.tagName.toLowerCase();
      const text = (el.innerText || el.textContent || '').trim();
      if (headingsCount[level] !== undefined) {
        headingsCount[level]++;
      }
      
      headings.push({
        id: 'h-' + level + '-' + (index + 1),
        level: level,
        text: text || '(تیتر خالی)',
        sourceUrl: url,
        pageTitle: title,
        index: index + 1,
        devices: ['desktop', 'tablet', 'mobile']
      });
    });

    // 3. Extract Stylesheets, CSS Rules & Inline Styles
    const stylesheets = [];
    const directCssRules = [];
    
    try {
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.href) {
            stylesheets.push(sheet.href);
          }
          // Try to read parsed CSS rules directly from DOM CSSOM
          if (sheet.cssRules && sheet.cssRules.length > 0) {
            const rulesText = Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
            if (rulesText) {
              directCssRules.push({
                href: sheet.href || null,
                cssText: rulesText
              });
            }
          }
        } catch (e) {
          // Cross-origin stylesheet security restriction, popup will fetch href directly via extension CORS bypass
        }
      });
    } catch (e) {}

    // Collect inline <style> elements
    const inlineStyles = [];
    document.querySelectorAll('style').forEach((styleEl) => {
      const content = styleEl.textContent || '';
      if (content.trim()) {
        inlineStyles.push(content);
      }
    });

    // 4. Extract Scripts (URLs and inline code)
    const scriptUrls = [];
    const inlineScripts = [];
    const trackerPattern = /(googletagmanager|google-analytics|analytics\.js|recaptcha|facebook\.net|clarity\.ms|hotjar|yandex|doubleclick|pixel|cdn-cgi)/i;

    document.querySelectorAll('script').forEach((scriptEl) => {
      const src = scriptEl.getAttribute('src');
      if (src) {
        try {
          const abs = new URL(src, window.location.origin).href;
          if (!trackerPattern.test(abs)) {
            scriptUrls.push(abs);
          }
        } catch {
          if (!trackerPattern.test(src)) {
            scriptUrls.push(src);
          }
        }
      } else {
        const txt = (scriptEl.textContent || '').trim();
        if (txt && !trackerPattern.test(txt) && !txt.includes('_wpemojiSettings')) {
          inlineScripts.push(txt);
        }
      }
    });

    // 5. Discover ALL Media Assets (Images, Videos, Audio, WebP, PNG, Favicons, Fonts)
    const mediaAssets = [];
    const seenAssetUrls = new Set();

    function addAsset(rawUrl, type) {
      if (!rawUrl || typeof rawUrl !== 'string') return;
      let cleanUrl = rawUrl.trim();
      if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:') || cleanUrl.startsWith('#') || cleanUrl.startsWith('javascript:')) return;
      
      let absUrl = '';
      try {
        absUrl = new URL(cleanUrl, window.location.origin).href;
      } catch {
        return;
      }
      
      if (seenAssetUrls.has(absUrl)) return;
      seenAssetUrls.add(absUrl);
      mediaAssets.push({
        url: absUrl,
        type: type,
        originalSrc: cleanUrl
      });
    }

    // A. Discover from <img> tags
    document.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src');
      const dataSrc = img.getAttribute('data-src') || 
                      img.getAttribute('data-lazy-src') || 
                      img.getAttribute('data-original') || 
                      img.getAttribute('nitro-lazy-src') ||
                      img.getAttribute('data-large_image') ||
                      img.getAttribute('data-full-url');
      if (dataSrc) addAsset(dataSrc, 'image');
      if (src) addAsset(src, 'image');

      // Parse srcset
      const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');
      if (srcset) {
        srcset.split(',').forEach(part => {
          const candidate = part.trim().split(/\s+/)[0];
          if (candidate) addAsset(candidate, 'image');
        });
      }
    });

    // B. Discover from <picture> and <source>
    document.querySelectorAll('picture source').forEach((srcEl) => {
      const srcset = srcEl.getAttribute('srcset') || srcEl.getAttribute('data-srcset');
      if (srcset) {
        srcset.split(',').forEach(part => {
          const candidate = part.trim().split(/\s+/)[0];
          if (candidate) addAsset(candidate, 'image');
        });
      }
    });

    // C. Discover Videos, Audio, and Video Posters
    document.querySelectorAll('video, audio').forEach((media) => {
      const src = media.getAttribute('src');
      if (src) addAsset(src, media.tagName.toLowerCase() === 'video' ? 'video' : 'audio');
      const poster = media.getAttribute('poster');
      if (poster) addAsset(poster, 'image');
    });
    document.querySelectorAll('video source, audio source').forEach((s) => {
      const src = s.getAttribute('src');
      if (src) addAsset(src, 'video');
    });

    // D. Discover background images from inline styles
    document.querySelectorAll('[style*="url("]').forEach((el) => {
      const styleAttr = el.getAttribute('style') || '';
      const matches = styleAttr.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi);
      for (const m of matches) {
        addAsset(m[1], 'image');
      }
    });

    // E. Discover Icons & Favicons
    document.querySelectorAll('link[rel*="icon"], link[rel*="apple-touch"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href) addAsset(href, 'image');
    });

    // F. Discover Media Links in <a> (mp4, webp, png, jpg, gif, svg)
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && /\.(mp4|webm|webp|png|jpe?g|gif|svg)(\?.*)?$/i.test(href)) {
        addAsset(href, href.includes('.mp4') ? 'video' : 'image');
      }
    });

    // 6. Clone and Pre-Sanitize DOM for Offline Packaging
    const clonedDoc = document.documentElement.cloneNode(true);
    
    // Promote lazy-load images to real src
    clonedDoc.querySelectorAll('img').forEach((img) => {
      const lazySrc = img.getAttribute('data-src') || 
                      img.getAttribute('data-lazy-src') || 
                      img.getAttribute('data-original') || 
                      img.getAttribute('nitro-lazy-src') ||
                      img.getAttribute('data-large_image') ||
                      img.getAttribute('data-full-url');
      if (lazySrc) {
        try {
          img.setAttribute('src', new URL(lazySrc, window.location.origin).href);
        } catch {
          img.setAttribute('src', lazySrc);
        }
      } else if (img.getAttribute('src')) {
        try {
          img.setAttribute('src', new URL(img.getAttribute('src'), window.location.origin).href);
        } catch {}
      }
      // Remove lazy indicators so offline browser loads images immediately
      img.removeAttribute('srcset');
      img.removeAttribute('data-srcset');
      img.removeAttribute('sizes');
      img.removeAttribute('loading');
      img.removeAttribute('decoding');
      if (img.classList.contains('lazyload')) img.classList.remove('lazyload');
      if (img.classList.contains('lazyloaded')) img.classList.remove('lazyloaded');
    });

    // Resolve media sources
    clonedDoc.querySelectorAll('video, audio, source').forEach((media) => {
      ['src', 'poster'].forEach((attr) => {
        const val = media.getAttribute(attr);
        if (val) {
          try {
            media.setAttribute(attr, new URL(val, window.location.origin).href);
          } catch {}
        }
      });
    });

    const liveHtml = '<!DOCTYPE html>\n' + clonedDoc.outerHTML;

    return {
      success: true,
      targetUrl: url,
      domain: domain,
      title: title,
      mode: 'single',
      pagesScanned: 1,
      totalLinksFound: links.length,
      internalLinksCount: links.filter(l => l.type === 'internal').length,
      externalLinksCount: links.filter(l => l.type === 'external').length,
      links: links,
      headings: headings,
      totalHeadingsFound: headings.length,
      headingsCount: headingsCount,
      stylesheets: stylesheets,
      directCssRules: directCssRules,
      inlineStyles: inlineStyles,
      scriptUrls: scriptUrls,
      inlineScripts: inlineScripts,
      mediaAssets: mediaAssets,
      files: [
        {
          id: 'file-html-1',
          name: 'index.html',
          type: 'html',
          content: liveHtml,
          size: new Blob([liveHtml]).size,
          sourceUrl: url
        }
      ],
      scannedUrls: [url],
      executionTimeMs: 12
    };
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_PAGE_DATA') {
      const data = extractPageData();
      sendResponse(data);
    }
    return true;
  });
})();
