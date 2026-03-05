import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { username, password });
            // 登录成功，保存 Token 和 Role 到浏览器缓存
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            navigate('/'); // 跳转回主页
        } catch (err) {
            setError('登录失败，请检查用户名或密码');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <form onSubmit={handleLogin} style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>Maki Math 登录</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div style={{ marginBottom: '1rem' }}>
                    <label>用户名: </label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label>密码: </label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit">进入系统</button>
            </form>
        </div>
    );
}
