import { getSkuPricesAndNames } from "./utils/sku";


// 定义提取数据的类型
interface TaobaoItem {
  id: string;
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


/**
 * 安全访问网页上下文中的window.lib.mtop.H5Request
 * 通过消息传递机制与页面通信
 * @param reqData - 请求数据
 * @returns Promise<API响应>
 */
function accessWindowLib(reqData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // 创建一个唯一的消息ID
      const messageId = `mtop_request_${Date.now()}_${Math.floor(
        Math.random() * 1000000
      )}`;

      // 创建一个消息监听器
      const messageListener = (event: MessageEvent) => {
        // 确保消息来源是当前页面
        if (event.source !== window) return;

        const data = event.data;

        // 检查消息是否是我们期望的响应
        if (
          data &&
          data.type === "MTOP_RESPONSE" &&
          data.messageId === messageId
        ) {
          // 移除消息监听器
          window.removeEventListener("message", messageListener);

          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.response);
          }
        }
      };

      // 添加消息监听器
      window.addEventListener("message", messageListener);

      // 创建一个外部脚本文件
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("js/mtop-bridge.js");
      script.onload = () => {
        // 脚本加载完成后，发送消息到页面上下文
        window.postMessage(
          {
            type: "MTOP_REQUEST",
            messageId: messageId,
            reqData: reqData,
          },
          "*"
        );

        // 设置超时
        setTimeout(() => {
          window.removeEventListener("message", messageListener);
          reject(new Error("请求超时"));
        }, 30000); // 30秒超时
      };

      script.onerror = () => {
        window.removeEventListener("message", messageListener);
        reject(new Error("加载mtop-bridge.js失败"));
      };

      // 将脚本添加到页面
      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      reject(error);
    }
  });
}

const SECOND_FOR_WAITING:number = 10*1000;
/**
 * 从淘宝页面提取商品数据。
 *
 * @param {ProgressUpdateFn} [sendProgressUpdate] - 可选参数，用于发送进度更新的回调函数。
 *   回调函数接收两个参数：消息（string）和进度百分比（number）。
 *
 * @returns {ExtractedTaobaoData} 返回一个对象，包含以下字段：
 *   - `pageTitle`: 当前页面的标题。
 *   - `pageUrl`: 当前页面的URL。
 *   - `items`: 提取的商品数据数组，每个商品包含以下字段：
 *     - `id`: 商品ID。
 *     - `title`: 商品标题。
 *     - `url`: 商品链接。
 *     - `price`: 商品价格。
 *     - `spec`: 商品规格。
 *     - `shopName`: 店铺名称。
 *     - `shopUrl`: 店铺链接。
 *   - `timestamp`: 数据提取的时间戳（ISO格式）。
 *   - `itemCount`: 提取的有效商品数量。
 *
 * @throws 如果提取过程中发生错误，会将错误信息打印到控制台，并返回包含错误标记的商品数据。
 *
 * @remarks
 * - 淘宝的DOM结构可能会变化，因此代码中的选择器可能需要根据实际情况调整。
 * - 进度更新功能是可选的，如果未提供回调函数，则不会发送进度更新。
 * - 无效数据（如标题为"N/A"或"Error"的商品）会被过滤掉。
 */
async function extractTaobaoItems(
  sendProgressUpdate?: ProgressUpdateFn
): Promise<ExtractedTaobaoData> {
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
  const items: Element[] = Array.from(
    document.querySelectorAll("#content_items_wrapper > div")
  );

  // 如果没有找到商品，抛出错误
  if (items.length === 0) {
    throw new Error("未找到任何商品，请确保您已打开淘宝商品列表页面");
  }

  if (sendProgressUpdate) {
    sendProgressUpdate(`找到 ${items.length} 个商品，开始提取数据...`, 20);
  }

  // 计算每个商品的进度增量
  const progressIncrement: number = items.length > 0 ? 70 / items.length : 0;
  let currentProgress: number = 20;
  // 记录商品提取阶段的最高进度值，确保进度不会回退
  let itemsHighestProgress: number = 20;

  const extractedData: TaobaoItem[] = items
    .map((item, index) => {
      try {
        // 每处理5个商品更新一次进度
        if (sendProgressUpdate && index % 5 === 0) {
          currentProgress += progressIncrement * 5;
          // 确保进度只增不减
          itemsHighestProgress = Math.max(itemsHighestProgress, currentProgress);
          sendProgressUpdate(
            `已提取 ${index}/${items.length} 个商品...`,
            Math.min(90, itemsHighestProgress)
          );
        }

        const itemId =
          item
            .querySelector("a[data-spm-act-id]")
            ?.getAttribute("data-spm-act-id") || "N/A";
        // 提取商品标题
        const titleElement = item.querySelector(
          "a[data-spm-act-id]  div[title]"
        ) as HTMLElement | null;
        const title: string =
          titleElement?.textContent?.trim() ||
          titleElement?.getAttribute("title")?.trim() ||
          "N/A";

        // 提取商品链接
        const linkElement = item.querySelector(
          "a[data-spm-act-id]"
        ) as HTMLAnchorElement | null;
        const url: string = linkElement?.href || "N/A";

        // 提取商品价格
        const priceElement = item.querySelector(
          "a[data-spm-act-id] div.innerPriceWrapper--aAJhHXD4"
        ) as HTMLElement | null;
        const price: string =
          priceElement?.textContent?.trim().replace(/[^\d.]/g, "") || "N/A11";

        // 提取商品规格
        const specElement = item.querySelector(
          ".attributes, .feature, .item-spec"
        ) as HTMLElement | null;
        const spec: string = specElement?.textContent?.trim() || "N/A";

        // 提取店铺名称和链接
        const shopElement = item.querySelector(
          "a[data-spm-act-id] span.shopNameText--DmtlsDKm"
        ) as HTMLElement | null;
        const shopName: string = shopElement?.textContent?.trim() || "N/A";

        const shopLinkElement = item.querySelector(
          "a[data-spm-act-id] a.shopName--hdF527QA"
        ) as HTMLAnchorElement | null;
        const shopUrl: string = shopLinkElement?.href || "N/A";

        return {
          id: itemId,
          title,
          url,
          price,
          spec,
          shopName,
          shopUrl,
        };
      } catch (error) {
        console.error("提取商品数据时出错:", error);
        return {
          id: "Error",
          title: "Error",
          url: "Error",
          price: "Error",
          spec: "Error",
          shopName: "Error",
          shopUrl: "Error",
        };
      }
    })
    .filter((item) => item.title !== "N/A" && item.title !== "Error"); // 过滤掉无效数据

  // 跳过SKU获取步骤
  if (sendProgressUpdate) {
    sendProgressUpdate("数据提取完成，准备最终数据...", 90);
  }

  // 为所有商品设置默认的spec值
  for (const item of extractedData) {
    item.spec = "SKU获取已跳过";
  }

  // 短暂延迟，让用户看到进度变化
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    pageTitle,
    pageUrl,
    items: extractedData,
    timestamp: new Date().toISOString(),
    itemCount: extractedData.length,
  };
}

/**
 * 请求淘宝商品详情API
 * @param itemId - 商品ID
 * @returns Promise<商品详情数据>
 */
export async function fetchTaobaoItemDetail(itemId: string): Promise<any> {
  try {
    // 构建请求数据
    const param = {
      id: itemId,
      detail_v: "3.3.2",
      "exParams": `{"\"id\":\"${itemId}\"}`
    };

    const reqData = {
        "api": "mtop.taobao.pcdetail.data.get",
        "v": "1.0",
        "data": param,
        "isSec": "0",
        "ecode": "0",
        "timeout": 10000,
        "jsonpIncPrefix": "pcdetail",
        "ttid": "2022@taobao_litepc_9.17.0",
        "AntiFlood": true,
        "AntiCreep": true
    };
    // 使用注入脚本的方式访问window.lib.mtop.H5Request
    const responseData = await accessWindowLib(reqData);
    // console.log('API响应数据:', responseData);

    // 检查API返回的状态码
    if (responseData && responseData.ret && responseData.ret[0].indexOf('SUCCESS') === -1) {
      throw new Error(`API返回错误: ${responseData.ret[0]}`);
    }

    console.log(`成功获取商品 ${itemId} 的详情数据`);
    return responseData;
  } catch (error) {
    console.error(`获取商品详情失败:`, error);
    throw error;
  }
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
      chrome.runtime.sendMessage(message, () => {
        // 处理可能的错误
        if (chrome.runtime.lastError) {
          console.error('发送进度更新消息失败:', chrome.runtime.lastError);
        }
      });
    };

    // 发送初始进度更新
    sendProgressUpdate("开始提取数据...", 10);

    // 使用setTimeout模拟异步操作，让UI有时间显示进度
    setTimeout(async () => {
      try {
        // 提取淘宝商品数据
        const data = await extractTaobaoItems(sendProgressUpdate);
        // console.log("提取的数据:", data);
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
  } else if (msg.action === 'fetch_item_detail' && msg.itemId) {
    // 处理获取商品详情的请求
    (async () => {
      try {
        // 发送进度更新
        const sendProgressUpdate = (statusText: string, progressPercent: number) => {
          chrome.runtime.sendMessage({
            action: 'progress_update',
            status: statusText,
            progress: progressPercent
          });
        };

        sendProgressUpdate("正在获取商品详情...", 30);

        // 调用API获取商品详情
        const itemDetail = await fetchTaobaoItemDetail(msg.itemId);

        sendProgressUpdate("商品详情获取成功", 100);

        // 发送响应
        sendResponse({ success: true, data: itemDetail });
      } catch (error) {
        console.error("获取商品详情失败:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        sendResponse({ success: false, error: errorMessage });
      }
    })();

    // 返回true以保持消息通道开放，允许异步响应
    return true;
  } else {
    sendResponse("Message not recognized.");
  }
});
