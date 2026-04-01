import React, { useState, useContext, useEffect } from 'react';
import { ShieldAlert, LogIn, Key, Users, User, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const { login } = useContext(AuthContext);
  const [role, setRole] = useState('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Login failed');
      login(data.user, data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  const fillDemoCredentials = () => {
    if (role === 'owner') {
      setEmail('owner@fire.com');
      setPassword('password123');
    } else if (role === 'inspector') {
      setEmail('inspector@fire.com');
      setPassword('password123');
    } else if (role === 'govt') {
      setEmail('govt@fire.com');
      setPassword('password123');
    }
  };

  // Reset fields when role changes to avoid confusion
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, [role]);

  return (
    <div className="flex items-center" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <ShieldAlert size={56} className="text-warning animate-pulse-danger" style={{ margin: '0 auto 16px', borderRadius: '50%', padding: '8px', background: 'var(--bg-glass)' }} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)' }}>Firecracker Safety Monitor</h1>
          <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.95rem' }}>Secure Portal Access</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: '8px', marginBottom: '16px', color: '#f8fafc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <ShieldAlert size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex-col gap-5">
          
          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} /> Select Authority Level
            </label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value)}
              style={{ padding: '12px', fontSize: '1rem', background: 'var(--bg-dark)' }}
            >
              <option value="owner">🏭 Factory Owner</option>
              <option value="inspector">📋 Safety Inspector</option>
              <option value="govt">🏛️ Government Authority</option>
            </select>
          </div>

          <div className="flex-col gap-2" style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} /> Email Address
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Enter your registered email" 
              required 
            />
          </div>

          <div className="flex-col gap-2">
            <label style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={16} /> Password
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter your secure password" 
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary flex items-center" style={{ marginTop: '16px', width: '100%', justifyContent: 'center', gap: '8px' }}>
            <LogIn size={20} /> Access Dashboard
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-glass)' }}>
          <button 
            type="button"
            onClick={fillDemoCredentials}
            className="flex items-center"
            style={{ 
              width: '100%', justifyContent: 'center', gap: '8px',
              padding: '12px', background: 'transparent', 
              border: '1px solid var(--border-glass)', borderRadius: '8px',
              color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {role === 'owner' ? <ShieldAlert size={16} /> : role === 'inspector' ? <ClipboardCheck size={16} /> : <ShieldCheck size={16} />}
            Load Demo Credentials for {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
