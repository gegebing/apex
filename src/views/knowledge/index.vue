<template>
  <div class="knowledge-page">
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-content">
        <h1>知识库</h1>
        <p class="subtitle">管理你的文档和数据源</p>
      </div>
      <button class="create-btn" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        <span>创建知识库</span>
      </button>
    </header>
    
    <!-- 知识库网格 -->
    <div class="knowledge-grid" v-loading="loading">
      <div
        v-for="kb in knowledgeBases"
        :key="kb.id"
        class="kb-card"
        @click="$router.push(`/knowledge/${kb.id}/documents`)"
      >
        <div class="kb-icon">
          <el-icon :size="32"><FolderOpened /></el-icon>
        </div>
        <div class="kb-info">
          <h3 class="kb-name">{{ kb.name }}</h3>
          <p class="kb-desc">{{ kb.description }}</p>
          <div class="kb-meta">
            <span class="doc-count">
              <el-icon><Document /></el-icon>
              {{ kb.document_count || 0 }} 篇文档
            </span>
            <span :class="['visibility', { public: kb.is_public }]">
              <el-icon><View v-if="kb.is_public" /><Hide v-else /></el-icon>
              {{ kb.is_public ? '公开' : '私有' }}
            </span>
          </div>
        </div>
        <div class="kb-actions" @click.stop>
          <button class="action-btn" @click="handleEdit(kb)">
            <el-icon><Edit /></el-icon>
          </button>
          <button class="action-btn danger" @click="handleDelete(kb.id)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="knowledgeBases.length === 0 && !loading" class="empty-state">
        <el-icon :size="48"><FolderOpened /></el-icon>
        <p>暂无知识库</p>
        <button class="create-btn-small" @click="showCreateDialog = true">
          创建第一个知识库
        </button>
      </div>
    </div>
    
    <!-- 创建对话框 -->
    <el-dialog 
      v-model="showCreateDialog" 
      title="创建知识库" 
      width="500px"
      :append-to-body="true"
      class="custom-dialog"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入知识库名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入知识库描述"
          />
        </el-form-item>
        <el-form-item label="公开设置">
          <el-switch v-model="formData.is_public" />
          <span class="switch-label">{{ formData.is_public ? '所有人可见' : '仅自己可见' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledge'
import type { KnowledgeBase } from '@/api/knowledge'
import { Plus, FolderOpened, Document, View, Hide, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const knowledgeStore = useKnowledgeStore()
const { knowledgeBases, total, loading } = storeToRefs(knowledgeStore)

const showCreateDialog = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  name: '',
  description: '',
  is_public: true
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入知识库描述', trigger: 'blur' }]
}

onMounted(() => {
  knowledgeStore.fetchKnowledgeBases({ page: 1, page_size: 50 })
})

async function handleCreate() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      await knowledgeStore.createKnowledgeBase(formData)
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      formData.name = ''
      formData.description = ''
      formData.is_public = true
    } finally {
      submitting.value = false
    }
  })
}

function handleEdit(kb: KnowledgeBase) {
  ElMessage.info('编辑功能开发中')
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('删除后无法恢复，确定要删除吗？', '警告', {
      type: 'warning'
    })
    await knowledgeStore.deleteKnowledgeBase(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.knowledge-page {
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

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.kb-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.25s ease;
  
  &:hover {
    border-color: rgba(16, 163, 127, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
  
  .kb-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-bottom: 16px;
  }
  
  .kb-info {
    margin-bottom: 16px;
    
    .kb-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    
    .kb-desc {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 12px;
    }
    
    .kb-meta {
      display: flex;
      gap: 16px;
      
      .doc-count,
      .visibility {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--text-secondary);
      }
      
      .visibility.public {
        color: #10a37f;
      }
    }
  }
  
  .kb-actions {
    display: flex;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
    
    .action-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      background: var(--surface);
      transition: all 0.2s;
      
      &:hover {
        color: var(--text-primary);
        background: var(--border-color);
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

.switch-label {
  margin-left: 12px;
  font-size: 13px;
  color: var(--text-secondary);
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

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: var(--bg-primary);
  border-color: var(--border-color);
  color: var(--text-primary);
  
  &:focus, &.is-focus {
    border-color: #10a37f;
  }
}
</style>
