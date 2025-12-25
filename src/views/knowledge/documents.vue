<template>
  <div class="documents-page">
    <header class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <div class="header-content">
          <h1>{{ currentKB?.name || '文档管理' }}</h1>
          <p class="subtitle">{{ currentKB?.description }}</p>
        </div>
      </div>
      <button class="create-btn" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        <span>添加文档</span>
      </button>
    </header>
    
    <!-- 文档列表 -->
    <div class="documents-list" v-loading="loading">
      <div
        v-for="doc in documents"
        :key="doc.id"
        class="doc-card"
      >
        <div class="doc-icon">
          <el-icon :size="20"><Document /></el-icon>
        </div>
        <div class="doc-info">
          <h3 class="doc-title">{{ doc.title }}</h3>
          <div class="doc-meta">
            <span class="file-type">{{ doc.file_type.toUpperCase() }}</span>
            <span class="divider">•</span>
            <span class="source">{{ doc.source }}</span>
          </div>
        </div>
        <div class="doc-actions">
          <button class="action-btn" @click="handlePreview(doc)">
            <el-icon><View /></el-icon>
          </button>
          <button class="action-btn danger" @click="handleDelete(doc.id)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="documents.length === 0 && !loading" class="empty-state">
        <el-icon :size="48"><Document /></el-icon>
        <p>暂无文档</p>
        <button class="create-btn-small" @click="showAddDialog = true">
          添加第一个文档
        </button>
      </div>
    </div>
    
    <!-- 添加文档对话框 -->
    <el-dialog v-model="showAddDialog" title="添加文档" width="600px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入文档标题" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="文件类型" prop="file_type">
            <el-select v-model="formData.file_type" placeholder="选择类型">
              <el-option label="纯文本" value="txt" />
              <el-option label="Markdown" value="md" />
              <el-option label="PDF" value="pdf" />
              <el-option label="Word" value="docx" />
            </el-select>
          </el-form-item>
          <el-form-item label="来源" prop="source">
            <el-select v-model="formData.source" placeholder="选择来源">
              <el-option label="手动输入" value="manual" />
              <el-option label="文件上传" value="upload" />
              <el-option label="网页抓取" value="web" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="10"
            placeholder="请输入文档内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAdd">
          添加
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 预览对话框 -->
    <el-dialog v-model="showPreviewDialog" title="文档预览" width="700px">
      <div class="preview-content">
        <MarkdownRender :content="previewContent" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledge'
import MarkdownRender from '@/components/Markdown/MarkdownRender.vue'
import { ArrowLeft, Plus, Document, View, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const route = useRoute()
const knowledgeStore = useKnowledgeStore()
const { currentKB, documents, loading } = storeToRefs(knowledgeStore)

const kbId = Number(route.params.id)

const showAddDialog = ref(false)
const showPreviewDialog = ref(false)
const previewContent = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  title: '',
  content: '',
  file_type: 'txt',
  source: 'manual'
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  file_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  source: [{ required: true, message: '请选择来源', trigger: 'change' }]
}

onMounted(async () => {
  await knowledgeStore.fetchKnowledgeBaseDetail(kbId)
  await knowledgeStore.fetchDocuments(kbId)
})

async function handleAdd() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      await knowledgeStore.addDocument(kbId, formData)
      ElMessage.success('添加成功')
      showAddDialog.value = false
      formData.title = ''
      formData.content = ''
    } finally {
      submitting.value = false
    }
  })
}

function handlePreview(doc: any) {
  previewContent.value = doc.content
  showPreviewDialog.value = true
}

async function handleDelete(docId: number) {
  try {
    await ElMessageBox.confirm('确定要删除此文档吗？', '警告', { type: 'warning' })
    await knowledgeStore.deleteDocument(kbId, docId)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.documents-page {
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
  
  .header-left {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  
  .back-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    transition: all 0.2s;
    
    &:hover {
      color: var(--text-primary);
      border-color: var(--text-secondary);
    }
  }
  
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

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doc-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s;
  
  &:hover {
    border-color: rgba(16, 163, 127, 0.3);
  }
  
  .doc-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }
  
  .doc-info {
    flex: 1;
    
    .doc-title {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .doc-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-secondary);
      
      .file-type {
        padding: 2px 8px;
        background: var(--surface);
        border-radius: 4px;
      }
      
      .divider {
        opacity: 0.5;
      }
    }
  }
  
  .doc-actions {
    display: flex;
    gap: 8px;
    
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.preview-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: 8px;
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
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
  background: var(--bg-primary);
  border-color: var(--border-color);
  box-shadow: none !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: var(--text-primary);
}
</style>
