import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/utils/storage'

export type ThemeMode = 'light' | 'dark' | 'system'

export const useAppStore = defineStore('app', () => {
    // 状态
    const sidebarCollapsed = ref(false)
    const themeMode = ref<ThemeMode>(storage.get<ThemeMode>('theme') || 'dark')

    // 方法
    function toggleSidebar() {
        sidebarCollapsed.value = !sidebarCollapsed.value
    }

    function setTheme(mode: ThemeMode) {
        themeMode.value = mode
        storage.set('theme', mode)
        applyTheme(mode)
    }

    function applyTheme(mode: ThemeMode) {
        const root = document.documentElement

        // 移除所有主题类
        root.classList.remove('light', 'dark')

        if (mode === 'system') {
            const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            // 暗色不加 class，亮色加 light class
            if (!preferDark) {
                root.classList.add('light')
            }
        } else if (mode === 'light') {
            root.classList.add('light')
        }
        // dark 模式不需要加 class，因为默认就是暗色
    }

    // 初始化主题
    applyTheme(themeMode.value)

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (themeMode.value === 'system') {
            const root = document.documentElement
            root.classList.remove('light')
            if (!e.matches) {
                root.classList.add('light')
            }
        }
    })

    return {
        // 状态
        sidebarCollapsed,
        themeMode,
        // 方法
        toggleSidebar,
        setTheme
    }
})
