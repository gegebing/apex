import { defineStore } from 'pinia'
import { ref } from 'vue'
import { modelApi, type Model, type ModelProvider } from '@/api/models'

export const useModelStore = defineStore('model', () => {
    // 状态
    const models = ref<Model[]>([])
    const providers = ref<ModelProvider[]>([])
    const currentModel = ref<Model | null>(null)
    const loading = ref(false)
    const total = ref(0)

    // 方法
    async function fetchProviders() {
        const data = await modelApi.getProviders()
        providers.value = data as ModelProvider[]
    }

    async function fetchModels(params: { page: number; page_size: number }) {
        loading.value = true
        try {
            const data = await modelApi.getModels(params) as any
            models.value = data.items || data
            total.value = data.total || data.length
        } finally {
            loading.value = false
        }
    }

    async function fetchModelDetail(id: number) {
        loading.value = true
        try {
            const data = await modelApi.getModelDetail(id)
            currentModel.value = data as Model
            return data
        } finally {
            loading.value = false
        }
    }

    async function createModel(data: Parameters<typeof modelApi.createModel>[0]) {
        const model = await modelApi.createModel(data)
        models.value.unshift(model as Model)
        return model
    }

    async function updateModel(id: number, data: Parameters<typeof modelApi.updateModel>[1]) {
        const model = await modelApi.updateModel(id, data)
        const index = models.value.findIndex(m => m.id === id)
        if (index !== -1) {
            models.value[index] = model as Model
        }
        return model
    }

    async function deleteModel(id: number) {
        await modelApi.deleteModel(id)
        models.value = models.value.filter(m => m.id !== id)
    }

    async function setDefaultModel(id: number) {
        await modelApi.setDefaultModel(id)
        // 更新所有模型的默认状态
        models.value.forEach(m => {
            m.is_default = m.id === id
        })
    }

    async function testModel(modelId: number, message: string) {
        return await modelApi.testModel(modelId, message)
    }

    return {
        // 状态
        models,
        providers,
        currentModel,
        loading,
        total,
        // 方法
        fetchProviders,
        fetchModels,
        fetchModelDetail,
        createModel,
        updateModel,
        deleteModel,
        setDefaultModel,
        testModel
    }
})
