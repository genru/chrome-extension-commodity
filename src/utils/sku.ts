interface SkuValue {
  comboPropertyValue: string;
  name: string;
  sortOrder: string;
  vid: string;
  image?: string; // Optional image property
}

export interface SkuProp {
  comboProperty: string;
  hasGroupTags: string;
  hasImage: string;
  name: string;
  packProp: string;
  pid: string;
  shouldGroup: string;
  values: SkuValue[];
  nameDesc?: string; // Optional nameDesc
}

export interface SkuItem {
  propPath: string; // e.g., "pid1:vid1;pid2:vid2"
  skuId: string;
}

interface SkuBase {
  components: any[]; // Adjust if you need specific types for components
  props: SkuProp[];
  skus: SkuItem[];
}

interface PriceInfo {
  priceColorNew: string;
  priceMoney: string;
  priceText: string;
}

interface SkuCoreInfo {
  cartParam?: { addCartCheck: string }; // Optional
  logisticsTime: string;
  moreQuantity: string;
  price: PriceInfo;
  quantity: string;
  quantityDisplayValue: string;
  quantityText: string;
  quantityErrorMsg?: string; // Optional
}

export interface SkuCore {
  sku2info: {
    [skuId: string]: SkuCoreInfo;
  };
  skuItem: {
    itemStatus: string;
    renderSku: string;
    unitBuy: string;
  };
}

export interface ProductData {
  skuBase: SkuBase;
  skuCore: SkuCore;
  // 允许任意属性名
  [key: string]: any;
}

export interface SkuPriceName {
  name: string;
  price: string;
  skuId: string;
}

/**
 * Extracts SKU names and prices from product data.
 *
 * @param data The product data object containing SKU base, props, and core info.
 * @returns An array of objects, each with a combined SKU name, its price, and skuId.
 */
export function getSkuPricesAndNames(data: ProductData): SkuPriceName[] {
  const skus = data.skuBase.skus;
  const skuInfoMap = data.skuCore.sku2info;
  const props = data.skuBase.props;

  const propMap = new Map<string, Map<string, string>>(); // Map: pid -> (vid -> name)

  // Populate the propMap for quick lookup of prop names based on pid and vid
  props.forEach(prop => {
    const valueMap = new Map<string, string>();
    prop.values.forEach(val => {
      valueMap.set(val.vid, val.name);
    });
    propMap.set(prop.pid, valueMap);
  });

  const pricesAndNames: SkuPriceName[] = [];

  skus.forEach(sku => {
    const skuId = sku.skuId;
    const propPath = sku.propPath; // e.g., "295251758:197010254;1627207:8237194892"

    const propParts = propPath.split(';'); // ["pid:vid", "pid:vid"]
    let skuNameParts: string[] = [];

    propParts.forEach(part => {
      const [pid, vid] = part.split(':');
      const valueName = propMap.get(pid)?.get(vid);
      if (valueName) {
        skuNameParts.push(valueName);
      }
    });

    const combinedSkuName = skuNameParts.join(' '); // Combine names, e.g., "古井贡酒年份原浆献礼 50度500mL*1瓶"

    const priceInfo = skuInfoMap[skuId];

    if (priceInfo) {
      const price = priceInfo.price.priceText;
      pricesAndNames.push({ name: combinedSkuName, price: price, skuId: skuId });
    }
  });

  return pricesAndNames;
}

// Example Usage (assuming skudata is loaded, e.g., from a JSON file or passed as a variable)
// const skudata: ProductData = yourLoadedJsonData;

// For demonstration, using the provided skudata as a placeholder:
const skudata: ProductData = {
  "seller": { /* ... */ },
  "item": { /* ... */ },
  "feature": { /* ... */ },
  "plusViewVO": { /* ... */ },
  "skuCore": {
    "sku2info": {
      "0": {
        "logisticsTime": "48小时内发货", "moreQuantity": "false",
        "price": { "priceColorNew": "#FF5000", "priceMoney": "8800", "priceText": "88起" },
        "quantity": "86", "quantityDisplayValue": "1", "quantityText": "有货"
      },
      "6021693851078": {
        "cartParam": { "addCartCheck": "true" }, "logisticsTime": "48小时内发货", "moreQuantity": "false",
        "price": { "priceColorNew": "#FF5000", "priceMoney": "17600", "priceText": "176" },
        "quantity": "28", "quantityDisplayValue": "1", "quantityText": "有货"
      },
      "5855642621500": {
        "cartParam": { "addCartCheck": "true" }, "logisticsTime": "48小时内发货", "moreQuantity": "false",
        "price": { "priceColorNew": "#FF5000", "priceMoney": "52800", "priceText": "528" },
        "quantity": "30", "quantityDisplayValue": "1", "quantityText": "有货"
      },
      "6021693851077": {
        "cartParam": { "addCartCheck": "true" }, "logisticsTime": "48小时内发货", "moreQuantity": "false",
        "price": { "priceColorNew": "#FF5000", "priceMoney": "8800", "priceText": "88" },
        "quantity": "28", "quantityDisplayValue": "1", "quantityText": "有货"
      },
      "6063031927546": {
        "cartParam": { "addCartCheck": "true" }, "logisticsTime": "48小时内发货", "moreQuantity": "false",
        "price": { "priceColorNew": "#FF5000", "priceMoney": "60000", "priceText": "600" },
        "quantity": "0", "quantityDisplayValue": "1", "quantityErrorMsg": "超出商品库存限制", "quantityText": "无货"
      },
      "6063031927544": {
        "cartParam": { "addCartCheck": "true" }, "logisticsTime": "48小时内发货", "moreQuantity": "false",
        "price": { "priceColorNew": "#FF5000", "priceMoney": "10000", "priceText": "100" },
        "quantity": "0", "quantityDisplayValue": "1", "quantityErrorMsg": "超出商品库存限制", "quantityText": "无货"
      },
      "6063031927545": {
        "cartParam": { "addCartCheck": "true" }, "logisticsTime": "48小时内发货", "moreQuantity": "false",
        "price": { "priceColorNew": "#FF5000", "priceMoney": "19900", "priceText": "199" },
        "quantity": "0", "quantityDisplayValue": "1", "quantityErrorMsg": "超出商品库存限制", "quantityText": "无货"
      }
    },
    "skuItem": { "itemStatus": "0", "renderSku": "true", "unitBuy": "1" }
  },
  "params": { /* ... */ },
  "skuBase": {
    "components": [],
    "props": [
      {
        "comboProperty": "false", "hasGroupTags": "false", "hasImage": "false", "name": "规格描述",
        "packProp": "false", "pid": "295251758", "shouldGroup": "false",
        "values": [{ "comboPropertyValue": "false", "name": "古井贡酒年份原浆献礼", "sortOrder": "0", "vid": "197010254" }]
      },
      {
        "comboProperty": "false", "hasGroupTags": "false", "hasImage": "true", "name": "颜色分类",
        "nameDesc": "（6）", "packProp": "false", "pid": "1627207", "shouldGroup": "false",
        "values": [
          { "comboPropertyValue": "false", "image": "https://gw.alicdn.com/bao/uploaded/i2/3377540910/O1CN01o61AH51IapUPKnoVm_!!3377540910.jpg", "name": "50度500mL*1瓶", "sortOrder": "1", "vid": "8237194892" },
          { "comboPropertyValue": "false", "image": "https://gw.alicdn.com/bao/uploaded/i4/3377540910/O1CN018iPfB51IapUQ3JFcw_!!3377540910.jpg", "name": "50度500mL*2瓶", "sortOrder": "2", "vid": "6113864979" },
          { "comboPropertyValue": "false", "image": "https://gw.alicdn.com/bao/uploaded/i3/3377540910/O1CN01hBBZZq1IapUNSSziN_!!3377540910.jpg", "name": "50度500mL*6瓶", "sortOrder": "3", "vid": "1957164755" },
          { "comboPropertyValue": "false", "image": "https://gw.alicdn.com/bao/uploaded/i2/3377540910/O1CN013zA2jF1IapV4fgNee_!!3377540910.jpg", "name": "♥50度500mL*1瓶", "sortOrder": "4", "vid": "39314298960" },
          { "comboPropertyValue": "false", "image": "https://gw.alicdn.com/bao/uploaded/i2/3377540910/O1CN01H704nn1IapV3kfwrE_!!3377540910.jpg", "name": "♥50度500mL*2瓶", "sortOrder": "5", "vid": "39314298961" },
          { "comboPropertyValue": "false", "image": "https://gw.alicdn.com/bao/uploaded/i2/3377540910/O1CN011zMzRQ1IapV4eCXbJ_!!3377540910.jpg", "name": "♥50度500mL*6瓶", "sortOrder": "6", "vid": "39314298962" }
        ]
      }
    ],
    "skus": [
      { "propPath": "295251758:197010254;1627207:8237194892", "skuId": "6021693851077" },
      { "propPath": "295251758:197010254;1627207:6113864979", "skuId": "6021693851078" },
      { "propPath": "295251758:197010254;1627207:1957164755", "skuId": "5855642621500" },
      { "propPath": "295251758:197010254;1627207:39314298960", "skuId": "6063031927544" },
      { "propPath": "295251758:197010254;1627207:39314298961", "skuId": "6063031927545" },
      { "propPath": "295251758:197010254;1627207:39314298962", "skuId": "6063031927546" }
    ]
  },
  "pcTrade": { /* ... */ },
  "componentsVO": { /* ... */ }
};

// const result = getSkuPricesAndNames(skudata);
// console.log(result);
/* Expected Output based on skudata.json:
[
  { name: '古井贡酒年份原浆献礼 50度500mL*1瓶', price: '88', skuId: '6021693851077' },
  { name: '古井贡酒年份原浆献礼 50度500mL*2瓶', price: '176', skuId: '6021693851078' },
  { name: '古井贡酒年份原浆献礼 50度500mL*6瓶', price: '528', skuId: '5855642621500' },
  { name: '古井贡酒年份原浆献礼 ♥50度500mL*1瓶', price: '100', skuId: '6063031927544' },
  { name: '古井贡酒年份原浆献礼 ♥50度500mL*2瓶', price: '199', skuId: '6063031927545' },
  { name: '古井贡酒年份原浆献礼 ♥50度500mL*6瓶', price: '600', skuId: '6063031927546' }
]
*/
