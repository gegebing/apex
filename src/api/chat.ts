import request from '@/utils/request'
import { handleStreamResponse, type StreamOptions } from '@/utils/stream'

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp?: number
}

export interface ChatParams {
    message: string
    session_id: string
}

export const chatApi = {
    /** 普通对话 */
    chat(message: string, sessionId: string) {
        return request.post<{ response: string }>('/api/v1/agents/chat', {
            message,
            session_id: sessionId
        })
    },

    /** 流式对话 */
    streamChat(
        message: string,
        sessionId: string,
        options: Omit<StreamOptions, 'onMessage'> & { onMessage: (chunk: string) => void }
    ) {
        return handleStreamResponse(
            '/api/v1/agents/chat/stream',
            { message, session_id: sessionId },
            options
        )
    },

    /** 获取对话历史 */
    getConversations(agentId: number, sessionId: string, limit: number = 20) {
        return request.get<ChatMessage[]>(`/api/v1/agents/${agentId}/conversations`, {
            params: { session_id: sessionId, limit }
        })
    },

    /** 清空对话历史 */
    clearConversations(agentId: number, sessionId: string) {
        return request.delete(`/api/v1/agents/${agentId}/conversations`, {
            params: { session_id: sessionId }
        })
    }
}

export default chatApi
