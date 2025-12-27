<template>
  <div class="workflow-create-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>创建工作流</h2>
      <div class="header-actions">
        <el-button @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          创建工作流
        </el-button>
      </div>
    </div>

    <!-- 基本信息卡片 -->
    <el-card class="info-card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        size="large"
      >
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入工作流名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="模型" prop="model_id">
              <el-select
                v-model="formData.model_id"
                placeholder="选择模型"
                filterable
                :loading="modelsLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="model in availableModels"
                  :key="model.id"
                  :label="model.name"
                  :value="model.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="选择状态">
                <el-option label="草稿" value="draft" />
                <el-option label="激活" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入工作流描述"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 画布区域 -->
    <div class="canvas-container">
      <workflow-canvas
        v-model="workflowConfig"
        :knowledge-bases="knowledgeBases"
        :available-tools="availableTools"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import WorkflowCanvas from '@/components/Workflow/WorkflowCanvas.vue'
import { workflowApi } from '@/api/workflows'
import { useModelStore } from '@/stores/model'
import { useKnowledgeStore } from '@/stores/knowledge'
import { storeToRefs } from 'pinia'
import type { WorkflowConfig } from '@/api/workflows'

const router = useRouter()
const modelStore = useModelStore()
const knowledgeStore = useKnowledgeStore()

const { models } = storeToRefs(modelStore)
const { knowledgeBases } = storeToRefs(knowledgeStore)

const formRef = ref<FormInstance>()
const submitting = ref(false)
const modelsLoading = ref(false)

// 可用模型列表（只显示激活状态的模型）
const availableModels = computed(() => {
  return models.value.filter(m => m.status === 'active')
})

// 可用工具列表（示例数据）
const availableTools = ref([
  { id: 'web_search', name: '网络搜索' },
  { id: 'calculator', name: '计算器' },
  { id: 'weather', name: '天气查询' },
  { id: 'email', name: '邮件发送' }
])

const formData = reactive({
  name: '',
  description: '',
  model_id: undefined as number | undefined,
  status: 'draft'
})

const workflowConfig = ref<WorkflowConfig>({
  nodes: [],
  edges: []
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入工作流名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入工作流描述', trigger: 'blur' }],
  model_id: [{ required: true, message: '请选择模型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

onMounted(async () => {
  // 加载模型列表
  await loadModels()

  // 加载知识库列表
  await knowledgeStore.fetchKnowledgeBases({ page: 1, page_size: 100 })

  // 初始化默认节点
  initDefaultNodes()
})

async function loadModels() {
  modelsLoading.value = true
  try {
    await modelStore.fetchModels({ page: 1, page_size: 100 })

    // 如果有默认模型，自动选中
    const defaultModel = availableModels.value.find(m => m.is_default)
    if (defaultModel) {
      formData.model_id = defaultModel.id
    }
  } catch (error) {
    ElMessage.error('加载模型列表失败')
    console.error('加载模型列表失败:', error)
  } finally {
    modelsLoading.value = false
  }
}

function initDefaultNodes() {
  // 初始化默认的开始和结束节点
  workflowConfig.value = {
    nodes: [
      {
        id: 'start',
        type: 'start',
        name: '开始',
        position: { x: 100, y: 200 }
      },
      {
        id: 'end',
        type: 'end',
        name: '结束',
        position: { x: 700, y: 200 }
      }
    ],
    edges: []
  }
}

async function handleSaveDraft() {
  formData.status = 'draft'
  await handleSubmit()
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    // 验证工作流配置
    if (workflowConfig.value.nodes.length === 0) {
      ElMessage.warning('请至少添加一个节点')
      return
    }

    // 检查是否有开始和结束节点
    const hasStart = workflowConfig.value.nodes.some(n => n.type === 'start')
    const hasEnd = workflowConfig.value.nodes.some(n => n.type === 'end')

    if (!hasStart || !hasEnd) {
      ElMessage.warning('工作流必须包含开始和结束节点')
      return
    }

    submitting.value = true
    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        model_id: formData.model_id!,
        status: formData.status,
        config: workflowConfig.value
      }

      await workflowApi.createWorkflow(submitData)
      ElMessage.success('创建成功')
      router.push('/workflows')
    } catch (error: any) {
      console.error('创建失败:', error)
      ElMessage.error(error?.message || '创建失败')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.workflow-create-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);

  h2 {
    flex: 1;
    margin: 0;
    font-size: 20px;
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.info-card {
  margin: 16px 24px;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.canvas-container {
  flex: 1;
  margin: 0 24px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

// Element Plus 样式覆盖
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

:deep(.el-select) {
  .el-input__wrapper {
    cursor: pointer;
  }
}
</style>
