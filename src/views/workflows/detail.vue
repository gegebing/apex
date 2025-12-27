<template>
  <div class="workflow-detail-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>工作流详情</h2>
      <div class="header-actions">
        <el-button :icon="Edit" @click="handleEdit">编辑</el-button>
        <el-button :icon="VideoPlay" type="primary" @click="handleExecute">
          执行
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="detail-content">
      <el-card v-if="workflow" class="info-card">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="名称">
            {{ workflow.name }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(workflow.status)">
              {{ getStatusLabel(workflow.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模型 ID">
            {{ workflow.model_id }}
          </el-descriptions-item>
          <el-descriptions-item label="节点数量">
            {{ workflow.config?.nodes?.length || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="连接数量">
            {{ workflow.config?.edges?.length || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatTime(workflow.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ workflow.description }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 工作流可视化 -->
      <el-card v-if="workflow" class="canvas-card">
        <template #header>
          <div class="card-header">
            <span>工作流图</span>
          </div>
        </template>
        <div class="workflow-viewer">
          <workflow-canvas
            v-model="workflow.config"
            :knowledge-bases="[]"
            :available-tools="[]"
          />
        </div>
      </el-card>

      <!-- 节点列表 -->
      <el-card v-if="workflow" class="nodes-card">
        <template #header>
          <div class="card-header">
            <span>节点列表</span>
          </div>
        </template>
        <el-table :data="workflow.config.nodes" style="width: 100%">
          <el-table-column prop="id" label="ID" width="200" />
          <el-table-column prop="name" label="名称" width="150" />
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getNodeTypeColor(row.type)">
                {{ getNodeTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="位置" width="150">
            <template #default="{ row }">
              x: {{ row.position.x }}, y: {{ row.position.y }}
            </template>
          </el-table-column>
          <el-table-column prop="data" label="配置" show-overflow-tooltip />
        </el-table>
      </el-card>
    </div>

    <!-- 执行对话框 -->
    <el-dialog v-model="executeDialogVisible" title="执行工作流" width="600px">
      <el-form label-width="80px">
        <el-form-item label="输入">
          <el-input
            v-model="executeInput"
            type="textarea"
            :rows="6"
            placeholder="请输入工作流执行的输入内容"
          />
        </el-form-item>
        <el-form-item v-if="executeResult" label="结果">
          <div class="execute-result">
            <pre>{{ executeResult }}</pre>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="executeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="executing" @click="handleConfirmExecute">
          执行
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Edit, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import WorkflowCanvas from '@/components/Workflow/WorkflowCanvas.vue'
import { workflowApi } from '@/api/workflows'
import type { Workflow } from '@/api/workflows'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const workflow = ref<Workflow | null>(null)
const executeDialogVisible = ref(false)
const executing = ref(false)
const executeInput = ref('')
const executeResult = ref('')

onMounted(() => {
  const id = Number(route.params.id)
  if (id) {
    loadWorkflowDetail(id)
  }
})

async function loadWorkflowDetail(id: number) {
  loading.value = true
  try {
    const response = await workflowApi.getWorkflowDetail(id)
    workflow.value = response.data as Workflow
  } catch (error) {
    console.error('加载工作流详情失败:', error)
    ElMessage.error('加载工作流详情失败')
  } finally {
    loading.value = false
  }
}

function handleEdit() {
  if (workflow.value) {
    router.push(`/workflows/${workflow.value.id}/edit`)
  }
}

function handleExecute() {
  executeInput.value = ''
  executeResult.value = ''
  executeDialogVisible.value = true
}

async function handleConfirmExecute() {
  if (!workflow.value || !executeInput.value.trim()) {
    ElMessage.warning('请输入执行内容')
    return
  }

  executing.value = true
  try {
    const response = await workflowApi.executeWorkflow(
      workflow.value.id,
      executeInput.value
    )
    executeResult.value = JSON.stringify(response.data, null, 2)
    ElMessage.success('执行成功')
  } catch (error: any) {
    console.error('执行失败:', error)
    ElMessage.error(error?.message || '执行失败')
  } finally {
    executing.value = false
  }
}

function getStatusType(status: string) {
  const typeMap: Record<string, any> = {
    active: 'success',
    draft: 'info',
    inactive: 'danger'
  }
  return typeMap[status] || 'info'
}

function getStatusLabel(status: string) {
  const labelMap: Record<string, string> = {
    active: '激活',
    draft: '草稿',
    inactive: '禁用'
  }
  return labelMap[status] || status
}

function getNodeTypeColor(type: string) {
  const colorMap: Record<string, any> = {
    start: 'success',
    end: 'danger',
    llm: 'primary',
    condition: 'warning',
    knowledge: 'info',
    tool: ''
  }
  return colorMap[type] || 'info'
}

function getNodeTypeLabel(type: string) {
  const labelMap: Record<string, string> = {
    start: '开始',
    end: '结束',
    llm: 'LLM',
    condition: '条件分支',
    knowledge: '知识库',
    tool: '工具'
  }
  return labelMap[type] || type
}

function formatTime(time: string | undefined) {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}
</script>

<style scoped lang="scss">
.workflow-detail-page {
  padding: 24px;
  height: 100%;
  overflow: auto;
  background: var(--bg-primary);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;

  h2 {
    flex: 1;
    margin: 0;
    font-size: 20px;
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.info-card {
  margin-bottom: 16px;
}

.canvas-card {
  margin-bottom: 16px;
  height: 600px;

  :deep(.el-card__body) {
    height: calc(100% - 60px);
    padding: 0;
  }

  .workflow-viewer {
    height: 100%;
  }
}

.nodes-card {
  :deep(.el-card__body) {
    padding: 0;
  }
}

.execute-result {
  width: 100%;
  max-height: 300px;
  overflow: auto;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 6px;

  pre {
    margin: 0;
    font-size: 12px;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-all;
  }
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}
</style>
