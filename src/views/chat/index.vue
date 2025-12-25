<template>
  <div class="chat-page">
    <!-- 左侧智能体列表 -->
    <aside class="agent-sidebar">
      <div class="sidebar-header">
        <button class="new-chat-btn" @click="handleNewSession">
          <el-icon><Plus /></el-icon>
          <span>新对话</span>
        </button>
      </div>
      
      <div class="agent-list">
        <div
          v-for="agent in activeAgents"
          :key="agent.id"
          :class="['agent-item', { active: selectedAgentId === agent.id }]"
          @click="handleAgentChange(agent.id)"
        >
          <div class="agent-avatar">
            <el-icon :size="18"><ChatDotRound /></el-icon>
          </div>
          <div class="agent-info">
            <span class="agent-name">{{ agent.name }}</span>
            <span class="agent-model">{{ agent.model_name }}</span>
          </div>
        </div>
      </div>
    </aside>
    
    <!-- 对话主区域 -->
    <main class="chat-main">
      <!-- 空状态 -->
      <div v-if="!selectedAgentId" class="welcome-screen">
        <div class="welcome-content">
          <div class="welcome-logo">
            <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="url(#welcomeGradient)" />
              <path d="M10 16L14 20L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="welcomeGradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stop-color="#10a37f"/>
                  <stop offset="1" stop-color="#1a7f5a"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="welcome-title">Apex</h1>
          <p class="welcome-subtitle">选择一个智能体，开启 AI 对话之旅</p>
          
          <div class="feature-cards">
            <div class="feature-card">
              <el-icon :size="24"><ChatDotRound /></el-icon>
              <span>自然对话</span>
            </div>
            <div class="feature-card">
              <el-icon :size="24"><Collection /></el-icon>
              <span>知识增强</span>
            </div>
            <div class="feature-card">
              <el-icon :size="24"><MagicStick /></el-icon>
              <span>智能生成</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 对话区域 -->
      <template v-else>
        <div class="chat-container">
          <!-- 消息列表 -->
          <div class="messages-area" ref="messagesRef">
            <div class="messages-wrapper">
              <!-- 欢迎消息 -->
              <div v-if="messages.length === 0" class="welcome-message">
                <div class="assistant-avatar">
                  <el-icon :size="20"><ChatDotRound /></el-icon>
                </div>
                <div class="message-content">
                  <p>{{ currentAgent?.welcome_message || '你好！有什么我可以帮助你的吗？' }}</p>
                </div>
              </div>
              
              <!-- 消息列表 -->
              <div
                v-for="(msg, index) in messages"
                :key="msg.id"
                :class="['message-row', `message-${msg.role}`]"
                :style="{ animationDelay: `${index * 0.05}s` }"
              >
                <div class="message-avatar">
                  <el-icon v-if="msg.role === 'user'" :size="18"><User /></el-icon>
                  <el-icon v-else :size="18"><ChatDotRound /></el-icon>
                </div>
                <div class="message-body">
                  <MarkdownRender :content="msg.content" />
                  <span v-if="msg.isStreaming" class="typing-cursor"></span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 输入区域 -->
          <div class="input-area">
            <div class="input-container">
              <textarea
                ref="inputRef"
                v-model="inputText"
                :placeholder="isStreaming ? '正在思考中...' : '输入消息...'"
                :disabled="isStreaming"
                rows="1"
                @keydown.enter.exact.prevent="handleSend"
                @input="autoResize"
              ></textarea>
              <button 
                class="send-btn"
                :disabled="!inputText.trim() || isStreaming"
                @click="handleSend"
              >
                <el-icon v-if="isStreaming" class="is-loading"><Loading /></el-icon>
                <el-icon v-else><Promotion /></el-icon>
              </button>
            </div>
            <p class="input-hint">按 Enter 发送，Shift+Enter 换行</p>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAgentStore } from '@/stores/agent'
import { useChatStore } from '@/stores/chat'
import MarkdownRender from '@/components/Markdown/MarkdownRender.vue'
import { 
  Plus, ChatDotRound, Collection, MagicStick, 
  User, Promotion, Loading 
} from '@element-plus/icons-vue'

const agentStore = useAgentStore()
const chatStore = useChatStore()

const { activeAgents, currentAgent } = storeToRefs(agentStore)
const { messages, isStreaming } = storeToRefs(chatStore)

const selectedAgentId = ref<number>()
const inputText = ref('')
const messagesRef = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()

onMounted(async () => {
  await agentStore.fetchAgents({ page: 1, page_size: 100, status: 'active' })
})

async function handleAgentChange(id: number) {
  selectedAgentId.value = id
  await agentStore.fetchAgentDetail(id)
  chatStore.setCurrentAgentId(id)
}

function handleNewSession() {
  chatStore.newSession()
}

async function handleSend() {
  if (!inputText.value.trim() || isStreaming.value) return
  
  const content = inputText.value
  inputText.value = ''
  resetTextareaHeight()
  
  await chatStore.sendMessage(content)
}

function autoResize() {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
  inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 200) + 'px'
}

function resetTextareaHeight() {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })
</script>

<style scoped lang="scss">
.chat-page {
  display: flex;
  height: 100%;
  background: var(--bg-primary);
}

// 左侧智能体列表
.agent-sidebar {
  width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  
  .new-chat-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border: 1px dashed var(--border-color);
    border-radius: 10px;
    color: var(--text-secondary);
    font-size: 14px;
    transition: all 0.2s;
    
    &:hover {
      border-color: #10a37f;
      color: #10a37f;
      background: rgba(16, 163, 127, 0.1);
    }
  }
}

.agent-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 16px;
}

.agent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: var(--surface);
  }
  
  &.active {
    background: rgba(16, 163, 127, 0.15);
    
    .agent-avatar {
      background: #10a37f;
    }
  }
  
  .agent-avatar {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
  
  .agent-info {
    flex: 1;
    min-width: 0;
    
    .agent-name {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .agent-model {
      display: block;
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}

// 主对话区域
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 欢迎页面
.welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .welcome-content {
    text-align: center;
    max-width: 600px;
    padding: 40px;
  }
  
  .welcome-logo {
    margin-bottom: 24px;
  }
  
  .welcome-title {
    font-size: 32px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }
  
  .welcome-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    margin-bottom: 40px;
  }
  
  .feature-cards {
    display: flex;
    gap: 16px;
    justify-content: center;
    
    .feature-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 24px;
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      color: var(--text-secondary);
      font-size: 13px;
      transition: all 0.2s;
      
      &:hover {
        border-color: rgba(16, 163, 127, 0.5);
        color: #10a37f;
      }
    }
  }
}

// 对话容器
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
}

// 消息区域
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0;
}

.messages-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-message,
.message-row {
  display: flex;
  gap: 16px;
  animation: fadeIn 0.3s ease forwards;
  
  .message-avatar,
  .assistant-avatar {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .message-content,
  .message-body {
    flex: 1;
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-primary);
  }
}

.welcome-message .assistant-avatar,
.message-row.message-assistant .message-avatar {
  background: #10a37f;
  color: white;
}

.message-row.message-user .message-avatar {
  background: #5436DA;
  color: white;
}

.typing-cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: #10a37f;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

// 输入区域
.input-area {
  padding: 16px 0 24px;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  transition: border-color 0.2s;
  
  &:focus-within {
    border-color: rgba(16, 163, 127, 0.5);
  }
  
  textarea {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 15px;
    line-height: 1.5;
    resize: none;
    max-height: 200px;
    
    &::placeholder {
      color: var(--text-secondary);
    }
    
    &:disabled {
      opacity: 0.6;
    }
  }
  
  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #10a37f;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover:not(:disabled) {
      background: #0e9271;
    }
    
    &:disabled {
      background: var(--surface);
      color: var(--text-secondary);
      cursor: not-allowed;
    }
  }
}

.input-hint {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}
</style>
