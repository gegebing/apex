<template>
  <div class="workflow-canvas-container">
    <!-- 左侧节点面板 -->
    <div class="node-panel">
      <div class="panel-header">
        <h3>节点类型</h3>
      </div>
      <div class="node-types-list">
        <div
          v-for="nodeType in NODE_TYPES"
          :key="nodeType.type"
          class="node-type-item"
          :style="{ '--node-color': nodeType.color }"
          draggable="true"
          @dragstart="handleDragStart($event, nodeType)"
        >
          <el-icon :size="20">
            <component :is="nodeType.icon" />
          </el-icon>
          <div class="node-type-info">
            <div class="node-type-label">{{ nodeType.label }}</div>
            <div class="node-type-desc">{{ nodeType.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间画布区域 -->
    <div
      class="canvas-area"
      ref="canvasRef"
      @drop="handleDrop"
      @dragover.prevent
      @click="handleCanvasClick"
    >
      <!-- SVG 连接线 -->
      <svg class="connections-layer">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#409EFF"
            />
          </marker>
        </defs>
        <path
          v-for="edge in edges"
          :key="edge.id"
          :d="getEdgePath(edge)"
          :class="['edge-path', { 'edge-selected': selectedEdgeId === edge.id }]"
          stroke="#409EFF"
          stroke-width="2"
          fill="none"
          marker-end="url(#arrowhead)"
          @click.stop="handleEdgeClick(edge.id)"
        />
      </svg>

      <!-- 节点 -->
      <div
        v-for="node in nodes"
        :key="node.id"
        :class="['workflow-node', `node-${node.type}`, { 'node-selected': selectedNodeId === node.id }]"
        :style="{ left: `${node.position.x}px`, top: `${node.position.y}px` }"
        @mousedown="handleNodeMouseDown($event, node)"
        @click.stop="handleNodeClick(node.id)"
      >
        <div class="node-header">
          <el-icon :size="16">
            <component :is="getNodeIcon(node.type)" />
          </el-icon>
          <span class="node-title">{{ node.name }}</span>
        </div>

        <!-- 输入连接点 -->
        <div
          v-if="node.type !== 'start'"
          class="connection-point input-point"
          @mouseup="handleConnectionMouseUp($event, node.id)"
        />

        <!-- 输出连接点 -->
        <div
          v-if="node.type !== 'end'"
          class="connection-point output-point"
          @mousedown="handleConnectionStart($event, node.id)"
        />
      </div>

      <!-- 连接线预览 -->
      <svg
        v-if="connectingFrom"
        class="connections-layer"
        style="pointer-events: none"
      >
        <path
          :d="tempConnectionPath"
          stroke="#409EFF"
          stroke-width="2"
          stroke-dasharray="5,5"
          fill="none"
          marker-end="url(#arrowhead)"
        />
      </svg>
    </div>

    <!-- 右侧属性面板 -->
    <div class="properties-panel">
      <div class="panel-header">
        <h3>{{ selectedNodeId ? '节点属性' : '属性' }}</h3>
      </div>

      <div v-if="selectedNode" class="properties-content">
        <el-form label-width="80px" size="small">
          <el-form-item label="名称">
            <el-input v-model="selectedNode.name" @input="handleNodeUpdate" />
          </el-form-item>

          <!-- LLM 节点配置 -->
          <template v-if="selectedNode.type === 'llm'">
            <el-divider content-position="left">LLM 配置</el-divider>
            <el-form-item label="系统提示词">
              <el-input
                v-model="selectedNode.data.system_prompt"
                type="textarea"
                :rows="4"
                @input="handleNodeUpdate"
              />
            </el-form-item>
            <el-form-item label="用户提示词">
              <el-input
                v-model="selectedNode.data.user_prompt"
                type="textarea"
                :rows="3"
                @input="handleNodeUpdate"
              />
            </el-form-item>
            <el-form-item label="输出变量">
              <el-input v-model="selectedNode.data.output_variable" @input="handleNodeUpdate" />
            </el-form-item>
          </template>

          <!-- 知识库节点配置 -->
          <template v-else-if="selectedNode.type === 'knowledge'">
            <el-divider content-position="left">知识库配置</el-divider>
            <el-form-item label="知识库">
              <el-select v-model="selectedNode.data.knowledge_base_id" @change="handleNodeUpdate">
                <el-option
                  v-for="kb in knowledgeBases"
                  :key="kb.id"
                  :label="kb.name"
                  :value="kb.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="检索数量">
              <el-input-number
                v-model="selectedNode.data.top_k"
                :min="1"
                :max="10"
                @change="handleNodeUpdate"
              />
            </el-form-item>
            <el-form-item label="查询语句">
              <el-input
                v-model="selectedNode.data.query"
                @input="handleNodeUpdate"
              />
            </el-form-item>
            <el-form-item label="输出变量">
              <el-input v-model="selectedNode.data.output_variable" @input="handleNodeUpdate" />
            </el-form-item>
          </template>

          <!-- 工具节点配置 -->
          <template v-else-if="selectedNode.type === 'tool'">
            <el-divider content-position="left">工具配置</el-divider>
            <el-form-item label="工具">
              <el-select v-model="selectedNode.data.tool_id" @change="handleNodeUpdate">
                <el-option
                  v-for="tool in availableTools"
                  :key="tool.id"
                  :label="tool.name"
                  :value="tool.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="输出变量">
              <el-input v-model="selectedNode.data.output_variable" @input="handleNodeUpdate" />
            </el-form-item>
          </template>

          <!-- 条件节点配置 -->
          <template v-else-if="selectedNode.type === 'condition'">
            <el-divider content-position="left">条件配置</el-divider>
            <div
              v-for="(condition, index) in selectedNode.data.conditions"
              :key="condition.id"
              class="condition-item"
            >
              <el-form-item :label="`条件 ${index + 1}`">
                <el-input
                  v-model="condition.expression"
                  placeholder="条件表达式"
                  @input="handleNodeUpdate"
                />
              </el-form-item>
              <el-form-item label="目标节点">
                <el-input
                  v-model="condition.target_node"
                  placeholder="节点 ID"
                  @input="handleNodeUpdate"
                />
              </el-form-item>
            </div>
          </template>

          <!-- 删除按钮 -->
          <div class="node-actions">
            <el-button type="danger" size="small" @click="handleDeleteNode">
              删除节点
            </el-button>
          </div>
        </el-form>
      </div>

      <div v-else class="properties-empty">
        <el-empty description="请选择一个节点" :image-size="80" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { nanoid } from 'nanoid'
import {
  VideoPlay,
  CircleClose,
  ChatDotRound,
  Share,
  Collection,
  Tools
} from '@element-plus/icons-vue'
import type { WorkflowNode, WorkflowEdge, NodePosition } from '@/api/workflows'
import { NODE_TYPES } from './types'

interface Props {
  modelValue?: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
  }
  knowledgeBases?: Array<{ id: number; name: string }>
  availableTools?: Array<{ id: string; name: string }>
}

interface Emits {
  (e: 'update:modelValue', value: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ nodes: [], edges: [] }),
  knowledgeBases: () => [],
  availableTools: () => []
})

const emit = defineEmits<Emits>()

const canvasRef = ref<HTMLElement>()
const nodes = ref<WorkflowNode[]>(props.modelValue.nodes || [])
const edges = ref<WorkflowEdge[]>(props.modelValue.edges || [])
const selectedNodeId = ref<string | null>(null)
const selectedEdgeId = ref<string | null>(null)

const draggingNode = ref<WorkflowNode | null>(null)
const dragOffset = ref<NodePosition | null>(null)
const connectingFrom = ref<string | null>(null)
const mousePosition = ref<NodePosition>({ x: 0, y: 0 })

const selectedNode = computed(() => {
  return nodes.value.find(n => n.id === selectedNodeId.value) || null
})

const tempConnectionPath = computed(() => {
  if (!connectingFrom.value) return ''
  const fromNode = nodes.value.find(n => n.id === connectingFrom.value)
  if (!fromNode) return ''

  const startX = fromNode.position.x + 150
  const startY = fromNode.position.y + 30
  const endX = mousePosition.value.x
  const endY = mousePosition.value.y

  return getBezierPath(startX, startY, endX, endY)
})

function getNodeIcon(type: string) {
  const iconMap: Record<string, any> = {
    start: VideoPlay,
    end: CircleClose,
    llm: ChatDotRound,
    condition: Share,
    knowledge: Collection,
    tool: Tools
  }
  return iconMap[type] || VideoPlay
}

function handleDragStart(event: DragEvent, nodeType: any) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('nodeType', JSON.stringify(nodeType))
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const nodeTypeStr = event.dataTransfer?.getData('nodeType')
  if (!nodeTypeStr || !canvasRef.value) return

  const nodeType = JSON.parse(nodeTypeStr)
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left - 75
  const y = event.clientY - rect.top - 20

  const newNode: WorkflowNode = {
    id: nanoid(),
    type: nodeType.type as any,
    name: nodeType.label,
    position: { x, y },
    data: { ...nodeType.defaultData }
  }

  nodes.value.push(newNode)
  emitChange()
}

function handleNodeMouseDown(event: MouseEvent, node: WorkflowNode) {
  if (event.button !== 0) return
  draggingNode.value = node
  dragOffset.value = {
    x: event.clientX - node.position.x,
    y: event.clientY - node.position.y
  }
}

function handleMouseMove(event: MouseEvent) {
  mousePosition.value = { x: event.clientX, y: event.clientY }

  if (draggingNode.value && dragOffset.value && canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    const x = event.clientX - dragOffset.value.x
    const y = event.clientY - dragOffset.value.y

    draggingNode.value.position.x = Math.max(0, x)
    draggingNode.value.position.y = Math.max(0, y)
  }
}

function handleMouseUp() {
  if (draggingNode.value) {
    emitChange()
  }
  draggingNode.value = null
  dragOffset.value = null

  if (connectingFrom.value) {
    connectingFrom.value = null
  }
}

function handleConnectionStart(event: MouseEvent, nodeId: string) {
  event.stopPropagation()
  connectingFrom.value = nodeId
}

function handleConnectionMouseUp(event: MouseEvent, targetNodeId: string) {
  event.stopPropagation()
  if (!connectingFrom.value || connectingFrom.value === targetNodeId) {
    connectingFrom.value = null
    return
  }

  // 检查是否已存在连接
  const exists = edges.value.some(
    e => e.source === connectingFrom.value && e.target === targetNodeId
  )
  if (!exists) {
    edges.value.push({
      id: nanoid(),
      source: connectingFrom.value,
      target: targetNodeId
    })
    emitChange()
  }

  connectingFrom.value = null
}

function handleNodeClick(nodeId: string) {
  selectedNodeId.value = nodeId
  selectedEdgeId.value = null
}

function handleEdgeClick(edgeId: string) {
  selectedEdgeId.value = edgeId
  selectedNodeId.value = null
}

function handleCanvasClick() {
  selectedNodeId.value = null
  selectedEdgeId.value = null
}

function handleNodeUpdate() {
  emitChange()
}

function handleDeleteNode() {
  if (!selectedNodeId.value) return

  // 删除节点和相关连接
  nodes.value = nodes.value.filter(n => n.id !== selectedNodeId.value)
  edges.value = edges.value.filter(
    e => e.source !== selectedNodeId.value && e.target !== selectedNodeId.value
  )

  selectedNodeId.value = null
  emitChange()
}

function getEdgePath(edge: WorkflowEdge): string {
  const fromNode = nodes.value.find(n => n.id === edge.source)
  const toNode = nodes.value.find(n => n.id === edge.target)
  if (!fromNode || !toNode) return ''

  const startX = fromNode.position.x + 150
  const startY = fromNode.position.y + 30
  const endX = toNode.position.x
  const endY = toNode.position.y + 30

  return getBezierPath(startX, startY, endX, endY)
}

function getBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const controlOffset = Math.abs(x2 - x1) * 0.5
  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`
}

function emitChange() {
  emit('update:modelValue', {
    nodes: nodes.value,
    edges: edges.value
  })
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped lang="scss">
.workflow-canvas-container {
  display: flex;
  height: 100%;
  background: var(--bg-primary);
}

// 左侧节点面板
.node-panel {
  width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;

  .panel-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .node-types-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .node-type-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    margin-bottom: 8px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: grab;
    transition: all 0.2s;

    &:hover {
      border-color: var(--node-color);
      background: rgba(64, 158, 255, 0.05);
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &:active {
      cursor: grabbing;
    }

    .node-type-info {
      flex: 1;
      min-width: 0;
    }

    .node-type-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .node-type-desc {
      font-size: 12px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

// 中间画布区域
.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
  background-image:
    radial-gradient(circle, var(--border-color) 1px, transparent 1px);
  background-size: 20px 20px;

  .connections-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;

    &:last-child {
      pointer-events: none;
    }
  }

  .edge-path {
    cursor: pointer;
    pointer-events: stroke;
    transition: stroke-width 0.2s;

    &:hover {
      stroke-width: 3;
    }

    &.edge-selected {
      stroke: #67C23A;
      stroke-width: 3;
    }
  }
}

.workflow-node {
  position: absolute;
  width: 150px;
  min-height: 60px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: move;
  user-select: none;
  transition: all 0.2s;

  &:hover {
    border-color: #409EFF;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
  }

  &.node-selected {
    border-color: #409EFF;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  &.node-start {
    border-color: #67C23A;
  }

  &.node-end {
    border-color: #F56C6C;
  }

  &.node-llm {
    border-color: #409EFF;
  }

  &.node-condition {
    border-color: #E6A23C;
  }

  &.node-knowledge {
    border-color: #909399;
  }

  &.node-tool {
    border-color: #8e44ad;
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .connection-point {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #409EFF;
    border: 2px solid var(--bg-secondary);
    border-radius: 50%;
    cursor: crosshair;
    transition: all 0.2s;

    &:hover {
      transform: scale(1.3);
      box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
    }

    &.input-point {
      left: -6px;
      top: 50%;
      transform: translateY(-50%);
    }

    &.output-point {
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
    }
  }
}

// 右侧属性面板
.properties-panel {
  width: 320px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;

  .panel-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .properties-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .properties-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .node-actions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }

  .condition-item {
    padding: 12px;
    margin-bottom: 8px;
    background: var(--bg-tertiary);
    border-radius: 6px;
  }
}

// Element Plus 样式覆盖
:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-divider) {
  margin: 16px 0;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}
</style>
