import request from '@/utils/request'

export interface KnowledgeBase {
    id: number
    name: string
    description: string
    is_public: boolean
    document_count?: number
    created_at?: string
    updated_at?: string
}

export interface Document {
    id: number
    knowledge_base_id: number
    title: string
    content: string
    file_type: string
    source: string
    created_at?: string
}

export interface CreateKnowledgeParams {
    name: string
    description: string
    is_public: boolean
}

export interface CreateDocumentParams {
    title: string
    content: string
    file_type: string
    source: string
}

export interface SearchParams {
    query: string
    top_k: number
}

export const knowledgeApi = {
    /** 获取知识库列表 */
    getKnowledgeBases(params: { page: number; page_size?: number }) {
        return request.get<KnowledgeBase[]>('/api/v1/knowledge-bases', { params })
    },

    /** 创建知识库 */
    createKnowledgeBase(data: CreateKnowledgeParams) {
        return request.post<KnowledgeBase>('/api/v1/knowledge-bases', data)
    },

    /** 获取知识库详情 */
    getKnowledgeBaseDetail(id: number) {
        return request.get<KnowledgeBase>(`/api/v1/knowledge-bases/${id}`)
    },

    /** 更新知识库 */
    updateKnowledgeBase(id: number, data: Partial<CreateKnowledgeParams>) {
        return request.put<KnowledgeBase>(`/api/v1/knowledge-bases/${id}`, data)
    },

    /** 删除知识库 */
    deleteKnowledgeBase(id: number) {
        return request.delete(`/api/v1/knowledge-bases/${id}`)
    },

    /** 获取知识库统计 */
    getKnowledgeBaseStats() {
        return request.get('/api/v1/knowledge-bases/stats')
    },

    /** 获取知识库的文档列表 */
    getDocuments(kbId: number, params: { page: number }) {
        return request.get<Document[]>(`/api/v1/knowledge-bases/${kbId}/documents`, { params })
    },

    /** 向知识库添加文档 */
    addDocument(kbId: number, data: CreateDocumentParams) {
        return request.post<Document>(`/api/v1/knowledge-bases/${kbId}/documents`, data)
    },

    /** 删除知识库中的文档 */
    deleteDocument(kbId: number, docId: number) {
        return request.delete(`/api/v1/knowledge-bases/${kbId}/documents/${docId}`)
    },

    /** 在知识库中搜索 */
    searchKnowledgeBase(kbId: number, params: SearchParams) {
        return request.post<Document[]>(`/api/v1/knowledge-bases/${kbId}/search`, params)
    }
}

export default knowledgeApi
