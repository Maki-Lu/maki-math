import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
    baseURL: '/api', // Nginx 会把这个转发给后端
    headers: {
        'Content-Type': 'application/json'
    }
});

// 请求拦截器：每次发请求前，自动把 Token 塞进去
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

// 响应拦截器：如果后端返回 401 (未登录)，自动踢回登录页
api.interceptors.response.use(response => response, error => {
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});

export default api;
