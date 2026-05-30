import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5005/api/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-header">
          <div className="brand-icon">
            <i className="fa-solid fa-bolt"></i>
          </div>
          <span className="brand-title">Task Manager</span>
        </div>
        
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue to your dashboard</p>
        
        {error && <div className="error-badge">{error}</div>}
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Email / Username</label>
            <div className="input-wrapper">
              <i className="fa-regular fa-envelope input-icon"></i>
              <input 
                type="text" 
                placeholder="you@example.com"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-lock input-icon"></i>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <i 
                className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} input-icon-right`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>
          <button type="submit" className="auth-submit-btn">Sign In</button>
        </form>
        <p style={{textAlign: 'center', marginTop: '24px', color: '#9ca3af', fontWeight: '500'}}>
          Don't have an account? <Link to="/register" className="auth-link">Create account</Link>
        </p>
      </div>
    </div>
  );
}
