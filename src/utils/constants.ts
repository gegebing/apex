/**
 * 常量定义
 */

// 智能体状态
export const AGENT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
} as const

// 模型提供商
export const MODEL_PROVIDERS = {
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    GOOGLE: 'google',
    CUSTOM: 'custom'
} as const

// 文件类型
export const FILE_TYPES = {
    TXT: 'txt',
    PDF: 'pdf',
    DOCX: 'docx',
    MD: 'md'
} as const

// 分页默认值
export const PAGINATION = {
    PAGE: 1,
    PAGE_SIZE: 20
} as const

// 消息角色
export const MESSAGE_ROLES = {
    USER: 'user',
    ASSISTANT: 'assistant',
    SYSTEM: 'system'
} as const
