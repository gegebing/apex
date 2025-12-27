<template>
  <div class="models-page">
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-content">
        <h1>模型配置</h1>
        <p class="subtitle">管理 AI 模型和接口设置</p>
      </div>
      <button class="create-btn" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        <span>添加模型</span>
      </button>
    </header>
    
    <!-- 模型列表 -->
    <div class="models-list" v-loading="loading">
      <div
        v-for="model in models"
        :key="model.id"
        class="model-card"
      >
        <div class="model-header">
          <div class="model-icon">
            <el-icon :size="20"><cpu /></el-icon>
          </div>
          <div class="model-badges">
            <span v-if="model.is_default" class="badge default">默认</span>
            <span :class="['badge', 'status', model.status]">
              {{ model.status === 'active' ? '激活' : '禁用' }}
            </span>
          </div>
        </div>
        
        <div class="model-body">
          <h3 class="model-name">{{ model.name }}</h3>
          <p class="model-id">{{ model.model_id }}</p>
          
          <div class="model-provider">
            <span class="provider-label">提供商</span>
            <span class="provider-value">{{ model.provider }}</span>
          </div>
          
          <div class="model-capabilities">
            <span v-if="model.support_stream" class="capability">
              <el-icon><VideoPlay /></el-icon>
              流式
            </span>
            <span v-if="model.support_function" class="capability">
              <el-icon><Operation /></el-icon>
              函数
            </span>
            <span v-if="model.support_vision" class="capability">
              <el-icon><Picture /></el-icon>
              视觉
            </span>
          </div>
        </div>
        
        <div class="model-footer">
          <button class="action-btn primary" @click="handleTest(model)">
            <el-icon><Connection /></el-icon>
            测试
          </button>
          <button class="action-btn" @click="handleSetDefault(model.id)">
            <el-icon><Star /></el-icon>
          </button>
          <button class="action-btn danger" @click="handleDelete(model.id)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="models.length === 0 && !loading" class="empty-state">
        <el-icon :size="48"><Cpu /></el-icon>
        <p>暂无模型配置</p>
        <button class="create-btn-small" @click="showCreateDialog = true">
          添加第一个模型
        </button>
      </div>
    </div>
    
    <!-- 测试对话框 -->
    <el-dialog v-model="showTestDialog" title="测试模型" width="600px">
      <div class="test-form">
        <el-input
          v-model="testMessage"
          type="textarea"
          :rows="3"
          placeholder="输入测试消息..."
        />
      </div>
      <div v-if="testResult" class="test-result">
        <h4>响应结果</h4>
        <div class="result-content">
          <MarkdownRender :content="testResult" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showTestDialog = false">关闭</el-button>
        <el-button type="primary" :loading="testing" @click="executeTest">
          发送测试
        </el-button>
      </template>
    </el-dialog>

    <!-- 新增模型对话框 -->
    <ModelCreateDialog
      v-model="showCreateDialog"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useModelStore } from '@/stores/model'
import MarkdownRender from '@/components/Markdown/MarkdownRender.vue'
import ModelCreateDialog from '@/components/Models/ModelCreateDialog.vue'
import {
  Plus, Cpu, VideoPlay, Operation, Picture,
  Connection, Star, Delete
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const modelStore = useModelStore()
const { models, loading } = storeToRefs(modelStore)

const showCreateDialog = ref(false)
const showTestDialog = ref(false)
const testMessage = ref('你好，请简单介绍一下自己')
const testResult = ref('')
const testing = ref(false)
const currentTestModelId = ref<number>()

onMounted(() => {
  modelStore.fetchModels({ page: 1, page_size: 50 })
})

function handleCreateSuccess() {
  // 刷新模型列表
  modelStore.fetchModels({ page: 1, page_size: 50 })
}

function handleTest(model: any) {
  currentTestModelId.value = model.id
  testResult.value = ''
  showTestDialog.value = true
}

async function executeTest() {
  if (!currentTestModelId.value || !testMessage.value.trim()) return
  
  testing.value = true
  try {
    const result = await modelStore.testModel(currentTestModelId.value, testMessage.value) as any
    testResult.value = result?.response || '测试成功，模型连接正常'
  } catch (error) {
    testResult.value = '测试失败，请检查模型配置和 API 密钥'
  } finally {
    testing.value = false
  }
}

async function handleSetDefault(id: number) {
  await modelStore.setDefaultModel(id)
  ElMessage.success('已设为默认模型')
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除此模型吗？', '警告', { type: 'warning' })
    await modelStore.deleteModel(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.models-page {
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

.models-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.model-card {
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
  
  .model-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    
    .model-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .model-badges {
      display: flex;
      gap: 6px;
      
      .badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
        
        &.default {
          background: rgba(16, 163, 127, 0.15);
          color: #10a37f;
        }
        
        &.status.active {
          background: rgba(16, 163, 127, 0.15);
          color: #10a37f;
        }
        
        &.status.inactive {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
      }
    }
  }
  
  .model-body {
    margin-bottom: 16px;
    
    .model-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .model-id {
      font-size: 13px;
      color: var(--text-secondary);
      font-family: monospace;
      margin-bottom: 12px;
    }
    
    .model-provider {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 12px;
      
      .provider-label {
        color: var(--text-secondary);
      }
      
      .provider-value {
        color: var(--text-primary);
        font-weight: 500;
        text-transform: capitalize;
      }
    }
    
    .model-capabilities {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      
      .capability {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: var(--surface);
        border-radius: 6px;
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }
  
  .model-footer {
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

.test-form {
  margin-bottom: 16px;
}

.test-result {
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

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: var(--bg-primary);
  border-color: var(--border-color);
  box-shadow: none !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: var(--text-primary);
}
</style>
