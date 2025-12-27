import type { WorkflowNode, WorkflowEdge, NodePosition } from '@/api/workflows'

// 节点类型定义
export interface NodeTypeConfig {
  type: string
  label: string
  description: string
  icon: string
  color: string
  defaultData?: Record<string, any>
}

// 节点拖拽信息
export interface DragInfo {
  type: string
  label: string
}

// 画布状态
export interface CanvasState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  draggingNode: WorkflowNode | null
  dragOffset: NodePosition | null
  connectingFrom: string | null
}

// 可用的节点类型配置
export const NODE_TYPES: NodeTypeConfig[] = [
  {
    type: 'start',
    label: '开始',
    description: '工作流的起始节点',
    icon: 'VideoPlay',
    color: '#67C23A'
  },
  {
    type: 'end',
    label: '结束',
    description: '工作流的结束节点',
    icon: 'CircleClose',
    color: '#F56C6C'
  },
  {
    type: 'llm',
    label: 'LLM',
    description: '大语言模型调用',
    icon: 'ChatDotRound',
    color: '#409EFF',
    defaultData: {
      system_prompt: '',
      user_prompt: '{{input}}',
      output_variable: 'output'
    }
  },
  {
    type: 'condition',
    label: '条件分支',
    description: '根据条件分支执行',
    icon: 'Share',
    color: '#E6A23C',
    defaultData: {
      conditions: [
        { id: 'c1', expression: '', target_node: '' }
      ]
    }
  },
  {
    type: 'knowledge',
    label: '知识库',
    description: '从知识库检索信息',
    icon: 'Collection',
    color: '#909399',
    defaultData: {
      knowledge_base_id: null,
      top_k: 3,
      query: '{{input}}',
      output_variable: 'context'
    }
  },
  {
    type: 'tool',
    label: '工具',
    description: '调用外部工具',
    icon: 'Tools',
    color: '#8e44ad',
    defaultData: {
      tool_id: '',
      parameters: {},
      output_variable: 'result'
    }
  }
]
