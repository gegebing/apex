<template>
  <div class="chat-window">
    <!-- 消息区域 -->
    <div class="messages-container" ref="messagesRef">
      <div v-if="messages.length === 0" class="empty-chat">
        <el-empty description="开始你的对话吧" :image-size="120" />
      </div>
      
      <template v-else>
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['message-item', `message-${msg.role}`]"
        >
          <div class="message-avatar">
            <el-avatar 
              :size="36"
              :icon="msg.role === 'user' ? UserFilled : ChatDotRound" 
              :style="{ 
                background: msg.role === 'user' ? '#5E35B1' : '#10a37f' 
              }"
            />
          </div>
          
          <div class="message-content">
            <div class="message-header">
              <span class="message-role">
                {{ msg.role === 'user' ? '用户' : 'AI 助手' }}
              </span>
              <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
            </div>
            
            <div class="message-body">
              <MarkdownRender :content="msg.content" />
              <span v-if="msg.isStreaming" class="typing-cursor">|</span>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-container">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="3"
        :placeholder="isStreaming ? '正在回复中...' : '输入消息... (Ctrl+Enter 发送)'"
        :disabled="isStreaming"
        resize="none"
        @keydown.ctrl.enter="handleSend"
      />
      <div class="input-actions">
        <el-button 
          type="primary" 
          :icon="Promotion"
          :disabled="!inputText.trim() || isStreaming"
          :loading="isStreaming"
          @click="handleSend"
        >
          {{ isStreaming ? '发送中' : '发送' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import MarkdownRender from '@/components/Markdown/MarkdownRender.vue'
import { UserFilled, ChatDotRound, Promotion } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const chatStore = useChatStore()
const { messages, isStreaming } = storeToRefs(chatStore)

const inputText = ref('')
const messagesRef = ref<HTMLElement>()

function formatTime(timestamp: number): string {
  return dayjs(timestamp).format('HH:mm:ss')
}

async function handleSend() {
  if (!inputText.value.trim() || isStreaming.value) return
  
  const content = inputText.value
  inputText.value = ''
  
  await chatStore.sendMessage(content)
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTo({
        top: messagesRef.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

// 监听消息变化，自动滚动到底部
watch(messages, scrollToBottom, { deep: true })
</script>

<style scoped lang="scss">
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  
  .empty-chat {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  
  .message-avatar {
    flex-shrink: 0;
  }
  
  .message-content {
    flex: 1;
    max-width: calc(100% - 60px);
    
    .message-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      
      .message-role {
        font-weight: 600;
        font-size: 14px;
      }
      
      .message-time {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .message-body {
      font-size: 14px;
      line-height: 1.6;
      
      .typing-cursor {
        animation: blink 1s infinite;
        color: var(--primary-color);
      }
    }
  }
  
  &.message-assistant {
    .message-body {
      background: #f5f7fa;
      padding: 12px 16px;
      border-radius: 8px;
    }
  }
}

.input-container {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: #fff;
  
  :deep(.el-textarea__inner) {
    border-radius: 8px;
    font-size: 14px;
  }
  
  .input-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

// 暗色模式
html.dark {
  .chat-window {
    background: #1f1f1f;
  }
  
  .message-item.message-assistant .message-body {
    background: #2a2a2a;
  }
  
  .input-container {
    background: #1f1f1f;
  }
}
</style>
