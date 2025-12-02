import React, { useState, useRef, useEffect } from 'react';
import AddBubbleModal from './AddBubbleModal';
import AddNodeModal from './AddNodeModal';
import NodeDetailModal from './NodeDetailModal'; // 引入详情页
import api from '../utils/api';

const Bubble = ({ data, level = 0, onRefresh, onShowMenu, expandCommand }) => {
    // === 状态定义 ===
    const [showAddBubble, setShowAddBubble] = useState(false);
    const [showAddNode, setShowAddNode] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null); // 当前选中的知识点(详情)
    const [isCollapsed, setIsCollapsed] = useState(false);  // 折叠状态
    
    // 引用
    const timerRef = useRef(null);

    // 权限
    const role = localStorage.getItem('role');
    const canEdit = role === 'Admin' || role === 'Editor';
    const isAdmin = role === 'Admin'; 

    const isOrdered = data.childLayout === 0;

    // === 监听全局折叠指令 ===
    useEffect(() => {
        if (expandCommand) {
            // 如果当前层级 >= 指令层级，则折叠
            if (level >= expandCommand.level) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        }
    }, [expandCommand, level]);

    // === 菜单选项逻辑 ===
    const getMenuOptions = (targetData, isNode = false) => {
        const options = [];
        if (isNode) {
            options.push({
                label: '✏️ 修改星星内容',
                action: () => {
                    const newTitle = prompt('修改标题:', targetData.title);
                    if (!newTitle) return;
                    const newContent = prompt('修改内容 (LaTeX/Markdown):', targetData.content);
                    if (!newContent) return;
                    api.put(`/node/${targetData.id}`, { title: newTitle, content: newContent }).then(() => onRefresh());
                }
            });
            if (isAdmin) {
                options.push({
                    label: '🗑️ 摘下星星',
                    color: '#ff8fab',
                    action: () => { if (confirm(`删除 "${targetData.title}"?`)) api.delete(`/node/${targetData.id}`).then(() => onRefresh()); }
                });
            }
        } else {
            options.push({ 
                label: '✏️ 重命名', 
                action: () => {
                    const newName = prompt('新名称:', targetData.name);
                    if (newName) api.put(`/bubble/${targetData.id}`, { name: newName, layout: targetData.childLayout }).then(() => onRefresh());
                } 
            });
            options.push({
                label: targetData.childLayout === 0 ? '✨ 变身：云朵模式' : '📑 变身：列表模式',
                action: () => {
                    const newLayout = targetData.childLayout === 0 ? 1 : 0;
                    api.put(`/bubble/${targetData.id}`, { name: targetData.name, layout: newLayout }).then(() => onRefresh());
                }
            });
            if (isAdmin) {
                options.push({
                    label: '🗑️ 移除泡泡',
                    color: '#ff8fab',
                    action: () => { if (confirm(`删除 "${targetData.name}"?`)) api.delete(`/bubble/${targetData.id}`).then(() => onRefresh()); }
                });
            }
        }
        return options;
    };

    // === 触发菜单 ===
    const triggerMenu = (e, targetData, isNode) => {
        if (!canEdit) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const yOffset = e.touches ? -60 : 0;
        if (onShowMenu) onShowMenu(clientX, clientY + yOffset, getMenuOptions(targetData, isNode));
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const handleContextMenu = (e, targetData, isNode = false) => {
        e.preventDefault(); e.stopPropagation(); triggerMenu(e, targetData, isNode);
    };

    const handleTouchStart = (e, targetData, isNode = false) => {
        if (e.touches.length > 1) return;
        timerRef.current = setTimeout(() => triggerMenu(e, targetData, isNode), 600);
    };

    const handleTouchEnd = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
    const handleTouchMove = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

    // === 点击知识点 (按需加载详情) ===
    const handleNodeClick = async (e, nodeSummary) => {
        e.stopPropagation();
        if (timerRef.current !== null) return; // 被长按拦截
        
        try {
            // 请求完整内容
            const res = await api.get(`/node/${nodeSummary.id}`);
            setSelectedNode(res.data);
        } catch (err) {
            console.error("获取详情失败", err);
            // 如果失败，可以用 summary 兜底显示，或者提示错误
            alert("加载详情失败，请检查网络");
        }
    };

    // === 样式定义 ===
    const glassStyle = {
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: level === 0 ? '16px' : 'var(--bubble-radius)',
        margin: 'var(--bubble-margin)',
        // 动态 Padding
        padding: `calc(var(--bubble-padding-v) + 30px) var(--bubble-padding-h) var(--bubble-padding-v) var(--bubble-padding-h)`,
        // 动态高度 (折叠时变小)
        minHeight: isCollapsed ? '50px' : '120px',
        minWidth: '200px',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.3s ease',
        userSelect: 'none', touchAction: 'pan-y'
    };

    const headerStyle = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '15px', paddingBottom: '10px',
        borderBottom: isOrdered && !isCollapsed ? '1px dashed rgba(0,0,0,0.05)' : 'none',
        width: '100%', position: 'absolute', top: '15px', left: 0, paddingLeft:'20px', paddingRight:'20px', boxSizing: 'border-box'
    };

    const titleStyle = { 
        fontSize: 'var(--title-size)', fontWeight: '700', color: '#6c757d', letterSpacing: '0.5px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
    };
    
    // 折叠箭头样式
    const arrowStyle = {
        fontSize: '10px', color: '#aaa', transition: 'transform 0.3s',
        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
    };

    const btnGroupStyle = { display: 'flex', gap: '8px' };
    const btnStyle = (color) => ({
        border: 'none', borderRadius: '12px', padding: '4px 8px', cursor: 'pointer',
        fontSize: '11px', minWidth: '24px', fontWeight: 'bold', color: 'white', background: color,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    });

    const contentStyle = {
        display: 'flex',
        flexDirection: isOrdered ? 'column' : 'row',
        flexWrap: isOrdered ? 'nowrap' : 'wrap',
        justifyContent: isOrdered ? 'flex-start' : 'center',
        alignItems: isOrdered ? 'stretch' : 'center',
        gap: '12px', width: '100%', marginTop: '20px',
        opacity: isCollapsed ? 0 : 1, // 折叠动画辅助
        pointerEvents: isCollapsed ? 'none' : 'auto'
    };

    const nodeStyle = {
        background: '#fff', border: 'none', borderRadius: '16px', padding: '12px 20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)', color: '#555', fontSize: '0.95em',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative', overflow: 'hidden'
    };
    const nodeDecoStyle = { width: '6px', height: '6px', borderRadius: '50%', background: '#ffb703', marginRight: '10px', boxShadow: '0 0 5px #ffb703' };

    return (
        <div 
            className="bubble-glass" style={glassStyle}
            onContextMenu={(e) => handleContextMenu(e, data, false)}
            onTouchStart={(e) => handleTouchStart(e, data, false)}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
        >
            <div style={headerStyle}>
                {/* 点击标题折叠 */}
                <div style={titleStyle} onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}>
                    {data.name}
                    <span style={arrowStyle}>▼</span>
                </div>
                {canEdit && (
                    <div style={btnGroupStyle}>
                        <button onClick={(e) => { e.stopPropagation(); setShowAddNode(true); }} style={btnStyle('#ffcdb2')}>★</button>
                        <button onClick={(e) => { e.stopPropagation(); setShowAddBubble(true); }} style={btnStyle('#b5e48c')}>＋</button>
                    </div>
                )}
            </div>

            {/* 只有未折叠才渲染内容 */}
            {!isCollapsed && (
                <div style={contentStyle}>
                    {data.children && data.children.map(child => (
                        <Bubble 
                            key={child.id} 
                            data={child} 
                            level={level + 1} 
                            onRefresh={onRefresh} 
                            onShowMenu={onShowMenu}
                            expandCommand={expandCommand} // 透传折叠指令
                        />
                    ))}

                    {data.nodes && data.nodes.map(node => (
                        <div key={node.id} 
                            style={nodeStyle}
                            title="点击查看详情"
                            onClick={(e) => handleNodeClick(e, node)}
                            onContextMenu={(e) => handleContextMenu(e, node, true)}
                            onTouchStart={(e) => handleTouchStart(e, node, true)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchMove}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05) rotate(1deg)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0)'}
                        >
                            <div style={nodeDecoStyle}></div>
                            {node.title}
                        </div>
                    ))}
                </div>
            )}

            {showAddBubble && <AddBubbleModal parentId={data.id} onClose={() => setShowAddBubble(false)} onSuccess={onRefresh} />}
            {showAddNode && <AddNodeModal parentBubbleId={data.id} onClose={() => setShowAddNode(false)} onSuccess={onRefresh} />}
            
            {/* 详情页弹窗 */}
            {selectedNode && <NodeDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
        </div>
    );
};

export default Bubble;