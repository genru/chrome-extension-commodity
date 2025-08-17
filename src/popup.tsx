import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

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

interface ExtractedData {
  pageTitle: string;
  pageUrl: string;
  items: TaobaoItem[];
  timestamp: string;
  itemCount: number;
}

const Popup = () => {
  const [count, setCount] = useState(0);
  const [currentURL, setCurrentURL] = useState<string>();
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("就绪");
  const [progress, setProgress] = useState<number>(0);
  const [maxPages, setMaxPages] = useState<number>(5);

  useEffect(() => {
    chrome.action.setBadgeText({ text: count.toString() });
  }, [count]);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      setCurrentURL(tabs[0].url);
    });

    // 从本地存储加载之前保存的数据
    chrome.storage.local.get('taobaoData', (result) => {
      if (result.taobaoData) {
        console.log('从本地存储加载数据:', result.taobaoData);
        setExtractedData(result.taobaoData);
        setStatus("已加载保存的数据");
      }
    });

    // 添加消息监听器，接收进度更新
    const messageListener = (message: { action: string; status: React.SetStateAction<string>; progress: React.SetStateAction<number>; }, sender: any, sendResponse: any) => {
      if (message.action === 'progress_update') {
        setStatus(message.status);
        setProgress(message.progress);
        // 立即发送响应，不再返回 true 表示异步
        sendResponse({ received: true });
      }
      return false; // 表示同步处理完成
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // 组件卸载时移除监听器
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // 提取淘宝商品数据
  const extractTaobaoData = () => {
    setIsLoading(true);
    setError(null);
    setStatus("准备中...");
    setProgress(5);

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.floor(Math.random() * 10) + 1;
      });
    }, 500);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (tab.id) {
        setStatus("正在分析页面...");
        setProgress(15);

        chrome.tabs.sendMessage(
          tab.id,
          { action: "extract_taobao_items", maxPages: maxPages },
          (response) => {
            clearInterval(progressInterval);
            setIsLoading(false);

            if (chrome.runtime.lastError) {
              setStatus("提取失败");
              setProgress(0);
              setError(`提取失败: ${chrome.runtime.lastError.message}`);
              return;
            }

            if (response && response.items) {
              setStatus("提取完成");
              setProgress(100);
              setExtractedData(response);
              // 保存到本地存储
              chrome.storage.local.set({ taobaoData: response }, () => {
                console.log('数据已保存到本地存储');
              });
            } else {
              setStatus("未找到数据");
              setProgress(0);
              setError("未找到商品数据，请确认当前页面是淘宝商品列表");
            }
          }
        );
      } else {
        clearInterval(progressInterval);
        setIsLoading(false);
        setStatus("错误");
        setProgress(0);
        setError("无法获取当前标签页");
      }
    });
  };

  // 导出数据为CSV
  const exportToCSV = () => {
    if (!extractedData || !extractedData.items.length) return;

    const headers = ["标题", "链接", "价格", "规格", "店铺名称", "店铺链接"];
    const csvRows = [
      headers.join(","),
      ...extractedData.items.map(item =>
        [
          `"${item.title.replace(/"/g, '""')}"`,
          `"${item.url}"`,
          `"${item.price}"`,
          `"${item.spec.replace(/"/g, '""')}"`,
          `"${item.shopName.replace(/"/g, '""')}"`,
          `"${item.shopUrl}"`
        ].join(",")
      )
    ];

    // 使用正确的换行符连接行
    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `淘宝商品数据_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 导出后清除本地存储的数据
    chrome.storage.local.remove('taobaoData', () => {
      console.log('导出完成，已清除本地存储的数据');
      setExtractedData(null);
      setStatus("就绪");
    });
  };

  return (
    <>
      <div style={{ minWidth: "700px", padding: "10px" }}>
        <h2>淘宝商品数据提取工具</h2>

        <div style={{ marginBottom: "15px" }}>
          <p><strong>当前时间:</strong> {new Date().toLocaleTimeString()}</p>
        </div>

        <div style={{ marginBottom: "15px", display: "flex", alignItems: "center" }}>
          <div style={{ marginRight: "15px", display: "flex", alignItems: "center" }}>
            <label style={{ marginRight: "8px", fontWeight: "bold" }}>
              提取页数:
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={maxPages}
              onChange={(e) => setMaxPages(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              style={{
                width: "60px",
                padding: "5px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={extractTaobaoData}
            disabled={isLoading}
            style={{
              padding: "10px 24px",
              backgroundColor: "#ff4400",
              color: "white",
              border: "none",
              borderRadius: "4px",
              marginRight: "10px",
              cursor: isLoading ? "wait" : "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {isLoading ? "提取中..." : "开始"}
          </button>

          <button
            onClick={exportToCSV}
            disabled={!extractedData}
            style={{
              padding: "8px 16px",
              backgroundColor: extractedData ? "#1890ff" : "#d9d9d9",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: extractedData ? "pointer" : "not-allowed",
              marginRight: "10px"
            }}
          >
            导出CSV
          </button>

          <button
            onClick={() => {
              chrome.storage.local.remove('taobaoData', () => {
                console.log('已清除本地存储的数据');
                setExtractedData(null);
                setStatus("就绪");
              });
            }}
            disabled={!extractedData}
            style={{
              padding: "8px 16px",
              backgroundColor: extractedData ? "#ff4d4f" : "#d9d9d9",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: extractedData ? "pointer" : "not-allowed"
            }}
          >
            清除数据
          </button>
        </div>

        {/* 状态和进度显示 */}
        <div style={{ marginBottom: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
            <span style={{ marginRight: "10px", fontWeight: "bold" }}>状态:</span>
            <span style={{
              color: status === "提取完成" ? "green" :
                     status === "错误" || status === "提取失败" || status === "未找到数据" ? "red" :
                     status === "就绪" ? "#666" : "#ff8c00"
            }}>
              {status}
            </span>
          </div>

          {isLoading && (
            <div style={{ width: "100%" }}>
              <div style={{
                height: "8px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: "#ff4400",
                  borderRadius: "4px",
                  transition: "width 0.3s ease-in-out"
                }} />
              </div>
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                fontSize: "12px",
                color: "#666",
                marginTop: "3px"
              }}>
                {progress}%
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: "red", marginBottom: "15px", padding: "8px", backgroundColor: "#fff2f0", border: "1px solid #ffccc7", borderRadius: "4px" }}>
            {error}
          </div>
        )}

        {extractedData && (
          <div>
            <h3>提取结果 ({extractedData.itemCount} 个商品)</h3>
            <div style={{ maxHeight: "400px", overflow: "auto", border: "1px solid #eee", padding: "10px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f7f7f7" }}>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>标题</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>价格</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>店铺</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.items.map((item, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9" }}>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#1890ff", textDecoration: "none" }}>
                          {item.title}
                        </a>
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{item.price}</td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{item.spec}</td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                        <a href={item.shopUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1890ff", textDecoration: "none" }}>
                          {item.shopName}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
