// Popup logic running inside the Chrome & Firefox extension
// Reference core implementation with Live Preview, Code Editor, Multi-Device and Full-Site support

let currentScrapeResult = null;
let currentMode = 'single'; // 'single' | 'all'
let currentDevice = 'desktop'; // 'desktop' | 'tablet' | 'mobile'
let currentTheme = 'dark';
let currentLang = 'fa';

// Virtual Filesystem: Holds in-memory files for editing, previewing, and ZIP bundling
let virtualFiles = [];
let originalFiles = [];
let activeEditorFileName = 'index.html';
let previewDevice = 'desktop';

// Offline binary assets storage (media, images, videos, fonts)
let currentOfflineAssets = []; // [{ path: string, data: ArrayBuffer, size: number }]
let totalDownloadedAssetBytes = 0;

// Bilingual translations dictionary
const I18N = {
  fa: {
    appTitle: 'Web Scraper Pro',
    appSubtitle: 'اکستنشن مرورگر | استخراج ۱۰۰٪ آفلاین، پیش‌نمایش زنده و ویرایشگر کد',
    tabLabel: 'صفحه فعال در تب مرورگر:',
    detectingTab: 'در حال شناسایی تب جاری...',
    modeLabel: 'حالت استخراج:',
    singlePage: 'تک‌صفحه',
    allPages: 'کل سایت (چندصفحه‌ای)',
    deviceLabel: 'دستگاه:',
    btnExtract: 'استخراج آنی صفحه فعال (۰ میلی‌ثانیه)',
    btnExtractLoading: 'در حال استخراج مستقیم DOM...',
    btnExtractCrawling: 'در حال خزش پیوندهای داخلی دامنه...',
    btnExtractSuccess: '✓ استخراج با موفقیت انجام شد',
    statLinks: 'کل لینک‌ها',
    statInternal: 'داخلی',
    statExternal: 'خارجی',
    statHeadings: 'تیترها (H1-H6)',
    statTime: 'زمان محلی',
    tabLinks: 'لینک‌ها',
    tabHeadings: 'تیترها (H1-H6)',
    tabPreview: '👁️ پیش‌نمایش زنده',
    tabEditor: '💻 ویرایشگر کد',
    tabExport: 'خروجی اکسل و CSV',
    tabOffline: 'دانلود سایت آفلاین (ZIP)',
    searchPlaceholder: 'جستجو در انکر تکست یا آدرس URL...',
    allTypes: 'همه انواع لینک',
    internalOnly: 'فقط لینک‌های داخلی',
    externalOnly: 'فقط لینک‌های خارجی',
    assetOnly: 'فایل‌ها و مدیا',
    anchorOnly: 'انکرهای درون‌صفحه‌ای (#)',
    allDevices: 'همه دستگاه‌ها',
    copySuccess: 'آدرس کپی شد!',
    applySuccess: 'تغییرات با موفقیت اعمال و در پیش‌نمایش زنده بروزرسانی شد!',
    resetConfirm: 'آیا مایلید تمام تغییرات این فایل به نسخه اولیه بازگردد؟'
  },
  en: {
    appTitle: 'Web Scraper Pro',
    appSubtitle: 'Browser Extension | 100% Offline Extractor, Live Preview & Code Editor',
    tabLabel: 'Active Tab in Browser:',
    detectingTab: 'Identifying active browser tab...',
    modeLabel: 'Crawl Mode:',
    singlePage: 'Single Page',
    allPages: 'Full Site (Multi-Page)',
    deviceLabel: 'Device:',
    btnExtract: 'Extract Active Page Now (0 ms)',
    btnExtractLoading: 'Extracting DOM directly...',
    btnExtractCrawling: 'Crawling internal site links...',
    btnExtractSuccess: '✓ Extraction Completed Successfully',
    statLinks: 'Total Links',
    statInternal: 'Internal',
    statExternal: 'External',
    statHeadings: 'Headings (H1-H6)',
    statTime: 'Local Time',
    tabLinks: 'Links',
    tabHeadings: 'Headings (H1-H6)',
    tabPreview: '👁️ Live Preview',
    tabEditor: '💻 Code Editor',
    tabExport: 'Excel & CSV Export',
    tabOffline: 'Offline Website (ZIP)',
    searchPlaceholder: 'Search anchor text or URL...',
    allTypes: 'All Link Types',
    internalOnly: 'Internal Links Only',
    externalOnly: 'External Links Only',
    assetOnly: 'Files & Media',
    anchorOnly: 'Page Anchors (#)',
    allDevices: 'All Devices',
    copySuccess: 'URL copied to clipboard!',
    applySuccess: 'Changes applied and live preview updated successfully!',
    resetConfirm: 'Are you sure you want to reset this file to its original state?'
  }
};

// Early Air-Gap Shield: Executed at the very top of <head> inside index.html to eliminate all ReferenceErrors
const OFFLINE_AIRGAP_EARLY_CODE = `(function() {
  'use strict';
  // 1. Silent Safe Mock for fetch API
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    return new Promise(function(resolve) {
      if (url.includes('.json') || (init && init.headers && String(init.headers['Accept'] || '').includes('json'))) {
        resolve(new Response(JSON.stringify({ status: 'ok', offline: true, data: [] }), {
          status: 200,
          statusText: 'OK (Offline Air-Gap)',
          headers: { 'Content-Type': 'application/json' }
        }));
      } else {
        resolve(new Response('', {
          status: 200,
          statusText: 'OK (Offline Air-Gap)',
          headers: { 'Content-Type': 'text/plain' }
        }));
      }
    });
  };

  // 2. Mock XMLHttpRequest
  if (typeof window.XMLHttpRequest !== 'undefined') {
    var OrigXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      var xhr = new OrigXHR();
      var _open = xhr.open;
      xhr.open = function() { try { return _open.apply(xhr, arguments); } catch(e){} };
      xhr.send = function() {
        setTimeout(function() {
          try {
            Object.defineProperty(xhr, 'readyState', { value: 4, writable: true });
            Object.defineProperty(xhr, 'status', { value: 200, writable: true });
            Object.defineProperty(xhr, 'statusText', { value: 'OK (Offline Air-Gap)', writable: true });
            Object.defineProperty(xhr, 'responseText', { value: '{}', writable: true });
            Object.defineProperty(xhr, 'response', { value: '{}', writable: true });
            if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
            if (typeof xhr.onload === 'function') xhr.onload();
          } catch(e){}
        }, 1);
      };
      return xhr;
    };
  }

  // 3. Dynamic Script Element Neutralizer: blocks dynamic remote script tags from trying to load offline
  var origCreateElement = document.createElement;
  document.createElement = function(tagName, options) {
    var elem = origCreateElement.call(document, tagName, options);
    var tag = (tagName || '').toLowerCase();
    if (tag === 'script') {
      var origSetAttr = elem.setAttribute;
      elem.setAttribute = function(name, val) {
        if (name && name.toLowerCase() === 'src' && typeof val === 'string' && (val.indexOf('//') !== -1 || val.indexOf('http') === 0)) {
          return origSetAttr.call(elem, 'data-blocked-offline-src', val);
        }
        return origSetAttr.call(elem, name, val);
      };
    }
    return elem;
  };

  // 4. Universal CMS and Framework Stubs (WP, Elementor, Analytics, GTag, WooCommerce)
  window.wp = window.wp || {};
  window.wp.i18n = window.wp.i18n || {
    setLocaleData: function() {},
    __: function(s) { return s; },
    _x: function(s) { return s; },
    _n: function(s, p, n) { return n === 1 ? s : p; },
    isRtl: function() { return true; }
  };
  window.wp.hooks = window.wp.hooks || {
    addAction: function() {},
    doAction: function() {},
    addFilter: function() {},
    applyFilters: function(hook, val) { return val; },
    removeAction: function() {},
    removeFilter: function() {}
  };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function() {};
  window.fbq = window.fbq || function() {};
  window.ga = window.ga || function() {};
  window.elementorFrontendConfig = window.elementorFrontendConfig || { isEditMode: false, isMobile: false, environmentMode: { edit: false, wpPreview: false } };
  window.ElementorProFrontendConfig = window.ElementorProFrontendConfig || {};
  window.woocommerce_params = window.woocommerce_params || { ajax_url: '#' };
  window.wc_cart_fragments_params = window.wc_cart_fragments_params || { ajax_url: '#' };

  // 5. Universal jQuery Instant Engine & Callback Queue
  if (typeof window.jQuery === 'undefined' && typeof window.$ === 'undefined') {
    var _readyCallbacks = [];
    var jq = function(selector) {
      if (typeof selector === 'function') {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setTimeout(function() { try { selector(window.jQuery || jq); } catch(e){} }, 1);
        } else {
          _readyCallbacks.push(selector);
        }
        return jq;
      }
      var elements = [];
      if (typeof selector === 'string') {
        try { elements = Array.prototype.slice.call(document.querySelectorAll(selector)); } catch(e){}
      } else if (selector && selector.nodeType) {
        elements = [selector];
      } else if (Array.isArray(selector)) {
        elements = selector;
      }
      var instance = Object.create(jq.fn);
      for (var i = 0; i < elements.length; i++) instance[i] = elements[i];
      instance.length = elements.length;
      return instance;
    };
    jq.fn = jq.prototype = {
      length: 0,
      ready: function(fn) { return jq(fn); },
      each: function(cb) { for(var i=0; i<this.length; i++) { cb.call(this[i], i, this[i]); } return this; },
      on: function(evt, sel, handler) {
        var h = typeof sel === 'function' ? sel : handler;
        if (h) {
          this.each(function() {
            var names = (evt || '').split(' ');
            var el = this;
            names.forEach(function(n) {
              var clean = n.split('.')[0];
              if (clean) {
                el.addEventListener(clean, function(e) {
                  try { h.call(el, e); } catch(err){}
                });
              }
            });
          });
        }
        return this;
      },
      off: function() { return this; },
      bind: function(e, h) { return this.on(e, h); },
      trigger: function(evt) {
        this.each(function() {
          var ev = new Event(evt.split('.')[0], { bubbles: true });
          this.dispatchEvent(ev);
        });
        return this;
      },
      click: function(fn) { return fn ? this.on('click', fn) : this.trigger('click'); },
      find: function(sel) {
        var res = [];
        this.each(function() {
          try { res = res.concat(Array.prototype.slice.call(this.querySelectorAll(sel))); } catch(e){}
        });
        return jq(res);
      },
      parent: function() { var res = []; this.each(function() { if (this.parentNode && !res.includes(this.parentNode)) res.push(this.parentNode); }); return jq(res); },
      children: function() { var res = []; this.each(function() { res = res.concat(Array.prototype.slice.call(this.children)); }); return jq(res); },
      closest: function(sel) {
        var res = [];
        this.each(function() {
          var el = this;
          while (el && el.matches) {
            if (el.matches(sel)) { res.push(el); break; }
            el = el.parentElement;
          }
        });
        return jq(res);
      },
      addClass: function(cls) { this.each(function() { (cls || '').split(' ').forEach(function(c){ if(c) this.classList.add(c); }.bind(this)); }); return this; },
      removeClass: function(cls) { this.each(function() { (cls || '').split(' ').forEach(function(c){ if(c) this.classList.remove(c); }.bind(this)); }); return this; },
      toggleClass: function(cls) { this.each(function() { (cls || '').split(' ').forEach(function(c){ if(c) this.classList.toggle(c); }.bind(this)); }); return this; },
      hasClass: function(cls) { return this[0] ? this[0].classList.contains(cls) : false; },
      css: function(prop, val) {
        if (typeof prop === 'object') {
          this.each(function() { for (var k in prop) { this.style[k] = prop[k]; } });
        } else if (val !== undefined) {
          this.each(function() { this.style[prop] = val; });
        } else {
          return this[0] ? getComputedStyle(this[0])[prop] : '';
        }
        return this;
      },
      attr: function(k, v) {
        if (v !== undefined) { this.each(function() { this.setAttribute(k, v); }); return this; }
        return this[0] ? this[0].getAttribute(k) : null;
      },
      removeAttr: function(k) { this.each(function() { this.removeAttribute(k); }); return this; },
      prop: function(k, v) {
        if (v !== undefined) { this.each(function() { this[k] = v; }); return this; }
        return this[0] ? this[0][k] : undefined;
      },
      val: function(v) {
        if (v !== undefined) { this.each(function() { this.value = v; }); return this; }
        return this[0] ? this[0].value : '';
      },
      html: function(h) {
        if (h !== undefined) { this.each(function() { this.innerHTML = h; }); return this; }
        return this[0] ? this[0].innerHTML : '';
      },
      text: function(t) {
        if (t !== undefined) { this.each(function() { this.textContent = t; }); return this; }
        return this[0] ? this[0].textContent : '';
      },
      append: function(content) {
        this.each(function() {
          if (typeof content === 'string') this.insertAdjacentHTML('beforeend', content);
          else if (content && content.nodeType) this.appendChild(content);
        });
        return this;
      },
      prepend: function(content) {
        this.each(function() {
          if (typeof content === 'string') this.insertAdjacentHTML('afterbegin', content);
          else if (content && content.nodeType) this.insertBefore(content, this.firstChild);
        });
        return this;
      },
      show: function() { this.each(function() { this.style.display = ''; }); return this; },
      hide: function() { this.each(function() { this.style.display = 'none'; }); return this; },
      fadeIn: function() { return this.show(); },
      fadeOut: function() { return this.hide(); },
      slideDown: function() { return this.show(); },
      slideUp: function() { return this.hide(); },
      animate: function() { return this; }
    };
    jq.ajax = function(opts) { if (opts && opts.success) setTimeout(opts.success, 5); return jq; };
    jq.get = jq.post = jq.getJSON = function(url, data, cb) {
      var fn = typeof data === 'function' ? data : cb;
      if (fn) setTimeout(function() { fn({}); }, 5);
      return jq;
    };
    jq.extend = function() {
      var target = arguments[0] || {};
      for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i];
        if (src) { for (var k in src) target[k] = src[k]; }
      }
      return target;
    };
    jq.each = function(obj, cb) {
      if (Array.isArray(obj)) { for (var i = 0; i < obj.length; i++) cb(i, obj[i]); }
      else if (obj) { for (var k in obj) cb(k, obj[k]); }
      return obj;
    };
    jq.isFunction = function(f) { return typeof f === 'function'; };
    jq.isArray = Array.isArray;
    jq.noop = function() {};
    jq.trim = function(s) { return (s || '').trim(); };
    window.jQuery = window.$ = jq;

    // Flush callbacks on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
      while (_readyCallbacks.length > 0) {
        var cb = _readyCallbacks.shift();
        try { cb(jq); } catch(e){}
      }
    });
  }

  // 6. Global Uncaught Error Suppression (Air-Gap Zero-Crash)
  window.addEventListener('error', function(e) { e.preventDefault(); }, true);
  window.addEventListener('unhandledrejection', function(e) { e.preventDefault(); });
})();`;

// The Air-Gap Zero-Network Runtime Shield to guarantee zero crashes offline
const OFFLINE_AIRGAP_SHIELD = `/* ========================================================================
   OFFLINE AIR-GAP RUNTIME SHIELD & ZERO-NETWORK MOCK ENGINE
   - Intercepts and safely resolves fetch & XMLHttpRequest to prevent crashes
   - Universal CMS/Framework stubs (WordPress, Elementor, Analytics)
   - Universal jQuery shim & callback queue for zero reference errors
   - Dynamic script element neutralizer (blocks remote script injection)
   - Stubs WebSocket and EventSource gracefully
   - Suppresses unhandled network rejection errors
   - Rescues broken runtime images with zero external dependencies
======================================================================== */
(function() {
  'use strict';

  // 1. Silent Safe Mock for fetch API
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    return new Promise(function(resolve) {
      if (url.includes('.json') || (init && init.headers && String(init.headers['Accept'] || '').includes('json'))) {
        resolve(new Response(JSON.stringify({ status: 'ok', offline: true, data: [] }), {
          status: 200,
          statusText: 'OK (Offline Air-Gap)',
          headers: { 'Content-Type': 'application/json' }
        }));
      } else {
        resolve(new Response('', {
          status: 200,
          statusText: 'OK (Offline Air-Gap)',
          headers: { 'Content-Type': 'text/plain' }
        }));
      }
    });
  };

  // 2. Mock XMLHttpRequest
  if (typeof window.XMLHttpRequest !== 'undefined') {
    var OrigXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      var xhr = new OrigXHR();
      var _open = xhr.open;
      var _send = xhr.send;
      var targetUrl = '';
      xhr.open = function(method, url) {
        targetUrl = url;
        try { return _open.apply(xhr, arguments); } catch(e) {}
      };
      xhr.send = function(body) {
        setTimeout(function() {
          try {
            Object.defineProperty(xhr, 'readyState', { value: 4, writable: true });
            Object.defineProperty(xhr, 'status', { value: 200, writable: true });
            Object.defineProperty(xhr, 'statusText', { value: 'OK (Offline Air-Gap)', writable: true });
            Object.defineProperty(xhr, 'responseText', { value: '{}', writable: true });
            Object.defineProperty(xhr, 'response', { value: '{}', writable: true });
            if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange();
            if (typeof xhr.onload === 'function') xhr.onload();
          } catch(e) {}
        }, 10);
      };
      return xhr;
    };
  }

  // 3. Dynamic Script Element Neutralizer: blocks dynamic remote script tags from trying to load offline
  var origCreateElement = document.createElement;
  document.createElement = function(tagName, options) {
    var elem = origCreateElement.call(document, tagName, options);
    if (tagName && String(tagName).toLowerCase() === 'script') {
      var origSetAttr = elem.setAttribute;
      elem.setAttribute = function(name, val) {
        if (name && name.toLowerCase() === 'src' && typeof val === 'string' && (val.indexOf('//') !== -1 || val.indexOf('http') === 0)) {
          return origSetAttr.call(elem, 'data-blocked-offline-src', val);
        }
        return origSetAttr.call(elem, name, val);
      };
    }
    return elem;
  };

  // 4. Universal CMS and Framework Stubs (WP, Elementor, Analytics, GTag)
  window.wp = window.wp || {};
  window.wp.i18n = window.wp.i18n || {
    setLocaleData: function() {},
    __: function(s) { return s; },
    _x: function(s) { return s; },
    _n: function(s, p, n) { return n === 1 ? s : p; },
    isRtl: function() { return true; }
  };
  window.wp.hooks = window.wp.hooks || {
    addAction: function() {},
    doAction: function() {},
    addFilter: function() {},
    applyFilters: function(hook, val) { return val; },
    removeAction: function() {},
    removeFilter: function() {}
  };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function() {};
  window.fbq = window.fbq || function() {};
  window.ga = window.ga || function() {};
  window.elementorFrontendConfig = window.elementorFrontendConfig || {};
  window.ElementorProFrontendConfig = window.ElementorProFrontendConfig || {};

  // 5. Universal jQuery Shim & Callback Queue
  if (typeof window.jQuery === 'undefined' && typeof window.$ === 'undefined') {
    var _jqQ = [];
    var jqStub = function(arg) {
      if (typeof arg === 'function') {
        if (document.readyState === 'complete') {
          setTimeout(function() { try { if (window.jQuery && window.jQuery !== jqStub) window.jQuery(arg); else arg(jqStub); } catch(e){} }, 1);
        } else {
          _jqQ.push(arg);
        }
        return jqStub;
      }
      var dummy = {
        ready: function(fn) { if (fn) _jqQ.push(fn); return dummy; },
        on: function() { return dummy; },
        off: function() { return dummy; },
        bind: function() { return dummy; },
        trigger: function() { return dummy; },
        click: function() { return dummy; },
        change: function() { return dummy; },
        css: function() { return dummy; },
        addClass: function() { return dummy; },
        removeClass: function() { return dummy; },
        toggleClass: function() { return dummy; },
        attr: function() { return ''; },
        prop: function() { return false; },
        val: function() { return ''; },
        html: function() { return dummy; },
        text: function() { return dummy; },
        append: function() { return dummy; },
        prepend: function() { return dummy; },
        find: function() { return dummy; },
        children: function() { return dummy; },
        parent: function() { return dummy; },
        closest: function() { return dummy; },
        each: function() { return dummy; },
        animate: function() { return dummy; },
        fadeIn: function() { return dummy; },
        fadeOut: function() { return dummy; },
        slideUp: function() { return dummy; },
        slideDown: function() { return dummy; },
        hide: function() { return dummy; },
        show: function() { return dummy; },
        length: 0
      };
      return dummy;
    };
    jqStub.fn = jqStub.prototype = {};
    jqStub.ajax = function(opts) {
      if (opts && typeof opts.success === 'function') setTimeout(opts.success, 10);
      return jqStub;
    };
    jqStub.get = jqStub.post = jqStub.getJSON = function(url, data, success) {
      var cb = typeof data === 'function' ? data : success;
      if (cb) setTimeout(function() { cb({}); }, 10);
      return jqStub;
    };
    jqStub.extend = function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i];
        for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
      }
      return target;
    };
    window.jQuery = window.$ = jqStub;
    window.__flushJqQueue = function() {
      while (_jqQ.length) {
        var fn = _jqQ.shift();
        try { fn(window.jQuery); } catch(e) {}
      }
    };
    if (document.readyState === 'complete') {
      window.__flushJqQueue();
    } else {
      window.addEventListener('load', window.__flushJqQueue);
    }
  }

  // 6. Universal WebSocket and EventSource Stubs
  if (typeof window.WebSocket !== 'undefined') {
    var OrigWS = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      var ws = {
        url: url,
        readyState: 3, // CLOSED
        send: function() {},
        close: function() {},
        addEventListener: function() {},
        removeEventListener: function() {}
      };
      return ws;
    };
  }

  // 7. Image Error Rescuer
  window.addEventListener('error', function(e) {
    if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
      var img = e.target;
      if (!img.getAttribute('data-offline-rescued')) {
        img.setAttribute('data-offline-rescued', 'true');
        img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%23f1f5f9"/><path d="M110 100 L135 70 L160 100 L175 85 L200 115 Z" fill="%2394a3b8"/><circle cx="130" cy="55" r="10" fill="%23cbd5e1"/><text x="150" y="145" font-family="sans-serif" font-size="11" fill="%2364748b" text-anchor="middle">تصویر آفلاین ذخیره شده</text></svg>';
      }
    }
  }, true);

  // 8. Suppress Unhandled Rejection caused by offline network drops
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && (event.reason.name === 'TypeError' || String(event.reason).includes('fetch') || String(event.reason).includes('Network'))) {
      event.preventDefault();
    }
  });
})();
`;

// Initial Bootstrap
document.addEventListener('DOMContentLoaded', async () => {
  // Check if opened with ?fullscreen=1
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('fullscreen') === '1' || window.innerWidth > 900) {
    document.body.classList.add('fullscreen');
  }

  // Load saved preferences
  try {
    const savedTheme = localStorage.getItem('ext_theme') || 'dark';
    setTheme(savedTheme);

    const savedLang = localStorage.getItem('ext_lang') || 'fa';
    setLanguage(savedLang);
  } catch (e) {}

  const activeTabTitle = document.getElementById('active-tab-title');
  const activeTabUrl = document.getElementById('active-tab-url');
  const btnExtract = document.getElementById('btn-extract-active');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  const btnToggleLang = document.getElementById('btn-toggle-lang');

  // Query active tab in browser
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs[0]) {
      const tab = tabs[0];
      activeTabTitle.textContent = tab.title || 'صفحه ناشناس';
      activeTabUrl.textContent = tab.url || '-';
    }
  } catch (err) {
    activeTabTitle.textContent = 'خطا در دسترسی به تب فعال';
  }

  // Header button handlers
  btnToggleTheme.addEventListener('click', () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  btnToggleLang.addEventListener('click', () => {
    setLanguage(currentLang === 'fa' ? 'en' : 'fa');
  });

  btnFullscreen.addEventListener('click', () => {
    if (document.body.classList.contains('fullscreen')) {
      document.body.classList.remove('fullscreen');
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?fullscreen=1') });
    }
  });

  // Crawl Mode segmented buttons
  document.querySelectorAll('.mode-selector .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-selector .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode || 'single';
    });
  });

  // Device selector buttons
  document.querySelectorAll('.device-selector .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.device-selector .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDevice = btn.dataset.device || 'desktop';
      renderLinksTable();
    });
  });

  // Main Extract button
  btnExtract.addEventListener('click', () => {
    extractActiveTab();
  });

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.remove('hidden');

      if (btn.dataset.tab === 'tab-preview') {
        renderLivePreview();
      } else if (btn.dataset.tab === 'tab-editor') {
        renderCodeEditor();
      }
    });
  });

  // Live Preview Device Switcher
  document.querySelectorAll('.preview-dev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preview-dev-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      previewDevice = btn.dataset.pdev || 'desktop';
      updatePreviewFrameSize();
    });
  });

  document.getElementById('btn-reload-preview').addEventListener('click', () => {
    renderLivePreview();
  });

  document.getElementById('btn-open-preview-window').addEventListener('click', () => {
    openPreviewInNewWindow();
  });

  // Code Editor Actions
  document.getElementById('btn-apply-code-changes').addEventListener('click', () => {
    applyCodeChanges();
  });

  document.getElementById('btn-download-active-file').addEventListener('click', () => {
    downloadActiveEditorFile();
  });

  document.getElementById('btn-reset-code-changes').addEventListener('click', () => {
    resetActiveEditorFile();
  });

  // Search & Filter Links
  const searchInput = document.getElementById('search-links');
  const filterType = document.getElementById('filter-link-type');
  const filterDevice = document.getElementById('filter-link-device');
  if (searchInput && filterType) {
    searchInput.addEventListener('input', renderLinksTable);
    filterType.addEventListener('change', renderLinksTable);
    if (filterDevice) filterDevice.addEventListener('change', renderLinksTable);
  }

  // Headings checkboxes
  document.querySelectorAll('.heading-filter').forEach(cb => {
    cb.addEventListener('change', renderHeadingsTable);
  });

  // Export Buttons
  document.getElementById('btn-download-structured-csv').addEventListener('click', () => {
    exportStructuredCsv();
  });
  document.getElementById('btn-download-json').addEventListener('click', () => {
    exportJson();
  });
  document.getElementById('btn-quick-export-links').addEventListener('click', () => {
    exportStructuredCsv('links');
  });

  // Offline Packager Buttons
  document.getElementById('btn-download-offline-zip').addEventListener('click', () => {
    downloadOfflineZip();
  });
  document.getElementById('btn-download-standalone-html').addEventListener('click', () => {
    downloadStandaloneHtml();
  });
  document.getElementById('btn-download-all-devices').addEventListener('click', () => {
    downloadAllDevicesZip();
  });
  document.getElementById('btn-download-visual-report').addEventListener('click', () => {
    downloadVisualReportHtml();
  });
});

// Theme Toggle
function setTheme(theme) {
  currentTheme = theme;
  try { localStorage.setItem('ext_theme', theme); } catch (e) {}

  const darkIcon = document.getElementById('theme-icon-dark');
  const lightIcon = document.getElementById('theme-icon-light');

  if (theme === 'light') {
    document.body.classList.add('light');
    if (darkIcon) darkIcon.classList.add('hidden');
    if (lightIcon) lightIcon.classList.remove('hidden');
  } else {
    document.body.classList.remove('light');
    if (darkIcon) darkIcon.classList.remove('hidden');
    if (lightIcon) lightIcon.classList.add('hidden');
  }
}

// Language Toggle
function setLanguage(lang) {
  currentLang = lang;
  try { localStorage.setItem('ext_lang', lang); } catch (e) {}

  const indicator = document.getElementById('lang-indicator');
  if (indicator) indicator.textContent = lang === 'fa' ? 'EN' : 'فا';

  const t = I18N[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  if (lang === 'fa') {
    document.body.dir = 'rtl';
  } else {
    document.body.dir = 'ltr';
  }

  // Translate labels
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('i18n-app-title', t.appTitle);
  setText('i18n-app-subtitle', t.appSubtitle);
  setText('i18n-tab-label', t.tabLabel);
  setText('i18n-mode-label', t.modeLabel);
  setText('i18n-single-page', t.singlePage);
  setText('i18n-all-pages', t.allPages);
  setText('i18n-device-label', t.deviceLabel);
  setText('btn-extract-label', t.btnExtract);
  setText('i18n-stat-links', t.statLinks);
  setText('i18n-stat-internal', t.statInternal);
  setText('i18n-stat-external', t.statExternal);
  setText('i18n-stat-headings', t.statHeadings);
  setText('i18n-stat-time', t.statTime);
  setText('i18n-tab-links', t.tabLinks);
  setText('i18n-tab-headings', t.tabHeadings);
  setText('i18n-tab-preview', t.tabPreview);
  setText('i18n-tab-editor', t.tabEditor);
  setText('i18n-tab-export', t.tabExport);
  setText('i18n-tab-offline', t.tabOffline);

  const searchInput = document.getElementById('search-links');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;
}

// Extract Active Tab DOM and optionally crawl internal links
async function extractActiveTab() {
  const btnExtract = document.getElementById('btn-extract-active');
  const btnLabel = document.getElementById('btn-extract-label');
  const progressBox = document.getElementById('extraction-progress');
  const progressText = document.getElementById('extraction-progress-text');
  const t = I18N[currentLang];

  btnExtract.disabled = true;
  if (btnLabel) btnLabel.textContent = currentMode === 'all' ? t.btnExtractCrawling : t.btnExtractLoading;
  if (progressBox) progressBox.classList.remove('hidden');

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || !tabs[0] || !tabs[0].id) {
      alert('تب فعالی برای استخراج یافت نشد.');
      btnExtract.disabled = false;
      if (btnLabel) btnLabel.textContent = t.btnExtract;
      if (progressBox) progressBox.classList.add('hidden');
      return;
    }

    const tabId = tabs[0].id;
    chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_PAGE_DATA' }, async (response) => {
      if (chrome.runtime.lastError || !response) {
        // Fallback: inject content script dynamically
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content_script.js']
        }, () => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_PAGE_DATA' }, async (retryResponse) => {
              await handleExtractionData(retryResponse);
            });
          }, 150);
        });
      } else {
        await handleExtractionData(response);
      }
    });
  } catch (err) {
    alert('خطا در استخراج: ' + err.message);
    btnExtract.disabled = false;
    if (btnLabel) btnLabel.textContent = t.btnExtract;
    if (progressBox) progressBox.classList.add('hidden');
  }
}

async function handleExtractionData(data) {
  const btnExtract = document.getElementById('btn-extract-active');
  const btnLabel = document.getElementById('btn-extract-label');
  const progressBox = document.getElementById('extraction-progress');
  const progressText = document.getElementById('extraction-progress-text');
  const t = I18N[currentLang];

  if (!data || !data.success) {
    alert('استخراج محتوا امکان‌پذیر نشد.');
    btnExtract.disabled = false;
    if (btnLabel) btnLabel.textContent = t.btnExtract;
    if (progressBox) progressBox.classList.add('hidden');
    return;
  }

  currentScrapeResult = data;

  // If Full Site Crawl mode is selected, discover and fetch internal links
  let crawledPages = [];
  if (currentMode === 'all' && data.links && data.links.length > 0) {
    progressText.textContent = 'در حال خزش صفحات داخلی دامنه...';
    const internalLinks = data.links.filter(l => l.type === 'internal' && l.url !== data.url && !l.url.includes('#'));
    const uniqueInternalUrls = Array.from(new Set(internalLinks.map(l => l.url))).slice(0, 6); // crawl top internal pages safely

    for (let i = 0; i < uniqueInternalUrls.length; i++) {
      const pageUrl = uniqueInternalUrls[i];
      progressText.textContent = `در حال خزش صفحه داخلی (${i + 1}/${uniqueInternalUrls.length}): ${pageUrl.substring(0, 40)}...`;
      try {
        const resp = await fetch(pageUrl);
        if (resp.ok) {
          const htmlText = await resp.text();
          const doc = new DOMParser().parseFromString(htmlText, 'text/html');
          const pageTitle = doc.title || `صفحه ${i + 1}`;
          crawledPages.push({
            url: pageUrl,
            title: pageTitle,
            html: htmlText
          });
        }
      } catch (e) {}
    }
  }

  currentScrapeResult.crawledPages = crawledPages;

  // Build the complete offline bundle files and store in virtualFiles
  progressText.textContent = 'در حال کامپایل استایل‌ها و راه‌اندازی سپر دفاعی آفلاین...';
  const bundled = await processAndBundleOffline(currentScrapeResult, (msg) => {
    progressText.textContent = msg;
  });

  // Generate visual links report
  const reportHtml = generateVisualLinksReportHtml(
    currentScrapeResult.links || [],
    currentScrapeResult.headings || [],
    currentScrapeResult.domain || 'offline_site',
    currentScrapeResult.executionTimeMs || 0
  );

  // Generate CSV summary
  const csvRows = [
    ['Type', 'Text', 'URL', 'Devices'],
    ...(currentScrapeResult.links || []).map(l => ['Link', l.text, l.url, (l.devices || []).join('; ')]),
    ...(currentScrapeResult.headings || []).map(h => ['Heading (' + h.level + ')', h.text, '', 'Universal'])
  ];
  const csvString = '\uFEFF' + csvRows.map(r => r.map(c => '"' + String(c || '').replace(/"/g, '""') + '"').join(',')).join('\r\n');

  // Initialize virtualFiles
  virtualFiles = [
    { name: 'index.html', content: bundled.indexHtml, type: 'html' },
    { name: 'styles.css', content: bundled.stylesCss, type: 'css' },
    { name: 'scripts.js', content: bundled.scriptsJs, type: 'js' },
    { name: 'standalone_offline.html', content: bundled.standaloneHtml, type: 'html' },
    { name: 'assets/assets_manifest.json', content: bundled.manifestJson || '{}', type: 'json' },
    { name: 'reports/links_report.html', content: reportHtml, type: 'html' },
    { name: 'data_summary.csv', content: csvString, type: 'csv' },
    { name: 'scraped_dataset.json', content: JSON.stringify(currentScrapeResult, null, 2), type: 'json' }
  ];

  // If crawled pages exist, add them into virtualFiles
  if (crawledPages.length > 0) {
    crawledPages.forEach((cp, idx) => {
      const pageIndex = (idx + 1).toString().padStart(2, '0');
      let baseSlug = (new URL(cp.url).pathname.replace(/[^a-zA-Z0-9_-]/g, '_') || 'page').slice(-20);
      virtualFiles.push({
        name: `pages/${pageIndex}_${baseSlug}/index.html`,
        content: cleanHtmlForPage(cp.html, bundled.stylesCss, bundled.scriptsJs),
        type: 'html'
      });
    });

    // Add navigation hub for pages
    const pagesDirectoryHtml = generatePagesIndexHub(currentScrapeResult.domain, crawledPages);
    virtualFiles.push({
      name: 'pages/index.html',
      content: pagesDirectoryHtml,
      type: 'html'
    });
  }

  // Deep clone to originalFiles for resetting
  originalFiles = JSON.parse(JSON.stringify(virtualFiles));

  // Reveal Stats & Navigation Tabs
  document.getElementById('stats-section').classList.remove('hidden');
  document.getElementById('tabs-nav').classList.remove('hidden');

  // Update stats counters
  document.getElementById('stat-links').textContent = data.totalLinksFound;
  document.getElementById('stat-internal').textContent = data.internalLinksCount;
  document.getElementById('stat-external').textContent = data.externalLinksCount;
  document.getElementById('stat-headings').textContent = data.totalHeadingsFound;
  document.getElementById('stat-time').textContent = data.executionTimeMs + ' ms';

  document.getElementById('badge-links-count').textContent = data.totalLinksFound;
  document.getElementById('badge-headings-count').textContent = data.totalHeadingsFound;

  renderLinksTable();
  renderHeadingsTable();
  renderLivePreview();
  renderCodeEditor();

  btnExtract.disabled = false;
  if (btnLabel) btnLabel.textContent = t.btnExtractSuccess;
  if (progressBox) progressBox.classList.add('hidden');
}

// Clean HTML for crawled pages
function cleanHtmlForPage(rawHtml, cssContent, jsContent) {
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  doc.querySelectorAll('base, script, link[rel="stylesheet"], style').forEach(el => el.remove());
  let head = doc.querySelector('head') || doc.createElement('head');
  if (!doc.head) doc.documentElement.insertBefore(head, doc.body || null);

  const linkCss = doc.createElement('link');
  linkCss.rel = 'stylesheet';
  linkCss.href = '../styles.css';
  head.appendChild(linkCss);

  const scr = doc.createElement('script');
  scr.src = '../scripts.js';
  head.appendChild(scr);

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

// Generate visual pages hub for Full Site mode
function generatePagesIndexHub(domain, pages) {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فهرست صفحات استخراج‌شده سایت - ${domain}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; margin: 0; }
    .container { max-width: 800px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 2rem; border: 1px solid #334155; }
    h1 { color: #38bdf8; font-size: 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid #334155; padding-bottom: 1rem; }
    .page-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .page-item { display: flex; align-items: center; justify-content: space-between; background: #0f172a; padding: 1rem 1.25rem; border-radius: 10px; border: 1px solid #334155; }
    .page-link { color: #f8fafc; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 0.75rem; }
    .btn { background: #38bdf8; color: #0f172a; padding: 0.45rem 1.1rem; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.85rem; }
    .btn:hover { background: #7dd3fc; }
  </style>
</head>
<body>
  <div class="container">
    <h1>فهرست پوشه‌بندی شده صفحات استخراج‌شده سایت: ${domain}</h1>
    <ul class="page-list">
      <li class="page-item">
        <span class="page-link">📁 پوشه 00 : صفحه اصلی (Home)</span>
        <a class="btn" href="../index.html">مشاهده صفحه اصلی</a>
      </li>
      ${pages.map((p, index) => {
        const pageIndex = (index + 1).toString().padStart(2, '0');
        let baseSlug = (new URL(p.url).pathname.replace(/[^a-zA-Z0-9_-]/g, '_') || 'page').slice(-20);
        const folder = `${pageIndex}_${baseSlug}`;
        return `<li class="page-item">
          <span class="page-link">📁 پوشه ${pageIndex} : ${escapeHtml(p.title)}</span>
          <a class="btn" href="./${folder}/index.html">مشاهده صفحه</a>
        </li>`;
      }).join('\n      ')}
    </ul>
  </div>
</body>
</html>`;
}

// Render Links Table with Filtering
function renderLinksTable() {
  if (!currentScrapeResult || !currentScrapeResult.links) return;
  const tbody = document.getElementById('links-tbody');
  const searchVal = (document.getElementById('search-links').value || '').toLowerCase();
  const filterType = document.getElementById('filter-link-type').value;
  const filterDev = document.getElementById('filter-link-device')?.value || 'all';

  const filtered = currentScrapeResult.links.filter(l => {
    if (filterType !== 'all' && l.type !== filterType) return false;
    if (filterDev !== 'all' && l.devices && !l.devices.includes(filterDev)) return false;
    if (searchVal && !l.text.toLowerCase().includes(searchVal) && !l.url.toLowerCase().includes(searchVal)) return false;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">موردی با فیلتر فعلی یافت نشد.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.slice(0, 150).map((l, idx) => {
    const devTag = (l.devices && l.devices.length > 0) ? l.devices.join(', ') : 'Universal';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(l.text)}</td>
        <td class="url-cell" title="${escapeHtml(l.url)}">${escapeHtml(l.url)}</td>
        <td><span class="badge">${devTag}</span></td>
        <td><span class="badge">${l.type}</span></td>
        <td>
          <button class="btn-icon copy-link-btn" data-url="${escapeHtml(l.url)}" title="کپی آدرس">
            📋
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.copy-link-btn').forEach(b => {
    b.addEventListener('click', (e) => {
      const u = e.currentTarget.getAttribute('data-url');
      navigator.clipboard.writeText(u);
      alert(I18N[currentLang].copySuccess);
    });
  });
}

// Render Headings Table
function renderHeadingsTable() {
  if (!currentScrapeResult || !currentScrapeResult.headings) return;
  const tbody = document.getElementById('headings-tbody');
  const activeLevels = Array.from(document.querySelectorAll('.heading-filter:checked')).map(cb => cb.value);

  const filtered = currentScrapeResult.headings.filter(h => activeLevels.includes(h.level));

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state">تیتری با فیلترهای انتخابی یافت نشد.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((h, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><span class="h-badge ${h.level}">${h.level.toUpperCase()}</span></td>
      <td>${escapeHtml(h.text)}</td>
    </tr>
  `).join('');
}

// Live Preview Renderer
function renderLivePreview() {
  const iframe = document.getElementById('live-preview-iframe');
  if (!iframe) return;

  const standalone = virtualFiles.find(f => f.name === 'standalone_offline.html') || virtualFiles.find(f => f.name === 'index.html');
  if (!standalone) return;

  let docHtml = standalone.content;

  // Incase standalone references external styles, inject inlined
  const css = virtualFiles.find(f => f.name === 'styles.css');
  const js = virtualFiles.find(f => f.name === 'scripts.js');

  if (!docHtml.includes('offline-standalone-styles') && css) {
    docHtml = docHtml.replace('</head>', `<style id="offline-preview-styles">${css.content}</style></head>`);
  }
  if (!docHtml.includes('offline-standalone-scripts') && js) {
    docHtml = docHtml.replace('</body>', `<script>${js.content}</script></body>`);
  }

  const blob = new Blob([docHtml], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  iframe.src = blobUrl;

  updatePreviewFrameSize();
}

function updatePreviewFrameSize() {
  const container = document.getElementById('preview-frame-container');
  const label = document.getElementById('preview-resolution-label');
  if (!container || !label) return;

  container.className = 'preview-frame-container dev-' + previewDevice;

  if (previewDevice === 'desktop') {
    label.textContent = '1920 × 1080 (دسکتاپ)';
  } else if (previewDevice === 'tablet') {
    label.textContent = '768 × 1024 (تبلت)';
  } else if (previewDevice === 'mobile') {
    label.textContent = '390 × 844 (موبایل)';
  }
}

function openPreviewInNewWindow() {
  const standalone = virtualFiles.find(f => f.name === 'standalone_offline.html') || virtualFiles.find(f => f.name === 'index.html');
  if (!standalone) return;
  const blob = new Blob([standalone.content], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}

// Code Editor / File Viewer System
function renderCodeEditor() {
  const tabsContainer = document.getElementById('editor-file-tabs');
  const textarea = document.getElementById('code-editor-textarea');
  const sizeBadge = document.getElementById('editor-file-size');
  if (!tabsContainer || !textarea) return;

  tabsContainer.innerHTML = virtualFiles.map(file => {
    const isActive = file.name === activeEditorFileName;
    return `<button class="editor-tab-pill ${isActive ? 'active' : ''}" data-filename="${file.name}">${file.name}</button>`;
  }).join('');

  tabsContainer.querySelectorAll('.editor-tab-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fn = e.currentTarget.getAttribute('data-filename');
      switchEditorFile(fn);
    });
  });

  const activeFile = virtualFiles.find(f => f.name === activeEditorFileName) || virtualFiles[0];
  if (activeFile) {
    activeEditorFileName = activeFile.name;
    textarea.value = activeFile.content;
    const bytes = new Blob([activeFile.content]).size;
    if (sizeBadge) sizeBadge.textContent = formatBytes(bytes);
  }
}

function switchEditorFile(filename) {
  activeEditorFileName = filename;
  renderCodeEditor();
}

function applyCodeChanges() {
  const textarea = document.getElementById('code-editor-textarea');
  const activeFile = virtualFiles.find(f => f.name === activeEditorFileName);
  if (!activeFile || !textarea) return;

  activeFile.content = textarea.value;

  // If index.html or styles.css or scripts.js was edited, sync standalone_offline.html
  if (['index.html', 'styles.css', 'scripts.js'].includes(activeFile.name)) {
    syncStandaloneFromVirtualFiles();
  }

  renderLivePreview();
  renderCodeEditor();
  alert(I18N[currentLang].applySuccess);
}

function syncStandaloneFromVirtualFiles() {
  const indexFile = virtualFiles.find(f => f.name === 'index.html');
  const cssFile = virtualFiles.find(f => f.name === 'styles.css');
  const jsFile = virtualFiles.find(f => f.name === 'scripts.js');
  const standalone = virtualFiles.find(f => f.name === 'standalone_offline.html');
  if (!indexFile || !standalone) return;

  const doc = new DOMParser().parseFromString(indexFile.content, 'text/html');
  doc.querySelectorAll('link[rel="stylesheet"], script[src="scripts.js"]').forEach(el => el.remove());

  const head = doc.head || doc.createElement('head');
  if (cssFile) {
    const st = doc.createElement('style');
    st.id = 'offline-standalone-styles';
    st.textContent = cssFile.content;
    head.appendChild(st);
  }
  if (jsFile) {
    const sc = doc.createElement('script');
    sc.id = 'offline-standalone-scripts';
    sc.textContent = jsFile.content;
    head.appendChild(sc);
  }

  standalone.content = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

function downloadActiveEditorFile() {
  const activeFile = virtualFiles.find(f => f.name === activeEditorFileName);
  if (!activeFile) return;

  let mime = 'text/plain';
  if (activeFile.name.endsWith('.html')) mime = 'text/html;charset=utf-8';
  else if (activeFile.name.endsWith('.css')) mime = 'text/css';
  else if (activeFile.name.endsWith('.js')) mime = 'application/javascript';
  else if (activeFile.name.endsWith('.json')) mime = 'application/json';
  else if (activeFile.name.endsWith('.csv')) mime = 'text/csv;charset=utf-8';

  const cleanFilename = activeFile.name.replace(/^.*[\\/]/, '');
  downloadBlob(activeFile.content, cleanFilename, mime);
}

function resetActiveEditorFile() {
  const orig = originalFiles.find(f => f.name === activeEditorFileName);
  const activeFile = virtualFiles.find(f => f.name === activeEditorFileName);
  if (!orig || !activeFile) return;

  if (confirm(I18N[currentLang].resetConfirm)) {
    activeFile.content = orig.content;
    renderCodeEditor();
    renderLivePreview();
  }
}

// Structured CSV & JSON Exports
function exportStructuredCsv(targetOverride) {
  if (!currentScrapeResult) return;
  const target = targetOverride || document.querySelector('input[name="csv-type"]:checked').value;
  const bom = '\uFEFF';
  const rows = [];

  if (target === 'combined') {
    rows.push(['Record Type', 'Index', 'Classification', 'Content / Text', 'Target URL', 'Devices', 'Source URL']);
    (currentScrapeResult.links || []).forEach((l, i) => {
      rows.push(['Link', String(i + 1), l.type.toUpperCase(), l.text, l.url, (l.devices || []).join('; '), l.sourceUrl]);
    });
    (currentScrapeResult.headings || []).forEach((h, i) => {
      rows.push(['Heading', String(i + 1), h.level.toUpperCase(), h.text, '', 'Universal', h.sourceUrl]);
    });
  } else if (target === 'links') {
    rows.push(['Index', 'Anchor Text', 'Target URL', 'Type', 'Devices', 'Source URL']);
    (currentScrapeResult.links || []).forEach((l, i) => {
      rows.push([String(i + 1), l.text, l.url, l.type, (l.devices || []).join('; '), l.sourceUrl]);
    });
  } else {
    rows.push(['Index', 'Level', 'Heading Text', 'Devices', 'Source URL']);
    (currentScrapeResult.headings || []).forEach((h, i) => {
      rows.push([String(i + 1), h.level.toUpperCase(), h.text, 'Universal', h.sourceUrl]);
    });
  }

  const csvContent = bom + rows.map(r => r.map(c => '"' + String(c || '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
  downloadBlob(csvContent, 'web_scraper_export_' + target + '.csv', 'text/csv;charset=utf-8;');
}

function exportJson() {
  if (!currentScrapeResult) return;
  const jsonContent = JSON.stringify(currentScrapeResult, null, 2);
  downloadBlob(jsonContent, 'scraped_dataset.json', 'application/json');
}

// Helper to safely convert ArrayBuffer to Base64 data URI
function bufferToDataUri(buffer, mimeType) {
  try {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return `data:${mimeType};base64,${btoa(binary)}`;
  } catch (e) {
    return '';
  }
}

// Offline-First Serialized Asset Cache: Caches assets in-memory and ensures zero network refetches
class OfflineAssetCache {
  constructor() {
    this.entries = new Map();
  }

  normalizeKey(url) {
    if (!url || typeof url !== 'string') return '';
    return url.split('#')[0].trim();
  }

  set(rawUrl, entry) {
    if (!rawUrl || !entry) return;
    const clean = this.normalizeKey(rawUrl);
    this.entries.set(clean, entry);
    const noQuery = clean.split('?')[0];
    this.entries.set(noQuery, entry);
    try {
      const p = new URL(clean);
      this.entries.set(p.origin + p.pathname, entry);
    } catch {}
    if (entry.localPath) {
      this.entries.set(entry.localPath, entry);
      const baseName = entry.localPath.replace(/^.*[\\/]/, '');
      this.entries.set(baseName, entry);
      this.entries.set(baseName.replace(/^\d+_/, ''), entry);
    }
  }

  get(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const clean = this.normalizeKey(rawUrl);
    if (this.entries.has(clean)) return this.entries.get(clean);
    const noQuery = clean.split('?')[0];
    if (this.entries.has(noQuery)) return this.entries.get(noQuery);
    try {
      const p = new URL(clean);
      const originPath = p.origin + p.pathname;
      if (this.entries.has(originPath)) return this.entries.get(originPath);
    } catch {}
    const baseName = noQuery.replace(/^.*[\\/]/, '');
    if (this.entries.has(baseName)) return this.entries.get(baseName);
    const stripped = baseName.replace(/^\d+_/, '');
    if (this.entries.has(stripped)) return this.entries.get(stripped);
    return null;
  }

  has(rawUrl) {
    return !!this.get(rawUrl);
  }

  getDataUri(rawUrl) {
    const entry = this.get(rawUrl);
    return entry ? entry.dataUri : null;
  }

  getLocalPath(rawUrl) {
    const entry = this.get(rawUrl);
    return entry ? entry.localPath : null;
  }

  serialize() {
    const unique = Array.from(new Set(this.entries.values()));
    return unique.map(e => ({
      originalUrl: e.originalUrl,
      localPath: e.localPath,
      mimeType: e.mimeType,
      size: e.size,
      dataUri: e.dataUri
    }));
  }
}

const globalOfflineAssetCache = new OfflineAssetCache();

// Dedicated High-Throughput Media Downloader for 100% Offline Asset Bundling
async function downloadMediaAssets(urls, onProgress, assetCache = globalOfflineAssetCache) {
  const assets = [];
  const urlToLocalMap = new Map();
  let totalBytes = 0;
  
  if (!urls || urls.length === 0) {
    return { assets, urlToLocalMap, totalBytes, assetCache };
  }

  // Filter and deduplicate valid HTTP/HTTPS URLs
  const uniqueUrls = Array.from(new Set(urls.filter(u => {
    return u && typeof u === 'string' &&
      !u.startsWith('data:') &&
      !u.startsWith('blob:') &&
      !u.startsWith('#') &&
      !u.startsWith('javascript:');
  })));

  const total = uniqueUrls.length;
  let completed = 0;
  let activeIndex = 0;
  const CONCURRENCY = 6;

  async function worker() {
    while (activeIndex < uniqueUrls.length) {
      const idx = activeIndex++;
      const rawUrl = uniqueUrls[idx];
      try {
        let parsed;
        try {
          parsed = new URL(rawUrl);
        } catch {
          continue;
        }

        const pathname = parsed.pathname || '';
        let ext = (pathname.split('.').pop() || '').toLowerCase();
        if (ext.length > 5 || !ext || /[^a-z0-9]/.test(ext)) {
          ext = 'png';
        }

        let folder = 'images';
        if (['mp4', 'webm', 'ogg', 'mov', 'mp3', 'wav', 'm4a'].includes(ext)) {
          folder = 'media';
        } else if (['woff2', 'woff', 'ttf', 'eot', 'otf'].includes(ext)) {
          folder = 'fonts';
        }

        let baseName = pathname.split('/').pop() || `asset_${idx}`;
        baseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
        if (!baseName.includes('.')) baseName += '.' + ext;
        
        const localPath = `assets/${folder}/${idx + 1}_${baseName}`;

        let mimeType = 'image/png';
        if (ext === 'svg') mimeType = 'image/svg+xml';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'ico') mimeType = 'image/x-icon';
        else if (ext === 'woff2') mimeType = 'font/woff2';
        else if (ext === 'woff') mimeType = 'font/woff';
        else if (ext === 'ttf') mimeType = 'font/ttf';
        else if (ext === 'mp4') mimeType = 'video/mp4';

        // Check if already in cache (Offline-first caching mechanism)
        if (assetCache && assetCache.has(rawUrl)) {
          const cached = assetCache.get(rawUrl);
          assets.push({
            path: cached.localPath || localPath,
            data: cached.buffer,
            size: cached.size
          });
          totalBytes += cached.size;
          urlToLocalMap.set(rawUrl, cached.localPath || localPath);
          urlToLocalMap.set(rawUrl.split('?')[0], cached.localPath || localPath);
          continue;
        }

        const resp = await fetch(rawUrl, { cache: 'force-cache' });
        if (resp.ok) {
          const headerType = resp.headers.get('content-type');
          if (headerType && !headerType.includes('text/html')) {
            mimeType = headerType.split(';')[0].trim();
          }
          const blob = await resp.blob();
          const buffer = await blob.arrayBuffer();
          const dataUri = bufferToDataUri(buffer, mimeType);

          const entry = {
            originalUrl: rawUrl,
            localPath: localPath,
            mimeType: mimeType,
            dataUri: dataUri,
            buffer: buffer,
            size: buffer.byteLength
          };

          if (assetCache) {
            assetCache.set(rawUrl, entry);
          }

          assets.push({
            path: localPath,
            data: buffer,
            size: buffer.byteLength
          });
          totalBytes += buffer.byteLength;
          urlToLocalMap.set(rawUrl, localPath);
          urlToLocalMap.set(rawUrl.split('?')[0], localPath);
          urlToLocalMap.set(parsed.href, localPath);
        }
      } catch (err) {
        // Continue downloading remaining assets smoothly
      } finally {
        completed++;
        if (onProgress && (completed % 2 === 0 || completed === total)) {
          const mb = (totalBytes / (1024 * 1024)).toFixed(1);
          onProgress(`در حال دانلود رسانه‌ها و تصاویر باکیفیت: ${completed}/${total} فایل (${mb} MB)...`);
        }
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(CONCURRENCY, total); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  return { assets, urlToLocalMap, totalBytes, assetCache };
}

function replaceCssAssetUrls(cssText, urlMap, baseUrl) {
  if (!cssText) return '';
  // Strip remote @import to prevent ERR_INTERNET_DISCONNECTED
  let cleaned = cssText.replace(/@import\s+(?:url\(['"]?[^'")]+['"]?\)|['"][^'"]+['"])[^;]*;/gi, '/* Remote @import removed for 100% offline isolation */');
  
  return cleaned.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, rawUrl) => {
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('#') || rawUrl.startsWith('blob:')) {
      return match;
    }
    let absUrl = rawUrl;
    try {
      absUrl = new URL(rawUrl, baseUrl).href;
    } catch {}

    const local = urlMap.get(absUrl) || urlMap.get(absUrl.split('?')[0]);
    if (local) {
      return `url("./${local}")`;
    }
    // If not downloaded and points to remote, strip to avoid net errors
    if (absUrl.startsWith('http://') || absUrl.startsWith('https://')) {
      return `url("")`;
    }
    return match;
  });
}

function replaceCssAssetUrlsWithDataUri(cssText, assetCache, baseUrl) {
  if (!cssText) return '';
  let cleaned = cssText.replace(/@import\s+(?:url\(['"]?[^'")]+['"]?\)|['"][^'"]+['"])[^;]*;/gi, '/* Remote @import removed for 100% offline isolation */');
  
  return cleaned.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, rawUrl) => {
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('#') || rawUrl.startsWith('blob:')) {
      return match;
    }
    let absUrl = rawUrl;
    try {
      absUrl = new URL(rawUrl, baseUrl).href;
    } catch {}

    const dataUri = assetCache.getDataUri(absUrl) || assetCache.getDataUri(rawUrl);
    if (dataUri) {
      return `url("${dataUri}")`;
    }
    if (absUrl.endsWith('.woff2') || absUrl.endsWith('.woff') || absUrl.endsWith('.ttf')) {
      return `local('Arial')`;
    }
    if (absUrl.startsWith('http://') || absUrl.startsWith('https://')) {
      return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%231e293b'/%3E%3C/svg%3E")`;
    }
    return match;
  });
}

// Core Offline Bundler: Processes external CSS, local media assets, scripts, and air-gap shield
async function processAndBundleOffline(data, onProgress) {
  const domain = data.domain || 'offline_site';
  const targetUrl = data.targetUrl || window.location.href;
  currentOfflineAssets = [];
  totalDownloadedAssetBytes = 0;

  // 1. Gather all asset URLs (images, videos, fonts, audio, icons)
  onProgress('در حال شناسایی و فهرست‌کردن تمام تصاویر، وب‌پی‌ها و رسانه‌ها...');
  const assetUrlSet = new Set();

  if (data.mediaAssets && Array.isArray(data.mediaAssets)) {
    data.mediaAssets.forEach(u => {
      if (u && typeof u === 'string') assetUrlSet.add(u);
      else if (u && typeof u === 'object' && u.url) assetUrlSet.add(u.url);
    });
  }

  const rawHtml = data.html || (data.files && data.files[0] && data.files[0].content) || '<!DOCTYPE html><html><head></head><body></body></html>';
  const parser = new DOMParser();
  const tempDoc = parser.parseFromString(rawHtml, 'text/html');

  // Extract from <img>, <picture>, <source>, <video>, <audio>, <link rel="icon">
  tempDoc.querySelectorAll('img, picture source, video, audio, video source, audio source, link[rel*="icon"]').forEach(el => {
    ['src', 'data-src', 'data-lazy-src', 'data-original', 'poster', 'href'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (val) {
        try { assetUrlSet.add(new URL(val, targetUrl).href); } catch {}
      }
    });
    const srcset = el.getAttribute('srcset') || el.getAttribute('data-srcset');
    if (srcset) {
      srcset.split(',').forEach(part => {
        const urlCandidate = part.trim().split(/\s+/)[0];
        if (urlCandidate) {
          try { assetUrlSet.add(new URL(urlCandidate, targetUrl).href); } catch {}
        }
      });
    }
  });

  // Extract from inline style backgrounds
  tempDoc.querySelectorAll('[style*="url("]').forEach(el => {
    const styleAttr = el.getAttribute('style') || '';
    const matches = styleAttr.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi);
    for (const m of matches) {
      if (m[1]) {
        try { assetUrlSet.add(new URL(m[1], targetUrl).href); } catch {}
      }
    }
  });

  // Extract from stylesheets
  const cssUrlRegex = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  if (data.directCssRules) {
    data.directCssRules.forEach(r => {
      if (r.cssText) {
        const matches = r.cssText.matchAll(cssUrlRegex);
        for (const m of matches) {
          if (m[1]) {
            try { assetUrlSet.add(new URL(m[1], r.href || targetUrl).href); } catch {}
          }
        }
      }
    });
  }

  // 2. Download all collected assets in parallel
  const chkMedia = document.getElementById('chk-download-all-media');
  const shouldDownloadMedia = chkMedia ? chkMedia.checked : true;
  let urlToLocalMap = new Map();

  if (shouldDownloadMedia && assetUrlSet.size > 0) {
    onProgress(`در حال دانلود ${assetUrlSet.size} رسانه باکیفیت بالا...`);
    const { assets, urlToLocalMap: uMap, totalBytes } = await downloadMediaAssets(Array.from(assetUrlSet), onProgress);
    currentOfflineAssets = assets;
    totalDownloadedAssetBytes = totalBytes;
    urlToLocalMap = uMap;
  }

  // 3. Compile external styles.css (User requirement: CSS must exist externally)
  onProgress('در حال استخراج و تجمیع استایل‌ها و فونت‌ها در styles.css...');
  let compiledCss = `/* ========================================================================
   Offline Consolidated External Stylesheet - Built by Web Scraper Pro
   100% Air-Gap Zero-Network Compliant | Zero Remote Fetch Required
======================================================================== */\n`;

  // Add system typography fallback for Persian/Latin
  compiledCss += `
@font-face {
  font-family: 'system-persian-fallback';
  src: local('IRANSans'), local('Vazirmatn'), local('Tahoma'), local('Arial'), local('-apple-system'), local('BlinkMacSystemFont'), local('Segoe UI');
}
body, button, input, textarea, select {
  font-family: 'IRANSans', 'Vazirmatn', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Tahoma, Arial, sans-serif !important;
}\n`;

  // A. Add external stylesheets
  if (data.stylesheets && data.stylesheets.length > 0) {
    for (let i = 0; i < data.stylesheets.length; i++) {
      const sheetUrl = data.stylesheets[i];
      try {
        const resp = await fetch(sheetUrl);
        if (resp.ok) {
          let cssText = await resp.text();
          cssText = replaceCssAssetUrls(cssText, urlToLocalMap, sheetUrl);
          compiledCss += `\n/* Source: ${sheetUrl} */\n` + cssText + '\n';
        }
      } catch (e) {
        if (data.directCssRules) {
          const direct = data.directCssRules.find(d => d.href === sheetUrl);
          if (direct && direct.cssText) {
            compiledCss += `\n/* Captured CSSOM: ${sheetUrl} */\n` + replaceCssAssetUrls(direct.cssText, urlToLocalMap, sheetUrl) + '\n';
          }
        }
      }
    }
  }

  // B. Add direct CSSOM rules
  if (data.directCssRules && data.directCssRules.length > 0) {
    data.directCssRules.forEach(d => {
      if (!d.href && d.cssText) {
        compiledCss += '\n/* Inline CSSOM Sheet */\n' + replaceCssAssetUrls(d.cssText, urlToLocalMap, targetUrl) + '\n';
      }
    });
  }

  // C. Add inline styles
  if (data.inlineStyles && data.inlineStyles.length > 0) {
    data.inlineStyles.forEach((styleTxt, idx) => {
      compiledCss += `\n/* Inline Style Block #${idx + 1} */\n` + replaceCssAssetUrls(styleTxt, urlToLocalMap, targetUrl) + '\n';
    });
  }

  // 4. Compile scripts.js with Air-Gap Runtime Shield
  onProgress('در حال ترکیب کدهای تعاملی و فعال‌سازی سپر دفاعی آفلاین...');
  let compiledJs = OFFLINE_AIRGAP_SHIELD + '\n\n/* ================= Page Interactive Scripts ================= */\n';

  const trackerPattern = /(googletagmanager|google-analytics|analytics\.js|recaptcha|facebook\.net|clarity\.ms|hotjar|yandex|doubleclick|pixel|cdn-cgi|rbtools|rs6\.min\.js)/i;
  if (data.scriptUrls && data.scriptUrls.length > 0) {
    const validScripts = data.scriptUrls.filter(s => !trackerPattern.test(s));
    for (let i = 0; i < Math.min(validScripts.length, 10); i++) {
      const sUrl = validScripts[i];
      try {
        const resp = await fetch(sUrl);
        if (resp.ok) {
          const sText = await resp.text();
          compiledJs += `\n/* Script: ${sUrl} */\ntry {\n${sText}\n} catch(e) { console.warn('Offline script bypass:', e); }\n`;
        }
      } catch (e) {}
    }
  }

  if (data.inlineScripts && data.inlineScripts.length > 0) {
    data.inlineScripts.forEach((scr, idx) => {
      if (!trackerPattern.test(scr)) {
        compiledJs += `\n/* Inline Script #${idx + 1} */\ntry {\n${scr}\n} catch(e) { console.warn('Inline script error suppressed:', e); }\n`;
      }
    });
  }

  // 5. Clean, sanitize and link index.html
  onProgress('در حال پاک‌سازی تگ‌های ریموت و اتصال پکیج‌های محلی به HTML...');
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // A. Remove remote/relative stylesheets, preloads, and preconnects
  doc.querySelectorAll('link').forEach(link => {
    const rel = (link.getAttribute('rel') || '').toLowerCase();
    const href = link.getAttribute('href') || '';
    if (rel === 'stylesheet' || rel === 'preload' || rel === 'prefetch' || rel === 'preconnect' || rel === 'dns-prefetch' || href.endsWith('.css') || href.includes('rs6.css')) {
      link.remove();
    }
  });
  doc.querySelectorAll('base').forEach(el => el.remove());
  doc.querySelectorAll('style').forEach(el => el.remove());

  // B. Setup <head>
  let head = doc.querySelector('head');
  if (!head) {
    head = doc.createElement('head');
    doc.documentElement.insertBefore(head, doc.body || null);
  }

  // Insert Early Air-Gap Shield as the FIRST element of <head>
  const earlyScript = doc.createElement('script');
  earlyScript.id = 'airgap-early-shield';
  earlyScript.textContent = OFFLINE_AIRGAP_EARLY_CODE;
  head.insertBefore(earlyScript, head.firstChild);

  // Insert external styles.css (user requirement: external CSS file)
  const linkCss = doc.createElement('link');
  linkCss.setAttribute('rel', 'stylesheet');
  linkCss.setAttribute('href', 'styles.css');
  head.appendChild(linkCss);

  // Insert external scripts.js
  const scriptJs = doc.createElement('script');
  scriptJs.setAttribute('src', 'scripts.js');
  head.appendChild(scriptJs);

  // C. Remove remote script tags from body and head
  doc.querySelectorAll('script').forEach(el => {
    if (el.id === 'airgap-early-shield') return;
    const src = el.getAttribute('src');
    if (src) {
      if (src !== 'scripts.js') {
        el.remove();
      }
    } else {
      const content = el.textContent || '';
      if (trackerPattern.test(content) || content.includes('_wpemojiSettings') || content.includes('challenge-platform')) {
        el.remove();
      } else {
        el.textContent = `try {\n${content}\n} catch(e) { console.warn('Offline inline script bypassed:', e); }`;
      }
    }
  });

  // D. Rewrite all <img> tags to point to local assets
  doc.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
    const candidate = dataSrc || src;

    if (candidate) {
      let abs = candidate;
      try { abs = new URL(candidate, targetUrl).href; } catch {}
      const local = urlToLocalMap.get(abs) || urlToLocalMap.get(abs.split('?')[0]);
      if (local) {
        img.setAttribute('src', `./${local}`);
      } else if (abs.startsWith('http')) {
        // Clean fallback to prevent ERR_INTERNET_DISCONNECTED
        img.setAttribute('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f1f5f9"/%3E%3C/svg%3E');
      }
    }
    img.removeAttribute('srcset');
    img.removeAttribute('data-srcset');
    img.removeAttribute('sizes');
    img.removeAttribute('loading');
    img.removeAttribute('decoding');
  });

  // E. Rewrite <video>, <audio>, <source>
  doc.querySelectorAll('video, audio, source').forEach(media => {
    ['src', 'poster'].forEach(attr => {
      const val = media.getAttribute(attr);
      if (val) {
        let abs = val;
        try { abs = new URL(val, targetUrl).href; } catch {}
        const local = urlToLocalMap.get(abs) || urlToLocalMap.get(abs.split('?')[0]);
        if (local) {
          media.setAttribute(attr, `./${local}`);
        } else if (abs.startsWith('http')) {
          media.removeAttribute(attr);
        }
      }
    });
  });

  // F. Rewrite inline background styles
  doc.querySelectorAll('[style*="url("]').forEach(el => {
    const styleAttr = el.getAttribute('style') || '';
    const newStyle = replaceCssAssetUrls(styleAttr, urlToLocalMap, targetUrl);
    el.setAttribute('style', newStyle);
  });

  const indexHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

  // 6. Create standalone_offline.html with COMPLETE inlining (Base64 for all assets, embedded styles & scripts)
  onProgress('در حال ایجاد نسخه تک‌فایل مستقل با Inlining کامل تصاویر و فونت‌ها (Base64)...');
  const sDoc = parser.parseFromString(rawHtml, 'text/html');
  let sHead = sDoc.querySelector('head');
  if (!sHead) {
    sHead = sDoc.createElement('head');
    sDoc.documentElement.insertBefore(sHead, sDoc.body || null);
  }

  // Remove existing CSS / external stylesheets and prefetch
  sDoc.querySelectorAll('link[rel*="stylesheet"], link[rel*="preload"], link[rel*="preconnect"], link[rel*="dns-prefetch"], base').forEach(el => el.remove());
  sDoc.querySelectorAll('style:not(svg style)').forEach(el => el.remove());

  // Inject early Air-Gap shield
  const sEarlyScript = sDoc.createElement('script');
  sEarlyScript.id = 'airgap-early-shield';
  sEarlyScript.textContent = OFFLINE_AIRGAP_EARLY_CODE;
  sHead.insertBefore(sEarlyScript, sHead.firstChild);

  // Inlined Base64 CSS
  const sCompiledCss = replaceCssAssetUrlsWithDataUri(compiledCss, globalOfflineAssetCache, targetUrl);
  const sEmbeddedStyle = sDoc.createElement('style');
  sEmbeddedStyle.id = 'offline-standalone-styles';
  sEmbeddedStyle.textContent = sCompiledCss;
  sHead.appendChild(sEmbeddedStyle);

  // Inlined Scripts with complete isolation
  const sEmbeddedScript = sDoc.createElement('script');
  sEmbeddedScript.id = 'offline-standalone-scripts';
  sEmbeddedScript.textContent = compiledJs;
  sHead.appendChild(sEmbeddedScript);

  // Strip remote scripts
  sDoc.querySelectorAll('script').forEach(scr => {
    if (scr.id === 'airgap-early-shield' || scr.id === 'offline-standalone-scripts') return;
    const src = scr.getAttribute('src');
    if (src) {
      scr.remove();
    } else {
      const content = scr.textContent || '';
      if (trackerPattern.test(content) || content.includes('_wpemojiSettings') || content.includes('challenge-platform')) {
        scr.remove();
      } else {
        scr.textContent = `try {\n${content}\n} catch(e) { console.warn('Offline inline script bypassed:', e); }`;
      }
    }
  });

  // Base64 Inlining for <img>
  sDoc.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original') || img.getAttribute('nitro-lazy-src');
    const candidate = dataSrc || src;

    if (candidate) {
      let abs = candidate;
      try { abs = new URL(candidate, targetUrl).href; } catch {}
      const dataUri = globalOfflineAssetCache.getDataUri(abs) || globalOfflineAssetCache.getDataUri(candidate);
      if (dataUri) {
        img.setAttribute('src', dataUri);
      } else if (candidate.startsWith('data:')) {
        img.setAttribute('src', candidate);
      } else {
        // Safe SVG placeholder to eliminate ERR_INTERNET_DISCONNECTED
        img.setAttribute('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f1f5f9"/%3E%3C/svg%3E');
      }
    }
    img.removeAttribute('srcset');
    img.removeAttribute('data-srcset');
    img.removeAttribute('sizes');
    img.removeAttribute('loading');
    img.removeAttribute('decoding');
  });

  // Base64 Inlining for <picture> <source>
  sDoc.querySelectorAll('picture source').forEach(s => {
    const srcset = s.getAttribute('srcset') || s.getAttribute('data-srcset');
    if (srcset) {
      const candidate = srcset.split(',')[0].trim().split(/\s+/)[0];
      let abs = candidate;
      try { abs = new URL(candidate, targetUrl).href; } catch {}
      const dataUri = globalOfflineAssetCache.getDataUri(abs) || globalOfflineAssetCache.getDataUri(candidate);
      if (dataUri) {
        s.setAttribute('srcset', dataUri);
      } else {
        s.remove();
      }
    }
  });

  // Base64 Inlining for <video>, <audio>, <source>
  sDoc.querySelectorAll('video, audio, source').forEach(media => {
    ['src', 'poster'].forEach(attr => {
      const val = media.getAttribute(attr);
      if (val) {
        let abs = val;
        try { abs = new URL(val, targetUrl).href; } catch {}
        const dataUri = globalOfflineAssetCache.getDataUri(abs) || globalOfflineAssetCache.getDataUri(val);
        if (dataUri) {
          media.setAttribute(attr, dataUri);
        } else if (abs.startsWith('http')) {
          media.removeAttribute(attr);
        }
      }
    });
  });

  // Base64 Inlining for favicon
  sDoc.querySelectorAll('link[rel*="icon"]').forEach(ico => {
    const href = ico.getAttribute('href');
    if (href) {
      let abs = href;
      try { abs = new URL(href, targetUrl).href; } catch {}
      const dataUri = globalOfflineAssetCache.getDataUri(abs) || globalOfflineAssetCache.getDataUri(href);
      if (dataUri) {
        ico.setAttribute('href', dataUri);
      } else {
        ico.setAttribute('href', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3C/svg%3E');
      }
    }
  });

  // Base64 Inlining for inline style backgrounds
  sDoc.querySelectorAll('[style*="url("]').forEach(el => {
    const styleAttr = el.getAttribute('style') || '';
    const newStyle = replaceCssAssetUrlsWithDataUri(styleAttr, globalOfflineAssetCache, targetUrl);
    el.setAttribute('style', newStyle);
  });

  // Force reveal lazyloaded/hidden elements
  sDoc.querySelectorAll('[class*="opacity-0"], [class*="invisible"], [data-aos], .aos-animate, .lazyload').forEach(elem => {
    let cls = elem.getAttribute('class') || '';
    cls = cls.replace(/\bopacity-0\b/g, '').replace(/\binvisible\b/g, '').replace(/\blazyload\b/g, 'lazyloaded').replace(/\s+/g, ' ').trim();
    elem.setAttribute('class', cls);
    elem.removeAttribute('data-aos');
  });

  const standaloneHtml = '<!DOCTYPE html>\n' + sDoc.documentElement.outerHTML;

  // Serialize asset manifest for offline reproducibility
  const serializedManifest = JSON.stringify(globalOfflineAssetCache.serialize(), null, 2);
  currentOfflineAssets.push({
    path: 'assets/assets_manifest.json',
    data: new TextEncoder().encode(serializedManifest).buffer,
    size: serializedManifest.length
  });

  return {
    indexHtml,
    stylesCss: compiledCss,
    scriptsJs: compiledJs,
    standaloneHtml,
    manifestJson: serializedManifest,
    assetFiles: currentOfflineAssets,
    totalDownloadedAssetBytes
  };
}

// Download Offline ZIP Bundle
async function downloadOfflineZip() {
  if (!virtualFiles || virtualFiles.length === 0) return;
  const btn = document.getElementById('btn-download-offline-zip');
  const progressBox = document.getElementById('offline-progress-status');
  const progressText = document.getElementById('offline-progress-text');

  btn.disabled = true;
  progressBox.classList.remove('hidden');
  
  const assetCount = currentOfflineAssets.length;
  const totalMb = (totalDownloadedAssetBytes / (1024 * 1024)).toFixed(1);
  progressText.textContent = `در حال بسته‌بندی فایل‌ها (${assetCount} مدیا و تصویر، حجم تقریبی: ${totalMb} MB) در ZIP با فشرده‌سازی حداکثر...`;

  try {
    const zip = new JSZip();

    // Add all virtualFiles
    virtualFiles.forEach(vf => {
      zip.file(vf.name, vf.content);
    });

    // Add all downloaded high-res assets into the zip
    currentOfflineAssets.forEach(asset => {
      zip.file(asset.path, asset.data);
    });

    // Add comprehensive execution guide in Persian
    zip.file('راهنمای_اجرای_آفلاین.txt', `پکیج ۱۰۰٪ آفلاین وب‌سایت (تولید شده با Web Scraper Pro)
======================================================
این پکیج به صورت کامل، بدون کوچک‌ترین وابستگی به اینترنت، با مشخصات زیر ایجاد شده است:

۱. فایل styles.css:
   - تمامی استایل‌ها، فونت‌ها و رنگ‌ها به صورت خارجی در این فایل تجمیع شده‌اند.
   - هیچ‌گونه ایمپورت آنلاین (@import) یا فونت ریموت وجود ندارد.

۲. پوشه assets/:
   - تمامی تصاویر اصلی (WebP, PNG, JPG, SVG)، ویدیوها (MP4) و فایل‌های مدیا به صورت لوکال در این پوشه ذخیره شده‌اند.
   - کل دارایی‌ها با کیفیت اورجینال درون پکیج گنجانده شده‌اند (مجموعاً ${assetCount} فایل رسانه - حجم بیش از ${totalMb} مگابایت).

۳. فایل scripts.js:
   - حاوی سپر دفاعی Air-Gap Zero-Network جهت جلوگیری از هرگونه خطای Fetch یا XHR هنگام قطع اینترنت.
   - شامل شبیه‌ساز کامل jQuery، ابزارهای وردپرس (wp.i18n, wp.hooks)، المنتور و ووکامرس.

۴. فایل index.html:
   - صفحه وب اصلی که با ارتباط با styles.css و scripts.js به طور کامل و روان بالا می‌آید.
   - بدون نیاز به سرور محلی؛ فقط کافیست روی index.html دابل‌کلیک کنید.

۵. فایل standalone_offline.html:
   - نسخه تک‌فایل فوق‌العاده مستقل بدون نیاز به هیچ پوشه کمکی.

روش اجرا:
کافیست روی index.html در هر مرورگری (Chrome, Edge, Firefox) دوبار کلیک کنید.
حتی در صورت قطع کامل اتصال اینترنت، سایت به شکل بی‌نقص اجرا می‌شود.
`);

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    }, (metadata) => {
      if (metadata.percent) {
        progressText.textContent = `در حال فشرده‌سازی ZIP: ${metadata.percent.toFixed(0)}% (${metadata.currentFile || ''})...`;
      }
    });

    const domain = (currentScrapeResult?.domain || 'offline_website').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadBlob(content, domain + '_complete_offline_bundle.zip', 'application/zip');

    progressText.textContent = `✓ بسته کامل آفلاین (${(content.size / (1024 * 1024)).toFixed(1)} MB) با موفقیت دانلود شد!`;
    setTimeout(() => {
      progressBox.classList.add('hidden');
      btn.disabled = false;
    }, 2500);
  } catch (e) {
    alert('خطا در ایجاد فایل ZIP: ' + e.message);
    progressBox.classList.add('hidden');
    btn.disabled = false;
  }
}

// Download Standalone Single File HTML
function downloadStandaloneHtml() {
  const standalone = virtualFiles.find(f => f.name === 'standalone_offline.html');
  if (!standalone) {
    alert('فایل تک‌صفحه‌ای یافت نشد.');
    return;
  }
  const domain = (currentScrapeResult?.domain || 'offline_page').replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadBlob(standalone.content, domain + '_standalone_offline.html', 'text/html;charset=utf-8');
}

// Download All Devices (Desktop, Tablet, Mobile) in 1 ZIP
async function downloadAllDevicesZip() {
  if (!virtualFiles || virtualFiles.length === 0) return;
  const progressBox = document.getElementById('offline-progress-status');
  const progressText = document.getElementById('offline-progress-text');
  progressBox.classList.remove('hidden');
  progressText.textContent = 'در حال ایجاد ساختار پکیج ۳ دستگاه (Desktop, Tablet, Mobile)...';

  try {
    const zip = new JSZip();
    const domain = (currentScrapeResult?.domain || 'offline_site').replace(/[^a-zA-Z0-9_-]/g, '_');

    const devices = ['desktop', 'tablet', 'mobile'];
    const indexHtml = virtualFiles.find(f => f.name === 'index.html')?.content || '';
    const stylesCss = virtualFiles.find(f => f.name === 'styles.css')?.content || '';
    const scriptsJs = virtualFiles.find(f => f.name === 'scripts.js')?.content || '';
    const standaloneHtml = virtualFiles.find(f => f.name === 'standalone_offline.html')?.content || '';

    devices.forEach(dev => {
      zip.file(`${dev}/index.html`, indexHtml);
      zip.file(`${dev}/styles.css`, stylesCss);
      zip.file(`${dev}/scripts.js`, scriptsJs);
      zip.file(`${dev}/standalone_offline.html`, standaloneHtml);
    });

    // Include assets directory
    currentOfflineAssets.forEach(asset => {
      zip.file(asset.path, asset.data);
      devices.forEach(dev => {
        zip.file(`${dev}/${asset.path}`, asset.data);
      });
    });

    // Reports folder
    const reportHtml = virtualFiles.find(f => f.name === 'reports/links_report.html')?.content;
    if (reportHtml) zip.file('reports/links_report.html', reportHtml);

    // Root Offline Hub Launcher
    const hubHtml = generateAllDevicesHubHtml(domain);
    zip.file('offline_hub.html', hubHtml);
    zip.file('index.html', hubHtml);

    const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    downloadBlob(content, domain + '_all_devices_bundle.zip', 'application/zip');

    progressText.textContent = '✓ پکیج ۳ دستگاه با موفقیت دانلود شد!';
    setTimeout(() => { progressBox.classList.add('hidden'); }, 2000);
  } catch (e) {
    alert('خطا در ایجاد پکیج ۳ دستگاه: ' + e.message);
    progressBox.classList.add('hidden');
  }
}

// Generate Offline Hub Launcher for 3 devices
function generateAllDevicesHubHtml(domain) {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Hub - ${domain} (Desktop, Tablet, Mobile)</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f8fafc; padding: 2rem 1rem; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .hub-container { max-width: 900px; width: 100%; background: #151d30; border: 1px solid #23304e; border-radius: 20px; padding: 2.5rem; text-align: center; }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #38bdf8; }
    p.desc { color: #94a3b8; font-size: 0.95rem; margin-bottom: 2rem; }
    .devices-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .card { background: #0d1322; border: 1px solid #23304e; border-radius: 16px; padding: 1.5rem; text-decoration: none; color: inherit; transition: all 0.2s; }
    .card:hover { transform: translateY(-4px); border-color: #38bdf8; }
    .icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .title { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.25rem; }
    .spec { font-family: monospace; font-size: 0.8rem; color: #38bdf8; margin-bottom: 0.75rem; }
    .btn { display: inline-block; width: 100%; padding: 0.6rem; background: #38bdf8; color: #0b0f19; font-weight: bold; border-radius: 8px; font-size: 0.85rem; margin-top: 0.75rem; }
  </style>
</head>
<body>
  <div class="hub-container">
    <h1>هاب اجرای آفلاین سایت: ${domain}</h1>
    <p class="desc">نسخه اختصاصی دستگاه مورد نظر خود را برای مشاهده کاملاً آفلاین انتخاب کنید:</p>
    <div class="devices-grid">
      <a class="card" href="./desktop/index.html">
        <div class="icon">💻</div>
        <div class="title">نسخه دسکتاپ</div>
        <div class="spec">1920 × 1080 Full HD</div>
        <div class="btn">اجرای نسخه دسکتاپ</div>
      </a>
      <a class="card" href="./tablet/index.html">
        <div class="icon">📱</div>
        <div class="title">نسخه تبلت</div>
        <div class="spec">768 × 1024 Tablet</div>
        <div class="btn">اجرای نسخه تبلت</div>
      </a>
      <a class="card" href="./mobile/index.html">
        <div class="icon">📲</div>
        <div class="title">نسخه موبایل</div>
        <div class="spec">390 × 844 Mobile</div>
        <div class="btn">اجرای نسخه موبایل</div>
      </a>
    </div>
  </div>
</body>
</html>`;
}

// Download Visual Links Report HTML
function downloadVisualReportHtml() {
  const report = virtualFiles.find(f => f.name === 'reports/links_report.html');
  if (!report) {
    alert('گزارش تحلیلی یافت نشد.');
    return;
  }
  const domain = (currentScrapeResult?.domain || 'offline_site').replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadBlob(report.content, domain + '_links_report.html', 'text/html;charset=utf-8');
}

// Visual HTML Links Report Generator
function generateVisualLinksReportHtml(links, headings, domain, totalTime) {
  const internalCount = links.filter(l => l.type === 'internal').length;
  const externalCount = links.filter(l => l.type === 'external').length;
  const assetCount = links.filter(l => l.type === 'asset').length;
  const anchorCount = links.filter(l => l.type === 'anchor').length;

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>گزارش تحلیلی پیوندها و تیترها - ${domain}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f8fafc; padding: 2rem; margin: 0; }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 { color: #38bdf8; font-size: 1.8rem; margin-bottom: 0.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
    .card { background: #151d30; border: 1px solid #23304e; border-radius: 12px; padding: 1.25rem; text-align: center; }
    .val { font-size: 1.8rem; font-weight: 800; color: #38bdf8; }
    .lbl { font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; background: #151d30; border-radius: 12px; overflow: hidden; }
    th, td { padding: 10px 14px; text-align: right; border-bottom: 1px solid #23304e; font-size: 0.85rem; }
    th { background: #1e293b; color: #94a3b8; }
    .badge { padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 داشبورد تحلیلی پیوندها و تیترهای صفحه: ${domain}</h1>
    <p style="color: #94a3b8;">زمان استخراج محلی: ${totalTime} ms | مجموع لینک‌ها: ${links.length}</p>

    <div class="stats-row">
      <div class="card"><div class="val">${links.length}</div><div class="lbl">کل لینک‌ها</div></div>
      <div class="card"><div class="val">${internalCount}</div><div class="lbl">لینک‌های داخلی</div></div>
      <div class="card"><div class="val">${externalCount}</div><div class="lbl">لینک‌های خارجی</div></div>
      <div class="card"><div class="val">${assetCount}</div><div class="lbl">فایل‌ها و مدیا</div></div>
      <div class="card"><div class="val">${headings.length}</div><div class="lbl">کل تیترها (H1-H6)</div></div>
    </div>

    <h2>جدول پیوندهای استخراج‌شده</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>انکر تکست</th>
          <th>آدرس مقصد (URL)</th>
          <th>نوع</th>
        </tr>
      </thead>
      <tbody>
        ${links.slice(0, 100).map((l, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(l.text)}</td>
            <td style="font-family: monospace; direction: ltr;">${escapeHtml(l.url)}</td>
            <td><span class="badge">${l.type}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

// Helpers
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function downloadBlob(content, filename, mimeType) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
