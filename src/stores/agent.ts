import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { agentApi, type Agent, type AgentListParams } from '@/api/agents'

export const useAgentStore = defineStore('agent', () => {
    // 状态
    const agentList = ref<Agent[]>([])
    const currentAgent = ref<Agent | null>(null)
    const loading = ref(false)
    const total = ref(0)

    // 计算属性
    const activeAgents = computed(() =>
        agentList.value.filter(a => a.status === 'active')
    )

    // 方法
    async function fetchAgents(params: AgentListParams) {
        loading.value = true
        try {
            const data = await agentApi.getAgents(params) as any
            agentList.value = data.items || data
            total.value = data.total || data.length
        } finally {
            loading.value = false
        }
    }

    async function fetchAgentDetail(id: number) {
        loading.value = true
        try {
            const data = await agentApi.getAgentDetail(id)
            currentAgent.value = data as Agent
            return data
        } finally {
            loading.value = false
        }
    }

    async function createAgent(data: Parameters<typeof agentApi.createAgent>[0]) {
        const agent = await agentApi.createAgent(data)
        agentList.value.unshift(agent as Agent)
        return agent
    }

    async function updateAgent(id: number, data: Parameters<typeof agentApi.updateAgent>[1]) {
        const agent = await agentApi.updateAgent(id, data)
        const index = agentList.value.findIndex(a => a.id === id)
        if (index !== -1) {
            agentList.value[index] = agent as Agent
        }
        if (currentAgent.value?.id === id) {
            currentAgent.value = agent as Agent
        }
        return agent
    }

    async function deleteAgent(id: number) {
        await agentApi.deleteAgent(id)
        agentList.value = agentList.value.filter(a => a.id !== id)
        if (currentAgent.value?.id === id) {
            currentAgent.value = null
        }
    }

    async function duplicateAgent(id: number, name: string) {
        const agent = await agentApi.duplicateAgent(id, name)
        agentList.value.unshift(agent as Agent)
        return agent
    }

    function setCurrentAgent(agent: Agent | null) {
        currentAgent.value = agent
    }

    return {
        // 状态
        agentList,
        currentAgent,
        loading,
        total,
        // 计算属性
        activeAgents,
        // 方法
        fetchAgents,
        fetchAgentDetail,
        createAgent,
        updateAgent,
        deleteAgent,
        duplicateAgent,
        setCurrentAgent
    }
})
