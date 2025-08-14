// 提取淘宝商品列表页面的数据
interface TaobaoItem {
  title: string;
  url: string;
  price: string;
  spec: string;
  shopName: string;
  shopUrl: string;
}

interface ExtractedTaobaoData {
  pageTitle: string;
  pageUrl: string;
  items: TaobaoItem[];
  timestamp: string;
  itemCount: number;
}

type ProgressUpdateFn = (statusText: string, progressPercent: number) => void;

function extractTaobaoItems(sendProgressUpdate?: ProgressUpdateFn): ExtractedTaobaoData {
  console.info("开始提取淘宝商品数据...");
  // 发送初始进度更新
  if (sendProgressUpdate) {
    sendProgressUpdate("分析页面结构中...", 20);
  }

  // 获取当前页面URL
  const pageUrl: string = window.location.href;

  // 获取页面标题
  const pageTitle: string = document.title;

  // 发送进度更新
  if (sendProgressUpdate) {
    sendProgressUpdate("识别商品列表中...", 30);
  }

  // 提取商品列表
  // 注意：淘宝的DOM结构可能会变化，以下选择器需要根据实际情况调整
  const items: Element[] = Array.from(document.querySelectorAll('#content_items_wrapper > div'));
// console.info("items=", items);
  if (sendProgressUpdate) {
    sendProgressUpdate(`找到 ${items.length} 个商品，开始提取数据...`, 40);
  }

  // 计算每个商品的进度增量
  const progressIncrement: number = items.length > 0 ? 50 / items.length : 0;
  let currentProgress: number = 40;

  const extractedData: TaobaoItem[] = items.map((item, index) => {
    try {
      // 每处理5个商品更新一次进度
      if (sendProgressUpdate && index % 5 === 0) {
        currentProgress += progressIncrement * 5;
        sendProgressUpdate(`已提取 ${index}/${items.length} 个商品...`, Math.min(90, currentProgress));
      }

      const itemId = item.querySelector('a[data-spm-act-id]')?.getAttribute('data-spm-act-id') || 'N/A';
      // 提取商品标题
      const titleElement = item.querySelector('a[data-spm-act-id]  div[title]') as HTMLElement | null;
      const title: string = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || 'N/A';

      // 提取商品链接
      const linkElement = item.querySelector('a[data-spm-act-id]') as HTMLAnchorElement | null;
      const url: string = linkElement?.href || 'N/A';

      // 提取商品价格
      const priceElement = item.querySelector('a[data-spm-act-id] div.innerPriceWrapper--aAJhHXD4') as HTMLElement | null;
      const price: string = priceElement?.textContent?.trim().replace(/[^\d.]/g, '') || 'N/A11';

      // 提取商品规格
      const specElement = item.querySelector('.attributes, .feature, .item-spec') as HTMLElement | null;
      const spec: string = specElement?.textContent?.trim() || 'N/A';

      // 提取店铺名称和链接
      const shopElement = item.querySelector('a[data-spm-act-id] span.shopNameText--DmtlsDKm') as HTMLElement | null;
      const shopName: string = shopElement?.textContent?.trim() || 'N/A';

      const shopLinkElement = item.querySelector('a[data-spm-act-id] > a.shopName--hdF527QA') as HTMLAnchorElement | null;
      const shopUrl: string = shopLinkElement?.href || 'N/A';

      return {
        title,
        url,
        price,
        spec,
        shopName,
        shopUrl
      };
    } catch (error) {
      console.error('提取商品数据时出错:', error);
      return {
        title: 'Error',
        url: 'Error',
        price: 'Error',
        spec: 'Error',
        shopName: 'Error',
        shopUrl: 'Error'
      };
    }
  }).filter(item => item.title !== 'N/A' && item.title !== 'Error'); // 过滤掉无效数据
console.info("items=", items, extractedData);
  if (sendProgressUpdate) {
    sendProgressUpdate("数据处理中...", 95);
  }

  return {
    pageTitle,
    pageUrl,
    items: extractedData,
    timestamp: new Date().toISOString(),
    itemCount: extractedData.length
  };
}

// 监听来自扩展其他部分的消息
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log(msg);
  if (msg.action === 'extract_taobao_items') {
    // 创建进度更新函数
    interface ProgressUpdateMessage {
      action: 'progress_update';
      status: string;
      progress: number;
    }

    const sendProgressUpdate: ProgressUpdateFn = (statusText: string, progressPercent: number) => {
      const message: ProgressUpdateMessage = {
        action: 'progress_update',
        status: statusText,
        progress: progressPercent
      };
      chrome.runtime.sendMessage(message, (response) => {
        // 处理可能的错误
        if (chrome.runtime.lastError) {
          console.error('发送进度更新消息失败:', chrome.runtime.lastError);
        }
      });
    };

    // 发送初始进度更新
    sendProgressUpdate("开始提取数据...", 10);

    // 使用setTimeout模拟异步操作，让UI有时间显示进度
    setTimeout(() => {
      try {
        // 提取淘宝商品数据
        const data = extractTaobaoItems(sendProgressUpdate);
console.info("data=", data);
        // 发送最终进度更新
        sendProgressUpdate("提取完成，准备数据...", 100);

        // 延迟一点时间再发送响应，让用户看到100%的进度
        setTimeout(() => {
          sendResponse(data);
        }, 500);
      } catch (error) {
        console.error("提取数据时出错:", error);
        sendProgressUpdate("提取失败", 0);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        sendResponse({ error: errorMessage });
      }
    }, 300);

    // 返回true以保持消息通道开放，允许异步响应
    return true;
  } else {
    sendResponse("Message not recognized.");
  }
});
