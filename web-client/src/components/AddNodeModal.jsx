import { useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import MDEditor from '@uiw/react-md-editor';
// 1. 引入数学公式插件
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.css'; // 引入公式样式

export default function AddNodeModal({ parentBubbleId, onClose, onSuccess }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/node', { title, content, parentBubbleId });
            onSuccess();
            onClose();
        } catch (err) {
            alert('失败: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(5px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999
    };

    const modalContent = (
        <div style={overlayStyle} onClick={onClose}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', minWidth: '80%', maxWidth: '800px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginTop: 0, color: '#ffb703' }}>★ 添加新知识点</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="标题 (例如: 导数定义)"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', fontSize: '16px' }} />
                    </div>
                    
                    {/* 2. 配置支持 LaTeX 的编辑器 */}
                    <div style={{ marginBottom: '20px' }} data-color-mode="light">
                        <MDEditor
                            value={content}
                            onChange={setContent}
                            height={400} // 设置一个固定高度，体验更好
                            previewOptions={{
                                // 注入插件
                                rehypePlugins: [[rehypeKatex, { strict: false }]],
                                remarkPlugins: [remarkMath],
                            }}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', background: '#f0f0f0', color: '#555' }}>取消</button>
                        <button type="submit" disabled={loading} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', background: '#ffb703', color: 'white', fontWeight: 'bold' }}>{loading ? '...' : '添加'}</button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}