import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import MDEditor from '@uiw/react-md-editor';

export default function EditNodeModal({ node, onClose, onSuccess }) {
    // 1. 这里使用了 'content' 作为状态变量名
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    // 初始化
    useEffect(() => {
        if (node) {
            setTitle(node.title || '');
            setContent(node.content || '');
        }
    }, [node]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/node/${node.id}`, {
                title,
                content
            });
            onSuccess();
            onClose();
        } catch (err) {
            alert('修改失败: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.6)', 
        backdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        zIndex: 99999,
        animation: 'fadeIn 0.2s'
    };

    const modalStyle = {
        background: 'rgba(255, 255, 255, 0.95)', 
        padding: '30px', 
        borderRadius: '24px', 
        width: '90%', maxWidth: '600px', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)', 
        border: '1px solid #fff',
        display: 'flex', flexDirection: 'column', gap: '20px'
    };

    const inputStyle = {
        width: '100%', padding: '12px 15px', 
        borderRadius: '12px', border: '1px solid #e0e0e0', 
        fontSize: '16px', outline: 'none', transition: 'all 0.2s',
        backgroundColor: '#f9f9f9', fontFamily: 'inherit'
    };

    const btnBase = {
        padding: '10px 25px', borderRadius: '20px', border:'none', 
        fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s'
    };

    // 2. 修复关键：把这里的变量名从 'content' 改成了 'modalElement'
    const modalElement = (
        <div style={overlayStyle} onClick={onClose}>
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: 0, color: '#ffb703', fontSize: '1.4rem' }}>✏️ 修改知识点</h3>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{display:'block', marginBottom:'5px', color:'#888', fontSize:'12px', fontWeight:'bold'}}>标题</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            required 
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = '#ffb703'}
                            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                        />
                    </div>
                    
                    <div>
                        <label style={{display:'block', marginBottom:'5px', color:'#888', fontSize:'12px', fontWeight:'bold'}}>内容 (LaTeX / Markdown)</label>
                        {/* <textarea 
                            value={content} 
                            onChange={e => setContent(e.target.value)} 
                            required 
                            rows="8"
                            style={{...inputStyle, resize: 'vertical', lineHeight: '1.6'}}
                            onFocus={e => e.target.style.borderColor = '#ffb703'}
                            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                        /> */}
                        <MDEditor
                            value={content}
                            onChange={e => setContent(e)}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={onClose} style={{ ...btnBase, background: '#f0f0f0', color: '#666' }}>
                            放弃
                        </button>
                        <button type="submit" disabled={loading} style={{ ...btnBase, background: '#ffb703', color: 'white', boxShadow: '0 4px 10px rgba(255, 183, 3, 0.3)' }}>
                            {loading ? '保存中...' : '保存修改'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    // 3. 渲染改名后的变量
    return createPortal(modalElement, document.body);
}