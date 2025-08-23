/**
 * 获取扩展的版本号
 * @returns {string} 扩展版本号
 */
export function getExtensionVersion(): string {
  return chrome.runtime.getManifest().version;
}