/**
 * DnD Kit 拖拽相关类型
 */

import { DragEndEvent, DragStartEvent, DragCancelEvent } from '@dnd-kit/core'

export interface DraggableData {
  name: string
  type: 'bubble' | 'node'
}

export type HandleDragStartType = (event: DragStartEvent) => void
export type HandleDragEndType = (event: DragEndEvent) => void
export type HandleDragCancelType = (event: DragCancelEvent) => void
