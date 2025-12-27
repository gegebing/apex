<template>
  <el-dialog
    v-model="visible"
    title="添加模型"
    width="700px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="left"
    >
      <el-divider content-position="left">基本信息</el-divider>

      <el-form-item label="模型名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="例如: Qwen/Qwen2.5-7B-Instruct"
        />
      </el-form-item>

      <el-form-item label="模型 ID" prop="model_id">
        <el-input
          v-model="formData.model_id"
          placeholder="模型的唯一标识符"
        />
      </el-form-item>

      <el-form-item label="提供商" prop="provider">
        <el-select
          v-model="formData.provider"
          placeholder="选择提供商"
          style="width: 100%"
        >
          <el-option label="OpenAI" value="openai" />
          <el-option label="Anthropic" value="anthropic" />
          <el-option label="Azure" value="azure" />
          <el-option label="SiliconFlow" value="siliconflow" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>

      <el-form-item label="模型类型" prop="model_type">
        <el-select
          v-model="formData.model_type"
          placeholder="选择模型类型"
          style="width: 100%"
        >
          <el-option label="聊天" value="chat" />
          <el-option label="补全" value="completion" />
          <el-option label="嵌入" value="embedding" />
          <el-option label="图像生成" value="image" />
        </el-select>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="2"
          placeholder="简要描述该模型"
        />
      </el-form-item>

      <el-divider content-position="left">API 配置</el-divider>

      <el-form-item label="API 地址" prop="base_url">
        <el-input
          v-model="formData.base_url"
          placeholder="https://api.openai.com/v1"
        />
      </el-form-item>

      <el-form-item label="API 密钥" prop="api_key">
        <el-input
          v-model="formData.api_key"
          type="password"
          placeholder="sk-..."
          show-password
        />
      </el-form-item>

      <el-divider content-position="left">参数配置</el-divider>

      <el-form-item label="最大令牌数" prop="max_tokens">
        <el-input-number
          v-model="formData.max_tokens"
          :min="1"
          :max="128000"
          :step="1000"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="上下文长度" prop="context_length">
        <el-input-number
          v-model="formData.context_length"
          :min="1"
          :max="200000"
          :step="1000"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="默认温度" prop="default_temperature">
        <el-slider
          v-model="formData.default_temperature"
          :min="0"
          :max="2"
          :step="0.1"
          :show-tooltip="true"
        />
      </el-form-item>

      <el-form-item label="默认 Top P" prop="default_top_p">
        <el-slider
          v-model="formData.default_top_p"
          :min="0"
          :max="1"
          :step="0.05"
          :show-tooltip="true"
        />
      </el-form-item>

      <el-divider content-position="left">定价设置</el-divider>

      <el-form-item label="输入价格" prop="input_price">
        <el-input-number
          v-model="formData.input_price"
          :min="0"
          :precision="6"
          :step="0.001"
          style="width: 200px"
        />
        <el-select
          v-model="formData.currency"
          style="width: 100px; margin-left: 10px"
        >
          <el-option label="USD" value="USD" />
          <el-option label="CNY" value="CNY" />
          <el-option label="EUR" value="EUR" />
        </el-select>
        <span style="margin-left: 10px; color: var(--text-secondary); font-size: 13px">
          每 1K tokens
        </span>
      </el-form-item>

      <el-form-item label="输出价格" prop="output_price">
        <el-input-number
          v-model="formData.output_price"
          :min="0"
          :precision="6"
          :step="0.001"
          style="width: 200px"
        />
        <span style="margin-left: 10px; color: var(--text-secondary); font-size: 13px">
          每 1K tokens
        </span>
      </el-form-item>

      <el-divider content-position="left">功能支持</el-divider>

      <el-form-item label="支持功能">
        <el-checkbox v-model="formData.support_stream">
          流式输出
        </el-checkbox>
        <el-checkbox v-model="formData.support_function">
          函数调用
        </el-checkbox>
        <el-checkbox v-model="formData.support_vision">
          视觉理解
        </el-checkbox>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio label="active">激活</el-radio>
          <el-radio label="inactive">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        添加模型
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useModelStore } from '@/stores/model'
import type { CreateModelParams } from '@/api/models'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const modelStore = useModelStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const visible = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    resetForm()
  }
})

const formData = reactive<CreateModelParams>({
  name: '',
  model_id: '',
  provider: 'openai',
  model_type: 'chat',
  base_url: '',
  api_key: '',
  max_tokens: 4096,
  context_length: 128000,
  default_temperature: 0.7,
  default_top_p: 1.0,
  input_price: 0.005,
  output_price: 0.015,
  currency: 'USD',
  status: 'active',
  support_stream: true,
  support_function: false,
  support_vision: false,
  description: ''
})

const formRules: FormRules<CreateModelParams> = {
  name: [
    { required: true, message: '请输入模型名称', trigger: 'blur' }
  ],
  model_id: [
    { required: true, message: '请输入模型 ID', trigger: 'blur' }
  ],
  provider: [
    { required: true, message: '请选择提供商', trigger: 'change' }
  ],
  model_type: [
    { required: true, message: '请选择模型类型', trigger: 'change' }
  ],
  base_url: [
    { required: true, message: '请输入 API 地址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的 URL', trigger: 'blur' }
  ],
  api_key: [
    { required: true, message: '请输入 API 密钥', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

function resetForm() {
  formData.name = ''
  formData.model_id = ''
  formData.provider = 'openai'
  formData.model_type = 'chat'
  formData.base_url = ''
  formData.api_key = ''
  formData.max_tokens = 4096
  formData.context_length = 128000
  formData.default_temperature = 0.7
  formData.default_top_p = 1.0
  formData.input_price = 0.005
  formData.output_price = 0.015
  formData.currency = 'USD'
  formData.status = 'active'
  formData.support_stream = true
  formData.support_function = false
  formData.support_vision = false
  formData.description = ''
  formRef.value?.clearValidate()
}

function handleClose() {
  visible.value = false
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    await modelStore.createModel(formData)

    ElMessage.success('模型添加成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    if (error?.errorFields) {
      // 表单验证失败
      return
    }
    ElMessage.error(error?.message || '模型添加失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
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
      font-size: 18px;
    }
  }

  .el-dialog__body {
    padding: 24px;
    max-height: 600px;
    overflow-y: auto;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
  }
}

:deep(.el-divider) {
  margin: 20px 0;
  border-color: var(--border-color);

  .el-divider__text {
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-weight: 600;
    font-size: 14px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 18px;

  .el-form-item__label {
    color: var(--text-secondary);
    font-weight: 500;
  }
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: var(--bg-primary);
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

:deep(.el-checkbox) {
  color: var(--text-primary);
  margin-right: 20px;

  .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: #10a37f;
    border-color: #10a37f;
  }

  .el-checkbox__label {
    color: var(--text-primary);
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

:deep(.el-input-number) {
  .el-input-number__decrease,
  .el-input-number__increase {
    background: var(--bg-primary);
    border-color: var(--border-color);
    color: var(--text-secondary);

    &:hover {
      color: #10a37f;
    }
  }
}
</style>
