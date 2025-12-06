import React, { useState, useRef, useEffect } from 'react';
import AddBubbleModal from './AddBubbleModal';
import AddNodeModal from './AddNodeModal';
import EditNodeModal from './EditNodeModal'; // <--- 引入漂亮的编辑弹窗
import NodeDetailModal from './NodeDetailModal';
import api from '../utils/api';

const Bubble = ({ data, level = 0, onRefresh, onShowMenu, expandCommand }) => {
    // === 状态 ===
    const [showAddBubble, setShowAddBubble] = useState(false);
    const [showAddNode, setShowAddNode] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null); // 查看详情
    const [editingNode, setEditingNode] = useState(null);   // 编辑内容 (新增)
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const timerRef = useRef(null);

    const role = localStorage.getItem('role');
    const canEdit = role === 'Admin' || role === 'Editor';
    const isAdmin = role === 'Admin'; 

    const isOrdered = data.childLayout === 0;

    // === 监听折叠 ===
    useEffect(() => {
        if (expandCommand) setIsCollapsed(level >= expandCommand.level);
    }, [expandCommand, level]);

    // === 样式定义 (数学动态版) ===
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
        transition: 'all 0.3s ease',
        userSelect: 'none', backdropFilter: 'blur(10px)'
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
        // 优化：无论有序无序，手机上都允许换行，防止撑破
        flexWrap: 'wrap', 
        // 优化：无序时居中，有序时靠左
        justifyContent: isOrdered ? 'flex-start' : 'center',
        gap: '10px', width: '100%', marginTop: '10px'
    };

    const btnStyle = { border:'none', borderRadius:'12px', padding:'4px 8px', cursor:'pointer', fontSize:'12px', fontWeight:'bold', color:'white', marginLeft:'5px' };
    const nodeStyle = { background:'white', border:'1px solid #eee', borderRadius:'12px', padding:'10px 15px', cursor:'pointer', display:'flex', alignItems:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' };

    // === 交互逻辑 ===
    const getMenuOptions = (targetData, isNode = false) => {
        const options = [];
        if (isNode) {
            options.push({ 
                label: '✏️ 修改内容 (Editor)', 
                action: async () => {
                    // 先拉取完整数据，再打开弹窗
                    try {
                        const res = await api.get(`/node/${targetData.id}`);
                        setEditingNode(res.data);
                    } catch (err) { alert("获取数据失败"); }
                } 
            });
            if (isAdmin) options.push({ label: '🗑️ 删除', color: 'red', action: () => { if(confirm('删除?')) api.delete(`/node/${targetData.id}`).then(()=>onRefresh()); } });
        } else {
            // 泡泡改名还是用 prompt 方便
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
            
            {/* 集成漂亮的编辑弹窗 */}
            {editingNode && <EditNodeModal node={editingNode} onClose={() => setEditingNode(null)} onSuccess={onRefresh} />}
        </div>
    );
};

export default Bubble;