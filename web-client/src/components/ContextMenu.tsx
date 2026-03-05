import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ContextMenuProps } from '../types';

export default function ContextMenu({ x, y, options, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: Event) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // 监听点击和滚动
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('scroll', onClose);
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('scroll', onClose);
        };
    }, [onClose]);

    // 定义菜单的样式
    const menuStyle: React.CSSProperties = {
        position: 'fixed', // 强制固定在窗口
        top: y,
        left: x,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        boxShadow: '3px 3px 10px rgba(0,0,0,0.2)',
        borderRadius: '4px',
        zIndex: 99999, // 确保在最最最上层
        padding: '5px 0',
        minWidth: '150px'
    };

    const menuContent = (
        <div ref={menuRef} style={menuStyle}>
            {options.map((option, index) => (
                <div
                    key={index}
                    onClick={(e) => {
                        e.stopPropagation(); // 防止点击菜单穿透
                        option.action();
                        onClose();
                    }}
                    style={{
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: option.color || '#333',
                        borderBottom: index < options.length - 1 ? '1px solid #eee' : 'none',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                >
                    {option.label}
                </div>
            ))}
        </div>
    );

    // 使用 createPortal 将菜单直接挂载到 document.body
    return createPortal(menuContent, document.body);
}
