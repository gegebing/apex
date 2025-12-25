import request from '@/utils/request'

export interface SystemStats {
    total_agents: number
    active_agents: number
    total_knowledge_bases: number
    total_documents: number
    total_conversations: number
    total_messages: number
}

export const adminApi = {
    /** 获取系统统计 */
    getSystemStats() {
        return request.get<SystemStats>('/api/v1/admin/stats')
    }
}

export default adminApi
