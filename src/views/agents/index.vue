<template>
  <div class="agents-page">
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-content">
        <h1>智能体</h1>
        <p class="subtitle">管理你的 AI 助手</p>
      </div>
      <button class="create-btn" @click="$router.push('/agents/create')">
        <el-icon><Plus /></el-icon>
        <span>创建智能体</span>
      </button>
    </header>
    
    <!-- 搜索筛选 -->
    <div class="filter-bar">
      <div class="search-box">
        <el-icon><Search /></el-icon>
        <input 
          v-model="searchText"
          type="text"
          placeholder="搜索智能体..."
        />
      </div>
      <div class="filter-tabs">
        <button 
          :class="['tab', { active: statusFilter === '' }]"
          @click="statusFilter = ''"
        >全部</button>
        <button 
          :class="['tab', { active: statusFilter === 'active' }]"
          @click="statusFilter = 'active'"
        >激活</button>
        <button 
          :class="['tab', { active: statusFilter === 'inactive' }]"
          @click="statusFilter = 'inactive'"
        >禁用</button>
      </div>
    </div>
    
    <!-- 智能体网格 -->
    <div class="agents-grid" v-loading="loading">
      <div
        v-for="agent in filteredAgents"
        :key="agent.id"
        class="agent-card"
        @click="$router.push(`/agents/${agent.id}`)"
      >
        <div class="card-header">
          <div class="agent-avatar">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div class="status-badge" :class="agent.status">
            {{ agent.status === 'active' ? '运行中' : '已停用' }}
          </div>
        </div>
        
        <div class="card-body">
          <h3 class="agent-name">{{ agent.name }}</h3>
          <p class="agent-desc">{{ agent.description }}</p>
          
          <div class="agent-meta">
            <span class="meta-item">
              <el-icon><Setting /></el-icon>
              {{ agent.model_name }}
            </span>
            <span v-if="agent.enable_rag" class="meta-item rag">
              <el-icon><Collection /></el-icon>
              RAG
            </span>
          </div>
        </div>
        
        <div class="card-footer">
          <button class="action-btn primary" @click.stop="handleChat(agent)">
            <el-icon><ChatDotRound /></el-icon>
            对话
          </button>
          <button class="action-btn" @click.stop="handleDuplicate(agent)">
            <el-icon><CopyDocument /></el-icon>
          </button>
          <button class="action-btn danger" @click.stop="handleDelete(agent.id)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredAgents.length === 0 && !loading" class="empty-state">
        <el-icon :size="48"><User /></el-icon>
        <p>暂无智能体</p>
        <button class="create-btn-small" @click="$router.push('/agents/create')">
          创建第一个智能体
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAgentStore } from '@/stores/agent'
import { useChatStore } from '@/stores/chat'
import { 
  Plus, Search, User, Setting, Collection, 
  ChatDotRound, CopyDocument, Delete 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const agentStore = useAgentStore()
const chatStore = useChatStore()

const { agentList, loading } = storeToRefs(agentStore)

const searchText = ref('')
const statusFilter = ref('')

const filteredAgents = computed(() => {
  return agentList.value.filter(agent => {
    const matchSearch = !searchText.value || 
      agent.name.toLowerCase().includes(searchText.value.toLowerCase())
    const matchStatus = !statusFilter.value || agent.status === statusFilter.value
    return matchSearch && matchStatus
  })
})

onMounted(() => {
  agentStore.fetchAgents({ page: 1, page_size: 50 })
})

function handleChat(agent: any) {
  chatStore.setCurrentAgentId(agent.id)
  agentStore.setCurrentAgent(agent)
  router.push('/chat')
}

async function handleDuplicate(agent: any) {
  try {
    const { value } = await ElMessageBox.prompt('请输入新智能体名称', '复制智能体', {
      inputValue: `${agent.name} - 副本`,
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    
    await agentStore.duplicateAgent(agent.id, value)
    ElMessage.success('复制成功')
  } catch {
    // 用户取消
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('删除后无法恢复，确定要删除此智能体吗？', '警告', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    
    await agentStore.deleteAgent(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.agents-page {
  height: 100%;
  overflow: auto;
  padding: 32px;
  background: var(--bg-primary);
}

// 页头
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  
  .header-content {
    h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .subtitle {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #10a37f;
  color: white;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.2s;
  
  &:hover {
      background: #0e9271;
    transform: translateY(-1px);
  }
}

// 筛选栏
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  width: 280px;
  transition: border-color 0.2s;
  
  &:focus-within {
    border-color: rgba(16, 163, 127, 0.5);
  }
  
  .el-icon {
    color: var(--text-secondary);
  }
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 14px;
    
    &::placeholder {
      color: var(--text-secondary);
    }
  }
}

.filter-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-secondary);
  border-radius: 10px;
  
  .tab {
    padding: 8px 16px;
    font-size: 13px;
    color: var(--text-secondary);
    border-radius: 8px;
    transition: all 0.2s;
    
    &:hover {
      color: var(--text-primary);
    }
    
    &.active {
      background: var(--bg-primary);
      color: var(--text-primary);
    }
  }
}

// 智能体网格
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.agent-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  
  &:hover {
    border-color: rgba(16, 163, 127, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    
    .agent-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      
      &.active {
        background: rgba(16, 163, 127, 0.15);
        color: #10a37f;
      }
      
      &.inactive {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
    }
  }
  
  .card-body {
    margin-bottom: 16px;
    
    .agent-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    
    .agent-desc {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 12px;
    }
    
    .agent-meta {
      display: flex;
      gap: 12px;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--text-secondary);
        
        &.rag {
          color: #10a37f;
        }
      }
    }
  }
  
  .card-footer {
    display: flex;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
    
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      color: var(--text-secondary);
      background: var(--surface);
      transition: all 0.2s;
      
      &:hover {
        color: var(--text-primary);
        background: var(--border-color);
      }
      
      &.primary {
        flex: 1;
        background: rgba(16, 163, 127, 0.15);
        color: #10a37f;
        
        &:hover {
          background: #10a37f;
          color: white;
        }
      }
      
      &.danger:hover {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
    }
  }
}

// 空状态
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  
  .el-icon {
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  p {
    margin-bottom: 20px;
  }
  
  .create-btn-small {
    padding: 10px 20px;
    background: #10a37f;
    color: white;
    font-size: 14px;
    border-radius: 8px;
    
    &:hover {
        background: #0e9271;
    }
  }
}
</style>
