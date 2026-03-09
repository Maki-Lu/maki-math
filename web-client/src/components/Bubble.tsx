import { useState, useRef, useEffect, CSSProperties, TouchEvent, MouseEvent } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import AddBubbleModal from './AddBubbleModal'
import AddNodeModal from './AddNodeModal'
import EditNodeModal from './EditNodeModal'
import NodeDetailModal from './NodeDetailModal'
import MoveBubbleModal from './MoveBubbleModal'
import api from '../utils/api'
import { getBubbleCollapseState, saveBubbleCollapseState } from '../utils/storage'
import type { BubbleNode, ContextMenuOption, ExpandCommand } from '../types'
import type { KnowledgeNode, BubbleStructureDto } from '../types'

interface BubbleProps {
  data: BubbleNode
  level?: number
  onRefresh: () => void
  onShowMenu: (x: number, y: number, options: ContextMenuOption[]) => void
  expandCommand?: ExpandCommand
}

const Bubble = ({ data, level = 0, onRefresh, onShowMenu, expandCommand }: BubbleProps) => {
  const [showAddBubble, setShowAddBubble] = useState(false)
  const [showAddNode, setShowAddNode] = useState(false)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [editingNode, setEditingNode] = useState<KnowledgeNode | null>(null)
  const [movingBubble, setMovingBubble] = useState<BubbleStructureDto | null>(null)

  // 初始化逻辑
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = getBubbleCollapseState(data.id)
    if (savedState !== undefined) {
      return savedState
    }
    if (expandCommand) return level >= expandCommand.level
    return false
  })

  const timerRef = useRef<number | null>(null)
  const role = localStorage.getItem('role')
  const canEdit = role === 'Admin' || role === 'Editor'
  const isAdmin = role === 'Admin'
  const isOrdered = data.childLayout === 0

  // DnD 配置
  const uniqueId = `bubble-${data.id}`
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: uniqueId,
    data: { name: data.name, type: 'bubble' },
    disabled: !canEdit
  })
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: uniqueId,
    data: { name: data.name, type: 'bubble' }
  })

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDragRef(node)
    setDropRef(node)
  }

  const transformStyle: CSSProperties = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 'auto'
      }
    : {}

  const dropStyle: CSSProperties =
    isOver && !isDragging
      ? {
          boxShadow: '0 0 0 3px #ffafcc, 0 0 20px rgba(255, 175, 204, 0.5)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          transform: 'scale(1.02)'
        }
      : {}

  // 监听全局指令
  useEffect(() => {
    if (expandCommand) {
      const newState = level >= expandCommand.level
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(newState)
      saveBubbleCollapseState(data.id, newState)
    }
  }, [expandCommand, level, data.id])

  // 手动切换
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    saveBubbleCollapseState(data.id, newState)
  }

  // 样式
  const glassStyle: CSSProperties = {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    border: level === 0 ? '2px solid rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: level === 0 ? '16px' : 'var(--bubble-radius)',
    margin: 'var(--bubble-margin)',
    padding: `calc(var(--bubble-padding-v) + 35px) var(--bubble-padding-h) var(--bubble-padding-v) var(--bubble-padding-h)`,
    minHeight: isCollapsed ? '50px' : '120px',
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    userSelect: 'none',
    backdropFilter: 'blur(10px)',
    touchAction: 'pan-y',
    ...transformStyle,
    ...dropStyle
  }

  const headerStyle: CSSProperties = {
    position: 'absolute',
    top: '15px',
    left: 'var(--bubble-padding-h)',
    right: 'var(--bubble-padding-h)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: isOrdered && !isCollapsed ? '1px dashed #ccc' : 'none',
    paddingBottom: '5px'
  }

  const titleStyle: CSSProperties = {
    fontSize: 'var(--title-size)',
    fontWeight: 'bold',
    color: '#555',
    cursor: 'pointer'
  }

  const contentStyle: CSSProperties = {
    display: isCollapsed ? 'none' : 'flex',
    flexDirection: isOrdered ? 'column' : 'row',
    flexWrap: 'wrap',
    justifyContent: isOrdered ? 'flex-start' : 'center',
    gap: '10px',
    width: '100%',
    marginTop: '10px'
  }

  const btnStyle: CSSProperties = {
    border: 'none',
    borderRadius: '12px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
    marginLeft: '5px'
  }

  const nodeStyle: CSSProperties = {
    background: 'white',
    border: '1px solid #eee',
    borderRadius: '12px',
    padding: '10px 15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
  }

  // 菜单逻辑
  type MenuTargetData = BubbleNode | KnowledgeNode | { id: number; title: string }
  
  const getMenuOptions = (targetData: MenuTargetData, isNode: boolean): ContextMenuOption[] => {
    const options: ContextMenuOption[] = []
    if (isNode) {
      const nodeData = targetData as KnowledgeNode
      options.push({
        label: '✏️ 修改内容 (Editor)',
        action: async () => {
          try {
            const res = await api.get(`/node/${nodeData.id}`)
            setEditingNode(res.data)
          } catch {
            alert('获取数据失败')
          }
        }
      })
      if (isAdmin) {
        options.push({
          label: '🗑️ 删除',
          action: () => {
            if (confirm('删除?')) {
              api.delete(`/node/${nodeData.id}`).then(() => onRefresh())
            }
          }
        })
      }
    } else {
      const bubbleData = targetData as BubbleNode
      options.push({
        label: '✏️ 重命名',
        action: () => {
          const n = prompt('新名:', bubbleData.name)
          if (n) {
            api.put(`/bubble/${bubbleData.id}`, { name: n, layout: bubbleData.childLayout }).then(() => onRefresh())
          }
        }
      })
      options.push({
        label: '🚀 移动泡泡 (菜单)',
        action: () => {
          setMovingBubble({
            id: bubbleData.id,
            name: bubbleData.name,
            parentId: bubbleData.parentId,
            childLayout: bubbleData.childLayout,
            nodes: bubbleData.nodes
          })
        }
      })
      options.push({
        label: '🔄 切换布局',
        action: () => {
          api
            .put(`/bubble/${bubbleData.id}`, {
              name: bubbleData.name,
              layout: bubbleData.childLayout === 0 ? 1 : 0
            })
            .then(() => onRefresh())
        }
      })
      if (isAdmin) {
        options.push({
          label: '🗑️ 删除',
          action: () => {
            if (confirm('删除?')) {
              api.delete(`/bubble/${bubbleData.id}`).then(() => onRefresh())
            }
          }
        })
      }
    }
    return options
  }

  const triggerMenu = (e: MouseEvent | TouchEvent, targetData: MenuTargetData, isNode: boolean) => {
    if (!canEdit) return
    const cx = (e as TouchEvent).touches?.[0]?.clientX ?? (e as MouseEvent).clientX
    const cy = (e as TouchEvent).touches?.[0]?.clientY ?? (e as MouseEvent).clientY
    if (onShowMenu) onShowMenu(cx, cy, getMenuOptions(targetData, isNode))
  }

  const handleNodeClick = async (e: MouseEvent, summary: { id: number; title: string }) => {
    e.stopPropagation()
    if (timerRef.current) return
    try {
      const res = await api.get(`/node/${summary.id}`)
      setSelectedNode(res.data)
    } catch {
      alert('加载失败')
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={glassStyle}
      {...listeners}
      {...attributes}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        triggerMenu(e, data, false)
      }}
      onTouchStart={(e) => {
        if (e.touches.length > 1) return
        timerRef.current = setTimeout(() => triggerMenu(e, data, false), 600)
      }}
      onTouchEnd={() => {
        clearTimeout(timerRef.current!)
        timerRef.current = null
      }}
    >
      <div style={headerStyle}>
        <div
          style={titleStyle}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            toggleCollapse()
          }}
        >
          {data.name} {isCollapsed ? '▼' : '▲'}
        </div>
        {canEdit && (
          <div onPointerDown={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowAddNode(true)
              }}
              style={{ ...btnStyle, background: '#ffb703' }}
            >
              ★
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowAddBubble(true)
              }}
              style={{ ...btnStyle, background: '#81c784' }}
            >
              ＋
            </button>
          </div>
        )}
      </div>

      <div style={contentStyle}>
        {data.children &&
          data.children.map((child) => (
            <Bubble
              key={child.id}
              data={child}
              level={level + 1}
              onRefresh={onRefresh}
              onShowMenu={onShowMenu}
              expandCommand={expandCommand}
            />
          ))}
        {data.nodes &&
          data.nodes.map((node) => (
            <div
              key={node.id}
              style={nodeStyle}
              onClick={(e) => handleNodeClick(e, node)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                triggerMenu(e, node, true)
              }}
              onTouchStart={(e) => {
                if (e.touches.length > 1) return
                timerRef.current = setTimeout(() => triggerMenu(e, node, true), 600)
              }}
              onTouchEnd={() => {
                clearTimeout(timerRef.current!)
                timerRef.current = null
              }}
            >
              <span style={{ color: '#ffb703', marginRight: '5px' }}>★</span> {node.title}
            </div>
          ))}
      </div>

      {showAddBubble && <AddBubbleModal parentId={data.id} onClose={() => setShowAddBubble(false)} onSuccess={onRefresh} />}
      {showAddNode && <AddNodeModal parentBubbleId={data.id} onClose={() => setShowAddNode(false)} onSuccess={onRefresh} />}
      {selectedNode && <NodeDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
      {editingNode && <EditNodeModal node={editingNode} onClose={() => setEditingNode(null)} onSuccess={onRefresh} />}
      {movingBubble && <MoveBubbleModal bubble={movingBubble} onClose={() => setMovingBubble(null)} onSuccess={onRefresh} />}
    </div>
  )
}

export default Bubble
