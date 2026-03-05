import { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { KnowledgeNode } from '../types'

interface NodeDetailModalProps {
  node: KnowledgeNode | null
  onClose: () => void
}

export default function NodeDetailModal({ node, onClose }: NodeDetailModalProps) {
  if (!node) return null

  // 遮罩层：全屏磨砂
  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // 极淡的遮罩
    backdropFilter: 'blur(8px)', // 强模糊，聚焦视线
    zIndex: 99999, // 最高层级
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }

  // 内容卡片：像一张纸
  const cardStyle: CSSProperties = {
    background: 'rgba(255, 255, 255, 0.95)',
    width: '90%',
    maxWidth: '800px', // 宽屏阅读体验
    maxHeight: '85vh', // 留出一点边距
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.8)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden' // 防止圆角溢出
  }

  // 头部：标题
  const headerStyle: CSSProperties = {
    padding: '25px 30px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(to right, #fff, #fcfcfc)'
  }

  // 内容区域：可滚动
  const contentStyle: CSSProperties = {
    padding: '30px 40px',
    overflowY: 'auto',
    fontSize: '1.1rem',
    lineHeight: '1.8',
    color: '#444',
    fontFamily: "'Latin Modern Math', 'M PLUS Rounded 1c', sans-serif" // 优先用数学字体
  }

  // 关闭按钮
  const closeBtnStyle: CSSProperties = {
    border: 'none',
    background: '#f1f3f5',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#888',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    padding: 0
  }

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px) scale(0.98); } to { transform: translateY(0) scale(1); } }
        /* Markdown 样式微调 */
        .markdown-body h1, .markdown-body h2 { border-bottom: none; color: #ffb703; }
        .markdown-body p { margin-bottom: 1.2em; }
        .markdown-body code { background: #f8f9fa; padding: 2px 6px; border-radius: 4px; color: #e8590c; }
        .katex { font-size: 1.1em; } /* 公式稍微大一点 */
      `}</style>

      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: '#495057', fontSize: '1.5rem' }}>
            <span style={{ color: '#ffb703', marginRight: '10px' }}>★</span>
            {node.title}
          </h2>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              ;(e.target as HTMLElement).style.background = '#ffcccc'
              ;(e.target as HTMLElement).style.color = 'white'
            }}
            onMouseLeave={(e) => {
              ;(e.target as HTMLElement).style.background = '#f1f3f5'
              ;(e.target as HTMLElement).style.color = '#888'
            }}
          >
            ✕
          </button>
        </div>

        {/* 正文 (Markdown + LaTeX) */}
        <div style={contentStyle} className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[[rehypeKatex, { strict: false }]]}
          >
            {node.content || '*（空空如也，快去添加点数学魔法吧）*'}
          </ReactMarkdown>
        </div>
      </div>
    </div>,
    document.body
  )
}
