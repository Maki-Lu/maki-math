import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import api from './utils/api';
import Login from './pages/Login';
import Bubble from './components/Bubble';
import AddBubbleModal from './components/AddBubbleModal';
import ContextMenu from './components/ContextMenu'; // <--- 1. 引入菜单组件

function Home() {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    
    // <--- 2. 定义全局唯一的菜单状态
    const [globalMenu, setGlobalMenu] = useState(null); 

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

    useEffect(() => {
        fetchData();
    }, []);

    // <--- 3. 定义一个处理函数，传给子孙们使用
    const handleShowMenu = (x, y, options) => {
        setGlobalMenu({ x, y, options });
    };

    if (loading) return <div>加载数学宇宙中...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Maki 开源数学平台</h1>
                {canEdit && (
                    <button 
                        onClick={() => setShowCreateCourse(true)}
                        style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        + 创建新课程
                    </button>
                )}
            </div>

            {treeData.length === 0 ? (
                <p>暂无课程。{canEdit ? '请点击右上角创建。' : '请等待管理员添加。'}</p>
            ) : (
                treeData.map(course => (
                    <div key={course.id} style={{ marginBottom: '40px' }}>
                        {/* <--- 4. 把 handleShowMenu 传下去 */}
                        <Bubble 
                            data={course} 
                            level={0} 
                            onRefresh={fetchData} 
                            onShowMenu={handleShowMenu} 
                        />
                    </div>
                ))
            )}

            {showCreateCourse && (
                <AddBubbleModal 
                    parentId={null} 
                    onClose={() => setShowCreateCourse(false)}
                    onSuccess={fetchData} 
                />
            )}

            {/* <--- 5. 在这里渲染唯一的菜单 */}
            {globalMenu && (
                <ContextMenu 
                    x={globalMenu.x} 
                    y={globalMenu.y} 
                    options={globalMenu.options} 
                    onClose={() => setGlobalMenu(null)} 
                />
            )}
        </div>
    );
}

export default function App() {
    const role = localStorage.getItem('role');

    return (
        <BrowserRouter>
            <nav style={{ padding: '10px', background: '#f0f0f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <Link to="/" style={{ marginRight: '10px', textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>首页</Link>
                </div>
                <div>
                    {!role ? (
                        <Link to="/login" style={{ textDecoration: 'none', color: '#007bff' }}>管理员登录</Link>
                    ) : (
                        <span>
                            当前身份: <strong>{role}</strong> 
                            <button 
                                onClick={() => { localStorage.clear(); window.location.href='/'; }}
                                style={{ marginLeft: '10px', cursor: 'pointer', border: 'none', background: 'none', color: 'red' }}
                            >
                                (退出)
                            </button>
                        </span>
                    )}
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </BrowserRouter>
    );
}
