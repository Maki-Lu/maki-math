/**
 * API 请求和响应类型定义
 */

import { BubbleLayout, ContentStatus } from './common'

// ===================== 登录相关 =====================

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  role: string
}

// ===================== 泡泡相关 =====================

export interface NodeSummaryDto {
  id: number
  title: string
}

export interface BubbleStructureDto {
  id: number
  name: string
  parentId?: number | null
  childLayout: BubbleLayout
  nodes: NodeSummaryDto[]
}

export interface BubbleDto {
  id: number
  name: string
  parentId?: number | null
  childLayout: BubbleLayout
  orderIndex: number
  status: ContentStatus
}

// ===================== 知识点相关 =====================

export interface KnowledgeNodeDto {
  id: number
  title: string
  content: string
  parentBubbleId: number
  orderIndex: number
  status: ContentStatus
  createdByUserId: number
}

export interface CreateNodeRequest {
  title: string
  content: string
  parentBubbleId: number
}

export interface UpdateNodeRequest {
  title: string
  content: string
}

// ===================== 其他 =====================

export interface ApiError {
  status: number
  message: string
}
