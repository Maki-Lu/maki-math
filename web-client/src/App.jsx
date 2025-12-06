import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useOutletContext } from 'react-router-dom';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core'; 
import api from './utils/api';
import Login from './pages/Login';
import Bubble from './components/Bubble';
import AddBubbleModal from './components/AddBubbleModal';
import ContextMenu from './components/ContextMenu';
import { saveScrollPosition, getScrollPosition } from './utils/storage';

function Home() {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true); // 仅用于首次加载
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    const [globalMenu, setGlobalMenu] = useState(null);
    const [activeId, setActiveId] = useState(null); 

    const { expandCommand } = useOutletContext(); 
    const role = localStorage.getItem('role');
    const canEdit = role === 'Admin' || role === 'Editor';

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    // 核心修改 1: 分离首次加载和后续刷新
    // isRefresh: 如果是 true，说明是编辑后的刷新，不要显示全屏 loading
    const fetchData = (isRefresh = false) => {
        if (!isRefresh) setLoading(true); // 只有第一次才转圈圈
        
        api.get('/bubble/structure')
            .then(res => {
                setTreeData(buildTree(res.data));
                setLoading(false);
                
                // 核心修改 2: 仅在首次加载或强制刷新时恢复滚动
                // 如果是无感刷新(isRefresh=true)，因为DOM没销毁，滚动条本来就不会动，不需要强制scrollTo
                if (!isRefresh) {
                    setTimeout(() => {
                        const savedY = getScrollPosition();
                        if (savedY > 0) window.scrollTo(0, savedY);
                    }, 100);
                }
            })
            .catch(err => { console.error(err); setLoading(false); });
    };

    const buildTree = (items) => {
        const rootItems = [];
        const lookup = {};
        items.forEach(item => { lookup[item.id] = { ...item, children: [] }; });
        items.forEach(item => {
            if (item.parentId && lookup[item.parentId]) {
                lookup[item.parentId].children.push(lookup[item.id]);
            } else {
                rootItems.push(lookup[item.id]);
            }
        });
        return rootItems;
    };

    useEffect(() => {
        let timeout;
        const handleScroll = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                saveScrollPosition(window.scrollY);
            }, 100);
        };
        window.addEventListener('scroll', handleScroll);
        
        // 首次加载
        fetchData(false);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeout);
        };
    }, []);

    // 传递给子组件的刷新函数，标记为 true (静默刷新)
    const handleRefresh = () => fetchData(true);

    const handleShowMenu = (x, y, options) => { setGlobalMenu({ x, y, options }); };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || active.id === over.id) return;
        const sourceId = parseInt(active.id.split('-')[1]);
        const targetId = parseInt(over.id.split('-')[1]);
        if (sourceId === targetId) return;

        if (window.confirm(`确认要将这个泡泡移动到新的位置吗？`)) {
            api.get(`/bubble/structure`).then(res => {
                const bubble = res.data.find(b => b.id === sourceId);
                if (bubble) {
                    api.put(`/bubble/${sourceId}`, {
                        name: bubble.name,
                        layout: bubble.childLayout,
                        parentId: targetId
                    }).then(() => {
                        handleRefresh(); // 静默刷新
                    }).catch(err => alert("移动失败: " + err.message));
                }
            });
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
        setGlobalMenu(null);
    };

    // 首次加载时显示 Loading，后续刷新不显示
    if (loading && treeData.length === 0) return <div style={{padding:'20px', textAlign:'center', color:'#fff'}}>正在加载数学宇宙...</div>;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ padding: 'var(--page-padding)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 style={{margin:0, fontSize:'1.5rem'}}>Maki 开源数学平台</h1>
                    {canEdit && (
                        <button onClick={() => setShowCreateCourse(true)} style={{ padding: '8px 16px', background: '#fff', color: '#ff8fab', border: '2px solid #ff8fab', borderRadius: '20px', fontWeight:'bold' }}>+ 新课程</button>
                    )}
                </div>

                <div>
                    {treeData.length === 0 ? <p style={{color:'#fff'}}>暂无课程。</p> : treeData.map(course => (
                        <div key={course.id} style={{ marginBottom: '30px' }}>
                            <Bubble 
                                data={course} 
                                level={0} 
                                onRefresh={handleRefresh} // 使用静默刷新
                                onShowMenu={handleShowMenu}
                                expandCommand={expandCommand} 
                            />
                        </div>
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div style={{
                            padding: '10px 20px', background: 'rgba(255,255,255,0.9)', 
                            borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                            border: '2px solid #ffafcc', color: '#555', fontWeight: 'bold'
                        }}>
                            🚀 正在移动泡泡...
                        </div>
                    ) : null}
                </DragOverlay>

                {showCreateCourse && <AddBubbleModal parentId={null} onClose={() => setShowCreateCourse(false)} onSuccess={handleRefresh} />}
                {globalMenu && <ContextMenu x={globalMenu.x} y={globalMenu.y} options={globalMenu.options} onClose={() => setGlobalMenu(null)} />}
            </div>
        </DndContext>
    );
}

// Layout 组件：修改 expandCommand 初始值
function Layout() {
    // 核心修改 3: 初始值设为 null，防止覆盖本地存储
    const [expandCommand, setExpandCommand] = useState(null);
    const role = localStorage.getItem('role');
    const btnStyle = (isActive) => ({ border: 'none', background: isActive ? '#ffafcc' : 'rgba(255,255,255,0.5)', color: isActive ? 'white' : '#666', borderRadius: '15px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s', marginRight: '8px', marginBottom: '5px' });
    const navStyle = { padding: '10px 20px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.5)', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' };
    
    return (
        <>
            <nav style={navStyle}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to="/" style={{ marginRight: '20px', textDecoration: 'none', color: '#4a4e69', fontWeight: '900', fontSize:'1.2rem' }}>MakiMath</Link>
                    <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap' }}>
                        {/* 点击按钮时，发送带时间戳的指令 */}
                        {[1, 2, 3].map(lvl => <button key={lvl} style={btnStyle(expandCommand?.level === lvl)} onClick={() => setExpandCommand({ level: lvl, ts: Date.now() })}>{lvl}级</button>)}
                        <button style={btnStyle(expandCommand?.level === 5)} onClick={() => setExpandCommand({ level: 5, ts: Date.now() })}>全部</button>
                    </div>
                </div>
                <div>{!role ? <Link to="/login" style={{textDecoration:'none', color:'#ff8fab', fontWeight:'bold'}}>登录</Link> : <span style={{fontSize:'12px', color:'#888'}}>{role} <button onClick={() => { localStorage.clear(); window.location.href='/'; }} style={{marginLeft:'5px', border:'none', background:'none', color:'#ff6b6b', cursor:'pointer'}}>退出</button></span>}</div>
            </nav>
            <Outlet context={{ expandCommand }} />
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}