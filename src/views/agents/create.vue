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
        
        <el-form-item label="模型提供商" prop="model_provider">
          <el-select v-model="formData.model_provider" placeholder="选择模型提供商">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Anthropic" value="anthropic" />
            <el-option label="Google" value="google" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="模型名称" prop="model_name">
          <el-select v-model="formData.model_name" placeholder="选择模型">
            <el-option label="GPT-4o" value="gpt-4o" />
            <el-option label="GPT-4o-mini" value="gpt-4o-mini" />
            <el-option label="GPT-3.5-turbo" value="gpt-3.5-turbo" />
            <el-option label="Claude 3.5 Sonnet" value="claude-3-5-sonnet" />
          </el-select>
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
          <el-input-number v-model="formData.max_tokens" :min="100" :max="16000" :step="100" />
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAgentStore } from '@/stores/agent'
import { useKnowledgeStore } from '@/stores/knowledge'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { storeToRefs } from 'pinia'

const router = useRouter()
const agentStore = useAgentStore()
const knowledgeStore = useKnowledgeStore()

const { knowledgeBases } = storeToRefs(knowledgeStore)

const formRef = ref<FormInstance>()
const submitting = ref(false)

const formData = reactive({
  name: '',
  description: '',
  model_provider: 'openai',
  model_name: 'gpt-4o-mini',
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
  model_provider: [{ required: true, message: '请选择模型提供商', trigger: 'change' }],
  model_name: [{ required: true, message: '请选择模型', trigger: 'change' }],
  system_prompt: [{ required: true, message: '请输入系统提示词', trigger: 'blur' }]
}

onMounted(async () => {
  await knowledgeStore.fetchKnowledgeBases({ page: 1, page_size: 100 })
})

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      await agentStore.createAgent(formData)
      ElMessage.success('创建成功')
      router.push('/agents')
    } catch (error) {
      console.error('创建失败:', error)
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
  background: #f5f7fa;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  
  h2 {
    margin: 0;
    font-size: 20px;
  }
}

.form-card {
  max-width: 800px;
  
  :deep(.el-divider) {
    margin: 24px 0;
    
    .el-divider__text {
      font-weight: 600;
      color: #303133;
    }
  }
}

// 暗色模式
html.dark {
  .agent-create-page {
    background: #1a1a1a;
  }
}
</style>
