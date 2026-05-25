import React, { useState } from 'react';
import { Project, Task, User } from '../types';
import { ChevronRight, ChevronDown, FolderOpen, Folder, Plus, User as UserIcon, Calendar, CheckCircle2, MoreHorizontal, Settings, Briefcase, Trash2 } from 'lucide-react';

interface ProjectTreeProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  currentUser: User | null;
  onAddProject: (project: Project) => void;
  onAddTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const ProjectTree: React.FC<ProjectTreeProps> = ({
  projects,
  tasks,
  users,
  currentUser,
  onAddProject,
  onAddTask,
  onSelectTask,
  onDeleteTask
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'project-management': true, // Keep management project expanded by default
    'project-1': true, // Keep the first project expanded by default
    'project-2': true,
    'project-4': true
  });

  // Project modal creation form state
  const [showAddProjModal, setShowAddProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjCat, setNewProjCat] = useState<'Cáp treo' | 'F&B' | 'Hạ tầng' | 'Cải tạo' | 'Năng lượng' | 'Môi trường' | 'Quản lý'>('Hạ tầng');
  const [newProjMgr, setNewProjMgr] = useState('Huy Phi');
  const [newProjStatus, setNewProjStatus] = useState<'Chưa triển khai' | 'Đang triển khai' | 'Hoàn thành' | 'Tạm dừng'>('Đang triển khai');
  const [newProjNotes, setNewProjNotes] = useState('');

  // Quick Task Creation form state inside tree
  const [quickTaskProjId, setQuickTaskProjId] = useState<string | null>(null);
  const [quickTaskParentId, setQuickTaskParentId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskAssignee, setQuickTaskAssignee] = useState('Huy Phi');

  // Toggle expand node
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isViewer = currentUser?.role === 'viewer';
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Handle create project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

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

  // Handle Quick Task Submit
  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !quickTaskProjId) return;

    // Find next task id code
    const ids = tasks.map(t => {
      const match = t.id.match(/CV-2026-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const newIdCode = `CV-2026-${(maxId + 1).toString().padStart(3, '0')}`;

    const matchedProj = projects.find(p => p.id === quickTaskProjId);

    const newTask: Task = {
      id: newIdCode,
      projectId: quickTaskProjId,
      projectName: matchedProj ? matchedProj.name : '',
      type: 'project',
      parentTaskId: quickTaskParentId, // Can be null (standard task) or another Task ID (subtask)
      name: quickTaskTitle.trim(),
      description: '',
      assignee: quickTaskAssignee,
      collaborators: [],
      startDate: "2026-05-21",
      dueDate: null,
      status: 'Chưa thực hiện',
      progress: 0,
      priority: 'Trung bình',
      notes: '',
      createdBy: currentUser?.email || 'nguyenhuyphidn@gmail.com',
      updatedAt: new Date().toISOString(),
      checklist: [],
      history: [{
        date: new Date().toISOString(),
        user: currentUser?.name || 'Huy Phi',
        action: 'Tạo nhanh từ Sơ đồ cây',
        details: quickTaskParentId ? `Thành công việc con của ${quickTaskParentId}` : 'Thành công việc chính dự án'
      }]
    };

    onAddTask(newTask);

    // Reset quick fields
    setQuickTaskTitle('');
    setQuickTaskProjId(null);
    setQuickTaskParentId(null);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Quá hạn': return 'badge-status-overdue';
      case 'Hoàn thành': return 'badge-status-success';
      case 'Đang thực hiện': return 'badge-status-progress';
      case 'Chờ phản hồi':
      case 'Chờ phê duyệt': return 'badge-status-pending';
      case 'Tạm dừng': return 'badge-status-paused';
      case 'Chưa thực hiện': return 'badge-status-todo';
      default: return 'badge-status-todo';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header and Add Project */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderOpen size={20} /> Cấu Trúc Dự Án Dạng Cây
        </h2>
        {!isViewer && (
          <button className="btn btn-primary" onClick={() => setShowAddProjModal(true)} style={{ padding: '8px 16px' }}>
            <Plus size={16} /> Tạo Dự Án Mới
          </button>
        )}
      </div>

      {/* Tree Grid Wrapper */}
      <div className="tree-container">
        {projects.map(project => {
          // Get all tasks directly under this project
          const projTasks = tasks.filter(t => t.projectId === project.id);
          
          // Separate top-level tasks from subtasks
          // Top level: tasks that have no parentTaskId
          const rootTasks = projTasks.filter(t => !t.parentTaskId);

          const isExpanded = !!expandedNodes[project.id];

          // Calculate average progress for project
          const avgProgress = projTasks.length > 0 
            ? Math.round(projTasks.reduce((acc, curr) => acc + curr.progress, 0) / projTasks.length) 
            : 0;

          return (
            <div key={project.id} className="tree-node">
              {/* Project Node Header */}
              <div 
                className="tree-header" 
                onClick={(e) => toggleExpand(project.id, e)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  backgroundColor: isExpanded ? 'var(--bg-tertiary)' : 'transparent',
                  borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div className={`tree-arrow ${isExpanded ? 'expanded' : ''}`}>
                    <ChevronRight size={18} />
                  </div>
                  
                  {project.id === 'project-management' ? (
                    <Briefcase size={20} style={{ color: 'var(--primary)' }} />
                  ) : isExpanded ? (
                    <FolderOpen size={20} style={{ color: 'var(--primary)' }} />
                  ) : (
                    <Folder size={20} style={{ color: 'var(--text-muted)' }} />
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{project.code} • {project.category}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>{project.name}</span>
                  </div>
                  
                  <span className="tree-node-badge">{projTasks.length} việc</span>
                </div>

                {/* Right side info for project */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tiến độ dự án: <strong>{avgProgress}%</strong></span>
                    <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${avgProgress}%`, backgroundColor: 'var(--primary)' }} />
                    </div>
                  </div>

                  <span className={`badge ${
                    project.status === 'Hoàn thành' ? 'badge-status-success' : 
                    project.status === 'Đang triển khai' ? 'badge-status-progress' : 'badge-status-paused'
                  }`}>
                    {project.status}
                  </span>

                  {!isViewer && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickTaskProjId(project.id);
                        setQuickTaskParentId(null);
                      }}
                    >
                      <Plus size={12} /> Việc con
                    </button>
                  )}
                </div>
              </div>

              {/* Children Nodes (collapsible tasks) */}
              {isExpanded && (
                <div className="tree-children">
                  {projTasks.length === 0 ? (
                    <div style={{ padding: '10px 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Chưa có công việc nào trong dự án này.
                    </div>
                  ) : (
                    rootTasks.map(task => {
                      // Find subtasks of this task
                      const subTasks = projTasks.filter(st => st.parentTaskId === task.id);
                      const isTaskExpanded = !!expandedNodes[task.id];
                      const hasSubtasks = subTasks.length > 0;

                      return (
                        <div key={task.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                          {/* Task Node */}
                          <div 
                            className="task-item-row"
                            onClick={() => onSelectTask(task)}
                          >
                            <div className="task-item-info">
                              {hasSubtasks ? (
                                <div 
                                  className={`tree-arrow ${isTaskExpanded ? 'expanded' : ''}`}
                                  onClick={(e) => toggleExpand(task.id, e)}
                                  style={{ padding: '4px' }}
                                >
                                  <ChevronRight size={16} />
                                </div>
                              ) : (
                                <div style={{ width: '24px' }} />
                              )}
                              
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{task.id}</span>
                                <span className="task-item-title" style={{ fontWeight: hasSubtasks ? 600 : 500 }}>
                                  {task.name}
                                </span>
                              </div>
                            </div>

                            {/* Task metadata */}
                            <div className="task-item-meta">
                              <span className="badge badge-assignee"><UserIcon size={10} /> {task.assignee}</span>
                              
                              {task.dueDate && (
                                <span className="badge badge-status-todo" style={{ display: 'flex', gap: '2px' }}>
                                  <Calendar size={10} /> {task.dueDate}
                                </span>
                              )}

                              <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                                {task.status}
                              </span>

                              <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '40px', textAlign: 'right' }}>
                                {task.progress}%
                              </span>

                              {!isViewer && (
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <button 
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickTaskProjId(project.id);
                                      setQuickTaskParentId(task.id);
                                    }}
                                  >
                                    + Thêm việc con
                                  </button>
                                  <button 
                                    className="btn"
                                    style={{ 
                                      padding: '4px 8px', 
                                      fontSize: '0.75rem', 
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      color: '#ef4444',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      backgroundColor: 'transparent',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                      e.currentTarget.style.borderColor = '#ef4444';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Bạn có chắc chắn muốn xóa công việc "${task.name}" và toàn bộ việc con liên quan?`)) {
                                        onDeleteTask(task.id);
                                      }
                                    }}
                                  >
                                    <Trash2 size={12} />
                                    Xóa
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Subtasks Node (collapsible) */}
                          {hasSubtasks && isTaskExpanded && (
                            <div className="tree-sub-children">
                              {subTasks.map(subtask => (
                                <div 
                                  key={subtask.id} 
                                  className="task-item-row"
                                  onClick={() => onSelectTask(subtask)}
                                  style={{ borderStyle: 'dashed' }}
                                >
                                  <div className="task-item-info">
                                    <div style={{ width: '12px' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{subtask.id} (Con)</span>
                                      <span className="task-item-title" style={{ fontSize: '0.875rem' }}>
                                        {subtask.name}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="task-item-meta">
                                    <span className="badge badge-assignee" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>
                                      <UserIcon size={10} /> {subtask.assignee}
                                    </span>
                                    <span className={`badge ${getStatusBadgeClass(subtask.status)}`} style={{ padding: '2px 6px', fontSize: '0.75rem' }}>
                                      {subtask.status}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, width: '40px', textAlign: 'right' }}>{subtask.progress}%</span>
                                    
                                    {!isViewer && (
                                      <button 
                                        className="btn"
                                        style={{ 
                                          padding: '2px 6px', 
                                          fontSize: '0.7rem', 
                                          borderRadius: '4px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '2px',
                                          color: '#ef4444',
                                          border: '1px solid rgba(239, 68, 68, 0.3)',
                                          backgroundColor: 'transparent',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                          e.currentTarget.style.borderColor = '#ef4444';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm(`Bạn có chắc chắn muốn xóa công việc con "${subtask.name}"?`)) {
                                            onDeleteTask(subtask.id);
                                          }
                                        }}
                                      >
                                        <Trash2 size={10} />
                                        Xóa
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* QUICK ADD TASK FORM INLINE MODAL */}
      {quickTaskProjId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Thêm Nhanh Công Việc {quickTaskParentId ? 'Con' : ''}</h3>
            </div>
            <form onSubmit={handleQuickTaskSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên công việc *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={quickTaskParentId ? "Ví dụ: Lập danh sách, Nghiệm thu..." : "Ví dụ: Điểm bán vé, Đường điện..."}
                    required
                    autoFocus
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Người phụ trách chính</label>
                  <select 
                    className="form-control"
                    value={quickTaskAssignee}
                    onChange={(e) => setQuickTaskAssignee(e.target.value)}
                  >
                    {users.map(u => (
                      <option key={u.email} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setQuickTaskProjId(null); setQuickTaskParentId(null); }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo nhanh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
