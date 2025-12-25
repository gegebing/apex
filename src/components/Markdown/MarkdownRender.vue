<template>
  <div class="markdown-body" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps<{
  content: string
}>()

// 配置 Markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  highlight: (str: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="code-block"><div class="code-header"><span class="code-lang">${lang}</span><button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.textContent)">复制</button></div><code class="hljs language-${lang}">${
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        }</code></pre>`
      } catch {
        // 忽略错误
      }
    }
    return `<pre class="code-block"><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`
  }
})

const renderedContent = computed(() => {
  if (!props.content) return ''
  return md.render(props.content)
})
</script>

<style lang="scss">
.markdown-body {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  word-break: break-word;
  
  // 标题
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.25em;
    margin-bottom: 0.5em;
    font-weight: 600;
    color: var(--text-primary);
    
    &:first-child {
      margin-top: 0;
    }
  }
  
  h1 { font-size: 1.5em; }
  h2 { font-size: 1.35em; }
  h3 { font-size: 1.2em; }
  
  // 段落
  p {
    margin: 0.75em 0;
    
    &:first-child {
      margin-top: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  // 代码块
  .code-block {
    margin: 1em 0;
    border-radius: 12px;
    overflow: hidden;
    background: #1e1e1e;
    
    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      .code-lang {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
      }
      
      .copy-btn {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
      }
    }
    
    code {
      display: block;
      padding: 16px;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      overflow-x: auto;
    }
  }
  
  // 行内代码
  code:not(.hljs) {
    background: rgba(16, 163, 127, 0.15);
    color: #10a37f;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    font-size: 0.9em;
  }
  
  // 列表
  ul, ol {
    padding-left: 1.5em;
    margin: 0.75em 0;
    
    li {
      margin: 0.25em 0;
      
      &::marker {
        color: var(--text-secondary);
      }
    }
  }
  
  ul {
    list-style: disc;
  }
  
  ol {
    list-style: decimal;
  }
  
  // 引用
  blockquote {
    border-left: 3px solid #10a37f;
    margin: 1em 0;
    padding: 0.5em 1em;
    background: rgba(16, 163, 127, 0.1);
    border-radius: 0 8px 8px 0;
    
    p {
      margin: 0;
    }
  }
  
  // 表格
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 14px;
    
    th, td {
      border: 1px solid var(--border-color);
      padding: 10px 14px;
      text-align: left;
    }
    
    th {
      background: var(--surface);
      font-weight: 600;
    }
    
    tr:hover td {
      background: var(--surface);
    }
  }
  
  // 链接
  a {
    color: #10a37f;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  // 图片
  img {
    max-width: 100%;
    border-radius: 8px;
    margin: 0.5em 0;
  }
  
  // 分割线
  hr {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 1.5em 0;
  }
  
  // 粗体和斜体
  strong {
    font-weight: 600;
  }
  
  em {
    font-style: italic;
  }
}

// highlight.js 主题覆盖
.hljs {
  background: transparent !important;
}
</style>
