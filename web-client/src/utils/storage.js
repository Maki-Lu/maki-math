// === 滚动位置管理 ===
export const saveScrollPosition = (y) => {
    localStorage.setItem('maki_scroll_y', y);
};

export const getScrollPosition = () => {
    const y = localStorage.getItem('maki_scroll_y');
    return y ? parseInt(y, 10) : 0;
};

// === 泡泡折叠状态管理 ===
// 我们用一个对象存储所有泡泡的状态: { "101": true, "102": false }
const STORAGE_KEY = 'maki_bubble_states';

const getAllStates = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
};

export const getBubbleCollapseState = (bubbleId) => {
    const states = getAllStates();
    // 返回 true/false，如果没有记录则返回 undefined
    return states[bubbleId];
};

export const saveBubbleCollapseState = (bubbleId, isCollapsed) => {
    const states = getAllStates();
    states[bubbleId] = isCollapsed;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
};

// 当用户点击全局层级按钮时，可能想要清除个别记忆，或者覆盖
// 这里我们简单处理：全局指令优先级最高，不清除记忆，但在组件里优先响应指令
