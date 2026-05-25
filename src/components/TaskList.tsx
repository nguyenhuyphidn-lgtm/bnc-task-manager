import React, { useState } from 'react';
import { Task, Project, User } from '../types';
import { List, Kanban, Search, Plus, Calendar, User as UserIcon, AlertCircle, AlertTriangle, ArrowUpDown, Trash2 } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  currentUser: User | null;
  onSelectTask: (task: Task) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  filterProject: string;
  onFilterProjectChange: (projectId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  projects,
  users,
  currentUser,
  onSelectTask,
  onAddTask,
  onUpdateTask,
  filterProject,
  onFilterProjectChange
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'overdue' | 'neardue'>('all');
  
  // Sort state
  const [sortBy, setSortBy] = useState<keyof Task>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form show state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProjId, setNewProjId] = useState('');
  const [newAssignee, setNewAssignee] = useState('Huy Phi');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'Cao' | 'Trung bình' | 'Thấp'>('Trung bình');
  const [newDesc, setNewDesc] = useState('');

  const today = new Date("2026-05-21"); // Mock date

  // Permissions check
  const isViewer = currentUser?.role === 'viewer';
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Toggle sort
  const handleSort = (field: keyof Task) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Drag and drop handlers for Kanban
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (isViewer) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) {
      const oldStatus = task.status;
      const updated: Task = {
        ...task,
        status: targetStatus as any,
        progress: targetStatus === 'Hoàn thành' ? 100 : (targetStatus === 'Chưa thực hiện' ? 0 : task.progress),
        updatedAt: new Date().toISOString()
      };
      
      updated.history.push({
        date: new Date().toISOString(),
        user: currentUser?.name || 'Ẩn danh',
        action: 'Kéo thả Kanban',
        details: `Trạng thái: ${oldStatus} ➔ ${targetStatus}`
      });

      onUpdateTask(updated);
    }
  };

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    // Search term
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (task.notes && task.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          task.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Project filter
    const matchesProject = !filterProject || task.projectId === filterProject;
    
    // Assignee filter
    const matchesAssignee = !filterAssignee || task.assignee === filterAssignee;
    
    // Status filter
    const matchesStatus = !filterStatus || task.status === filterStatus;
    
    // Priority filter
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    
    // Quick filters (overdue, neardue)
    let matchesQuick = true;
    if (quickFilter === 'overdue') {
      if (task.status === 'Hoàn thành' || task.status === 'Tạm dừng' || task.status === 'Hủy bỏ' || !task.dueDate) {
        matchesQuick = false;
      } else {
        matchesQuick = new Date(task.dueDate) < today;
      }
    } else if (quickFilter === 'neardue') {
      if (task.status === 'Hoàn thành' || task.status === 'Tạm dừng' || task.status === 'Hủy bỏ' || !task.dueDate) {
        matchesQuick = false;
      } else {
        const due = new Date(task.dueDate);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        matchesQuick = diffDays >= 0 && diffDays <= 3;
      }
    }

    return matchesSearch && matchesProject && matchesAssignee && matchesStatus && matchesPriority && matchesQuick;
  });

  // Sort logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (valA === null || valA === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (valB === null || valB === undefined) return sortOrder === 'asc' ? 1 : -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }

    return sortOrder === 'asc' 
      ? (valA > valB ? 1 : -1) 
      : (valA < valB ? 1 : -1);
  });

  // Form submit handler
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Find next task id code
    const ids = tasks.map(t => {
      const match = t.id.match(/CV-2026-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const newIdCode = `CV-2026-${(maxId + 1).toString().padStart(3, '0')}`;

    const matchedProj = projects.find(p => p.id === newProjId);

    const newTask: Task = {
      id: newIdCode,
      projectId: newProjId,
      projectName: matchedProj ? matchedProj.name : '',
      type: 'project',
      parentTaskId: null,
      name: newTitle.trim(),
      description: newDesc.trim(),
      assignee: newAssignee,
      collaborators: [],
      startDate: "2026-05-21",
      dueDate: newDueDate || null,
      status: 'Chưa thực hiện',
      progress: 0,
      priority: newPriority,
      notes: '',
      createdBy: currentUser?.email || 'nguyenhuyphidn@gmail.com',
      updatedAt: new Date().toISOString(),
      checklist: [],
      history: [{
        date: new Date().toISOString(),
        user: currentUser?.name || 'Huy Phi',
        action: 'Tạo công việc mới',
        details: `Thiết lập ban đầu qua biểu mẫu`
      }]
    };

    onAddTask(newTask);

    // Reset fields
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setNewProjId('');
    setShowAddForm(false);
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

  const getDueDateColor = (task: Task) => {
    if (task.status === 'Hoàn thành' || !task.dueDate) return 'inherit';
    const due = new Date(task.dueDate);
    if (due < today) return 'var(--color-danger)';
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff <= 3) return 'var(--color-warning)';
    return 'inherit';
  };

  // Kanban columns mapping
  const kanbanColumns = [
    { id: 'Chưa thực hiện', title: 'Chưa thực hiện', color: 'var(--color-todo)' },
    { id: 'Đang thực hiện', title: 'Đang thực hiện', color: 'var(--color-info)' },
    { id: 'Chờ phản hồi', title: 'Chờ phản hồi', color: 'var(--color-warning)' },
    { id: 'Chờ phê duyệt', title: 'Chờ phê duyệt', color: 'var(--color-pending)' },
    { id: 'Hoàn thành', title: 'Hoàn thành', color: 'var(--color-success)' },
    { id: 'Tạm dừng', title: 'Tạm dừng', color: 'var(--color-paused)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top action view toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
            style={{ padding: '8px 16px' }}
          >
            <List size={16} /> Danh Sách
          </button>
          <button 
            className={`btn ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('kanban')}
            style={{ padding: '8px 16px' }}
          >
            <Kanban size={16} /> Bảng Kanban
          </button>
        </div>

        {!isViewer && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)} style={{ padding: '8px 16px' }}>
            <Plus size={16} /> Thêm Việc Mới
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="filter-bar">
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Tìm kiếm</label>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control search-input"
              placeholder="Tên việc, ghi chú, mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Dự án</label>
          <select className="form-control" value={filterProject} onChange={(e) => onFilterProjectChange(e.target.value)}>
            <option value="">Tất cả dự án</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Người phụ trách</label>
          <select className="form-control" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
            <option value="">Tất cả</option>
            {users.map(u => (
              <option key={u.email} value={u.name}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Trạng thái</label>
          <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="Chưa thực hiện">Chưa thực hiện</option>
            <option value="Đang thực hiện">Đang thực hiện</option>
            <option value="Chờ phản hồi">Chờ phản hồi</option>
            <option value="Chờ phê duyệt">Chờ phê duyệt</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Tạm dừng">Tạm dừng</option>
            <option value="Quá hạn">Quá hạn</option>
            <option value="Hủy bỏ">Hủy bỏ</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Ưu tiên</label>
          <select className="form-control" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="Cao">Cao</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Thấp">Thấp</option>
          </select>
        </div>
      </div>

      {/* Quick Filters tab bar */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          className={`tab-btn ${quickFilter === 'all' ? 'active' : ''}`}
          onClick={() => setQuickFilter('all')}
        >
          Tất cả ({tasks.length})
        </button>
        <button 
          className={`tab-btn ${quickFilter === 'overdue' ? 'active' : ''}`}
          style={{ borderLeft: '3px solid var(--color-danger)' }}
          onClick={() => setQuickFilter('overdue')}
        >
          Quá hạn ({
            tasks.filter(t => t.status !== 'Hoàn thành' && t.status !== 'Tạm dừng' && t.status !== 'Hủy bỏ' && t.dueDate && new Date(t.dueDate) < today).length
          })
        </button>
        <button 
          className={`tab-btn ${quickFilter === 'neardue' ? 'active' : ''}`}
          style={{ borderLeft: '3px solid var(--color-warning)' }}
          onClick={() => setQuickFilter('neardue')}
        >
          Sắp đến hạn ({
            tasks.filter(t => {
              if (t.status === 'Hoàn thành' || t.status === 'Tạm dừng' || t.status === 'Hủy bỏ' || !t.dueDate) return false;
              const due = new Date(t.dueDate);
              const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return diffDays >= 0 && diffDays <= 3;
            }).length
          })
        </button>
      </div>

      {/* RENDER VIEW: LIST MODE */}
      {viewMode === 'list' ? (
        <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
                  <th style={{ padding: '16px 20px', width: '60px', minWidth: '60px' }}>
                    TT
                  </th>
                  <th style={{ padding: '16px 20px', cursor: 'pointer', minWidth: '350px' }} onClick={() => handleSort('name')}>
                    Tên công việc <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                  </th>
                  <th style={{ padding: '16px 20px', minWidth: '200px' }}>Dự án / Phân nhóm</th>
                  <th style={{ padding: '16px 20px', cursor: 'pointer', minWidth: '170px' }} onClick={() => handleSort('assignee')}>
                    Người thực hiện <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                  </th>
                  <th style={{ padding: '16px 20px', cursor: 'pointer', minWidth: '140px' }} onClick={() => handleSort('dueDate')}>
                    Thời hạn <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                  </th>
                  <th style={{ padding: '16px 20px', cursor: 'pointer', minWidth: '160px' }} onClick={() => handleSort('status')}>
                    Trạng thái <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                  </th>
                  <th style={{ padding: '16px 20px', minWidth: '120px' }}>Ưu tiên</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Không có công việc nào khớp với bộ lọc của bạn.
                    </td>
                  </tr>
                ) : (
                  sortedTasks.map((task, index) => (
                    <tr 
                      key={task.id} 
                      onClick={() => onSelectTask(task)}
                      style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-muted)', width: '60px' }}>{index + 1}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 500, color: 'var(--text-primary)', minWidth: '350px', wordBreak: 'break-word' }}>
                        {task.name}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                        {task.projectId === 'project-management' || task.type === 'management' ? `💼 ${task.projectName || 'CÔNG TÁC QUẢN LÝ'}` : `🏗️ ${task.projectName}`}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge badge-assignee"><UserIcon size={12} /> {task.assignee}</span>
                      </td>
                      <td style={{ padding: '14px 20px', color: getDueDateColor(task), fontWeight: task.dueDate ? 600 : 'normal' }}>
                        {task.dueDate ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} /> {task.dueDate}
                          </div>
                        ) : '---'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge ${
                          task.priority === 'Cao' ? 'badge-priority-high' : 
                          task.priority === 'Trung bình' ? 'badge-priority-medium' : 'badge-priority-low'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* RENDER VIEW: KANBAN MODE */
        <div className="kanban-board">
          {kanbanColumns.map(col => {
            const columnTasks = sortedTasks.filter(t => t.status === col.id);
            return (
              <div 
                key={col.id} 
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="kanban-column-header">
                  <span className="kanban-column-title">
                    <span className="legend-dot" style={{ backgroundColor: col.color }} />
                    {col.title}
                  </span>
                  <span className="tree-node-badge">{columnTasks.length}</span>
                </div>

                <div className="kanban-task-list">
                  {columnTasks.length === 0 ? (
                    <div style={{ 
                      flex: 1, 
                      border: '2px dashed var(--border-color)', 
                      borderRadius: 'var(--border-radius-sm)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '24px', 
                      fontSize: '0.8rem', 
                      color: 'var(--text-muted)',
                      textAlign: 'center'
                    }}>
                      Kéo thả thẻ vào đây
                    </div>
                  ) : (
                    columnTasks.map(task => (
                      <div 
                        key={task.id}
                        className="kanban-card"
                        draggable={!isViewer}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onSelectTask(task)}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{task.id}</span>
                        <span className="kanban-card-title">{task.name}</span>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.projectId === 'project-management' || task.type === 'management' ? `💼 ${task.projectName || 'CÔNG TÁC QUẢN LÝ'}` : `🏗️ ${task.projectName}`}
                          </span>
                        </div>

                        <div className="kanban-card-meta">
                          <span className="badge badge-assignee" style={{ padding: '2px 4px', fontSize: '0.7rem' }}>
                            <UserIcon size={10} /> {task.assignee}
                          </span>
                          
                          {task.dueDate && (
                            <span style={{ color: getDueDateColor(task), fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem' }}>
                              <Calendar size={10} /> {task.dueDate.split('-').slice(1).join('/') /* Short date */}
                            </span>
                          )}
                        </div>

                        {/* Progress line */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${task.progress}%`, backgroundColor: 'var(--primary)' }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{task.progress}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP FORM: CREATE TASK */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>Tạo Mới Công Việc</h3>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên đầu việc cụ thể *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập nội dung công việc..."
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Thuộc dự án/công trình *</label>
                  <select
                    className="form-control"
                    required
                    value={newProjId}
                    onChange={(e) => setNewProjId(e.target.value)}
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Người chịu trách nhiệm chính</label>
                  <select
                    className="form-control"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                  >
                    {users.map(u => (
                      <option key={u.email} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hạn hoàn thành (Deadline)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mức độ ưu tiên</label>
                  <select
                    className="form-control"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                  >
                    <option value="Thấp">Thấp</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Cao">Cao</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả thêm</label>
                  <textarea
                    className="form-control"
                    placeholder="Mô tả chi tiết yêu cầu..."
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
