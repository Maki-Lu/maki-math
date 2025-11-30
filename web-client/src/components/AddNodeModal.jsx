import { useState } from 'react';
import api from '../utils/api';

export default function AddNodeModal({ parentBubbleId, onClose, onSuccess }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/node', {
                title,
                content,
                parentBubbleId
            });
            alert('知识点创建成功！');
            onSuccess();
            onClose();
        } catch (err) {
            alert('失败: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', minWidth: '400px' }}>
                <h3>★ 添加新知识点</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>标题：</label>
                        <input 
                            type="text" value={title} onChange={e => setTitle(e.target.value)} required 
                            style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                        <label>内容 (支持 Markdown/LaTeX)：</label>
                        <textarea 
                            value={content} onChange={e => setContent(e.target.value)} required 
                            rows="5"
                            style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button type="button" onClick={onClose}>取消</button>
                        <button type="submit" disabled={loading}>{loading ? '提交中...' : '添加'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
