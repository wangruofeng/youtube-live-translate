// Background Service Worker

chrome.runtime.onInstalled.addListener((details) => {
  console.log('YouTube Live Translate 扩展已安装', details.reason);

  // 仅在首次安装时设置默认值，避免更新时覆盖用户设置
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      enabled: true,
      targetLang: 'zh-CN',
    });
  }
});

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    // 这里可以添加后台翻译逻辑
    sendResponse({ success: true });
  }

  return true;
});

export {};
