import { defineStore } from 'pinia'
import { ref } from 'vue'
import { workflowApi, type Workflow, type WorkflowExecution, type NodeType, type WorkflowTemplate, type CreateWorkflowParams } from '@/api/workflows'

export const useWorkflowStore = defineStore('workflow', () => {
    // 状态
    const workflows = ref<Workflow[]>([])
    const currentWorkflow = ref<Workflow | null>(null)
    const executions = ref<WorkflowExecution[]>([])
    const nodeTypes = ref<NodeType[]>([])
    const templates = ref<WorkflowTemplate[]>([])
    const loading = ref(false)
    const total = ref(0)

    // 获取工作流列表
    async function fetchWorkflows(params?: { page?: number; page_size?: number }) {
        loading.value = true
        try {
            const data = await workflowApi.getWorkflows(params) as any
            workflows.value = data.items || data
            total.value = data.total || workflows.value.length
        } finally {
            loading.value = false
        }
    }

    // 获取工作流详情
    async function fetchWorkflowDetail(id: number) {
        loading.value = true
        try {
            const data = await workflowApi.getWorkflowDetail(id)
            currentWorkflow.value = data as Workflow
        } finally {
            loading.value = false
        }
    }

    // 创建工作流
    async function createWorkflow(data: CreateWorkflowParams) {
        const result = await workflowApi.createWorkflow(data)
        await fetchWorkflows()
        return result
    }

    // 更新工作流
    async function updateWorkflow(id: number, data: Partial<CreateWorkflowParams>) {
        const result = await workflowApi.updateWorkflow(id, data)
        await fetchWorkflows()
        return result
    }

    // 删除工作流
    async function deleteWorkflow(id: number) {
        await workflowApi.deleteWorkflow(id)
        workflows.value = workflows.value.filter(w => w.id !== id)
    }

    // 执行工作流
    async function executeWorkflow(id: number, input: string) {
        return await workflowApi.executeWorkflow(id, input)
    }

    // 获取执行历史
    async function fetchExecutions(workflowId: number) {
        const data = await workflowApi.getExecutions(workflowId) as any
        executions.value = data.items || data
    }

    // 获取节点类型
    async function fetchNodeTypes() {
        const data = await workflowApi.getNodeTypes()
        nodeTypes.value = data as NodeType[]
    }

    // 获取模板
    async function fetchTemplates() {
        const data = await workflowApi.getTemplates()
        templates.value = data as WorkflowTemplate[]
    }

    // 验证配置
    async function validateConfig(config: Workflow['config']) {
        return await workflowApi.validateConfig(config)
    }

    return {
        // 状态
        workflows,
        currentWorkflow,
        executions,
        nodeTypes,
        templates,
        loading,
        total,
        // 方法
        fetchWorkflows,
        fetchWorkflowDetail,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        executeWorkflow,
        fetchExecutions,
        fetchNodeTypes,
        fetchTemplates,
        validateConfig
    }
})
