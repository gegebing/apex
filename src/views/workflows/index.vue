<template>
  <div class="workflows-page">
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-content">
        <h1>工作流</h1>
        <p class="subtitle">构建智能自动化流程</p>
      </div>
      <button class="create-btn" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        <span>创建工作流</span>
      </button>
    </header>
    
    <!-- 模板选择 -->
    <div class="templates-section">
      <h3>从模板开始</h3>
      <div class="templates-grid">
        <div 
          v-for="template in defaultTemplates" 
          :key="template.id"
          class="template-card"
          @click="handleUseTemplate(template)"
        >
          <div class="template-icon">
            <el-icon :size="24"><component :is="template.icon" /></el-icon>
          </div>
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 工作流列表 -->
    <div class="workflows-section">
      <h3>我的工作流</h3>
      <div class="workflows-grid" v-loading="loading">
        <div
          v-for="workflow in workflows"
          :key="workflow.id"
          class="workflow-card"
        >
          <div class="workflow-header">
            <div class="workflow-icon">
              <el-icon :size="20"><Share /></el-icon>
            </div>
            <span :class="['status-badge', workflow.status]">
              {{ statusLabel[workflow.status] }}
            </span>
          </div>
          
          <div class="workflow-body">
            <h3>{{ workflow.name }}</h3>
            <p>{{ workflow.description }}</p>
            <div class="workflow-meta">
              <span class="node-count">
                <el-icon><Connection /></el-icon>
                {{ workflow.config?.nodes?.length || 0 }} 节点
              </span>
            </div>
          </div>
          
          <div class="workflow-footer">
            <button class="action-btn primary" @click="handleExecute(workflow)">
              <el-icon><VideoPlay /></el-icon>
              执行
            </button>
            <button class="action-btn" @click="handleEdit(workflow)">
              <el-icon><Edit /></el-icon>
            </button>
            <button class="action-btn danger" @click="handleDelete(workflow.id)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="workflows.length === 0 && !loading" class="empty-state">
          <el-icon :size="48"><Share /></el-icon>
          <p>暂无工作流</p>
          <p class="hint">从模板创建或自定义工作流</p>
        </div>
      </div>
    </div>
    
    <!-- 执行对话框 -->
    <el-dialog v-model="showExecuteDialog" title="执行工作流" width="500px">
      <el-form>
        <el-form-item label="输入内容">
          <el-input
            v-model="executeInput"
            type="textarea"
            :rows="4"
            placeholder="输入要处理的内容..."
          />
        </el-form-item>
      </el-form>
      <div v-if="executeResult" class="execute-result">
        <h4>执行结果</h4>
        <div class="result-content">
          <MarkdownRender :content="executeResult" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showExecuteDialog = false">关闭</el-button>
        <el-button type="primary" :loading="executing" @click="doExecute">
          执行
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import type { Workflow } from '@/api/workflows'
import MarkdownRender from '@/components/Markdown/MarkdownRender.vue'
import { 
  Plus, Share, Connection, VideoPlay, Edit, Delete,
  ChatDotRound, Setting, Document
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const workflowStore = useWorkflowStore()
const { workflows, loading } = storeToRefs(workflowStore)

const showExecuteDialog = ref(false)
const executeInput = ref('')
const executeResult = ref('')
const executing = ref(false)
const currentWorkflowId = ref<number>()

const statusLabel: Record<string, string> = {
  active: '运行中',
  inactive: '已停用',
  draft: '草稿'
}

const defaultTemplates = [
  { 
    id: 'router', 
    name: '智能路由', 
    description: '根据内容自动分发到不同处理流程',
    icon: Share
  },
  { 
    id: 'qa', 
    name: '问答助手', 
    description: '基于知识库的智能问答',
    icon: ChatDotRound
  },
  { 
    id: 'extract', 
    name: '信息抽取', 
    description: '从文本中提取结构化信息',
    icon: Document
  },
  { 
    id: 'custom', 
    name: '自定义', 
    description: '从空白开始创建',
    icon: Setting
  }
]

onMounted(() => {
  workflowStore.fetchWorkflows()
})

function handleCreate() {
  ElMessage.info('工作流编辑器开发中')
}

function handleUseTemplate(template: any) {
  ElMessage.info(`使用模板: ${template.name}`)
}

function handleEdit(workflow: Workflow) {
  ElMessage.info('工作流编辑器开发中')
}

function handleExecute(workflow: Workflow) {
  currentWorkflowId.value = workflow.id
  executeInput.value = ''
  executeResult.value = ''
  showExecuteDialog.value = true
}

async function doExecute() {
  if (!currentWorkflowId.value || !executeInput.value.trim()) return
  
  executing.value = true
  try {
    const result = await workflowStore.executeWorkflow(
      currentWorkflowId.value, 
      executeInput.value
    ) as any
    executeResult.value = result?.output || '执行成功'
  } catch (error) {
    executeResult.value = '执行失败，请检查工作流配置'
  } finally {
    executing.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除此工作流吗？', '警告', { type: 'warning' })
    await workflowStore.deleteWorkflow(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.workflows-page {
  height: 100%;
  overflow: auto;
  padding: 32px;
  background: var(--bg-primary);
}

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

// 模板区域
.templates-section {
  margin-bottom: 40px;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
  }
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: rgba(16, 163, 127, 0.3);
    transform: translateY(-2px);
  }
  
  .template-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: linear-gradient(135deg, #10a37f 0%, #1a7f5a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }
  
  .template-info {
    h4 {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    p {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}

// 工作流列表
.workflows-section {
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
  }
}

.workflows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.workflow-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.25s;
  
  &:hover {
    border-color: rgba(16, 163, 127, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
  
  .workflow-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    
    .workflow-icon {
      width: 44px;
      height: 44px;
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
      font-size: 11px;
      font-weight: 500;
      
      &.active {
        background: rgba(16, 163, 127, 0.15);
        color: #10a37f;
      }
      
      &.inactive {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
      
      &.draft {
        background: rgba(251, 191, 36, 0.15);
        color: #f59e0b;
      }
    }
  }
  
  .workflow-body {
    margin-bottom: 16px;
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    
    p {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 12px;
    }
    
    .workflow-meta {
      .node-count {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }
  
  .workflow-footer {
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
    margin-bottom: 4px;
  }
  
  .hint {
    font-size: 13px;
    opacity: 0.7;
  }
}

.execute-result {
  margin-top: 16px;
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
  }
  
  .result-content {
    padding: 16px;
    background: var(--bg-primary);
    border-radius: 10px;
    max-height: 300px;
    overflow-y: auto;
  }
}

// Element Plus 对话框暗色主题
:deep(.el-dialog) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  
  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    
    .el-dialog__title {
      color: var(--text-primary);
      font-weight: 600;
    }
  }
  
  .el-dialog__body {
    padding: 24px;
  }
  
  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
  }
}

:deep(.el-form-item__label) {
  color: var(--text-primary);
}

:deep(.el-textarea__inner) {
  background: var(--bg-primary);
  border-color: var(--border-color);
  color: var(--text-primary);
  box-shadow: none !important;
}
</style>
