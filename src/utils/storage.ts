/**
 * 本地存储工具
 */

const PREFIX = 'ai_agent_'

export const storage = {
  /**
   * 获取存储项
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(PREFIX + key)
      if (item === null) return defaultValue ?? null
      return JSON.parse(item) as T
    } catch {
      return defaultValue ?? null
    }
  },

  /**
   * 设置存储项
   */
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch (error) {
      console.error('存储失败:', error)
    }
  },

  /**
   * 移除存储项
   */
  remove(key: string): void {
    localStorage.removeItem(PREFIX + key)
  },

  /**
   * 清空所有存储
   */
  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }
}

export default storage
