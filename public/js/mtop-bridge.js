/**
 * mtop-bridge.js
 * 
 * 此脚本在页面上下文中执行，用于安全地访问window.lib.mtop.H5Request
 * 通过消息传递机制与content script通信
 */

(function() {
  // 监听来自content script的消息
  window.addEventListener('message', function(event) {
    // 确保消息来源是当前页面
    if (event.source !== window) return;
    
    const data = event.data;
    
    // 检查消息是否是我们期望的请求
    if (data && data.type === 'MTOP_REQUEST') {
      const messageId = data.messageId;
      const reqData = data.reqData;
      
      try {
        // 检查window.lib.mtop.H5Request是否可用
        if (!window.lib || !window.lib.mtop || !window.lib.mtop.H5Request) {
          window.postMessage({
            type: 'MTOP_RESPONSE',
            messageId: messageId,
            error: 'window.lib.mtop.H5Request is not available'
          }, '*');
          return;
        }
        
        // 调用H5Request API
        window.lib.mtop.H5Request(reqData)
          .then(function(response) {
            window.postMessage({
              type: 'MTOP_RESPONSE',
              messageId: messageId,
              response: response,
              error: null
            }, '*');
          })
          .catch(function(error) {
            window.postMessage({
              type: 'MTOP_RESPONSE',
              messageId: messageId,
              response: null,
              error: error.message || 'Unknown error'
            }, '*');
          });
      } catch (error) {
        window.postMessage({
          type: 'MTOP_RESPONSE',
          messageId: messageId,
          response: null,
          error: error.message || 'Exception in mtop-bridge.js'
        }, '*');
      }
    }
  });
})();