import React, { useState, useRef, useEffect } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import AddBubbleModal from './AddBubbleModal';
import AddNodeModal from './AddNodeModal';
import EditNodeModal from './EditNodeModal';
import NodeDetailModal from './NodeDetailModal';
import MoveBubbleModal from './MoveBubbleModal';
import api from '../utils/api';
import { getBubbleCollapseState, saveBubbleCollapseState } from '../utils/storage';
import type { BubbleProps, Bubble, Node, MenuItem } from '../types';

const Bubble = ({ data, level = 0, onRefresh, onShowMenu, expandCommand }: BubbleProps) => {
    const [showAddBubble, setShowAddBubble] = useState(false);
    const [showAddNode, setShowAddNode] = useState(false);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [movingBubble, setMovingBubble] = useState<Bubble | null>(null);

    // 2. 初始化逻辑优化：
    // 如果本地有记忆 -> 用记忆
    // 如果没有记忆且有全局指令 -> 用指令
    // 否则 -> 默认不折叠 (false)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const savedState = getBubbleCollapseState(data.id);
        if (savedState !== undefined) {
            return savedState;
        }
        if (expandCommand) return level >= expandCommand.level;
        return false;
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const role = localStorage.getItem('role');
    const canEdit = role === 'Admin' || role === 'Editor';
    const isAdmin = role === 'Admin';
    const isOrdered = data.childLayout === 0;

    // DnD 配置
    const uniqueId = `bubble-${data.id}`;
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: uniqueId, data: { name: data.name, type: 'bubble' }, disabled: !canEdit
    });
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: uniqueId, data: { name: data.name, type: 'bubble' }
    });
    const setNodeRef = (node: HTMLElement | null) => { setDragRef(node); setDropRef(node); };
    const transformStyle: React.CSSProperties = transform ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.3 : 1, zIndex: isDragging ? 999 : 'auto', } : {};
    const dropStyle: React.CSSProperties = isOver && !isDragging ? { boxShadow: '0 0 0 3px #ffafcc, 0 0 20px rgba(255, 175, 204, 0.5)', backgroundColor: 'rgba(255, 255, 255, 0.9)', transform: 'scale(1.02)' } : {};

    // 3. 监听全局指令：仅当指令非空时才覆盖
    useEffect(() => {
        if (expandCommand) {
            const newState = level >= expandCommand.level;
            setIsCollapsed(newState);
            saveBubbleCollapseState(data.id, newState); // 强制同步保存
        }
    }, [expandCommand, level, data.id]);

    // 4. 手动切换：切换状态并保存到本地
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        saveBubbleCollapseState(data.id, newState);
    };

    // 样式保持不变
    const glassStyle: React.CSSProperties = {
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        border: level === 0 ? '2px solid rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.6)',
        borderRadius: level === 0 ? '16px' : 'var(--bubble-radius)',
        margin: 'var(--bubble-margin)',
        padding: `calc(var(--bubble-padding-v) + 35px) var(--bubble-padding-h) var(--bubble-padding-v) var(--bubble-padding-h)`,
        minHeight: isCollapsed ? '50px' : '120px',
        minWidth: '220px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        userSelect: 'none', backdropFilter: 'blur(10px)',
        touchAction: 'pan-y',
        ...transformStyle, ...dropStyle
    };

    const headerStyle: React.CSSProperties = {
        position: 'absolute', top: '15px', left: 'var(--bubble-padding-h)', right: 'var(--bubble-padding-h)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: isOrdered && !isCollapsed ? '1px dashed #ccc' : 'none',
        paddingBottom: '5px'
    };

    const titleStyle: React.CSSProperties = { fontSize: 'var(--title-size)', fontWeight: 'bold', color: '#555', cursor: 'pointer' };

    const contentStyle: React.CSSProperties = {
        display: isCollapsed ? 'none' : 'flex',
        flexDirection: isOrdered ? 'column' : 'row',
        flexWrap: 'wrap',
        justifyContent: isOrdered ? 'flex-start' : 'center',
        gap: '10px', width: '100%', marginTop: '10px'
    };

    const btnStyle: React.CSSProperties = { border:'none', borderRadius:'12px', padding:'4px 8px', cursor:'pointer', fontSize:'12px', fontWeight:'bold', color:'white', marginLeft:'5px' };
    const nodeStyle: React.CSSProperties = { background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'10px 15px', cursor:'pointer', display:'flex', alignItems:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' };

    // 菜单逻辑保持不变
    const getMenuOptions = (targetData: Bubble | Node, isNode = false): MenuItem[] => {
        const options: MenuItem[] = [];
        if (isNode) {
            const node = targetData as Node;
            options.push({
                label: '✏️ 修改内容 (Editor)',
                action: async () => {
                    try {
                        const res = await api.get(`/node/${node.id}`);
                        setEditingNode(res.data);
                    } catch (err) {
                        alert("获取数据失败");
                    }
                }
            });
            if (isAdmin) options.push({
                label: '🗑️ 删除',
                color: 'red',
                action: () => {
                    if(confirm('删除?')) api.delete(`/node/${node.id}`).then(()=>onRefresh());
                }
            });
        } else {
            const bubble = targetData as Bubble;
            options.push({
                label: '✏️ 重命名',
                action: () => {
                    const n = prompt('新名:', bubble.name);
                    if(n) api.put(`/bubble/${bubble.id}`, {name:n, layout: bubble.childLayout}).then(()=>onRefresh());
                }
            });
            options.push({
                label: '🚀 移动泡泡 (菜单)',
                action: () => {
                    setMovingBubble(bubble);
                }
            });
            options.push({
                label: '🔄 切换布局',
                action: () => {
                    api.put(`/bubble/${bubble.id}`, {name: bubble.name, layout: bubble.childLayout===0?1:0}).then(()=>onRefresh());
                }
            });
            if (isAdmin) options.push({
                label: '🗑️ 删除',
                color: 'red',
                action: () => {
                    if(confirm('删除?')) api.delete(`/bubble/${bubble.id}`).then(()=>onRefresh());
                }
            });
        }
        return options;
    };

    const triggerMenu = (e: React.MouseEvent | React.TouchEvent, targetData: Bubble | Node, isNode: boolean) => {
        if (!canEdit) return;
        const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
        if (onShowMenu) onShowMenu(cx, cy, getMenuOptions(targetData, isNode));
    };

    const handleNodeClick = async (e: React.MouseEvent, summary: Node | { id: number }) => {
        e.stopPropagation();
        if (timerRef.current) return;
        try {
            const res = await api.get(`/node/${summary.id}`);
            setSelectedNode(res.data);
        } catch {
            alert('加载失败');
        }
    };

    return (
        <div ref={setNodeRef} style={glassStyle} {...listeners} {...attributes}
            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); triggerMenu(e, data, false); }}
            onTouchStart={e => { if(e.touches.length>1)return; timerRef.current=setTimeout(()=>triggerMenu(e, data, false), 600); }}
            onTouchEnd={() => { if(timerRef.current) clearTimeout(timerRef.current); timerRef.current=null; }}
        >
            <div style={headerStyle}>
                <div style={titleStyle}
                     onPointerDown={e => e.stopPropagation()}
                     onClick={e => { e.stopPropagation(); toggleCollapse(); /* 5. 使用新的 toggleCollapse */ }}
                >
                    {data.name} {isCollapsed ? '▼' : '▲'}
                </div>
                {canEdit && (
                    <div onPointerDown={e => e.stopPropagation()}>
                        <button onClick={e => { e.stopPropagation(); setShowAddNode(true); }} style={{...btnStyle, background:'#ffb703'}}>★</button>
                        <button onClick={e => { e.stopPropagation(); setShowAddBubble(true); }} style={{...btnStyle, background:'#81c784'}}>＋</button>
                    </div>
                )}
            </div>

            <div style={contentStyle}>
                {data.children && data.children.map(child => (
                    <Bubble key={child.id} data={child} level={level + 1} onRefresh={onRefresh} onShowMenu={onShowMenu} expandCommand={expandCommand} />
                ))}
                {data.nodes && data.nodes.map(node => (
                    <div key={node.id} style={nodeStyle} onClick={e => handleNodeClick(e, node)}
                        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); triggerMenu(e, node as Node | Bubble, true); }}
                        onTouchStart={e => { if(e.touches.length>1)return; timerRef.current=setTimeout(()=>triggerMenu(e, node as Node | Bubble, true), 600); }}
                        onTouchEnd={() => { if(timerRef.current) { clearTimeout(timerRef.current); timerRef.current=null; }}}
                    >
                        <span style={{color:'#ffb703', marginRight:'5px'}}>★</span> {node.title}
                    </div>
                ))}
            </div>

            {showAddBubble && <AddBubbleModal parentId={data.id} onClose={() => setShowAddBubble(false)} onSuccess={onRefresh} />}
            {showAddNode && <AddNodeModal parentBubbleId={data.id} onClose={() => setShowAddNode(false)} onSuccess={onRefresh} />}
            {selectedNode && <NodeDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
            {editingNode && <EditNodeModal node={editingNode} onClose={() => setEditingNode(null)} onSuccess={onRefresh} />}
            {movingBubble && <MoveBubbleModal bubble={movingBubble} onClose={() => setMovingBubble(null)} onSuccess={onRefresh} />}
        </div>
    );
};

export default Bubble;
