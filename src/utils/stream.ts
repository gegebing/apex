/**
 * 流式请求处理工具
 */

export interface StreamOptions {
    onMessage: (chunk: string) => void
    onError?: (error: Error) => void
    onComplete?: () => void
}

/**
 * 处理流式响应
 * @param url 请求 URL
 * @param data 请求数据
 * @param options 回调选项
 */
export async function handleStreamResponse(
    url: string,
    data: Record<string, unknown>,
    options: StreamOptions
): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL

    try {
        const response = await fetch(`${baseUrl}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder('utf-8')

        if (!reader) {
            throw new Error('无法获取流数据读取器')
        }

        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()

            if (done) {
                // 处理剩余的 buffer
                if (buffer.trim()) {
                    processSSEData(buffer, options.onMessage)
                }
                options.onComplete?.()
                break
            }

            buffer += decoder.decode(value, { stream: true })

            // 按行处理 SSE 数据
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // 保留最后一行未完成的数据

            for (const line of lines) {
                processSSEData(line, options.onMessage)
            }
        }
    } catch (error) {
        options.onError?.(error as Error)
    }
}

/**
 * 处理 SSE 数据行
 */
function processSSEData(line: string, onMessage: (chunk: string) => void): void {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith(':')) {
        // 空行或注释，跳过
        return
    }

    if (trimmedLine.startsWith('data:')) {
        const data = trimmedLine.slice(5).trim()

        if (data === '[DONE]') {
            return
        }

        try {
            const parsed = JSON.parse(data)
            // 根据实际 API 响应格式提取内容
            const content = parsed.content || parsed.choices?.[0]?.delta?.content || parsed.text || data
            if (content) {
                onMessage(content)
            }
        } catch {
            // 如果不是 JSON 格式，直接使用原始数据
            onMessage(data)
        }
    }
}

/**
 * 生成唯一会话 ID
 */
export function generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
