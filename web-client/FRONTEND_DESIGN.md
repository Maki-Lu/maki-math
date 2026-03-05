# Maki Math 前端页面设计文档

## 目录
1. [设计理念](#设计理念)
2. [页面结构](#页面结构)
3. [核心组件](#核心组件)
4. [交互设计](#交互设计)
5. [视觉样式系统](#视觉样式系统)
6. [工具模块](#工具模块)

---

## 1. 设计理念

### 核心概念
- **泡泡宇宙** - 采用"泡泡"作为知识容器的隐喻，支持无限层级嵌套
- **玻璃拟态** - 使用半透明磨砂效果营造梦幻、轻盈的视觉体验
- **日系樱花风格** - 粉色系渐变背景，配合圆润的字体和按钮设计

### 设计原则
| 原则 | 说明 |
|------|------|
| **可扩展性** | 泡泡可无限嵌套，自动计算层级样式 |
| **状态持久化** | 折叠状态、滚动位置自动保存 |
| **响应式** | 移动端深度适配，触摸友好 |
| **渐进增强** | 基础功能无需登录，编辑需要权限 |

---

## 2. 页面结构

### 路由架构
```
/ (Layout)
├── / (Home) - 主页（课程浏览）
└── /login - 登录页
```

### 2.1 主页 (Home)

**文件**: `src/pages/Home.jsx`

**功能**:
- 显示所有课程的泡泡树状结构
- 支持层级展开控制 (1级/2级/3级/全部)
- 编辑者可创建新课程
- 拖拽泡泡重新组织结构

**核心元素**:
```jsx
// 页面布局
<nav>
  - Logo + "MakiMath" 品牌标识
  - 层级控制按钮 [1级][2级][3级][全部]
  - 登录/用户信息
</nav>

<main>
  - 课程标题 + [+ 新课程] 按钮
  - 泡泡树（递归渲染）
</main>

<footer>
  - ICP 备案信息
</footer>
```

**状态管理**:
| 状态 | 用途 |
|------|------|
| `treeData` | 课程结构数据 |
| `loading` | 首次加载状态 |
| `globalMenu` | 右键菜单状态 |
| `expandCommand` | 全局展开指令 |

### 2.2 登录页 (Login)

**文件**: `src/pages/Login.jsx`

**设计**:
- 简洁的居中卡片式表单
- 用户名 + 密码输入
- 错误提示显示
- 成功后跳转主页并保存 Token/Role

**表单字段**:
- `username` - 用户名
- `password` - 密码

---

## 3. 核心组件

### 3.1 Bubble 组件

**文件**: `src/components/Bubble.jsx`

**作用**: 递归渲染知识树的核心组件，每个泡泡可以是：
- 课程（顶级）
- 章节/主题（子泡泡）
- 知识点容器

**特性**:
- **拖拽**: 使用 `@dnd-kit` 实现，仅编辑者可用
- **折叠**: 点击标题切换展开/折叠，状态持久化
- **右键菜单**: 长按触摸或右键触发操作菜单
- **层级样式**: 根据 `level` 自动调整大小和圆角

**布局模式**:
| 模式 | 样式 | 适用场景 |
|------|------|----------|
| `Ordered` (0) | 纵向列表 | 有序章节 |
| `Unordered` (1) | 横向云朵 | 无序主题 |

**内部元素**:
```jsx
<div className="bubble">
  <header>
    - 标题 (点击折叠/展开)
    - [★] 添加知识点按钮
    - [＋] 添加子泡泡按钮
  </header>

  <content>
    - 子泡泡（递归渲染）
    - 知识点卡片
  </content>
</div>
```

**关键 Props**:
| Prop | 类型 | 说明 |
|------|------|------|
| `data` | Object | 泡泡数据 |
| `level` | Number | 嵌套层级 |
| `onRefresh` | Function | 刷新回调 |
| `onShowMenu` | Function | 显示菜单回调 |
| `expandCommand` | Object | 全局展开指令 |

### 3.2 AddBubbleModal 模态框

**文件**: `src/components/AddBubbleModal.jsx`

**作用**: 创建新泡泡或课程

**交互**:
- 使用 `createPortal` 渲染到 `document.body`
- 点击遮罩关闭
- 磨砂玻璃遮罩效果

**表单字段**:
- `name` - 泡泡名称
- `layout` - 布局模式（列表/云朵）

**视觉细节**:
- 半透明白色遮罩 + `backdrop-filter: blur(5px)`
- 卡片圆角 24px
- 粉色主按钮 `#ffafcc`

### 3.3 AddNodeModal 模态框

**文件**: `src/components/AddNodeModal.jsx`

**作用**: 在泡泡中添加知识点

**特性**:
- 集成 `MDEditor` 支持 Markdown + LaTeX
- 实时预览数学公式
- 退出时确认提示

**表单字段**:
- `title` - 知识点标题
- `content` - Markdown 内容（支持 `$` 行内公式和 `$$` 块级公式）

**技术栈**:
- `@uiw/react-md-editor` - 编辑器
- `rehype-katex` - KaTeX 渲染
- `remark-math` - 数学语法解析

### 3.4 EditNodeModal 模态框

**文件**: `src/components/EditNodeModal.jsx`

**作用**: 编辑现有知识点

**特性**:
- 预填充现有数据
- 退出确认提示
- 与 AddNodeModal 共用编辑器组件

### 3.5 NodeDetailModal 模态框

**文件**: `src/components/NodeDetailModal.jsx`

**作用**: 展示知识点详情（只读）

**设计特点**:
- 宽屏阅读体验（90% 宽度，最大 800px）
- 淡入上滑动画
- 点击任意位置关闭
- 优先使用数学字体 `Latin Modern Math`

**渲染内容**:
- 使用 `react-markdown` + `rehype-katex`
- 支持 Markdown 和 LaTeX
- 自定义样式（标题颜色、代码块背景等）

### 3.6 MoveBubbleModal 模态框

**文件**: `src/components/MoveBubbleModal.jsx`

**作用**: 将泡泡移动到新的父节点

**功能**:
- 展示完整的泡泡树（排除自己和子孙节点）
- 层级缩进显示
- 可移动到顶层（成为新课程）

**安全检查**:
```javascript
// 不能移动到自己或自己的子孙内部
if (item.id === bubble.id) return;
```

### 3.7 ContextMenu 右键菜单

**文件**: `src/components/ContextMenu.jsx`

**作用**: 通用上下文菜单组件

**触发方式**:
- PC: 右键点击
- 移动端: 长按 600ms

**菜单项示例**:
```javascript
// 泡泡菜单
[
  { label: '✏️ 重命名', action: ... },
  { label: '🚀 移动泡泡', action: ... },
  { label: '🔄 切换布局', action: ... },
  { label: '🗑️ 删除', color: 'red', action: ... }
]

// 知识点菜单
[
  { label: '✏️ 修改内容', action: ... },
  { label: '🗑️ 删除', color: 'red', action: ... }
]
```

---

## 4. 交互设计

### 4.1 拖拽交互

**库**: `@dnd-kit/core`

**传感器配置**:
```javascript
useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
)
```

**视觉反馈**:
- 拖拽时：透明度降低至 0.3，z-index 提升
- 悬停目标：粉色发光边框 + 轻微放大

**流程**:
1. 用户拖拽泡泡
2. 显示"🚀 正在移动泡泡..."遮罩
3. 放置到目标泡泡
4. 确认对话框
5. API 调用更新 `parentId`
6. 静默刷新数据

### 4.2 折叠展开

**三级控制**:
1. **全局指令** - 顶部导航按钮（1/2/3级/全部）
2. **手动切换** - 点击泡泡标题
3. **状态记忆** - LocalStorage 持久化

**存储键**: `maki_bubble_states`
```json
{
  "101": true,   // 泡泡101折叠
  "102": false   // 泡泡102展开
}
```

### 4.3 滚动位置记忆

**存储键**: `maki_scroll_y`

**策略**:
- 滚动时防抖保存（100ms）
- 首次加载恢复位置
- 编辑操作后不触发（避免跳动）

---

## 5. 视觉样式系统

### 5.1 CSS 变量

**文件**: `src/index.css`

```css
:root {
  /* 字体 */
  font-family: 'M PLUS Rounded 1c', 'Nunito', sans-serif;

  /* 动态布局（数学化） */
  --bubble-padding-v: clamp(10px, 2vw, 20px);
  --bubble-padding-h: clamp(7px, 1.5vw, 16px);
  --bubble-margin: clamp(4px, 1vw, 13px);
  --bubble-radius: clamp(12px, 2.5vw, 24px);
  --title-size: clamp(0.9rem, 2.5vw, 1.1rem);

  /* 背景 */
  --sakura-bg: linear-gradient(to top, #fbc2eb 0%, #a6c1ee 100%);
}
```

### 5.2 配色方案

| 元素 | 颜色 | 用途 |
|------|------|------|
| 背景 | `#fbc2eb → #a6c1ee` | 樱花渐变 |
| 泡泡 | `rgba(255,255,255,0.6)` | 半透明白 |
| 主按钮 | `#ffafcc` | 樱花粉 |
| 添加按钮 | `#81c784` | 清新绿 |
| 知识点按钮 | `#ffb703` | 金黄色 |
| 移动按钮 | `#4a90e2` | 天空蓝 |
| 删除 | `red` | 危险操作 |

### 5.3 玻璃拟态效果

```css
.glass-style {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}
```

### 5.4 动画

| 动画 | 效果 | 用途 |
|------|------|------|
| `fadeIn` | 透明度 0→1 | 模态框遮罩 |
| `slideUp` | 上滑 + 缩放 | 模态框内容 |
| `弹性动画` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 按钮点击 |

### 5.5 滚动条美化

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background: rgba(251, 194, 235, 0.8); /* 樱花粉 */
  border-radius: 10px;
}
```

---

## 6. 工具模块

### 6.1 API 工具

**文件**: `src/utils/api.js`

**功能**:
- Axios 实例配置
- 自动注入 JWT Token
- 401 自动跳转登录

```javascript
// 请求拦截器
config.headers.Authorization = `Bearer ${token}`;

// 响应拦截器
if (status === 401) {
  localStorage.clear();
  window.location.href = '/login';
}
```

### 6.2 存储工具

**文件**: `src/utils/storage.js`

**功能**:
- 滚动位置管理
- 泡泡折叠状态管理

```javascript
// 滚动
saveScrollPosition(y)
getScrollPosition()

// 折叠状态
getBubbleCollapseState(id)
saveBubbleCollapseState(id, isCollapsed)
```

---

## 7. 响应式设计

### 移动端优化 (< 480px)

```css
:root {
  --page-padding: 5px;        /* 减少边距 */
  --bubble-margin: 4px;       /* 紧凑间距 */
}

.bubble-content {
  gap: 5px !important;        /* 减少子元素间距 */
}
```

**触摸优化**:
- 长按触发右键菜单
- 拖拽延迟 250ms 避免误触
- 触摸容差 5px

---

## 8. 组件关系图

```
App (BrowserRouter)
 └── Layout
      ├── Nav (Logo + 层级按钮 + 用户信息)
      ├── Routes
      │    ├── Home
      │    │    ├── 课程列表
      │    │    └── Bubble (递归)
      │    │         ├── AddBubbleModal
      │    │         ├── AddNodeModal
      │    │         ├── EditNodeModal
      │    │         ├── NodeDetailModal
      │    │         └── MoveBubbleModal
      │    └── Login
      └── Footer
```

---

## 9. 开发建议

### 添加新功能时
1. 复用现有模态框样式
2. 使用 `createPortal` 挂载到 `body`
3. 保持玻璃拟态设计语言
4. 新颜色加入配色表文档

### 调试技巧
- `localStorage` 查看存储状态
- Network 面板查看 API 调用
- React DevTools 查看组件层级

---

*最后更新: 2025-03-05*
