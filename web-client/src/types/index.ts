// ============ API 类型 ============

export interface Bubble {
  id: number;
  name: string;
  parentId: number | null;
  childLayout: BubbleLayout;
  children?: Bubble[];
  nodes?: (Node | NodeSummary)[];
}

export interface Node {
  id: number;
  title: string;
  content: string;
  parentBubbleId: number;
}

export interface NodeSummary {
  id: number;
  title: string;
}

export interface BubbleStructureDto {
  id: number;
  name: string;
  parentId: number | null;
  childLayout: BubbleLayout;
  nodes: NodeSummary[];
}

// ============ 枚举 ============

export enum BubbleLayout {
  Ordered = 0,
  Unordered = 1
}

export enum UserRole {
  User = 'User',
  Editor = 'Editor',
  Reviewer = 'Reviewer',
  Admin = 'Admin'
}

export enum ContentStatus {
  Pending = 0,
  Active = 1,
  Deleted = 2
}

// ============ API 请求/响应 ============

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
}

export interface CreateBubbleRequest {
  name: string;
  parentId: number | null;
  layout: number;
}

export interface CreateNodeRequest {
  title: string;
  content: string;
  parentBubbleId: number;
}

export interface ApiResponse<T> {
  data: T;
}

// ============ 组件 Props 类型 ============

export interface BubbleProps {
  data: Bubble;
  level: number;
  onRefresh: () => void;
  onShowMenu: (x: number, y: number, options: MenuItem[]) => void;
  expandCommand: ExpandCommand | null;
}

export interface ExpandCommand {
  level: number;
  ts: number;
}

export interface ModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export interface MenuItem {
  label: string;
  color?: string;
  action: () => void;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  options: MenuItem[];
  onClose: () => void;
}

// ============ 模态框 Props ============

export interface AddBubbleModalProps extends ModalProps {
  parentId: number | null;
}

export interface AddNodeModalProps extends ModalProps {
  parentBubbleId: number;
}

export interface EditNodeModalProps extends ModalProps {
  node: Node;
}

export interface MoveBubbleModalProps extends ModalProps {
  bubble: Bubble;
}

export interface NodeDetailModalProps {
  node: Node;
  onClose: () => void;
}
