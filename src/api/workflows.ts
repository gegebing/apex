import request from '@/utils/request'

// ============ 类型定义 ============

// 工作流节点条件
export interface WorkflowCondition {
    id: string
    expression: string
    target_node: string
}

// 节点位置
export interface NodePosition {
    x: number
    y: number
}

// 工作流节点数据
export interface WorkflowNodeData {
    conditions?: WorkflowCondition[]
    system_prompt?: string
    user_prompt?: string
    output_variable?: string
    [key: string]: any
}

// 工作流节点
export interface WorkflowNode {
    id: string
    type: 'start' | 'end' | 'llm' | 'condition' | 'tool' | 'knowledge'
    name: string
    position: NodePosition
    data?: WorkflowNodeData
}

// 工作流边
export interface WorkflowEdge {
    id: string
    source: string
    target: string
}

// 工作流配置
export interface WorkflowConfig {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
}

// 工作流
export interface Workflow {
    id: number
    name: string
    description: string
    status: 'active' | 'inactive' | 'draft'
    config: WorkflowConfig
    created_at?: string
    updated_at?: string
}

// 创建工作流参数
export interface CreateWorkflowParams {
    name: string
    description: string
    model_id: number
    status: string
    config: WorkflowConfig
}

// 工作流执行记录
export interface WorkflowExecution {
    id: number
    workflow_id: number
    status: 'running' | 'completed' | 'failed'
    input: string
    output?: string
    started_at: string
    completed_at?: string
    duration_ms?: number
    node_results?: Record<string, unknown>
}

// 节点类型
export interface NodeType {
    type: string
    name: string
    description: string
    icon: string
    config_schema: Record<string, unknown>
}

// 可用工具
export interface WorkflowTool {
    id: string
    name: string
    description: string
    parameters: Record<string, unknown>
}

// 工作流模板
export interface WorkflowTemplate {
    id: number
    name: string
    description: string
    config: WorkflowConfig
}

// ============ API 接口 ============

export const workflowApi = {
    /**
     * 创建工作流
     */
    createWorkflow(data: CreateWorkflowParams) {
        return request.post<Workflow>('/api/v1/workflows', data)
    },

    /**
     * 获取工作流列表
     */
    getWorkflows(params?: { page?: number; page_size?: number }) {
        return request.get<{ items: Workflow[]; total: number }>('/api/v1/workflows', { params })
    },

    /**
     * 获取工作流详情
     */
    getWorkflowDetail(id: number) {
        return request.get<Workflow>(`/api/v1/workflows/${id}`)
    },

    /**
     * 更新工作流
     */
    updateWorkflow(id: number, data: Partial<CreateWorkflowParams>) {
        return request.put<Workflow>(`/api/v1/workflows/${id}`, data)
    },

    /**
     * 删除工作流
     */
    deleteWorkflow(id: number) {
        return request.delete(`/api/v1/workflows/${id}`)
    },

    /**
     * 执行工作流
     */
    executeWorkflow(id: number, input: string) {
        return request.post<WorkflowExecution>(`/api/v1/workflows/${id}/execute`, { input })
    },

    /**
     * 获取执行历史
     */
    getExecutions(workflowId: number, params?: { page?: number; page_size?: number }) {
        return request.get<{ items: WorkflowExecution[]; total: number }>(
            `/api/v1/workflows/${workflowId}/executions`,
            { params }
        )
    },

    /**
     * 获取执行详情
     */
    getExecutionDetail(workflowId: number, executionId: number) {
        return request.get<WorkflowExecution>(
            `/api/v1/workflows/${workflowId}/executions/${executionId}`
        )
    },

    /**
     * 获取节点类型
     */
    getNodeTypes() {
        return request.get<NodeType[]>('/api/v1/workflows/node-types')
    },

    /**
     * 获取可用工具
     */
    getAvailableTools() {
        return request.get<WorkflowTool[]>('/api/v1/workflows/tools')
    },

    /**
     * 获取工作流模板
     */
    getTemplates() {
        return request.get<WorkflowTemplate[]>('/api/v1/workflows/templates')
    },

    /**
     * 验证工作流配置
     */
    validateConfig(config: WorkflowConfig) {
        return request.post<{ valid: boolean; errors?: string[] }>(
            '/api/v1/workflows/validate',
            { config }
        )
    }
}
