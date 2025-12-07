import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useOutletContext } from 'react-router-dom';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core'; 
import api from './utils/api';
import Login from './pages/Login';
import Bubble from './components/Bubble';
import AddBubbleModal from './components/AddBubbleModal';
import ContextMenu from './components/ContextMenu';
import { saveScrollPosition, getScrollPosition } from './utils/storage';
import logoImg from '../public/logo.png';

function Home() {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true); // 仅首次加载显示
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

    // === 核心修复 1: 静默刷新逻辑 ===
    const fetchData = (isRefresh = false) => {
        // 如果是编辑后的刷新(isRefresh=true)，不要设loading，防止页面闪烁和滚动条跳动
        if (!isRefresh) setLoading(true); 
        
        api.get('/bubble/structure')
            .then(res => {
                setTreeData(buildTree(res.data));
                setLoading(false);
                
                // 仅在首次加载时恢复滚动位置
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
        
        // 首次加载 (isRefresh = false)
        fetchData(false);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeout);
        };
    }, []);

    // 传递给子组件的刷新函数：使用静默模式
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
                        handleRefresh(); // 拖拽后静默刷新
                    }).catch(err => alert("移动失败: " + err.message));
                }
            });
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
        setGlobalMenu(null);
    };

    // 只有首次加载且没数据时才显示Loading
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
                                onRefresh={handleRefresh} // 传入静默刷新
                                onShowMenu={handleShowMenu}
                                expandCommand={expandCommand} 
                            />
                        </div>
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', border: '2px solid #ffafcc', color: '#555', fontWeight: 'bold' }}>
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

function Layout() {
    // === 核心修复 2: 初始指令设为 null ===
    // 这样页面刷新时，Bubble 就不会收到“强制展开”的命令，而是读取 localStorage
    const [expandCommand, setExpandCommand] = useState(null);
    const role = localStorage.getItem('role');
    const btnStyle = (isActive) => ({ border: 'none', background: isActive ? '#ffafcc' : 'rgba(255,255,255,0.5)', color: isActive ? 'white' : '#666', borderRadius: '15px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s', marginRight: '8px', marginBottom: '5px' });
    const navStyle = { padding: '10px 20px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.5)', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' };
    
    return (
        <>
            <nav style={navStyle}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link 
                    to="/" 
                    style={{ 
                        marginRight: '20px', 
                        textDecoration: 'none', 
                        color: '#4a4e69', 
                        fontWeight: '900', 
                        fontSize:'1.2rem',
                        display: 'flex',
                        alignItems: 'center' 
                    }}
                >
                    <img src={logoImg} alt="Maki Logo" style={{ height: '40px', width: 'auto', marginRight: '10px' }} />
                    MakiMath
                </Link>
                    <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap' }}>
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