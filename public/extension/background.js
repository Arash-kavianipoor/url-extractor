// Background Service Worker for Web Scraper Pro (Chrome MV3 & Firefox MV3)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Web Scraper & Offline Extractor Pro installed successfully.');
  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: 'extract-current-page',
      title: 'استخراج این صفحه با Web Scraper Pro',
      contexts: ['page', 'selection', 'link']
    });
  }
});

if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'extract-current-page' && tab && tab.id) {
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup.html?fullscreen=1&tabId=' + tab.id)
      });
    }
  });
}
