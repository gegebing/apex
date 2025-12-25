<template>
  <div class="dashboard-page">
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-content">
        <h1>数据统计</h1>
        <p class="subtitle">平台使用情况概览</p>
      </div>
    </header>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon agents">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.total_agents || 0 }}</span>
          <span class="stat-label">智能体总数</span>
        </div>
        <div class="stat-trend up">
          <el-icon><Top /></el-icon>
          <span>+12%</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon active">
          <el-icon :size="24"><Check /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.active_agents || 0 }}</span>
          <span class="stat-label">激活智能体</span>
        </div>
        <div class="stat-trend up">
          <el-icon><Top /></el-icon>
          <span>+8%</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon knowledge">
          <el-icon :size="24"><FolderOpened /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.total_knowledge_bases || 0 }}</span>
          <span class="stat-label">知识库</span>
        </div>
        <div class="stat-trend up">
          <el-icon><Top /></el-icon>
          <span>+5%</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon docs">
          <el-icon :size="24"><Document /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ stats.total_documents || 0 }}</span>
          <span class="stat-label">文档总数</span>
        </div>
        <div class="stat-trend up">
          <el-icon><Top /></el-icon>
          <span>+23%</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon conversations">
          <el-icon :size="24"><ChatDotRound /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ formatNumber(stats.total_conversations || 0) }}</span>
          <span class="stat-label">对话次数</span>
        </div>
        <div class="stat-trend up">
          <el-icon><Top /></el-icon>
          <span>+45%</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon messages">
          <el-icon :size="24"><ChatLineSquare /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ formatNumber(stats.total_messages || 0) }}</span>
          <span class="stat-label">消息总数</span>
        </div>
        <div class="stat-trend up">
          <el-icon><Top /></el-icon>
          <span>+67%</span>
        </div>
      </div>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-card main-chart">
        <div class="chart-header">
          <h3>使用趋势</h3>
          <div class="chart-tabs">
            <button :class="{ active: chartPeriod === 'week' }" @click="chartPeriod = 'week'">7天</button>
            <button :class="{ active: chartPeriod === 'month' }" @click="chartPeriod = 'month'">30天</button>
            <button :class="{ active: chartPeriod === 'year' }" @click="chartPeriod = 'year'">12月</button>
          </div>
        </div>
        <div ref="lineChartRef" class="chart-container"></div>
      </div>
      
      <div class="chart-card">
        <div class="chart-header">
          <h3>智能体分布</h3>
        </div>
        <div ref="pieChartRef" class="chart-container small"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { adminApi, type SystemStats } from '@/api/admin'
import * as echarts from 'echarts'
import { 
  User, Check, FolderOpened, Document, 
  ChatDotRound, ChatLineSquare, Top 
} from '@element-plus/icons-vue'

const stats = reactive<Partial<SystemStats>>({})
const chartPeriod = ref('week')
const lineChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let lineChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

onMounted(async () => {
  try {
    const data = await adminApi.getSystemStats()
    Object.assign(stats, data)
  } catch {
    Object.assign(stats, {
      total_agents: 12,
      active_agents: 8,
      total_knowledge_bases: 5,
      total_documents: 156,
      total_conversations: 1234,
      total_messages: 8765
    })
  }
  
  initCharts()
})

onUnmounted(() => {
  lineChart?.dispose()
  pieChart?.dispose()
})

function initCharts() {
  initLineChart()
  initPieChart()
  
  window.addEventListener('resize', () => {
    lineChart?.resize()
    pieChart?.resize()
  })
}

function initLineChart() {
  if (!lineChartRef.value) return
  
  lineChart = echarts.init(lineChartRef.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['对话次数', '消息数'],
      textStyle: { color: 'rgba(255, 255, 255, 0.6)' },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 40,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.5)' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.5)' }
    },
    series: [
      {
        name: '对话次数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#10a37f' },
        itemStyle: { color: '#10a37f' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 163, 127, 0.3)' },
            { offset: 1, color: 'rgba(16, 163, 127, 0)' }
          ])
        },
        data: [120, 182, 151, 234, 190, 330, 410]
      },
      {
        name: '消息数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#667eea' },
        itemStyle: { color: '#667eea' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0)' }
          ])
        },
        data: [520, 612, 491, 834, 690, 1030, 1210]
      }
    ]
  }
  
  lineChart.setOption(option)
}

function initPieChart() {
  if (!pieChartRef.value) return
  
  pieChart = echarts.init(pieChartRef.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#fff' }
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: 'rgba(30, 30, 30, 1)',
          borderWidth: 2
        },
        label: { show: false },
        labelLine: { show: false },
        data: [
          { value: 5, name: '技术助手', itemStyle: { color: '#10a37f' } },
          { value: 3, name: '客服助手', itemStyle: { color: '#667eea' } },
          { value: 2, name: '写作助手', itemStyle: { color: '#f093fb' } },
          { value: 2, name: '其他', itemStyle: { color: '#4facfe' } }
        ]
      }
    ]
  }
  
  pieChart.setOption(option)
}
</script>

<style scoped lang="scss">
.dashboard-page {
  height: 100%;
  overflow: auto;
  padding: 32px;
  background: var(--bg-primary);
}

.page-header {
  margin-bottom: 32px;
  
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }
  
  .subtitle {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

// 统计卡片网格
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  transition: all 0.25s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    
    &.agents { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    &.active { background: linear-gradient(135deg, #10a37f 0%, #1a7f5a 100%); }
    &.knowledge { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    &.docs { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    &.conversations { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    &.messages { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; }
  }
  
  .stat-content {
    flex: 1;
    
    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .stat-label {
      display: block;
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 2px;
    }
  }
  
  .stat-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 20px;
    
    &.up {
      background: rgba(16, 163, 127, 0.15);
      color: #10a37f;
    }
    
    &.down {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
  }
}

// 图表区域
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.chart-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .chart-tabs {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: var(--surface);
      border-radius: 8px;
      
      button {
        padding: 6px 12px;
        font-size: 12px;
        color: var(--text-secondary);
        border-radius: 6px;
        transition: all 0.2s;
        
        &:hover {
          color: var(--text-primary);
        }
        
        &.active {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
      }
    }
  }
  
  .chart-container {
    height: 300px;
    
    &.small {
      height: 250px;
    }
  }
}

// 响应式
@media (max-width: 1024px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
}
</style>
