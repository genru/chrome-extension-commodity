// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'save_taobao_data' && message.data) {
    // 保存提取的淘宝商品数据到本地存储
    chrome.storage.local.set({ taobaoData: message.data }, () => {
      console.log('淘宝商品数据已保存到本地存储');
      sendResponse({ success: true });
    });
    return true; // 保持消息通道开放，以便异步响应
  } 
  // 转发进度更新消息到popup
  else if (message.action === 'progress_update') {
    // 获取当前活动标签页的ID
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // 记录进度到控制台
      console.log(`进度更新: ${message.status} - ${message.progress}%`);
      
      // 将消息转发到所有标签页，让popup能够接收
      chrome.runtime.sendMessage(message, () => {
        // 处理可能的错误
        if (chrome.runtime.lastError) {
          console.error('发送进度更新消息失败:', chrome.runtime.lastError);
        }
      });
      
      // 发送响应
      sendResponse({ received: true });
    });
    return true; // 保持消息通道开放，以便异步响应
  }
});

// 添加右键菜单，用于在任何页面上快速提取淘宝商品数据
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'extract_taobao_items',
    title: '提取淘宝商品数据',
    contexts: ['page']
  });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'extract_taobao_items' && tab?.id) {
    chrome.tabs.sendMessage(
      tab.id,
      { action: 'extract_taobao_items' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('提取失败:', chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.items) {
          // 保存到本地存储
          chrome.storage.local.set({ taobaoData: response }, () => {
            console.log('数据已保存到本地存储');
            // 显示提取成功的通知
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon.png',
              title: '淘宝商品数据提取成功',
              message: `成功提取 ${response.itemCount} 个商品数据`
            });
          });
        }
      }
    );
  }
});
