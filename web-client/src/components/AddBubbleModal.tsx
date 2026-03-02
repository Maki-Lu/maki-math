import { useState, FormEvent, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import api from '../utils/api'

interface AddBubbleModalProps {
  parentId?: number
  onClose: () => void
  onSuccess: () => void
}

export default function AddBubbleModal({ parentId, onClose, onSuccess }: AddBubbleModalProps) {
  const [name, setName] = useState('')
  const [layout, setLayout] = useState('0')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/bubble', {
        name: name,
        parentId: parentId || null,
        layout: parseInt(layout)
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '未知错误'
      alert('创建失败: ' + errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // 这里的 zIndex 设为最高，且 position fixed 保证覆盖全屏
  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // 半透明白背景，磨砂感
    backdropFilter: 'blur(5px)', // 背景模糊
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999 // 最高层级
  }

  const modalContent = (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{
          background: '#fff',
          padding: '30px',
          borderRadius: '24px',
          minWidth: '300px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0'
        }}
        onClick={(e) => e.stopPropagation()} // 防止点击内容关闭
      >
        <h3 style={{ marginTop: 0, color: '#555' }}>
          {parentId ? '🌱 添加新内容' : '🌍 创建新课程'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#777' }}>名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #eee',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="请输入名字..."
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#777' }}>布局模式</label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #eee',
                fontSize: '16px',
                background: 'white',
                boxSizing: 'border-box'
              }}
            >
              <option value="0">📑 列表模式 (有序)</option>
              <option value="1">☁️ 云朵模式 (无序)</option>
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
              disabled={loading}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: '#ffafcc',
                color: 'white',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '提交中...' : '确定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // 传送到 body
  return createPortal(modalContent, document.body)
}
