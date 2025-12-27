import request from '@/utils/request'
import { handleStreamResponse, type StreamOptions } from '@/utils/stream'

export interface ChatMessage {
    id: number
    agent_id: number
    session_id: string
    role: 'user' | 'assistant'
    content: string
    token_used: number
    created_at: string
}

export interface ChatParams {
    message: string
    session_id: string
}

export const chatApi = {
    /** 普通对话 */
    chat(agentId: number, message: string, sessionId: string) {
        return request.post<{ response: string }>('/api/v1/agents/chat', {
            message,
            session_id: sessionId,
            agent_id: agentId
        })
    },

    /** 流式对话 */
    streamChat(
        agentId: number,
        message: string,
        sessionId: string,
        options: Omit<StreamOptions, 'onMessage'> & { onMessage: (chunk: string) => void }
    ) {
        return handleStreamResponse(
            '/api/v1/agents/chat/stream',
            { message, session_id: sessionId, agent_id: agentId },
            options
        )
    },

    /** 获取对话历史 */
    getConversations(agentId: number, sessionId: string, limit: number = 20) {
        return request.get<{ data: ChatMessage[] }>(`/api/v1/agents/${agentId}/conversations`, {
            params: { session_id: sessionId, limit }
        })
    },

    /** 清空对话历史 */
    clearConversations(agentId: number, sessionId: string) {
        return request.delete(`/api/v1/workflows/${agentId}/conversations`, {
            params: { session_id: sessionId }
        })
    }
}

export default chatApi
