import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useOutletContext } from 'react-router-dom';
import api from './utils/api';
import Login from './pages/Login';
import Bubble from './components/Bubble';
import AddBubbleModal from './components/AddBubbleModal';
import ContextMenu from './components/ContextMenu';

// === Home 组件：只负责显示内容 ===
function Home() {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    const [globalMenu, setGlobalMenu] = useState(null);

    // 接收来自 App 的全局指令！
    const { expandCommand } = useOutletContext(); 

    const role = localStorage.getItem('role');
    const canEdit = role === 'Admin' || role === 'Editor';

    const fetchData = () => {
        setLoading(true);
        api.get('/bubble/structure')
            .then(res => {
                setTreeData(buildTree(res.data));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
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

    useEffect(() => { fetchData(); }, []);

    const handleShowMenu = (x, y, options) => { setGlobalMenu({ x, y, options }); };

    if (loading) return <div style={{padding:'20px', textAlign:'center', color:'#fff'}}>正在加载数学宇宙...</div>;

    return (
        <div style={{ padding: '20px' }}>
            {/* 顶部标题栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{margin:0, fontSize:'1.5rem'}}>Maki 开源数学平台</h1>
                {canEdit && (
                    <button 
                        onClick={() => setShowCreateCourse(true)}
                        style={{ padding: '8px 16px', background: '#fff', color: '#ff8fab', border: '2px solid #ff8fab', borderRadius: '20px', fontWeight:'bold' }}
                    >
                        + 新课程
                    </button>
                )}
            </div>

            {/* 泡泡列表 */}
            <div>
                {treeData.length === 0 ? <p style={{color:'#fff'}}>暂无课程。</p> : treeData.map(course => (
                    <div key={course.id} style={{ marginBottom: '30px' }}>
                        <Bubble 
                            data={course} 
                            level={0} 
                            onRefresh={fetchData} 
                            onShowMenu={handleShowMenu}
                            expandCommand={expandCommand} // 透传指令
                        />
                    </div>
                ))}
            </div>

            {showCreateCourse && <AddBubbleModal parentId={null} onClose={() => setShowCreateCourse(false)} onSuccess={fetchData} />}
            {globalMenu && <ContextMenu x={globalMenu.x} y={globalMenu.y} options={globalMenu.options} onClose={() => setGlobalMenu(null)} />}
        </div>
    );
}

// === 布局组件：包含导航栏 ===
function Layout() {
    // 状态提升：在这里管理折叠指令
    const [expandCommand, setExpandCommand] = useState({ level: 5, ts: Date.now() });
    const role = localStorage.getItem('role');

    // 按钮样式
    const btnStyle = (isActive) => ({
        border: 'none', 
        background: isActive ? '#ffafcc' : 'rgba(255,255,255,0.5)',
        color: isActive ? 'white' : '#666',
        borderRadius: '15px', padding: '6px 12px', cursor: 'pointer',
        fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s',
        marginRight: '8px', marginBottom: '5px' // 防止手机换行挤在一起
    });

    const navStyle = {
        padding: '10px 20px', 
        background: 'rgba(255, 255, 255, 0.7)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.5)',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap' // 手机端允许换行
    };

    return (
        <>
            <nav style={navStyle}>
                {/* 左侧：首页链接 + 控制按钮 */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to="/" style={{ marginRight: '20px', textDecoration: 'none', color: '#4a4e69', fontWeight: '900', fontSize:'1.2rem' }}>MakiMath</Link>
                    
                    {/* 层级控制按钮组 */}
                    <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{fontSize:'12px', color:'#888', marginRight:'8px', display:'none'}}>层级:</span>
                        {[1, 2, 3].map(lvl => (
                            <button key={lvl} style={btnStyle(expandCommand.level === lvl)} onClick={() => setExpandCommand({ level: lvl, ts: Date.now() })}>
                                {lvl}级
                            </button>
                        ))}
                        <button style={btnStyle(expandCommand.level === 5)} onClick={() => setExpandCommand({ level: 5, ts: Date.now() })}>
                            全部
                        </button>
                    </div>
                </div>

                {/* 右侧：登录信息 */}
                <div>
                    {!role ? (
                        <Link to="/login" style={{textDecoration:'none', color:'#ff8fab', fontWeight:'bold'}}>登录</Link>
                    ) : (
                        <span style={{fontSize:'12px', color:'#888'}}>
                            {role} 
                            <button onClick={() => { localStorage.clear(); window.location.href='/'; }} style={{marginLeft:'5px', border:'none', background:'none', color:'#ff6b6b', cursor:'pointer'}}>退出</button>
                        </span>
                    )}
                </div>
            </nav>
            
            {/* 这里的 context 会传递给 Home */}
            <Outlet context={{ expandCommand }} />
        </>
    );
}

// === 主入口 ===
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