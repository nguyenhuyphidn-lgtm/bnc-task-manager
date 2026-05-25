import React, { useState } from 'react';
import { Task, Project, User } from '../types';
import { CheckCircle2, AlertTriangle, AlertOctagon, ListTodo, Briefcase, Users, ArrowUpRight, Plus } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  currentUser: User | null;
  onSelectTask: (task: Task) => void;
  onSelectProject?: (projectId: string) => void;
  onAddProject?: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, 
  projects, 
  users, 
  currentUser,
  onSelectTask, 
  onSelectProject,
  onAddProject
}) => {
  // Project modal creation form state
  const [showAddProjModal, setShowAddProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjCat, setNewProjCat] = useState<'Cáp treo' | 'F&B' | 'Hạ tầng' | 'Cải tạo' | 'Năng lượng' | 'Môi trường' | 'Quản lý'>('Hạ tầng');
  const [newProjMgr, setNewProjMgr] = useState('Huy Phi');
  const [newProjStatus, setNewProjStatus] = useState<'Chưa triển khai' | 'Đang triển khai' | 'Hoàn thành' | 'Tạm dừng'>('Đang triển khai');
  const [newProjNotes, setNewProjNotes] = useState('');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !onAddProject) return;

    // Generate code if empty
    const code = newProjCode.trim() || `DA-${(projects.length + 1).toString().padStart(2, '0')}`;
    const newProj: Project = {
      id: `project-${Date.now()}`,
      name: newProjName.trim().toUpperCase(),
      code: code,
      category: newProjCat,
      manager: newProjMgr,
      status: newProjStatus,
      notes: newProjNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAddProject(newProj);

    // Reset fields
    setNewProjName('');
    setNewProjCode('');
    setNewProjNotes('');
    setShowAddProjModal(false);
  };

  // Stat calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Hoàn thành').length;
  const inProgressTasks = tasks.filter(t => t.status === 'Đang thực hiện').length;
  const todoTasks = tasks.filter(t => t.status === 'Chưa thực hiện').length;
  
  // Calculate Overdue and Near Due (within 3 days)
  const today = new Date("2026-05-21"); // Current mock date as requested by requirements
  
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'Hoàn thành' || t.status === 'Tạm dừng' || t.status === 'Hủy bỏ' || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due < today;
  });

  const nearDueTasks = tasks.filter(t => {
    if (t.status === 'Hoàn thành' || t.status === 'Tạm dừng' || t.status === 'Hủy bỏ' || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  });

  // Calculate completion percentage
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Assignee task counts
  const assigneeStats = users.map(user => {
    const userTasks = tasks.filter(t => t.assignee === user.name);
    const completed = userTasks.filter(t => t.status === 'Hoàn thành').length;
    return {
      name: user.name,
      total: userTasks.length,
      completed: completed,
      progress: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0
    };
  }).filter(stat => stat.total > 0) // Only show people with tasks
    .sort((a, b) => b.total - a.total);

  // Project progress calculations
  const projectStats = projects.map(p => {
    const projTasks = tasks.filter(t => t.projectId === p.id);
    const total = projTasks.length;
    const completed = projTasks.filter(t => t.status === 'Hoàn thành').length;
    
    // Average progress of tasks
    const avgProgress = total > 0 
      ? Math.round(projTasks.reduce((acc, curr) => acc + curr.progress, 0) / total) 
      : 0;

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      total: total,
      completed: completed,
      progress: avgProgress,
      status: p.status
    };
  }).sort((a, b) => b.progress - a.progress);

  // Dynamic SVG circle math
  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Projects Progress panel */}
      <div className="panel-card">
        <div className="panel-title-wrapper">
          <h3 className="panel-title"><Briefcase size={18} /> Tiến Độ Dự Án & Công Trình</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tổng số: {projects.length} dự án</span>
            {currentUser?.role !== 'viewer' && (
              <button 
                className="btn btn-primary" 
                onClick={() => setShowAddProjModal(true)} 
                style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Thêm dự án
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', paddingRight: '6px' }}>
          {projectStats.map(stat => (
            <div 
              key={stat.id} 
              className="dashboard-project-card"
              onClick={() => onSelectProject && onSelectProject(stat.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{stat.code}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {stat.name}
                  </span>
                </div>
                <span className={`badge ${
                  stat.status === 'Hoàn thành' ? 'badge-status-success' : 
                  stat.status === 'Đang triển khai' ? 'badge-status-progress' : 'badge-status-paused'
                }`}>
                  {stat.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Tiến độ tổng thể:</span>
                <span style={{ fontWeight: 600 }}>{stat.progress}% ({stat.completed}/{stat.total} việc con)</span>
              </div>

              <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${stat.progress}%`, 
                  backgroundColor: 'var(--primary)',
                  borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Counters Grid */}
      <div className="dashboard-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-header">
            <span className="stat-title">Tổng công việc</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
              <ListTodo size={20} />
            </div>
          </div>
          <span className="stat-value">{totalTasks}</span>
          <span className="stat-footer">Đang được theo dõi trên hệ thống</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div className="stat-header">
            <span className="stat-title">Đã hoàn thành</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <span className="stat-value">{completedTasks}</span>
          <span className="stat-footer">Tỷ lệ hoàn thành: {completionRate}%</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div className="stat-header">
            <span className="stat-title">Sắp đến hạn (≤ 3 ngày)</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <span className="stat-value">{nearDueTasks.length}</span>
          <span className="stat-footer">Cần tập trung xử lý sớm</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div className="stat-header">
            <span className="stat-title">Đã quá hạn</span>
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
              <AlertOctagon size={20} />
            </div>
          </div>
          <span className="stat-value" style={{ color: 'var(--color-danger)' }}>{overdueTasks.length}</span>
          <span className="stat-footer" style={{ color: overdueTasks.length > 0 ? 'var(--color-danger)' : 'inherit' }}>
            {overdueTasks.length > 0 ? 'Yêu cầu cập nhật tiến độ gấp' : 'Không có công việc trễ hạn'}
          </span>
        </div>
      </div>

      {/* Double Column Charts Section */}
      <div className="dashboard-charts-layout">
        {/* Left Side: SVG Chart + Assignee stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="panel-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', alignItems: 'center' }}>
            {/* SVG Circle chart */}
            <div className="chart-container">
              <svg width="180" height="180" className="svg-donut">
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke="var(--bg-tertiary)"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="transparent"
                  stroke="var(--primary)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="svg-donut-segment"
                />
              </svg>
              <div className="donut-label">
                <span className="donut-label-value">{completionRate}%</span>
                <span className="donut-label-text">Hoàn thành</span>
              </div>
            </div>

            {/* Quick breakdown legends */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>Tiến Độ Dự Án</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Tỷ lệ hoàn thành công việc chung của Ban Hạ tầng đạt <strong>{completionRate}%</strong>.
              </p>
              <div className="chart-legends">
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: 'var(--color-success)' }} />
                  <span>Hoàn thành ({completedTasks})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: 'var(--color-info)' }} />
                  <span>Đang làm ({inProgressTasks})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: 'var(--color-todo)' }} />
                  <span>Chưa làm ({todoTasks})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: 'var(--color-danger)' }} />
                  <span>Quá hạn ({overdueTasks.length})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignee distribution */}
          <div className="panel-card">
            <div className="panel-title-wrapper">
              <h3 className="panel-title"><Users size={18} /> Phân Bổ Công Việc Theo Nhân Sự</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {assigneeStats.map(stat => (
                <div key={stat.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{stat.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <strong>{stat.completed}</strong>/{stat.total} việc ({stat.progress}% hoàn thành)
                    </span>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${stat.progress}%`, 
                      backgroundColor: stat.progress > 75 ? 'var(--color-success)' : stat.progress > 40 ? 'var(--primary)' : 'var(--color-warning)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease-in-out'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Urgent / Near due tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="panel-card" style={{ flex: 1 }}>
            <div className="panel-title-wrapper">
              <h3 className="panel-title" style={{ color: 'var(--color-danger)' }}><AlertOctagon size={18} /> Công Việc Khẩn Cấp</h3>
            </div>

            <div className="urgent-list" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {overdueTasks.length === 0 && nearDueTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  Không có công việc khẩn cấp. Mọi thứ đang diễn ra đúng kế hoạch!
                </div>
              ) : (
                <>
                  {overdueTasks.map(task => (
                    <div key={task.id} className="urgent-item" onClick={() => onSelectTask(task)} style={{ cursor: 'pointer' }}>
                      <div className="urgent-info">
                        <span className="urgent-name">{task.name}</span>
                        <div className="urgent-meta">
                          <span>{task.projectName || ''}</span>
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Quá hạn: {task.dueDate}</span>
                        </div>
                      </div>
                      <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ))}
                  
                  {nearDueTasks.map(task => (
                    <div key={task.id} className="urgent-item warning" onClick={() => onSelectTask(task)} style={{ cursor: 'pointer' }}>
                      <div className="urgent-info">
                        <span className="urgent-name">{task.name}</span>
                        <div className="urgent-meta">
                          <span>{task.projectName || ''}</span>
                          <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Hạn: {task.dueDate}</span>
                        </div>
                      </div>
                      <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* FULL MODAL: CREATE PROJECT */}
      {showAddProjModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Tạo Dự Án Mới</h3>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên dự án/công trình *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập tên dự án cụ thể..."
                    required
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mã dự án (Không bắt buộc)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: DA-IDP, DA-MT3, ..."
                    value={newProjCode}
                    onChange={(e) => setNewProjCode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nhóm dự án</label>
                  <select
                    className="form-control"
                    value={newProjCat}
                    onChange={(e) => setNewProjCat(e.target.value as any)}
                  >
                    <option value="Hạ tầng">Hạ tầng</option>
                    <option value="Cáp treo">Cáp treo</option>
                    <option value="F&B">F&B</option>
                    <option value="Cải tạo">Cải tạo</option>
                    <option value="Năng lượng">Năng lượng</option>
                    <option value="Môi trường">Môi trường</option>
                    <option value="Quản lý">Quản lý</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Người phụ trách chính</label>
                  <select
                    className="form-control"
                    value={newProjMgr}
                    onChange={(e) => setNewProjMgr(e.target.value)}
                  >
                    {users.map(u => (
                      <option key={u.email} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Trạng thái triển khai</label>
                  <select
                    className="form-control"
                    value={newProjStatus}
                    onChange={(e) => setNewProjStatus(e.target.value as any)}
                  >
                    <option value="Chưa triển khai">Chưa triển khai</option>
                    <option value="Đang triển khai">Đang triển khai</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú dự án</label>
                  <textarea
                    className="form-control"
                    placeholder="Mô tả tóm tắt dự án..."
                    rows={2}
                    value={newProjNotes}
                    onChange={(e) => setNewProjNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProjModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo dự án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
