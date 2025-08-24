/**
 * 许可证验证工具
 */

// 许可证状态类型
export enum LicenseStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  EXPIRED = 'expired',
  PENDING = 'pending',
  ERROR = 'error'
}

// 许可证验证结果接口
export interface LicenseVerificationResult {
  status: LicenseStatus;
  message: string;
  expiryDate?: string;
}

/**
 * 验证许可证
 * @param licenseKey 许可证密钥
 * @returns 返回一个Promise，解析为许可证验证结果
 */
export async function verifyLicense(licenseKey: string): Promise<LicenseVerificationResult> {
  if (!licenseKey || licenseKey.trim() === '') {
    return {
      status: LicenseStatus.INVALID,
      message: '请输入有效的许可证密钥'
    };
  }

  try {
    // 构建验证请求URL
    // 注意：在实际应用中，应该使用HTTPS并包含适当的安全措施
    const verificationUrl = `https://licenceman.njxyzc.com/licences/api/validate`;

    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    let data;

    try {
      const response = await fetch(verificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Id': 'app_7ld1qiudhs3',
          'X-Api-Key': 'key_ubr0ec13aq868z8f2tfevx'
        },
        body: JSON.stringify({ licenceKey:licenseKey, deviceId:"dev_us8yeo9Z3" }),
        signal: controller.signal
      });

      // 清除超时计时器
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status}`);
      }

      data = await response.json();
    } catch (fetchError) {
      // 处理 fetch 内部错误（如超时、网络问题等）
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('连接超时，请稍后重试');
      }
      throw fetchError; // 重新抛出错误，由外层 catch 处理
    }

    // 解析服务器响应
    console.log('许可证验证响应:', data);

    if (data.valid) {
      return {
        status: LicenseStatus.VALID,
        message: data.message || '许可证有效',
        expiryDate: data.expiryDate
      };
    }

    return {
        status: LicenseStatus.INVALID,
        message: data.message || '许可证无效或已过期'
    };

  } catch (error) {
    console.error('许可证验证失败:', error);

    // 处理错误消息，确保编码正确
    let errorMsg = '未知错误';
    if (error instanceof Error) {
        // 尝试处理可能的编码问题
        const rawMessage = error.message;
    }

    return {
      status: LicenseStatus.ERROR,
      message: `验证过程中出错: ${errorMsg}`
    };
  }
}

/**
 * 检查许可证是否有效
 * @returns 返回一个Promise，解析为布尔值，表示许可证是否有效
 */
export async function checkLicenseValidity(): Promise<boolean> {
  try {
    // 从存储中获取许可证密钥
    const data = await new Promise<{licenseKey?: string}>((resolve) => {
      chrome.storage.sync.get(['licenseKey'], (result) => {
        resolve(result);
      });
    });

    if (!data.licenseKey) {
      console.log('未找到许可证密钥');
      return false;
    }

    // 验证许可证
    const result = await verifyLicense(data.licenseKey);
    return result.status === LicenseStatus.VALID;
  } catch (error) {
    console.error('检查许可证有效性时出错:', error);
    return false;
  }
}