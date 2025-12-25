<template>
  <div class="main-layout">
    <!-- 侧边栏 -->
    <aside :class="['sidebar', { collapsed: appStore.sidebarCollapsed }]">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="url(#gradient)" />
              <path d="M10 16L14 20L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stop-color="#10a37f"/>
                  <stop offset="1" stop-color="#1a7f5a"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span v-show="!appStore.sidebarCollapsed" class="logo-text">Apex</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
        >
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
          <span v-show="!appStore.sidebarCollapsed" class="nav-label">{{ item.title }}</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <button class="toggle-btn" @click="appStore.toggleSidebar">
          <el-icon :size="18">
            <component :is="appStore.sidebarCollapsed ? Expand : Fold" />
          </el-icon>
        </button>
        
        <button class="theme-btn" @click="toggleTheme">
          <el-icon :size="18">
            <component :is="isDark ? Sunny : Moon" />
          </el-icon>
        </button>
      </div>
    </aside>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { 
  ChatDotRound, 
  User, 
  Collection, 
  Setting, 
  DataAnalysis,
  Share,
  Fold,
  Expand,
  Sunny,
  Moon
} from '@element-plus/icons-vue'

const route = useRoute()
const appStore = useAppStore()

const menuItems = [
  { path: '/chat', title: '对话', icon: ChatDotRound },
  { path: '/agents', title: '智能体', icon: User },
  { path: '/knowledge', title: '知识库', icon: Collection },
  { path: '/models', title: '模型', icon: Setting },
  { path: '/workflows', title: '工作流', icon: Share },
  { path: '/dashboard', title: '统计', icon: DataAnalysis }
]

const isDark = computed(() => appStore.themeMode !== 'light')

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function toggleTheme() {
  appStore.setTheme(isDark.value ? 'light' : 'dark')
}
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
}

.sidebar {
  width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  
  &.collapsed {
    width: 68px;
    
    .nav-item {
      justify-content: center;
      padding: 12px;
    }
  }
}

.sidebar-header {
  padding: 20px;
  
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .logo-icon {
      flex-shrink: 0;
    }
    
    .logo-text {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
    }
  }
}

.sidebar-nav {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--surface);
    color: var(--text-primary);
  }
  
  &.active {
    background: rgba(16, 163, 127, 0.15);
    color: #10a37f;
    
    .el-icon {
      color: #10a37f;
    }
  }
  
  .nav-label {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
  }
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  
  .toggle-btn,
  .theme-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--surface);
      color: var(--text-primary);
    }
  }
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
