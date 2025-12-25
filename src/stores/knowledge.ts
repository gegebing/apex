import { defineStore } from 'pinia'
import { ref } from 'vue'
import { knowledgeApi, type KnowledgeBase, type Document } from '@/api/knowledge'

export const useKnowledgeStore = defineStore('knowledge', () => {
    // 状态
    const knowledgeBases = ref<KnowledgeBase[]>([])
    const currentKB = ref<KnowledgeBase | null>(null)
    const documents = ref<Document[]>([])
    const loading = ref(false)
    const total = ref(0)

    // 方法
    async function fetchKnowledgeBases(params: { page: number; page_size?: number }) {
        loading.value = true
        try {
            const data = await knowledgeApi.getKnowledgeBases(params) as any
            knowledgeBases.value = data.items || data
            total.value = data.total || data.length
        } finally {
            loading.value = false
        }
    }

    async function fetchKnowledgeBaseDetail(id: number) {
        loading.value = true
        try {
            const data = await knowledgeApi.getKnowledgeBaseDetail(id)
            currentKB.value = data as KnowledgeBase
            return data
        } finally {
            loading.value = false
        }
    }

    async function createKnowledgeBase(data: Parameters<typeof knowledgeApi.createKnowledgeBase>[0]) {
        const kb = await knowledgeApi.createKnowledgeBase(data)
        knowledgeBases.value.unshift(kb as KnowledgeBase)
        return kb
    }

    async function updateKnowledgeBase(id: number, data: Parameters<typeof knowledgeApi.updateKnowledgeBase>[1]) {
        const kb = await knowledgeApi.updateKnowledgeBase(id, data)
        const index = knowledgeBases.value.findIndex(k => k.id === id)
        if (index !== -1) {
            knowledgeBases.value[index] = kb as KnowledgeBase
        }
        return kb
    }

    async function deleteKnowledgeBase(id: number) {
        await knowledgeApi.deleteKnowledgeBase(id)
        knowledgeBases.value = knowledgeBases.value.filter(k => k.id !== id)
    }

    async function fetchDocuments(kbId: number, page: number = 1) {
        loading.value = true
        try {
            const data = await knowledgeApi.getDocuments(kbId, { page }) as any
            documents.value = data.items || data
        } finally {
            loading.value = false
        }
    }

    async function addDocument(kbId: number, data: Parameters<typeof knowledgeApi.addDocument>[1]) {
        const doc = await knowledgeApi.addDocument(kbId, data)
        documents.value.unshift(doc as Document)
        return doc
    }

    async function deleteDocument(kbId: number, docId: number) {
        await knowledgeApi.deleteDocument(kbId, docId)
        documents.value = documents.value.filter(d => d.id !== docId)
    }

    return {
        // 状态
        knowledgeBases,
        currentKB,
        documents,
        loading,
        total,
        // 方法
        fetchKnowledgeBases,
        fetchKnowledgeBaseDetail,
        createKnowledgeBase,
        updateKnowledgeBase,
        deleteKnowledgeBase,
        fetchDocuments,
        addDocument,
        deleteDocument
    }
})
