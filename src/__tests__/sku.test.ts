import { getSkuPricesAndNames, ProductData, SkuPriceName } from '../utils/sku';

describe('SKU Utility Functions', () => {
  describe('getSkuPricesAndNames', () => {
    it('should extract SKU names and prices correctly', () => {
      // 准备测试数据
      const testData: ProductData = {
        skuBase: {
          components: [],
          props: [
            {
              comboProperty: "false",
              hasGroupTags: "false",
              hasImage: "false",
              name: "规格描述",
              packProp: "false",
              pid: "295251758",
              shouldGroup: "false",
              values: [{ 
                comboPropertyValue: "false", 
                name: "古井贡酒年份原浆献礼", 
                sortOrder: "0", 
                vid: "197010254" 
              }]
            },
            {
              comboProperty: "false",
              hasGroupTags: "false",
              hasImage: "true",
              name: "颜色分类",
              nameDesc: "（6）",
              packProp: "false",
              pid: "1627207",
              shouldGroup: "false",
              values: [
                { 
                  comboPropertyValue: "false", 
                  image: "https://example.com/image1.jpg", 
                  name: "50度500mL*1瓶", 
                  sortOrder: "1", 
                  vid: "8237194892" 
                },
                { 
                  comboPropertyValue: "false", 
                  image: "https://example.com/image2.jpg", 
                  name: "50度500mL*2瓶", 
                  sortOrder: "2", 
                  vid: "6113864979" 
                }
              ]
            }
          ],
          skus: [
            { propPath: "295251758:197010254;1627207:8237194892", skuId: "6021693851077" },
            { propPath: "295251758:197010254;1627207:6113864979", skuId: "6021693851078" }
          ]
        },
        skuCore: {
          sku2info: {
            "6021693851077": {
              logisticsTime: "48小时内发货",
              moreQuantity: "false",
              price: { 
                priceColorNew: "#FF5000", 
                priceMoney: "8800", 
                priceText: "88" 
              },
              quantity: "28",
              quantityDisplayValue: "1",
              quantityText: "有货"
            },
            "6021693851078": {
              logisticsTime: "48小时内发货",
              moreQuantity: "false",
              price: { 
                priceColorNew: "#FF5000", 
                priceMoney: "17600", 
                priceText: "176" 
              },
              quantity: "28",
              quantityDisplayValue: "1",
              quantityText: "有货"
            }
          },
          skuItem: { 
            itemStatus: "0", 
            renderSku: "true", 
            unitBuy: "1" 
          }
        }
      };

      // 执行测试函数
      const result = getSkuPricesAndNames(testData);

      // 验证结果
      const expected: SkuPriceName[] = [
        { name: '古井贡酒年份原浆献礼 50度500mL*1瓶', price: '88', skuId: '6021693851077' },
        { name: '古井贡酒年份原浆献礼 50度500mL*2瓶', price: '176', skuId: '6021693851078' }
      ];

      expect(result).toEqual(expected);
    });

    it('should handle empty SKU data', () => {
      // 准备空数据
      const emptyData: ProductData = {
        skuBase: {
          components: [],
          props: [],
          skus: []
        },
        skuCore: {
          sku2info: {},
          skuItem: { 
            itemStatus: "0", 
            renderSku: "true", 
            unitBuy: "1" 
          }
        }
      };

      // 执行测试函数
      const result = getSkuPricesAndNames(emptyData);

      // 验证结果
      expect(result).toEqual([]);
    });

    it('should handle missing price information', () => {
      // 准备缺少价格信息的数据
      const missingPriceData: ProductData = {
        skuBase: {
          components: [],
          props: [
            {
              comboProperty: "false",
              hasGroupTags: "false",
              hasImage: "false",
              name: "规格描述",
              packProp: "false",
              pid: "295251758",
              shouldGroup: "false",
              values: [{ 
                comboPropertyValue: "false", 
                name: "古井贡酒年份原浆献礼", 
                sortOrder: "0", 
                vid: "197010254" 
              }]
            }
          ],
          skus: [
            { propPath: "295251758:197010254", skuId: "6021693851077" }
          ]
        },
        skuCore: {
          sku2info: {
            // 故意不提供 6021693851077 的价格信息
          },
          skuItem: { 
            itemStatus: "0", 
            renderSku: "true", 
            unitBuy: "1" 
          }
        }
      };

      // 执行测试函数
      const result = getSkuPricesAndNames(missingPriceData);

      // 验证结果 - 应该返回空数组，因为没有价格信息
      expect(result).toEqual([]);
    });

    it('should handle invalid property paths', () => {
      // 准备包含无效属性路径的数据
      const invalidPathData: ProductData = {
        skuBase: {
          components: [],
          props: [
            {
              comboProperty: "false",
              hasGroupTags: "false",
              hasImage: "false",
              name: "规格描述",
              packProp: "false",
              pid: "295251758",
              shouldGroup: "false",
              values: [{ 
                comboPropertyValue: "false", 
                name: "古井贡酒年份原浆献礼", 
                sortOrder: "0", 
                vid: "197010254" 
              }]
            }
          ],
          skus: [
            { propPath: "invalid:path", skuId: "6021693851077" }
          ]
        },
        skuCore: {
          sku2info: {
            "6021693851077": {
              logisticsTime: "48小时内发货",
              moreQuantity: "false",
              price: { 
                priceColorNew: "#FF5000", 
                priceMoney: "8800", 
                priceText: "88" 
              },
              quantity: "28",
              quantityDisplayValue: "1",
              quantityText: "有货"
            }
          },
          skuItem: { 
            itemStatus: "0", 
            renderSku: "true", 
            unitBuy: "1" 
          }
        }
      };

      // 执行测试函数
      const result = getSkuPricesAndNames(invalidPathData);

      // 验证结果 - 应该返回一个只有价格和ID的对象，名称为空
      expect(result).toEqual([
        { name: '', price: '88', skuId: '6021693851077' }
      ]);
    });

    it('should handle complex SKU data with multiple properties', () => {
      // 准备复杂的测试数据，包含多个属性
      const complexData: ProductData = {
        skuBase: {
          components: [],
          props: [
            {
              comboProperty: "false",
              hasGroupTags: "false",
              hasImage: "false",
              name: "规格描述",
              packProp: "false",
              pid: "295251758",
              shouldGroup: "false",
              values: [{ 
                comboPropertyValue: "false", 
                name: "古井贡酒年份原浆献礼", 
                sortOrder: "0", 
                vid: "197010254" 
              }]
            },
            {
              comboProperty: "false",
              hasGroupTags: "false",
              hasImage: "true",
              name: "颜色分类",
              packProp: "false",
              pid: "1627207",
              shouldGroup: "false",
              values: [
                { 
                  comboPropertyValue: "false", 
                  name: "50度500mL*1瓶", 
                  sortOrder: "1", 
                  vid: "8237194892" 
                }
              ]
            },
            {
              comboProperty: "false",
              hasGroupTags: "false",
              hasImage: "false",
              name: "包装",
              packProp: "false",
              pid: "123456",
              shouldGroup: "false",
              values: [
                { 
                  comboPropertyValue: "false", 
                  name: "礼盒装", 
                  sortOrder: "1", 
                  vid: "789012" 
                }
              ]
            }
          ],
          skus: [
            { propPath: "295251758:197010254;1627207:8237194892;123456:789012", skuId: "6021693851077" }
          ]
        },
        skuCore: {
          sku2info: {
            "6021693851077": {
              logisticsTime: "48小时内发货",
              moreQuantity: "false",
              price: { 
                priceColorNew: "#FF5000", 
                priceMoney: "8800", 
                priceText: "88" 
              },
              quantity: "28",
              quantityDisplayValue: "1",
              quantityText: "有货"
            }
          },
          skuItem: { 
            itemStatus: "0", 
            renderSku: "true", 
            unitBuy: "1" 
          }
        }
      };

      // 执行测试函数
      const result = getSkuPricesAndNames(complexData);

      // 验证结果 - 应该包含所有属性名称
      expect(result).toEqual([
        { name: '古井贡酒年份原浆献礼 50度500mL*1瓶 礼盒装', price: '88', skuId: '6021693851077' }
      ]);
    });
  });
});