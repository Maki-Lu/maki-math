/**
 * 泡泡 / Bubble 相关类型
 */

import { BubbleLayout, ContentStatus } from './common'

export interface BubbleNode {
  id: number
  name: string
  parentId?: number | null
  childLayout: BubbleLayout
  orderIndex: number
  status: ContentStatus
  children: BubbleNode[]
  nodes: Array<{
    id: number
    title: string
  }>
}

export interface BubbleProps {
  data: BubbleNode
  level: number
  onRefresh: () => void
  onShowMenu: (x: number, y: number, options: ContextMenuOption[]) => void
  expandCommand?: ExpandCommand
}

export interface ContextMenuOption {
  label: string
  action: () => void
}

export interface ExpandCommand {
  level: number
}

export interface AddBubbleModalProps {
  parentBubbleId?: number
  onClose: () => void
  onSuccess: () => void
}

export interface MoveBubbleModalProps {
  bubbleId: number
  onClose: () => void
  onSuccess: () => void
}
