<template>
  <div class="markdown-body" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps<{
  content: string
}>()

// 复制代码功能
const copyCode = (btn: HTMLElement) => {
  const codeBlock = btn.closest('.code-block')
  const codeElement = codeBlock?.querySelector('code')
  if (codeElement) {
    const text = codeElement.textContent || ''
    navigator.clipboard.writeText(text).then(() => {
      // 显示复制成功状态
      const originalText = btn.textContent
      btn.textContent = '已复制'
      btn.classList.add('copied')
      setTimeout(() => {
        btn.textContent = originalText
        btn.classList.remove('copied')
      }, 2000)
    }).catch(err => {
      console.error('复制失败:', err)
    })
  }
}

// 注册全局复制函数
onMounted(() => {
  ;(window as any).copyCode = copyCode
})

onUnmounted(() => {
  delete (window as any).copyCode
})

// 配置 Markdown-it
const md = new MarkdownIt({
  html: false,          // 禁用 HTML 标签
  linkify: true,        // 自动识别链接
  breaks: true,         // 保留换行符（单个换行转换为 <br>）
  typographer: false,   // 禁用排版优化（保留引号等原样）
  highlight: (str: string, lang: string) => {
    // 处理没有指定语言的情况
    if (!lang || lang.trim() === '') {
      return `<pre class="code-block"><div class="code-header"><span class="code-lang">TEXT</span><button class="copy-btn" onclick="copyCode(this)">复制</button></div><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`
    }

    // 规范化语言名称（处理可能的别名）
    const normalizedLang = lang.trim().toLowerCase()

    // 检查语言是否被支持
    if (hljs.getLanguage(normalizedLang)) {
      try {
        // 直接使用原始代码进行高亮，保持原始缩进和格式
        const highlighted = hljs.highlight(str, {
          language: normalizedLang,
          ignoreIllegals: true
        }).value
        return `<pre class="code-block" data-language="${normalizedLang}"><div class="code-header"><span class="code-lang">${normalizedLang}</span><button class="copy-btn" onclick="copyCode(this)">复制</button></div><code class="hljs language-${normalizedLang}">${highlighted}</code></pre>`
      } catch (e) {
        console.warn('代码高亮失败:', lang, e)
      }
    }

    // 语言不支持或高亮失败，显示原始语言标签但使用纯文本（保持原始格式）
    return `<pre class="code-block"><div class="code-header"><span class="code-lang">${lang}</span><button class="copy-btn" onclick="copyCode(this)">复制</button></div><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`
  }
})

const renderedContent = computed(() => {
  if (!props.content) return ''

  // 确保内容是字符串类型
  const content = String(props.content)

  try {
    return md.render(content)
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    // 如果渲染失败，返回转义后的纯文本
    return content.replace(/[&<>"']/g, (match) => {
      const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }
      return escapeMap[match]
    })
  }
})
</script>

<style lang="scss">
.markdown-body {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  word-break: break-word;

  // 移除默认的顶部和底部边距
  > *:first-child {
    margin-top: 0 !important;
  }

  > *:last-child {
    margin-bottom: 0 !important;
  }

  // 标题
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.2em;
    margin-bottom: 0.6em;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
  }

  h1 {
    font-size: 1.5em;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.3em;
  }

  h2 {
    font-size: 1.35em;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.3em;
  }

  h3 {
    font-size: 1.2em;
  }

  h4 {
    font-size: 1.1em;
  }

  h5, h6 {
    font-size: 1em;
  }

  // 段落
  p {
    margin: 0.75em 0;
    line-height: 1.7;
  }

  // 代码块
  .code-block {
    margin: 1em 0;
    border-radius: 8px;
    overflow: hidden;
    background: #1e1e1e;
    border: 1px solid var(--border-color);

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .code-lang {
        font-size: 12px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .copy-btn {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        background: rgba(255, 255, 255, 0.1);
        border: none;
        cursor: pointer;
        padding: 4px 12px;
        border-radius: 4px;
        transition: all 0.2s;
        font-family: inherit;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        &:active {
          transform: scale(0.95);
        }

        &.copied {
          background: rgba(16, 163, 127, 0.3);
          color: #10a37f;
        }
      }
    }

    code {
      display: block;
      padding: 16px;
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      line-height: 1.6;
      overflow-x: auto;
      color: #d4d4d4;

      // 自定义滚动条样式
      &::-webkit-scrollbar {
        height: 8px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }

  // 行内代码
  code:not(.hljs) {
    background: rgba(16, 163, 127, 0.12);
    color: #10a37f;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
    border: 1px solid rgba(16, 163, 127, 0.2);
  }

  // 列表
  ul, ol {
    padding-left: 1.5em;
    margin: 0.75em 0;

    li {
      margin: 0.35em 0;
      line-height: 1.7;

      &::marker {
        color: var(--text-secondary);
        font-weight: 500;
      }
    }

    // 嵌套列表
    ul, ol {
      margin: 0.35em 0;
    }
  }

  ul {
    list-style: disc;

    ul {
      list-style: circle;
    }
  }

  ol {
    list-style: decimal;

    ol {
      list-style: lower-alpha;
    }
  }

  // 引用
  blockquote {
    border-left: 4px solid #10a37f;
    margin: 1em 0;
    padding: 0.75em 1.25em;
    background: rgba(16, 163, 127, 0.08);
    border-radius: 0 8px 8px 0;
    color: var(--text-primary);

    p {
      margin: 0;
    }

    // 嵌套引用
    blockquote {
      border-left-color: rgba(16, 163, 127, 0.5);
      background: rgba(16, 163, 127, 0.05);
    }
  }

  // 表格
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: 14px;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid var(--border-color);

    th, td {
      border: 1px solid var(--border-color);
      padding: 12px 16px;
      text-align: left;
    }

    th {
      background: var(--bg-secondary);
      font-weight: 600;
      color: var(--text-primary);
    }

    tbody tr {
      transition: background 0.2s;

      &:hover {
        background: var(--surface);
      }

      &:nth-child(even) {
        background: rgba(0, 0, 0, 0.02);

        &:hover {
          background: var(--surface);
        }
      }
    }
  }

  // 链接
  a {
    color: #10a37f;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s;

    &:hover {
      color: #0e9271;
      border-bottom-color: #0e9271;
    }
  }

  // 图片
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 0.75em 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  // 分割线
  hr {
    border: none;
    border-top: 2px solid var(--border-color);
    margin: 2em 0;
  }

  // 粗体和斜体
  strong {
    font-weight: 600;
    color: var(--text-primary);
  }

  em {
    font-style: italic;
  }

  // 任务列表
  input[type="checkbox"] {
    margin-right: 8px;
    cursor: pointer;
  }

  // 删除线
  del {
    color: var(--text-secondary);
    text-decoration: line-through;
  }

  // 键盘快捷键样式
  kbd {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 2px 6px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.9em;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}

// highlight.js 主题覆盖
.hljs {
  background: transparent !important;
  padding: 0 !important;
}

// highlight.js 暗色主题
.hljs-comment,
.hljs-quote {
  color: #6a9955;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-type,
.hljs-addition {
  color: #569cd6;
}

.hljs-string,
.hljs-title,
.hljs-name,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-selector-class,
.hljs-selector-id {
  color: #ce9178;
}

.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-class .hljs-title {
  color: #9cdcfe;
}

.hljs-built_in,
.hljs-builtin-name {
  color: #4ec9b0;
}

.hljs-number,
.hljs-symbol {
  color: #b5cea8;
}

.hljs-regexp,
.hljs-link {
  color: #d16969;
}

.hljs-meta,
.hljs-subst,
.hljs-selector-attr,
.hljs-selector-pseudo {
  color: #9cdcfe;
}

.hljs-deletion {
  color: #f14c4c;
}

.hljs-section {
  color: #d7ba7d;
}
</style>
