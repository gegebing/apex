import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatApi, type ChatMessage } from '@/api/chat'
import { generateSessionId } from '@/utils/stream'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
    isStreaming?: boolean
}

export const useChatStore = defineStore('chat', () => {
    // 状态
    const messages = ref<Message[]>([])
    const sessionId = ref(generateSessionId())
    const isStreaming = ref(false)
    const currentAgentId = ref<number | null>(null)

    // 计算属性
    const messageCount = computed(() => messages.value.length)
    const lastMessage = computed(() => messages.value[messages.value.length - 1] || null)

    // 方法
    function generateMessageId(): string {
        return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }

    function addMessage(role: 'user' | 'assistant', content: string, isStreaming = false): Message {
        const message: Message = {
            id: generateMessageId(),
            role,
            content,
            timestamp: Date.now(),
            isStreaming
        }
        messages.value.push(message)
        return message
    }

    function updateLastAssistantMessage(content: string, isStreaming = true) {
        const lastMsg = messages.value[messages.value.length - 1]
        if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = content
            lastMsg.isStreaming = isStreaming
        }
    }

    async function sendMessage(content: string) {
        if (!content.trim() || isStreaming.value || !currentAgentId.value) {
            if (!currentAgentId.value) {
                console.error('未设置智能体 ID')
            }
            return
        }

        // 添加用户消息
        addMessage('user', content)

        // 开始流式响应
        isStreaming.value = true
        let assistantContent = ''

        // 添加空的助手消息
        addMessage('assistant', '', true)

        try {
            await chatApi.streamChat(currentAgentId.value, content, sessionId.value, {
                onMessage: (chunk) => {
                    assistantContent += chunk
                    updateLastAssistantMessage(assistantContent, true)
                },
                onComplete: () => {
                    updateLastAssistantMessage(assistantContent, false)
                    isStreaming.value = false
                },
                onError: (error) => {
                    console.error('流式对话错误:', error)
                    updateLastAssistantMessage(assistantContent || '抱歉，发生了错误，请重试。', false)
                    isStreaming.value = false
                }
            })
        } catch (error) {
            console.error('发送消息失败:', error)
            isStreaming.value = false
        }
    }

    async function loadHistory(agentId: number) {
        try {
            const response = await chatApi.getConversations(agentId, sessionId.value) as any
            const data = response?.data || []
            messages.value = data.map((msg: any) => ({
                id: `msg-${msg.id}`,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.created_at).getTime(),
                isStreaming: false
            }))
        } catch (error) {
            console.error('加载历史失败:', error)
        }
    }

    async function clearHistory(agentId: number) {
        await chatApi.clearConversations(agentId, sessionId.value)
        messages.value = []
    }

    function newSession() {
        sessionId.value = generateSessionId()
        messages.value = []
    }

    function setCurrentAgentId(id: number | null) {
        currentAgentId.value = id
        if (id) {
            newSession()
        }
    }

    return {
        // 状态
        messages,
        sessionId,
        isStreaming,
        currentAgentId,
        // 计算属性
        messageCount,
        lastMessage,
        // 方法
        addMessage,
        sendMessage,
        loadHistory,
        clearHistory,
        newSession,
        setCurrentAgentId
    }
})
