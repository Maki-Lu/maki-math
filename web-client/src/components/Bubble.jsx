import React, { useState, useRef, useEffect } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core'; // 1. 引入 Hooks
import { CSS } from '@dnd-kit/utilities'; // 用于处理位移样式
import AddBubbleModal from './AddBubbleModal';
import AddNodeModal from './AddNodeModal';
import EditNodeModal from './EditNodeModal';
import NodeDetailModal from './NodeDetailModal';
import MoveBubbleModal from './MoveBubbleModal'; 
import api from '../utils/api';

const Bubble = ({ data, level = 0, onRefresh, onShowMenu, expandCommand }) => {
    const [showAddBubble, setShowAddBubble] = useState(false);
    const [showAddNode, setShowAddNode] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [editingNode, setEditingNode] = useState(null);
    const [movingBubble, setMovingBubble] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const timerRef = useRef(null);

    const role = localStorage.getItem('role');
    const canEdit = role === 'Admin' || role === 'Editor';
    const isAdmin = role === 'Admin'; 
    const isOrdered = data.childLayout === 0;

    // === DnD 逻辑配置 ===
    const uniqueId = `bubble-${data.id}`; // 唯一 ID

    // 1. 让自己可拖拽
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: uniqueId,
        data: { name: data.name, type: 'bubble' },
        disabled: !canEdit // 只有编辑者能拖
    });

    // 2. 让自己可接收 (Droppable)
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: uniqueId,
        data: { name: data.name, type: 'bubble' }
    });

    // 合并 Ref (既能拖也能放)
    const setNodeRef = (node) => {
        setDragRef(node);
        setDropRef(node);
    };

    // 拖拽时的位移样式
    const transformStyle = transform ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1, // 拖拽时变半透明
        zIndex: isDragging ? 999 : 'auto',
    } : {};

    // 接收时的样式 (高亮提示)
    const dropStyle = isOver && !isDragging ? {
        boxShadow: '0 0 0 3px #ffafcc, 0 0 20px rgba(255, 175, 204, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        transform: 'scale(1.02)'
    } : {};

    useEffect(() => {
        if (expandCommand) setIsCollapsed(level >= expandCommand.level);
    }, [expandCommand, level]);

    const glassStyle = {
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
        transition: 'all 0.2s ease', // 动画改快一点，跟手
        userSelect: 'none', backdropFilter: 'blur(10px)',
        touchAction: 'none', // 关键：防止手机滚动干扰拖拽
        ...transformStyle, // 应用拖拽位移
        ...dropStyle       // 应用接收高亮
    };

    const headerStyle = {
        position: 'absolute', top: '15px', left: 'var(--bubble-padding-h)', right: 'var(--bubble-padding-h)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: isOrdered && !isCollapsed ? '1px dashed #ccc' : 'none',
        paddingBottom: '5px'
    };

    const titleStyle = { fontSize: 'var(--title-size)', fontWeight: 'bold', color: '#555', cursor: 'pointer' };

    const contentStyle = {
        display: isCollapsed ? 'none' : 'flex',
        flexDirection: isOrdered ? 'column' : 'row',
        flexWrap: 'wrap',
        justifyContent: isOrdered ? 'flex-start' : 'center',
        gap: '10px', width: '100%', marginTop: '10px'
    };

    const btnStyle = { border:'none', borderRadius:'12px', padding:'4px 8px', cursor:'pointer', fontSize:'12px', fontWeight:'bold', color:'white', marginLeft:'5px' };
    const nodeStyle = { background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'10px 15px', cursor:'pointer', display:'flex', alignItems:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' };

    // === 交互逻辑 (保持不变) ===
    const getMenuOptions = (targetData, isNode = false) => {
        const options = [];
        if (isNode) {
            options.push({ label: '✏️ 修改内容 (Editor)', action: async () => { try { const res = await api.get(`/node/${targetData.id}`); setEditingNode(res.data); } catch (err) { alert("获取数据失败"); } } });
            if (isAdmin) options.push({ label: '🗑️ 删除', color: 'red', action: () => { if(confirm('删除?')) api.delete(`/node/${targetData.id}`).then(()=>onRefresh()); } });
        } else {
            options.push({ label: '✏️ 重命名', action: () => { const n = prompt('新名:', targetData.name); if(n) api.put(`/bubble/${targetData.id}`, {name:n, layout: targetData.childLayout}).then(()=>onRefresh()); } });
            options.push({ label: '🚀 移动泡泡 (菜单)', action: () => { setMovingBubble(targetData); } });
            options.push({ label: '🔄 切换布局', action: () => { api.put(`/bubble/${targetData.id}`, {name: targetData.name, layout: targetData.childLayout===0?1:0}).then(()=>onRefresh()); } });
            if (isAdmin) options.push({ label: '🗑️ 删除', color: 'red', action: () => { if(confirm('删除?')) api.delete(`/bubble/${targetData.id}`).then(()=>onRefresh()); } });
        }
        return options;
    };

    const triggerMenu = (e, targetData, isNode) => {
        if (!canEdit) return;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        if (onShowMenu) onShowMenu(cx, cy, getMenuOptions(targetData, isNode));
    };

    const handleNodeClick = async (e, summary) => {
        e.stopPropagation();
        if (timerRef.current) return;
        try { const res = await api.get(`/node/${summary.id}`); setSelectedNode(res.data); } 
        catch { alert('加载失败'); }
    };

    return (
        <div 
            ref={setNodeRef} // 绑定 DnD Ref
            style={glassStyle}
            // 绑定拖拽监听器 (listeners) 和 属性 (attributes) 到泡泡容器上
            {...listeners} 
            {...attributes}
            
            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); triggerMenu(e, data, false); }}
            // 注意：因为 DnD 占用了触摸事件，这里我们需要调整长按逻辑。
            // Dnd-kit 的 Sensor 已经配置了长按250ms激活。所以如果是长按，会触发 DragStart。
            // 这里的 touchStart 主要用于触发右键菜单。
            // 冲突点：长按既触发拖拽，又触发菜单。
            // 解决：我们让菜单通过点击标题触发，或者通过右键触发。
            // 或者：我们暂时保留这个逻辑，看 dnd-kit 是否会拦截。
            onTouchStart={e => { if(e.touches.length>1)return; timerRef.current=setTimeout(()=>triggerMenu(e, data, false), 600); }}
            onTouchEnd={() => { clearTimeout(timerRef.current); timerRef.current=null; }}
        >
            <div style={headerStyle}>
                {/* 标题区域禁止拖拽，允许折叠点击 */}
                <div style={titleStyle} 
                     onPointerDown={e => e.stopPropagation()} // 防止标题点击触发拖拽
                     onClick={e => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                >
                    {data.name} {isCollapsed ? '▼' : '▲'}
                </div>
                {canEdit && (
                    <div onPointerDown={e => e.stopPropagation()}> {/* 按钮区域禁止拖拽 */}
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
                        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); triggerMenu(e, node, true); }}
                        // 知识点暂时不支持拖拽，保持原样
                        onTouchStart={e => { if(e.touches.length>1)return; timerRef.current=setTimeout(()=>triggerMenu(e, node, true), 600); }}
                        onTouchEnd={() => { clearTimeout(timerRef.current); timerRef.current=null; }}
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