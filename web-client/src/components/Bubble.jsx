import React, { useState, useRef, useEffect } from 'react';
import AddBubbleModal from './AddBubbleModal';
import AddNodeModal from './AddNodeModal';
import NodeDetailModal from './NodeDetailModal';
import api from '../utils/api';

const Bubble = ({ data, level = 0, onRefresh, onShowMenu, expandCommand }) => {
    const [showAddBubble, setShowAddBubble] = useState(false);
    const [showAddNode, setShowAddNode] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const timerRef = useRef(null);

    const role = localStorage.getItem('role');
    const canEdit = role === 'Admin' || role === 'Editor';
    const isAdmin = role === 'Admin'; 

    const isOrdered = data.childLayout === 0;

    // === 监听折叠指令 ===
    useEffect(() => {
        if (expandCommand) {
            setIsCollapsed(level >= expandCommand.level);
        }
    }, [expandCommand, level]);

    // === 颜色逻辑 ===
    // 简单的颜色轮转，确保有背景色
    const colors = ['#e3f2fd', '#e8f5e9', '#fff9c4', '#fce4ec', '#f3e5f5'];
    const bgColor = colors[level % colors.length];

    // === 样式定义 (响应式版) ===
    const glassStyle = {
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.65)', 
        border: `2px solid ${level === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}`,
        
        // 使用 CSS 变量！自动响应手机
        borderRadius: level === 0 ? '16px' : 'var(--bubble-r)',
        margin: 'var(--bubble-m)',
        // 顶部 padding 依然要留给标题，但使用变量计算
        padding: `calc(var(--bubble-p-v) + 35px) var(--bubble-p-h) var(--bubble-p-v) var(--bubble-p-h)`,
        
        minHeight: isCollapsed ? '60px' : '100px',
        minWidth: 'auto', // 允许手机上变窄
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        transition: 'all 0.3s ease',
        userSelect: 'none',
        backdropFilter: 'blur(10px)'
    };

    const headerStyle = {
        position: 'absolute', top: '15px', left: 'var(--bubble-p-h)', right: 'var(--bubble-p-h)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: isOrdered && !isCollapsed ? '1px dashed #ccc' : 'none',
        paddingBottom: '5px'
    };

    const titleStyle = { 
        fontSize: '16px', fontWeight: 'bold', color: '#555', cursor: 'pointer' 
    };

    const contentStyle = {
        display: isCollapsed ? 'none' : 'flex',
        flexDirection: isOrdered ? 'column' : 'row',
        flexWrap: 'wrap', // 关键：手机上强制换行
        gap: '10px', width: '100%', marginTop: '5px'
    };

    // 按钮和节点样式
    const btnStyle = { border:'none', borderRadius:'12px', padding:'4px 8px', cursor:'pointer', fontSize:'12px', fontWeight:'bold', color:'white', marginLeft:'5px' };
    const nodeStyle = { background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'10px 15px', cursor:'pointer', display:'flex', alignItems:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' };

    // === 交互逻辑 (保持不变) ===
    const getMenuOptions = (targetData, isNode = false) => {
        const options = [];
        if (isNode) {
            options.push({ label: '✏️ 修改内容', action: () => { const t = prompt('标题:', targetData.title); if(t) { const c = prompt('内容:', targetData.content); if(c) api.put(`/node/${targetData.id}`, {title:t, content:c}).then(()=>onRefresh()); } } });
            if (isAdmin) options.push({ label: '🗑️ 删除', color: 'red', action: () => { if(confirm('删除?')) api.delete(`/node/${targetData.id}`).then(()=>onRefresh()); } });
        } else {
            options.push({ label: '✏️ 重命名', action: () => { const n = prompt('新名:', targetData.name); if(n) api.put(`/bubble/${targetData.id}`, {name:n, layout: targetData.childLayout}).then(()=>onRefresh()); } });
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
            style={glassStyle}
            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); triggerMenu(e, data, false); }}
            onTouchStart={e => { if(e.touches.length>1)return; timerRef.current=setTimeout(()=>triggerMenu(e, data, false), 600); }}
            onTouchEnd={() => { clearTimeout(timerRef.current); timerRef.current=null; }}
        >
            <div style={headerStyle}>
                <div style={titleStyle} onClick={e => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}>
                    {data.name} {isCollapsed ? '▼' : '▲'}
                </div>
                {canEdit && (
                    <div>
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
                    >
                        <span style={{color:'#ffb703', marginRight:'5px'}}>★</span> {node.title}
                    </div>
                ))}
            </div>

            {showAddBubble && <AddBubbleModal parentId={data.id} onClose={() => setShowAddBubble(false)} onSuccess={onRefresh} />}
            {showAddNode && <AddNodeModal parentBubbleId={data.id} onClose={() => setShowAddNode(false)} onSuccess={onRefresh} />}
            {selectedNode && <NodeDetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />}
        </div>
    );
};

export default Bubble;