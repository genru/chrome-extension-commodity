import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const Options = () => {
  const [status, setStatus] = useState<string>("");
  const [autoExtract, setAutoExtract] = useState<boolean>(false);
  const [extractFields, setExtractFields] = useState<{
    title: boolean;
    url: boolean;
    price: boolean;
    spec: boolean;
    shopName: boolean;
    shopUrl: boolean;
  }>({
    title: true,
    url: true,
    price: true,
    spec: true,
    shopName: true,
    shopUrl: true,
  });
  const [csvDelimiter, setCsvDelimiter] = useState<string>(",");
  const [notifyOnExtract, setNotifyOnExtract] = useState<boolean>(true);
  const [maxItems, setMaxItems] = useState<number>(100);

  useEffect(() => {
    // 从存储中恢复选项设置
    chrome.storage.sync.get(
      {
        autoExtract: false,
        extractFields: {
          title: true,
          url: true,
          price: true,
          spec: true,
          shopName: true,
          shopUrl: true,
        },
        csvDelimiter: ",",
        notifyOnExtract: true,
        maxItems: 100,
      },
      (items) => {
        setAutoExtract(items.autoExtract);
        setExtractFields(items.extractFields);
        setCsvDelimiter(items.csvDelimiter);
        setNotifyOnExtract(items.notifyOnExtract);
        setMaxItems(items.maxItems);
      }
    );
  }, []);

  const saveOptions = () => {
    // 保存选项到 chrome.storage.sync
    chrome.storage.sync.set(
      {
        autoExtract,
        extractFields,
        csvDelimiter,
        notifyOnExtract,
        maxItems,
      },
      () => {
        // 更新状态，让用户知道选项已保存
        setStatus("设置已保存");
        const id = setTimeout(() => {
          setStatus("");
        }, 2000);
        return () => clearTimeout(id);
      }
    );
  };

  const handleFieldChange = (field: string, checked: boolean) => {
    setExtractFields({
      ...extractFields,
      [field]: checked,
    });
  };

  const clearStoredData = () => {
    chrome.storage.local.remove("taobaoData", () => {
      setStatus("已清除所有存储的商品数据");
      setTimeout(() => {
        setStatus("");
      }, 2000);
    });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>淘宝商品数据提取工具 - 设置</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>数据提取设置</h3>
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="checkbox"
              checked={autoExtract}
              onChange={(e) => setAutoExtract(e.target.checked)}
            />
            自动提取（页面加载完成后自动提取数据）
          </label>
        </div>
        
        <div style={{ marginBottom: "10px" }}>
          <p style={{ marginBottom: "5px" }}>要提取的字段：</p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <label style={{ marginRight: "15px", marginBottom: "5px" }}>
              <input
                type="checkbox"
                checked={extractFields.title}
                onChange={(e) => handleFieldChange("title", e.target.checked)}
              />
              商品标题
            </label>
            <label style={{ marginRight: "15px", marginBottom: "5px" }}>
              <input
                type="checkbox"
                checked={extractFields.url}
                onChange={(e) => handleFieldChange("url", e.target.checked)}
              />
              商品链接
            </label>
            <label style={{ marginRight: "15px", marginBottom: "5px" }}>
              <input
                type="checkbox"
                checked={extractFields.price}
                onChange={(e) => handleFieldChange("price", e.target.checked)}
              />
              商品价格
            </label>
            <label style={{ marginRight: "15px", marginBottom: "5px" }}>
              <input
                type="checkbox"
                checked={extractFields.spec}
                onChange={(e) => handleFieldChange("spec", e.target.checked)}
              />
              商品规格
            </label>
            <label style={{ marginRight: "15px", marginBottom: "5px" }}>
              <input
                type="checkbox"
                checked={extractFields.shopName}
                onChange={(e) => handleFieldChange("shopName", e.target.checked)}
              />
              店铺名称
            </label>
            <label style={{ marginRight: "15px", marginBottom: "5px" }}>
              <input
                type="checkbox"
                checked={extractFields.shopUrl}
                onChange={(e) => handleFieldChange("shopUrl", e.target.checked)}
              />
              店铺链接
            </label>
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>导出设置</h3>
        <div style={{ marginBottom: "10px" }}>
          <label>
            CSV 分隔符：
            <select
              value={csvDelimiter}
              onChange={(e) => setCsvDelimiter(e.target.value)}
              style={{ marginLeft: "10px" }}
            >
              <option value=",">逗号 (,)</option>
              <option value=";">分号 (;)</option>
              <option value="\t">制表符 (Tab)</option>
            </select>
          </label>
        </div>
        
        <div style={{ marginBottom: "10px" }}>
          <label>
            最大提取商品数量：
            <input
              type="number"
              min="1"
              max="1000"
              value={maxItems}
              onChange={(e) => setMaxItems(parseInt(e.target.value) || 100)}
              style={{ marginLeft: "10px", width: "80px" }}
            />
          </label>
        </div>
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>通知设置</h3>
        <div>
          <label>
            <input
              type="checkbox"
              checked={notifyOnExtract}
              onChange={(e) => setNotifyOnExtract(e.target.checked)}
            />
            提取完成后显示通知
          </label>
        </div>
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>数据管理</h3>
        <button 
          onClick={clearStoredData}
          style={{ 
            padding: "8px 16px", 
            backgroundColor: "#ff4d4f", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          清除所有存储的商品数据
        </button>
      </div>
      
      <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "green", fontWeight: "bold" }}>{status}</div>
        <button 
          onClick={saveOptions}
          style={{ 
            padding: "8px 20px", 
            backgroundColor: "#1890ff", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          保存设置
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
