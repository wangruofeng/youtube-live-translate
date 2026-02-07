// Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Live Translate 扩展已安装');

  // 设置默认值
  chrome.storage.sync.set({
    enabled: true,
    targetLang: 'zh-CN',
  });
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
