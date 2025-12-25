<template>
  <div class="agent-detail-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>智能体详情</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="ChatDotRound" @click="handleChat">
          开始对话
        </el-button>
      </div>
    </div>
    
    <el-skeleton :loading="loading" animated :rows="10">
      <template #default>
        <div v-if="currentAgent" class="detail-content">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>基本信息</span>
                <el-button type="primary" link @click="editing = true">编辑</el-button>
              </div>
            </template>
            
            <el-descriptions :column="2" border>
              <el-descriptions-item label="名称">{{ currentAgent.name }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="currentAgent.status === 'active' ? 'success' : 'danger'">
                  {{ currentAgent.status === 'active' ? '激活' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="模型提供商">{{ currentAgent.model_provider }}</el-descriptions-item>
              <el-descriptions-item label="模型">{{ currentAgent.model_name }}</el-descriptions-item>
              <el-descriptions-item label="温度">{{ currentAgent.temperature }}</el-descriptions-item>
              <el-descriptions-item label="最大 Token">{{ currentAgent.max_tokens }}</el-descriptions-item>
              <el-descriptions-item label="RAG 状态">
                <el-tag :type="currentAgent.enable_rag ? 'success' : 'info'">
                  {{ currentAgent.enable_rag ? '已启用' : '未启用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="公开">
                <el-tag :type="currentAgent.is_public ? 'success' : 'info'">
                  {{ currentAgent.is_public ? '是' : '否' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">
                {{ currentAgent.description }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
          
          <el-card class="prompt-card">
            <template #header>
              <span>提示词配置</span>
            </template>
            
            <div class="prompt-section">
              <h4>系统提示词</h4>
              <el-input
                v-model="currentAgent.system_prompt"
                type="textarea"
                :rows="6"
                readonly
              />
            </div>
            
            <div class="prompt-section">
              <h4>欢迎语</h4>
              <el-input
                v-model="currentAgent.welcome_message"
                type="textarea"
                :rows="2"
                readonly
              />
            </div>
          </el-card>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAgentStore } from '@/stores/agent'
import { useChatStore } from '@/stores/chat'
import { ArrowLeft, ChatDotRound } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const agentStore = useAgentStore()
const chatStore = useChatStore()

const { currentAgent, loading } = storeToRefs(agentStore)
const editing = ref(false)

const agentId = Number(route.params.id)

onMounted(async () => {
  await agentStore.fetchAgentDetail(agentId)
})

function handleChat() {
  if (currentAgent.value) {
    chatStore.setCurrentAgentId(currentAgent.value.id)
    router.push('/chat')
  }
}
</script>

<style scoped lang="scss">
.agent-detail-page {
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
    flex: 1;
  }
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prompt-card {
  .prompt-section {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #606266;
    }
  }
}

// 暗色模式
html.dark {
  .agent-detail-page {
    background: #1a1a1a;
  }
}
</style>
