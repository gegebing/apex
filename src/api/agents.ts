import request from '@/utils/request'

export interface Agent {
    id: number
    name: string
    description: string
    model_provider: string
    model_name: string
    temperature: number
    max_tokens: number
    system_prompt: string
    welcome_message: string
    enable_rag: boolean
    rag_top_k: number
    knowledge_base_ids: number[]
    status: string
    is_public: boolean
    created_at?: string
    updated_at?: string
}

export interface AgentListParams {
    page: number
    page_size: number
    status?: string
}

export interface CreateAgentParams {
    name: string
    description: string
    model_provider: string
    model_name: string
    temperature: number
    max_tokens: number
    system_prompt: string
    welcome_message: string
    enable_rag: boolean
    rag_top_k: number
    knowledge_base_ids: number[]
    status: string
    is_public: boolean
}

export const agentApi = {
    /** 获取智能体列表 */
    getAgents(params: AgentListParams) {
        return request.get<Agent[]>('/api/v1/agents', { params })
    },

    /** 创建智能体 */
    createAgent(data: CreateAgentParams) {
        return request.post<Agent>('/api/v1/agents', data)
    },

    /** 获取智能体详情 */
    getAgentDetail(id: number) {
        return request.get<Agent>(`/api/v1/agents/${id}`)
    },

    /** 更新智能体 */
    updateAgent(id: number, data: Partial<CreateAgentParams>) {
        return request.put<Agent>(`/api/v1/agents/${id}`, data)
    },

    /** 删除智能体 */
    deleteAgent(id: number) {
        return request.delete(`/api/v1/agents/${id}`)
    },

    /** 复制智能体 */
    duplicateAgent(id: number, name: string) {
        return request.post<Agent>(`/api/v1/agents/${id}/duplicate`, { name })
    },

    /** 获取智能体信息（对话前调用） */
    getAgentInfo(id: number) {
        return request.get<{ welcome_message: string }>(`/api/v1/agents/${id}/info`)
    },

    /** 获取智能体统计 */
    getAgentStats() {
        return request.get('/api/v1/agents/stats')
    },

    /** 获取提示词模板 */
    getPromptTemplates() {
        return request.get('/api/v1/agents/prompt-templates')
    }
}

export default agentApi
