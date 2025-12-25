import request from '@/utils/request'

export interface Model {
    id: number
    name: string
    model_id: string
    provider: string
    model_type: string
    base_url: string
    api_key?: string
    max_tokens: number
    context_length: number
    default_temperature: number
    default_top_p: number
    input_price: number
    output_price: number
    currency: string
    status: string
    support_stream: boolean
    support_function: boolean
    support_vision: boolean
    description: string
    is_default?: boolean
    created_at?: string
    updated_at?: string
}

export interface CreateModelParams {
    name: string
    model_id: string
    provider: string
    model_type: string
    base_url: string
    api_key: string
    max_tokens: number
    context_length: number
    default_temperature: number
    default_top_p: number
    input_price: number
    output_price: number
    currency: string
    status: string
    support_stream: boolean
    support_function: boolean
    support_vision: boolean
    description: string
}

export interface ModelProvider {
    id: string
    name: string
    icon?: string
}

export const modelApi = {
    /** 获取提供商列表 */
    getProviders() {
        return request.get<ModelProvider[]>('/api/v1/models/providers')
    },

    /** 获取模型列表 */
    getModels(params: { page: number; page_size: number }) {
        return request.get<Model[]>('/api/v1/models', { params })
    },

    /** 创建模型配置 */
    createModel(data: CreateModelParams) {
        return request.post<Model>('/api/v1/models', data)
    },

    /** 获取模型详情 */
    getModelDetail(id: number) {
        return request.get<Model>(`/api/v1/models/${id}`)
    },

    /** 更新模型配置 */
    updateModel(id: number, data: Partial<CreateModelParams>) {
        return request.put<Model>(`/api/v1/models/${id}`, data)
    },

    /** 删除模型 */
    deleteModel(id: number) {
        return request.delete(`/api/v1/models/${id}`)
    },

    /** 设置为默认模型 */
    setDefaultModel(id: number) {
        return request.post(`/api/v1/models/${id}/set-default`)
    },

    /** 测试模型连接 */
    testModel(modelId: number, message: string) {
        return request.post<{ response: string }>('/api/v1/models/test', {
            model_id: modelId,
            message
        })
    },

    /** 获取使用统计 */
    getUsageStats(modelId: number, days: number = 7) {
        return request.get('/api/v1/models/usage-stats', {
            params: { model_id: modelId, days }
        })
    }
}

export default modelApi
