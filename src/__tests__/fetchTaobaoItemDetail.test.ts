/**
 * @jest-environment jsdom
 */

// 导入需要测试的函数
// 注意：由于fetchTaobaoItemDetail是在content_script.tsx中定义的，
// 我们需要模拟这个函数而不是直接导入它

// 模拟全局fetch函数
global.fetch = jest.fn();

// 模拟chrome API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  }
} as any;

// 模拟md5函数
jest.mock('../utils/md5', () => ({
  md5: jest.fn().mockImplementation((str) => 'mocked_md5_hash')
}));

describe('fetchTaobaoItemDetail 函数测试', () => {
  // 在每个测试前重置模拟
  beforeEach(() => {
    jest.resetAllMocks();
    
    // 模拟document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '_m_h5_tk=mock_token_12345678; other_cookie=value',
    });
    
    // 模拟fetch返回成功响应
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ret: ['SUCCESS::调用成功'],
        data: {
          item: {
            title: '测试商品',
            price: '99.00',
            images: ['image1.jpg', 'image2.jpg']
          },
          seller: {
            shopName: '测试店铺'
          }
        }
      })
    });
  });

  test('使用有效的商品ID调用fetchTaobaoItemDetail应该成功返回商品详情', async () => {
    // 导入测试对象
    // 注意：我们需要在测试内部导入，以确保模拟已经设置好
    const contentScript = require('../content_script');
    const fetchTaobaoItemDetail = contentScript.fetchTaobaoItemDetail;
    
    // 调用函数
    const itemId = '946595238196';
    const result = await fetchTaobaoItemDetail(itemId);
    
    // 验证fetch被正确调用
    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    // 验证URL包含正确的商品ID
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(fetchCall).toContain(`itemNumId%22%3A%22${itemId}%22`);
    
    // 验证请求包含必要的参数
    expect(fetchCall).toContain('api=mtop.taobao.pcdetail.data.get');
    expect(fetchCall).toContain('v=1.0');
    expect(fetchCall).toContain('appKey=12574478');
    expect(fetchCall).toContain('sign=mocked_md5_hash');
    
    // 验证请求头
    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers.get('Referer')).toBe(`https://detail.tmall.com/item.htm?id=${itemId}`);
    expect(headers.get('User-Agent')).toBeDefined();
    expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
    
    // 验证返回的数据
    expect(result).toEqual({
      item: {
        title: '测试商品',
        price: '99.00',
        images: ['image1.jpg', 'image2.jpg']
      },
      seller: {
        shopName: '测试店铺'
      }
    });
  });

  test('当API返回错误时，fetchTaobaoItemDetail应该抛出异常', async () => {
    // 模拟API返回错误
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ret: ['FAIL::调用失败'],
        data: {}
      })
    });
    
    // 导入测试对象
    const contentScript = require('../content_script');
    const fetchTaobaoItemDetail = contentScript.fetchTaobaoItemDetail;
    
    // 调用函数并期望抛出异常
    const itemId = '946595238196';
    await expect(fetchTaobaoItemDetail(itemId)).rejects.toThrow('API返回错误');
  });

  test('当网络请求失败时，fetchTaobaoItemDetail应该抛出异常', async () => {
    // 模拟网络请求失败
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    // 导入测试对象
    const contentScript = require('../content_script');
    const fetchTaobaoItemDetail = contentScript.fetchTaobaoItemDetail;
    
    // 调用函数并期望抛出异常
    const itemId = '946595238196';
    await expect(fetchTaobaoItemDetail(itemId)).rejects.toThrow('API请求失败: 500 Internal Server Error');
  });

  test('当cookie中没有_m_h5_tk时，fetchTaobaoItemDetail应该抛出异常', async () => {
    // 模拟没有_m_h5_tk的cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'other_cookie=value',
    });
    
    // 导入测试对象
    const contentScript = require('../content_script');
    const fetchTaobaoItemDetail = contentScript.fetchTaobaoItemDetail;
    
    // 调用函数并期望抛出异常
    const itemId = '946595238196';
    await expect(fetchTaobaoItemDetail(itemId)).rejects.toThrow('未找到_m_h5_tk cookie');
  });
});