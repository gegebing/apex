import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: () => import('@/components/Layout/MainLayout.vue'),
        redirect: '/chat',
        children: [
            {
                path: 'chat',
                name: 'Chat',
                component: () => import('@/views/chat/index.vue'),
                meta: { title: '智能对话', icon: 'ChatDotRound' }
            },
            {
                path: 'agents',
                name: 'Agents',
                component: () => import('@/views/agents/index.vue'),
                meta: { title: '智能体管理', icon: 'User' }
            },
            {
                path: 'agents/create',
                name: 'AgentCreate',
                component: () => import('@/views/agents/create.vue'),
                meta: { title: '创建智能体', hidden: true }
            },
            {
                path: 'agents/:id',
                name: 'AgentDetail',
                component: () => import('@/views/agents/detail.vue'),
                meta: { title: '智能体详情', hidden: true }
            },
            {
                path: 'knowledge',
                name: 'Knowledge',
                component: () => import('@/views/knowledge/index.vue'),
                meta: { title: '知识库', icon: 'Collection' }
            },
            {
                path: 'knowledge/:id/documents',
                name: 'KnowledgeDocuments',
                component: () => import('@/views/knowledge/documents.vue'),
                meta: { title: '文档管理', hidden: true }
            },
            {
                path: 'models',
                name: 'Models',
                component: () => import('@/views/models/index.vue'),
                meta: { title: '模型配置', icon: 'Setting' }
            },
            {
                path: 'workflows',
                name: 'Workflows',
                component: () => import('@/views/workflows/index.vue'),
                meta: { title: '工作流', icon: 'Share' }
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('@/views/dashboard/index.vue'),
                meta: { title: '数据统计', icon: 'DataAnalysis' }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫：设置页面标题
router.beforeEach((to, _from, next) => {
    const title = to.meta.title as string || 'Apex'
    document.title = `${title} - Apex`
    next()
})

export default router
