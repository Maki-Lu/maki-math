import { useState, useEffect, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import type { MoveBubbleModalProps, Bubble, BubbleStructureDto } from '../types';

interface BubbleOption {
    id: number;
    name: string;
    depth: number;
}

export default function MoveBubbleModal({ bubble, onClose, onSuccess }: MoveBubbleModalProps) {
    const [targetId, setTargetId] = useState(''); // 空字符串表示"移动到最顶层（成为课程）"
    const [options, setOptions] = useState<BubbleOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // 获取所有泡泡结构，用于构建下拉菜单
    useEffect(() => {
        api.get<BubbleStructureDto[]>('/bubble/structure')
            .then(res => {
                const allBubbles: BubbleOption[] = [];

                // 递归函数：将树展平，并计算层级前缀
                const flatten = (items: Bubble[], depth = 0) => {
                    items.forEach(item => {
                        // ❌ 核心过滤：不能移动到【自己】或者【自己的子孙】里面
                        // 如果当前 item 是 bubble 自己，或者 item 在 bubble 的子孙链条里（虽然前端很难判断子孙链，
                        // 但最简单的逻辑是：如果我们在遍历过程中遇到了 bubble.id，那么这一整枝都不应该加入列表）

                        // 简单粗暴法：如果遍历到的 item.id 等于 bubble.id，那么跳过它和它所有的子节点
                        if (item.id === bubble.id) return;

                        // 添加到选项列表
                        allBubbles.push({
                            id: item.id,
                            name: item.name,
                            depth: depth
                        });

                        // 递归子节点
                        if (item.children && item.children.length > 0) {
                            flatten(item.children, depth + 1);
                        }
                    });
                };

                // 由于后端返回的是扁平列表 (你之前的修改)，我们需要先在前端组装成树，再 Flatten？
                // 或者我们可以直接用后端返回的扁平列表？
                // 不，后端返回的是 List<BubbleStructureDto>，里面是没有 children 的（上次改成了扁平）。
                // 所以我们得先用 App.jsx 里的 buildTree 逻辑组装一次，才能知道谁是谁的子孙。

                // 为了复用代码，我们把 buildTree 逻辑简单复制过来
                const buildTree = (items: BubbleStructureDto[]): Bubble[] => {
                    const rootItems: Bubble[] = [];
                    const lookup: { [key: number]: Bubble } = {};
                    items.forEach(i => lookup[i.id] = { ...i, children: [], nodes: i.nodes || [] } as Bubble);
                    items.forEach(i => {
                        const bubbleItem = lookup[i.id] as Bubble;
                        if (i.parentId && lookup[i.parentId]) {
                            lookup[i.parentId].children!.push(bubbleItem);
                        } else {
                            rootItems.push(bubbleItem);
                        }
                    });
                    return rootItems;
                };

                const tree = buildTree(res.data);
                flatten(tree);
                setOptions(allBubbles);
                setLoading(false);
            })
            .catch(() => {
                alert("加载结构失败");
                onClose();
            });
    }, [bubble]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // targetId === '' 代表 null (顶层)
            const parentId = targetId === '' ? null : parseInt(targetId);

            // 调用 Update 接口，同时发送 name 和 layout (保持不变)，只改 ParentId
            await api.put(`/bubble/${bubble.id}`, {
                name: bubble.name,
                layout: bubble.childLayout,
                parentId: parentId
            });

            onSuccess?.();
            onClose();
        } catch (err) {
            alert('移动失败: ' + ((err as any).response?.data || (err as Error).message));
        } finally {
            setSubmitting(false);
        }
    };

    const overlayStyle: React.CSSProperties = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(5px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999
    };

    const modalContent = (
        <div style={overlayStyle} onClick={onClose}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', width: '350px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginTop: 0, color: '#4a90e2' }}>🚀 移动泡泡</h3>
                <p style={{color:'#666', fontSize:'14px'}}>将 <strong>{bubble.name}</strong> 移动到：</p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <select
                            value={targetId}
                            onChange={e => setTargetId(e.target.value)}
                            disabled={loading}
                            style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid #eee', fontSize:'16px', background:'white' }}
                        >
                            <option value="">🌍 (最顶层 - 成为新课程)</option>
                            {options.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                    {/* 用空格模拟层级缩进 */}
                                    {'\u00A0\u00A0'.repeat(opt.depth)} 📂 {opt.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', background: '#f0f0f0', color: '#555' }}>取消</button>
                        <button type="submit" disabled={submitting || loading} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', background: '#4a90e2', color: 'white', fontWeight: 'bold' }}>
                            {submitting ? '移动中...' : '确定'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
