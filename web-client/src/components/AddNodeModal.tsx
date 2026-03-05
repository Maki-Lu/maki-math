import { useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import MDEditor from '@uiw/react-md-editor';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.css';
import type { AddNodeModalProps } from '../types';

export default function AddNodeModal({ parentBubbleId, onClose, onSuccess }: AddNodeModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/node', { title, content, parentBubbleId });
            onSuccess?.();
            onClose();
        } catch (err) {
            alert('失败: ' + ((err as any).response?.data || (err as Error).message));
        } finally {
            setLoading(false);
        }
    };

    // === 确认退出 ===
    const handleOverlayClick = () => {
        // 添加模式下，通常只要点击背景就提示，防止误触
        if (window.confirm("确定要放弃添加并退出吗？")) {
            onClose();
        }
    };

    // === 拦截拖拽 ===
    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const overlayStyle: React.CSSProperties = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(5px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999
    };

    const modalContent = (
        <div style={overlayStyle} onClick={handleOverlayClick}>
            <div
                style={{
                    background: '#fff', padding: '30px', borderRadius: '24px',
                    minWidth: '80%', maxWidth: '800px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0'
                }}
                onClick={stopPropagation}
                onPointerDown={stopPropagation}
                onMouseDown={stopPropagation}
                onTouchStart={e => e.stopPropagation()}
            >
                <h3 style={{ marginTop: 0, color: '#ffb703' }}>★ 添加新知识点</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="标题 (例如: 导数定义)"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', fontSize: '16px' }} />
                    </div>

                    <div style={{ marginBottom: '20px' }} data-color-mode="light">
                        <MDEditor
                            value={content}
                            onChange={value => setContent(value || '')}
                            height={400}
                            previewOptions={{
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
