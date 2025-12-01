import React, { useState, useRef } from 'react';
import AddBubbleModal from './AddBubbleModal';
import AddNodeModal from './AddNodeModal';
import NodeDetailModal from './NodeDetailModal'; // <--- 新增
import api from '../utils/api';

const Bubble = ({ data, level = 0, onRefresh, onShowMenu }) => {
    const [showAddBubble, setShowAddBubble] = useState(false);
    const [showAddNode, setShowAddNode] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null); // <--- 新增：当前选中的知识点
    const timerRef = useRef(null);

    const role = localStorage.getItem('role');
    const canEdit = role === 'Admin' || role === 'Editor';
    const isAdmin = role === 'Admin'; 

    const isOrdered = data.childLayout === 0;

    // === 菜单逻辑 (保持不变) ===
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

    // === 点击知识点 ===
    const handleNodeClick = (e, node) => {
        e.stopPropagation(); // 防止冒泡
        // 如果正在触发长按菜单，不要打开详情
        if (timerRef.current === null) { 
             setSelectedNode(node); // <--- 打开详情页
        }
    };

    // === 样式 (保持之前的艺术品级样式) ===
    const glassStyle = {
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: level === 0 ? '16px' : 'var(--bubble-radius)',
        margin: 'var(--bubble-margin)',
        padding: `calc(var(--bubble-padding-v) + 30px) var(--bubble-padding-h) var(--bubble-padding-v) var(--bubble-padding-h)`,
        minWidth: '200px',
        minHeight: '120px',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        userSelect: 'none', touchAction: 'pan-y'
    };

    const headerStyle = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '15px', paddingBottom: '10px',
        borderBottom: isOrdered ? '1px dashed rgba(0,0,0,0.05)' : 'none',
        width: '100%', position: 'absolute', top: '15px', left: 0, paddingLeft:'20px', paddingRight:'20px', boxSizing: 'border-box'
    };

    const titleStyle = { fontSize: 'var(--title-size)', fontWeight: '700', color: '#6c757d', letterSpacing: '0.5px' };

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
        gap: '12px', width: '100%', marginTop: '20px'
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
                <div style={titleStyle}>{data.name}</div>
                {canEdit && (
                    <div style={btnGroupStyle}>
                        <button onClick={(e) => { e.stopPropagation(); setShowAddNode(true); }} style={btnStyle('#ffcdb2')}>★</button>
                        <button onClick={(e) => { e.stopPropagation(); setShowAddBubble(true); }} style={btnStyle('#b5e48c')}>＋</button>
                    </div>
                )}
            </div>

            <div style={contentStyle}>
                {data.children && data.children.map(child => (
                    <Bubble key={child.id} data={child} level={level + 1} onRefresh={onRefresh} onShowMenu={onShowMenu} />
                ))}

                {data.nodes && data.nodes.map(node => (
                    <div key={node.id} 
                        style={nodeStyle}
                        title="点击查看详情"
                        onClick={(e) => handleNodeClick(e, node)} // <--- 点击打开详情
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

            {showAddBubble && <AddBubbleModal parentId={data.id} onClose={() => setShowAddBubble(false)} onSuccess={onRefresh} />}
            {showAddNode && <AddNodeModal parentBubbleId={data.id} onClose={() => setShowAddNode(false)} onSuccess={onRefresh} />}
            
            {/* 渲染详情弹窗 */}
            {selectedNode && <NodeDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
        </div>
    );
};

export default Bubble;
