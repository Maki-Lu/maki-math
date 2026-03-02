import { useState, useEffect, FormEvent, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import api from '../utils/api'
import type { BubbleStructureDto } from '../types'

interface BubbleOption {
  id: number
  name: string
  depth: number
}

interface MoveBubbleModalProps {
  bubble: BubbleStructureDto
  onClose: () => void
  onSuccess: () => void
}

export default function MoveBubbleModal({ bubble, onClose, onSuccess }: MoveBubbleModalProps) {
  const [targetId, setTargetId] = useState('') // 空字符串表示"移动到最顶层（成为课程）"
  const [options, setOptions] = useState<BubbleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 获取所有泡泡结构，用于构建下拉菜单
  useEffect(() => {
    api
      .get('/bubble/structure')
      .then((res) => {
        const allBubbles: BubbleOption[] = []

        // 递归函数：将树展平，并计算层级前缀
        const flatten = (items: BubbleStructureDto[], depth: number = 0): void => {
          items.forEach((item) => {
            // ❌ 核心过滤：不能移动到【自己】或者【自己的子孙】里面
            if (item.id === bubble.id) return

            // 添加到选项列表
            allBubbles.push({
              id: item.id,
              name: item.name,
              depth: depth
            })

            // 由于后端返回的是扁平列表，我们需要先组装成树
            // 递归子节点会在 buildTree 中处理
          })
        }

        // buildTree 逻辑
        const buildTree = (items: BubbleStructureDto[]): BubbleStructureDto[] => {
          const rootItems: BubbleStructureDto[] = []
          const lookup: Record<number, BubbleStructureDto & { children: BubbleStructureDto[] }> = {}

          items.forEach((i) => {
            lookup[i.id] = { ...i, children: [] }
          })

          items.forEach((i) => {
            if (i.parentId && lookup[i.parentId]) {
              lookup[i.parentId].children.push(lookup[i.id])
            } else {
              rootItems.push(lookup[i.id])
            }
          })

          return rootItems
        }

        const tree = buildTree(res.data)
        flatten(tree)
        setOptions(allBubbles)
        setLoading(false)
      })
      .catch(() => {
        alert('加载结构失败')
        onClose()
      })
  }, [bubble.id, onClose])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // targetId === '' 代表 null (顶层)
      const parentId = targetId === '' ? null : parseInt(targetId)

      // 调用 Update 接口，同时发送 name 和 layout (保持不变)，只改 ParentId
      await api.put(`/bubble/${bubble.id}`, {
        name: bubble.name,
        layout: bubble.childLayout,
        parentId: parentId
      })

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '未知错误'
      alert('移动失败: ' + errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999
  }

  const modalContent = (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{
          background: '#fff',
          padding: '30px',
          borderRadius: '24px',
          width: '350px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, color: '#4a90e2' }}>🚀 移动泡泡</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          将 <strong>{bubble.name}</strong> 移动到：
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid #eee',
                fontSize: '16px',
                background: 'white',
                boxSizing: 'border-box'
              }}
            >
              <option value="">🌍 (最顶层 - 成为新课程)</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {/* 用空格模拟层级缩进 */}
                  {'\u00A0\u00A0'.repeat(opt.depth)} 📂 {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: '#f0f0f0',
                color: '#555',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: '#4a90e2',
                color: 'white',
                fontWeight: 'bold',
                cursor: submitting || loading ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? '移动中...' : '确定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
