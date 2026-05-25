import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập Email.');
      return;
    }

    const matchedUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      setError('Email không tồn tại trong hệ thống. Hãy thử bằng tính năng Đăng nhập nhanh.');
    }
  };

  const handleQuickLogin = (user: User) => {
    onLogin(user);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 30% 30%, #1e3a60 0%, #061224 100%)',
      color: 'white',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'rgba(12, 30, 54, 0.75)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(16px)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '850px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
        display: 'grid',
        gridTemplateColumns: '1fr 1.1fr',
        gap: '40px'
      }}>
        {/* Left Side: Standard Login Form */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.2rem',
              color: 'white'
            }}>B</div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'white' }}>KỸ THUẬT HẠ TẦNG</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>BNC Task Manager</span>
            </div>
          </div>

          <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', fontWeight: 600 }}>Đăng nhập</h3>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              color: 'var(--color-danger)'
            }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Email tài khoản</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ width: '100%', paddingLeft: '38px', backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'white' }}
                  placeholder="Nhập email của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-control"
                  style={{ width: '100%', paddingLeft: '38px', backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'white' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', width: '100%', marginTop: '8px', color: 'white', fontWeight: 700 }}>
              <LogIn size={18} /> Đăng nhập hệ thống
            </button>
          </form>
        </div>

        {/* Right Side: Quick Login Options */}
        <div style={{
          borderLeft: '1px solid var(--border-color)',
          paddingLeft: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--primary)', fontWeight: 600 }}>Đăng nhập nhanh</h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Lựa chọn tài khoản phù hợp với vai trò của bạn để kiểm tra tính năng hệ thống ngay lập tức:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '6px' }}>
            {users.map((user) => {
              // Color codes for roles
              const { roleLabel, badgeColor, badgeBg } = (() => {
                if (user.role === 'manager') {
                  return { roleLabel: 'Lãnh đạo', badgeColor: 'var(--color-info)', badgeBg: 'var(--color-info-bg)' };
                }
                if (user.role === 'admin') {
                  return { roleLabel: 'Quản trị', badgeColor: 'var(--color-success)', badgeBg: 'var(--color-success-bg)' };
                }
                if (user.role === 'assignee') {
                  return { roleLabel: 'Phụ trách', badgeColor: 'var(--color-warning)', badgeBg: 'var(--color-warning-bg)' };
                }
                return { roleLabel: 'Người xem', badgeColor: 'var(--text-secondary)', badgeBg: 'var(--bg-tertiary)' };
              })();

              return (
                <div
                  key={user.email}
                  onClick={() => handleQuickLogin(user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(6px)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{user.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    color: badgeColor,
                    backgroundColor: badgeBg
                  }}>
                    {roleLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
