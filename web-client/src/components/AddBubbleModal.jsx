import { useState } from 'react';
import api from '../utils/api';

export default function AddBubbleModal({ parentId, onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [layout, setLayout] = useState(0); // 0: Ordered, 1: Unordered
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 调用后端 API 创建泡泡
            await api.post('/bubble', {
                name: name,
                parentId: parentId || null, // 如果没有 parentId，就是顶级课程
                layout: parseInt(layout)
            });
            alert('创建成功！');
            onSuccess(); // 通知父组件刷新列表
            onClose();   // 关闭弹窗
        } catch (err) {
            alert('创建失败: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    // 简单的内联样式 (Modal)
    const modalStyle = {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000
    };

    return (
        <div style={modalStyle}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', minWidth: '300px' }}>
                <h3>{parentId ? '添加子泡泡' : '创建新课程'}</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>名称：</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                        <label>内部布局：</label>
                        <select 
                            value={layout} 
                            onChange={e => setLayout(e.target.value)}
                            style={{ width: '100%', padding: '5px' }}
                        >
                            <option value={0}>有序 (纵向排列)</option>
                            <option value={1}>无序 (气泡聚合)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button type="button" onClick={onClose}>取消</button>
                        <button type="submit" disabled={loading}>
                            {loading ? '提交中...' : '确定'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
