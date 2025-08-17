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

      // 从存储中获取当前最高进度，确保进度不会回退
      chrome.storage.local.get('progressUpdate', (data) => {
        const currentStoredProgress = data.progressUpdate?.progress || 0;
        const newProgress = message.progress;

        // 如果新进度小于已存储的进度，则保持使用已存储的较高进度值
        if (newProgress < currentStoredProgress) {
          console.log(`防止进度回退: 保持进度 ${currentStoredProgress}% (忽略新进度 ${newProgress}%)`);
          message.progress = currentStoredProgress;
        }

        // 将消息存储在本地，让popup可以在打开时获取最新进度
        chrome.storage.local.set({ progressUpdate: message }, () => {
          // 尝试将消息转发到所有标签页，让已打开的popup能够接收
          try {
            chrome.runtime.sendMessage(message, () => {
              // 忽略"Receiving end does not exist"错误，这是正常的，当popup未打开时会发生
              if (chrome.runtime.lastError) {
                // 只记录日志，不作为错误处理
                console.log('进度更新消息未被接收 (popup可能未打开)');
              }
            });
          } catch (error) {
            console.log('发送进度更新消息时出现异常:', error);
          }
        });
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
    // 默认提取1页
    const maxPages = 5;

    chrome.tabs.sendMessage(
      tab.id,
      { action: 'extract_taobao_items', maxPages },
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
