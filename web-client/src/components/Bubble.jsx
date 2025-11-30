import React, { useState, useRef } from 'react';
import AddBubbleModal from './AddBubbleModal';
import AddNodeModal from './AddNodeModal';
import api from '../utils/api';

const Bubble = ({ data, level = 0, onRefresh, onShowMenu }) => {
    const [showAddBubble, setShowAddBubble] = useState(false);
    const [showAddNode, setShowAddNode] = useState(false);
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
                    const newContent = prompt('修改内容:', targetData.content);
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
                label: targetData.childLayout === 0 ? '✨ 变身：云朵模式 (无序)' : '📑 变身：清单模式 (有序)',
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

    // === 🎨 艺术品级样式设计 ===

    // 1. 磨砂玻璃容器 (Glassmorphism)
    const glassStyle = {
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.55)', // 半透明白
        backdropFilter: 'blur(12px)',            // 模糊背景，营造空气感
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.8)', // 亮边框，模拟玻璃边缘
        // level === 0 是最外层课程，给大一点；里面的用数学函数计算
        borderRadius: level === 0 ? '16px' : 'var(--bubble-radius)',
        margin: 'var(--bubble-margin)',
        // 顶部 padding 特别处理：因为头部有标题和按钮，需要大一点的空间
        padding: `calc(var(--bubble-padding-v) + 30px) var(--bubble-padding-h) var(--bubble-padding-v) var(--bubble-padding-h)`,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)', // 极其柔和的阴影
        
        minWidth: '200px',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column', // 垂直排列：上面是头，下面是内容
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        userSelect: 'none',
        touchAction: 'pan-y'
    };

    // 2. 头部区域 (Flex布局：解决遮挡问题)
    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between', // 标题在左，按钮在右，撑开
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: isOrdered ? '1px dashed rgba(0,0,0,0.05)' : 'none', // 隐约的分隔线
        width: '100%'
    };

    const titleStyle = {
        fontSize: '1.1em',
        fontWeight: '700',
        color: '#6c757d',
        letterSpacing: '0.5px'
    };

    // 3. 糖果按钮 (可爱风)
    const btnGroupStyle = { display: 'flex', gap: '8px' };
    const btnStyle = (color) => ({
        border: 'none',
        borderRadius: '12px', // 枕头形
        padding: '4px 8px', // 稍微改小
        fontSize: '11px',
        minWidth: '24px',   // 保证最小点击面积
        cursor: 'pointer',
        fontWeight: 'bold',
        color: 'white',
        background: color,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    });

    // 4. 内容区域
    const contentStyle = {
        display: 'flex',
        flexDirection: isOrdered ? 'column' : 'row',
        flexWrap: isOrdered ? 'nowrap' : 'wrap',
        justifyContent: isOrdered ? 'flex-start' : 'center',
        alignItems: isOrdered ? 'stretch' : 'center',
        gap: '12px',
        width: '100%'
    };

    // 5. 知识点卡片 (Wish Card)
    const nodeStyle = {
        background: '#fff',
        border: 'none',
        borderRadius: '16px',
        padding: '12px 20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
        color: '#555',
        fontSize: '0.95em',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        overflow: 'hidden'
    };

    // 知识点左边的彩色条 (装饰)
    const nodeDecoStyle = {
        width: '6px', height: '6px', borderRadius: '50%',
        background: '#ffb703', marginRight: '10px',
        boxShadow: '0 0 5px #ffb703'
    };

    return (
        <div 
            className="bubble-glass" 
            style={glassStyle}
            onContextMenu={(e) => handleContextMenu(e, data, false)}
            onTouchStart={(e) => handleTouchStart(e, data, false)}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
        >
            {/* --- 灵动头部：标题左，按钮右 --- */}
            <div style={headerStyle}>
                <div style={titleStyle}>{data.name}</div>
                {canEdit && (
                    <div style={btnGroupStyle}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowAddNode(true); }}
                            style={btnStyle('#ffcdb2')} // 杏色
                            title="添加星星"
                        >★</button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowAddBubble(true); }}
                            style={btnStyle('#b5e48c')} // 嫩草绿
                            title="添加云朵"
                        >＋</button>
                    </div>
                )}
            </div>

            {/* --- 内容容器 --- */}
            <div style={contentStyle}>
                {/* 递归子泡泡 */}
                {data.children && data.children.map(child => (
                    <Bubble 
                        key={child.id} 
                        data={child} 
                        level={level + 1} 
                        onRefresh={onRefresh} 
                        onShowMenu={onShowMenu} 
                    />
                ))}

                {/* 知识点 */}
                {data.nodes && data.nodes.map(node => (
                    <div key={node.id} 
                        style={nodeStyle}
                        title={node.content}
                        onContextMenu={(e) => handleContextMenu(e, node, true)}
                        onTouchStart={(e) => handleTouchStart(e, node, true)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05) rotate(1deg)'} // 悬停微微晃动
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0)'}
                    >
                        <div style={nodeDecoStyle}></div>
                        {node.title}
                    </div>
                ))}
            </div>

            {showAddBubble && <AddBubbleModal parentId={data.id} onClose={() => setShowAddBubble(false)} onSuccess={onRefresh} />}
            {showAddNode && <AddNodeModal parentBubbleId={data.id} onClose={() => setShowAddNode(false)} onSuccess={onRefresh} />}
        </div>
    );
};

export default Bubble;
