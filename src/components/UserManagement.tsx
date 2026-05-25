import React, { useState } from 'react';
import { User } from '../types';
import { UserPlus, Trash2, Shield, Mail, UserCheck, AlertTriangle } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  currentUser: User | null;
  onSaveUser: (user: User) => Promise<void>;
  onDeleteUser: (email: string) => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'assignee' | 'viewer'>('assignee');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check permission: Only Admin or Manager can modify users
  const canModify = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !name) {
      setError('Vui lòng điền đầy đủ thông tin Email và Họ tên.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Định dạng email không hợp lệ.');
      return;
    }

    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      setError('Email này đã tồn tại trên hệ thống.');
      return;
    }

    try {
      await onSaveUser({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role
      });
      setEmail('');
      setName('');
      setRole('assignee');
      setSuccess('Thêm nhân sự mới thành công!');
    } catch (err) {
      setError('Có lỗi xảy ra khi lưu nhân sự.');
    }
  };

  const handleRoleChange = async (user: User, newRole: typeof role) => {
    if (!canModify) return;
    try {
      await onSaveUser({
        ...user,
        role: newRole
      });
      setSuccess(`Đã cập nhật vai trò của ${user.name} thành ${newRole}`);
    } catch (err) {
      setError('Không thể cập nhật vai trò.');
    }
  };

  const handleDelete = async (emailToDelete: string) => {
    if (!canModify) return;
    if (emailToDelete === currentUser?.email) {
      setError('Bạn không thể tự xóa tài khoản của chính mình.');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân sự có email ${emailToDelete} khỏi hệ thống không?`)) {
      try {
        await onDeleteUser(emailToDelete);
        setSuccess('Đã xóa nhân sự khỏi hệ thống.');
      } catch (err) {
        setError('Có lỗi xảy ra khi xóa nhân sự.');
      }
    }
  };

  const translateRole = (r: User['role']) => {
    switch (r) {
      case 'admin': return { label: 'Quản trị viên', badge: 'badge-status-success' };
      case 'manager': return { label: 'Quản lý (Lãnh đạo)', badge: 'badge-status-progress' };
      case 'assignee': return { label: 'Nhân sự thực hiện', badge: 'badge-status-todo' };
      case 'viewer': return { label: 'Người xem báo cáo', badge: 'badge-status-paused' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)' }}>Quản lý Nhân sự & Phân quyền</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Cấp quyền và quản lý tài khoản email truy cập website Ban Kỹ thuật Hạ tầng BNC.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--color-danger)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--color-success)', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: canModify ? '1.2fr 2fr' : '1fr', gap: '24px' }}>
        
        {/* Left Column: Form User Creation */}
        {canModify && (
          <div className="panel-card" style={{ height: 'fit-content' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
              <UserPlus size={18} /> Thêm nhân sự mới
            </h3>

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Địa chỉ Email (Gmail)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nguyenhuyphidn@gmail.com"
                    style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Họ và tên nhân sự</label>
                <div style={{ position: 'relative' }}>
                  <UserCheck size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Huy Phi"
                    style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Phân quyền / Vai trò</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <option value="assignee">Nhân sự thực hiện (Assignee)</option>
                  <option value="manager">Quản lý (Manager - Lãnh đạo)</option>
                  <option value="admin">Quản trị hệ thống (Admin)</option>
                  <option value="viewer">Chỉ xem báo cáo (Viewer)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                Thêm nhân sự
              </button>
            </form>
          </div>
        )}

        {/* Right Column: User list & roles editor */}
        <div className="panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} /> Danh sách nhân sự ({users.length})
            </h3>
            {!canModify && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> Chỉ đọc
              </span>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="list-table">
              <thead>
                <tr>
                  <th>Nhân sự</th>
                  <th>Gmail</th>
                  <th>Vai trò</th>
                  {canModify && <th style={{ textAlign: 'center', width: '80px' }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const roleInfo = translateRole(u.role);
                  return (
                    <tr key={u.email}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</span>
                          {u.email === currentUser?.email && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>(Tài khoản của bạn)</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        {canModify && u.email !== currentUser?.email ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value as any)}
                            style={{ padding: '4px 8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '0.85rem' }}
                          >
                            <option value="assignee">Nhân sự thực hiện</option>
                            <option value="manager">Quản lý (Lãnh đạo)</option>
                            <option value="admin">Quản trị viên</option>
                            <option value="viewer">Chỉ xem báo cáo</option>
                          </select>
                        ) : (
                          <span className={`badge ${roleInfo?.badge}`}>
                            {roleInfo?.label}
                          </span>
                        )}
                      </td>
                      {canModify && (
                        <td style={{ textAlign: 'center' }}>
                          {u.email !== currentUser?.email ? (
                            <button
                              onClick={() => handleDelete(u.email)}
                              style={{ border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', padding: '6px', borderRadius: 'var(--border-radius-sm)', display: 'inline-flex', alignItems: 'center' }}
                              title="Xóa nhân sự"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Khóa</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
