import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import api from './utils/api';
import Login from './pages/Login';
import Bubble from './components/Bubble';
import AddBubbleModal from './components/AddBubbleModal';
import ContextMenu from './components/ContextMenu';

function Home() {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    const [globalMenu, setGlobalMenu] = useState(null);

    // === 新增：全局折叠指令 ===
    // level: 展开到第几层 (1:只看课程, 5:全部展开)
    // ts: 时间戳，用于强制触发更新
    const [expandCommand, setExpandCommand] = useState({ level: 5, ts: Date.now() });

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

    // === 控制台样式 ===
    const controlPanelStyle = {
        position: 'fixed', top: '80px', left: '20px', zIndex: 100,
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
        padding: '10px', borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.5)',
        display: 'flex', flexDirection: 'column', gap: '5px'
    };

    const levelBtnStyle = (isActive) => ({
        border: 'none', background: isActive ? '#ffafcc' : 'transparent',
        color: isActive ? 'white' : '#666',
        borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
        fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s'
    });

    if (loading) return <div>加载数学宇宙中...</div>;

    return (
        <div style={{ padding: '20px' }}>
            {/* === 左上角固定控制台 === */}
            <div style={controlPanelStyle}>
                <div style={{fontSize:'12px', color:'#999', marginBottom:'5px', textAlign:'center'}}>层级控制</div>
                {[1, 2, 3, 4].map(lvl => (
                    <button 
                        key={lvl}
                        style={levelBtnStyle(expandCommand.level === lvl)}
                        onClick={() => setExpandCommand({ level: lvl, ts: Date.now() })}
                    >
                        只看 {lvl} 级
                    </button>
                ))}
                <button 
                    style={levelBtnStyle(expandCommand.level === 5)}
                    onClick={() => setExpandCommand({ level: 5, ts: Date.now() })}
                >
                    全部展开
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginLeft: '120px' }}>
                <h1>Maki 开源数学平台</h1>
                {canEdit && (
                    <button onClick={() => setShowCreateCourse(true)} style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        + 创建新课程
                    </button>
                )}
            </div>

            <div style={{ marginLeft: '120px' /* 给左边控制台留位置 */ }}>
                {treeData.length === 0 ? <p>暂无课程。</p> : treeData.map(course => (
                    <div key={course.id} style={{ marginBottom: '40px' }}>
                        <Bubble 
                            data={course} 
                            level={0} 
                            onRefresh={fetchData} 
                            onShowMenu={handleShowMenu}
                            expandCommand={expandCommand} // <--- 传下去
                        />
                    </div>
                ))}
            </div>

            {showCreateCourse && <AddBubbleModal parentId={null} onClose={() => setShowCreateCourse(false)} onSuccess={fetchData} />}
            {globalMenu && <ContextMenu x={globalMenu.x} y={globalMenu.y} options={globalMenu.options} onClose={() => setGlobalMenu(null)} />}
        </div>
    );
}

// export default App ... (保持原有的 export)
export default function App() {
    // ... 保持原有代码 ...
    // 这里为了节省篇幅，省略 export default App 的内容，请保持你原来 Main layout 的完整性
    // 只需修改上面的 Home 组件即可
    const role = localStorage.getItem('role');
    return (
        <BrowserRouter>
            <nav style={{ padding: '10px', background: 'rgba(255,255,255,0.8)', backdropFilter:'blur(5px)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', position:'sticky', top:0, zIndex:90 }}>
                <div><Link to="/" style={{ marginRight: '10px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>首页</Link></div>
                <div>{!role ? <Link to="/login" style={{textDecoration:'none', color:'#ffafcc'}}>管理员登录</Link> : <span style={{fontSize:'12px', color:'#888'}}>身份: {role}</span>}</div>
            </nav>
            <Routes><Route path="/" element={<Home />} /><Route path="/login" element={<Login />} /></Routes>
        </BrowserRouter>
    );
}