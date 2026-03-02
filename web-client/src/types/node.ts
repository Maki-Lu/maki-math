/**
 * 知识点 / Node 相关类型
 */

import { ContentStatus } from './common'

export interface KnowledgeNode {
  id: number
  title: string
  content: string
  parentBubbleId: number
  orderIndex: number
  status: ContentStatus
  createdByUserId: number
}

export interface NodeDetailModalProps {
  node: KnowledgeNode
  onClose: () => void
}

export interface EditNodeModalProps {
  node: KnowledgeNode
  onClose: () => void
  onSuccess: () => void
}

export interface AddNodeModalProps {
  bubbleId: number
  onClose: () => void
  onSuccess: () => void
}
