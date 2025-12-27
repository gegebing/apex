<template>
  <div class="agent-create-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>创建智能体</h2>
    </div>
    
    <el-card class="form-card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        size="large"
      >
        <el-divider content-position="left">基本信息</el-divider>
        
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入智能体名称" />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入智能体描述" 
          />
        </el-form-item>
        
        <el-divider content-position="left">模型配置</el-divider>

        <el-form-item label="选择模型" prop="model_id">
          <el-select
            v-model="formData.model_id"
            placeholder="选择模型"
            filterable
            :loading="modelsLoading"
            style="width: 100%"
            @change="handleModelChange"
          >
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            >
              <div class="model-option">
                <div class="model-option-name">{{ model.name }}</div>
                <div class="model-option-info">
                  <span class="provider-badge">{{ model.provider }}</span>
                  <span v-if="model.is_default" class="default-badge">默认</span>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="模型信息" v-if="selectedModel">
          <div class="model-info-card">
            <div class="info-row">
              <span class="label">提供商:</span>
              <span class="value">{{ selectedModel.provider }}</span>
            </div>
            <div class="info-row">
              <span class="label">类型:</span>
              <span class="value">{{ selectedModel.model_type }}</span>
            </div>
            <div class="info-row">
              <span class="label">上下文长度:</span>
              <span class="value">{{ formatNumber(selectedModel.context_length) }}</span>
            </div>
            <div class="info-row">
              <span class="label">最大 Token:</span>
              <span class="value">{{ formatNumber(selectedModel.max_tokens) }}</span>
            </div>
            <div class="info-row capabilities">
              <span class="label">支持功能:</span>
              <div class="capability-tags">
                <el-tag v-if="selectedModel.support_stream" size="small" type="success">流式</el-tag>
                <el-tag v-if="selectedModel.support_function" size="small" type="info">函数调用</el-tag>
                <el-tag v-if="selectedModel.support_vision" size="small" type="warning">视觉</el-tag>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="温度" prop="temperature">
          <el-slider
            v-model="formData.temperature"
            :min="0"
            :max="2"
            :step="0.1"
            show-input
          />
        </el-form-item>

        <el-form-item label="最大 Token" prop="max_tokens">
          <el-input-number
            v-model="formData.max_tokens"
            :min="100"
            :max="selectedModel?.max_tokens || 16000"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-divider content-position="left">提示词配置</el-divider>
        
        <el-form-item label="系统提示词" prop="system_prompt">
          <el-input
            v-model="formData.system_prompt"
            type="textarea"
            :rows="6"
            placeholder="设定智能体的角色和行为..."
          />
        </el-form-item>
        
        <el-form-item label="欢迎语" prop="welcome_message">
          <el-input
            v-model="formData.welcome_message"
            type="textarea"
            :rows="2"
            placeholder="用户首次进入对话时显示的欢迎语"
          />
        </el-form-item>
        
        <el-divider content-position="left">RAG 配置</el-divider>
        
        <el-form-item label="启用 RAG">
          <el-switch v-model="formData.enable_rag" />
        </el-form-item>
        
        <el-form-item v-if="formData.enable_rag" label="检索数量" prop="rag_top_k">
          <el-input-number v-model="formData.rag_top_k" :min="1" :max="10" />
        </el-form-item>
        
        <el-form-item v-if="formData.enable_rag" label="关联知识库">
          <el-select
            v-model="formData.knowledge_base_ids"
            multiple
            placeholder="选择知识库"
            style="width: 100%"
          >
            <el-option
              v-for="kb in knowledgeBases"
              :key="kb.id"
              :label="kb.name"
              :value="kb.id"
            />
          </el-select>
        </el-form-item>
        
        <el-divider content-position="left">其他设置</el-divider>
        
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">激活</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="公开">
          <el-switch v-model="formData.is_public" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            创建智能体
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAgentStore } from '@/stores/agent'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useModelStore } from '@/stores/model'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { storeToRefs } from 'pinia'
import type { Model } from '@/api/models'

const router = useRouter()
const agentStore = useAgentStore()
const knowledgeStore = useKnowledgeStore()
const modelStore = useModelStore()

const { knowledgeBases } = storeToRefs(knowledgeStore)
const { models } = storeToRefs(modelStore)

const formRef = ref<FormInstance>()
const submitting = ref(false)
const modelsLoading = ref(false)

// 可用模型列表（只显示激活状态的模型）
const availableModels = computed(() => {
  return models.value.filter(m => m.status === 'active')
})

// 选中的模型对象
const selectedModel = ref<Model | null>(null)

const formData = reactive({
  name: '',
  description: '',
  model_id: undefined as number | undefined,
  temperature: 0.7,
  max_tokens: 2000,
  system_prompt: '',
  welcome_message: '',
  enable_rag: false,
  rag_top_k: 3,
  knowledge_base_ids: [] as number[],
  status: 'active',
  is_public: true
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入智能体名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  model_id: [{ required: true, message: '请选择模型', trigger: 'change' }],
  system_prompt: [{ required: true, message: '请输入系统提示词', trigger: 'blur' }]
}

onMounted(async () => {
  // 加载知识库列表
  await knowledgeStore.fetchKnowledgeBases({ page: 1, page_size: 100 })

  // 加载模型列表
  await loadModels()
})

async function loadModels() {
  modelsLoading.value = true
  try {
    await modelStore.fetchModels({ page: 1, page_size: 100 })

    // 如果有默认模型，自动选中
    const defaultModel = availableModels.value.find(m => m.is_default)
    if (defaultModel) {
      formData.model_id = defaultModel.id
      handleModelChange(defaultModel.id)
    }
  } catch (error) {
    ElMessage.error('加载模型列表失败')
    console.error('加载模型列表失败:', error)
  } finally {
    modelsLoading.value = false
  }
}

function handleModelChange(modelId: number) {
  const model = availableModels.value.find(m => m.id === modelId)
  if (model) {
    selectedModel.value = model
    // 根据模型的默认值更新表单
    formData.temperature = model.default_temperature
    formData.max_tokens = Math.min(2000, model.max_tokens)
  }
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      // 获取选中的模型信息
      const model = availableModels.value.find(m => m.id === formData.model_id)
      if (!model) {
        ElMessage.error('请选择有效的模型')
        return
      }

      // 构造提交数据
      const submitData = {
        ...formData,
        model_provider: model.provider,
        model_name: model.model_id
      }

      await agentStore.createAgent(submitData)
      ElMessage.success('创建成功')
      router.push('/agents')
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
.agent-create-page {
  padding: 24px;
  height: 100%;
  overflow: auto;
  background: var(--bg-primary);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 20px;
    color: var(--text-primary);
  }
}

.form-card {
  max-width: 800px;

  :deep(.el-card__body) {
    padding: 32px;
  }

  :deep(.el-divider) {
    margin: 24px 0;
    border-color: var(--border-color);

    .el-divider__text {
      font-weight: 600;
      color: var(--text-primary);
      background: var(--bg-secondary);
    }
  }

  :deep(.el-form-item__label) {
    color: var(--text-secondary);
    font-weight: 500;
  }
}

// 模型选项样式
.model-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;

  .model-option-name {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
  }

  .model-option-info {
    display: flex;
    gap: 6px;
    align-items: center;

    .provider-badge {
      font-size: 12px;
      padding: 2px 8px;
      background: rgba(16, 163, 127, 0.1);
      color: #10a37f;
      border-radius: 4px;
      text-transform: capitalize;
    }

    .default-badge {
      font-size: 11px;
      padding: 2px 6px;
      background: rgba(255, 156, 0, 0.15);
      color: #ff9c00;
      border-radius: 4px;
    }
  }
}

// 模型信息卡片
.model-info-card {
  padding: 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;

  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      min-width: 100px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .value {
      color: var(--text-primary);
      font-weight: 500;
    }

    &.capabilities {
      align-items: flex-start;

      .label {
        padding-top: 2px;
      }
    }
  }

  .capability-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
}

// Element Plus 组件样式覆盖
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  box-shadow: none !important;

  &:hover {
    border-color: rgba(16, 163, 127, 0.3);
  }

  &.is-focus {
    border-color: #10a37f !important;
  }
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: var(--text-primary);
}

:deep(.el-input__inner)::placeholder,
:deep(.el-textarea__inner)::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

:deep(.el-select) {
  .el-input__wrapper {
    cursor: pointer;
  }
}

:deep(.el-select__placeholder) {
  color: var(--text-secondary);
}

:deep(.el-select-dropdown__item) {
  padding: 8px 12px;
  background: var(--bg-secondary);

  &:hover {
    background: var(--surface);
  }

  &.is-selected {
    background: rgba(16, 163, 127, 0.15);
    color: #10a37f;
  }
}

:deep(.el-slider) {
  .el-slider__runway {
    background: var(--border-color);
  }

  .el-slider__bar {
    background: #10a37f;
  }

  .el-slider__button {
    border-color: #10a37f;
  }
}

:deep(.el-input-number) {
  .el-input-number__decrease,
  .el-input-number__increase {
    background: var(--bg-secondary);
    border-color: var(--border-color);
    color: var(--text-secondary);

    &:hover {
      color: #10a37f;
    }
  }

  .el-input__inner {
    text-align: left;
  }
}

:deep(.el-switch) {
  .el-switch__core {
    background: var(--border-color);
  }

  &.is-checked .el-switch__core {
    background: #10a37f;
  }
}

:deep(.el-radio) {
  color: var(--text-primary);
  margin-right: 20px;

  .el-radio__input.is-checked .el-radio__inner {
    background-color: #10a37f;
    border-color: #10a37f;
  }

  .el-radio__label {
    color: var(--text-primary);
  }
}

:deep(.el-checkbox) {
  color: var(--text-primary);

  .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: #10a37f;
    border-color: #10a37f;
  }

  .el-checkbox__label {
    color: var(--text-primary);
  }
}

:deep(.el-button--primary) {
  background: #10a37f;
  border-color: #10a37f;

  &:hover,
  &:focus {
    background: #0e9271;
    border-color: #0e9271;
  }
}
</style>
