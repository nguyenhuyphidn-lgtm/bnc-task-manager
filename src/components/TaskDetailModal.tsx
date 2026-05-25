import React, { useState, useEffect } from 'react';
import { Task, Project, User, ChecklistItem, HistoryItem } from '../types';
import { X, Plus, Trash2, CheckSquare, Square, Calendar, User as UserIcon, AlertCircle, Clock, FileText } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  projects: Project[];
  users: User[];
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  projects,
  users,
  currentUser,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (task) {
      setEditedTask(JSON.parse(JSON.stringify(task))); // Deep clone
    } else {
      setEditedTask(null);
    }
  }, [task, isOpen]);

  if (!isOpen || !editedTask) return null;

  // Enforce Permissions
  const isViewer = currentUser?.role === 'viewer';
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const isAssignee = editedTask.assignee === currentUser?.name || currentUser?.role === 'assignee';

  // Can edit everything? (Admin/Manager)
  const canEditAllFields = isAdminOrManager;
  // Can edit progress/status/checklist? (Admin/Manager/Assignee)
  const canUpdateProgress = isAdminOrManager || isAssignee;

  const handleFieldChange = (field: keyof Task, value: any) => {
    if (!editedTask) return;

    // Log history of changes if important fields change
    const oldVal = editedTask[field];
    let actionDetail = '';

    if (field === 'status' && oldVal !== value) {
      actionDetail = `Trạng thái: ${oldVal} ➔ ${value}`;
    } else if (field === 'progress' && oldVal !== value) {
      actionDetail = `Tiến độ: ${oldVal}% ➔ ${value}%`;
    } else if (field === 'assignee' && oldVal !== value) {
      actionDetail = `Người phụ trách: ${oldVal || 'Không có'} ➔ ${value}`;
    } else if (field === 'dueDate' && oldVal !== value) {
      actionDetail = `Hạn hoàn thành: ${oldVal || 'Không có'} ➔ ${value || 'Không có'}`;
    }

    const updated = {
      ...editedTask,
      [field]: value,
      updatedAt: new Date().toISOString()
    };

    if (actionDetail) {
      updated.history.push({
        date: new Date().toISOString(),
        user: currentUser?.name || 'Ẩn danh',
        action: 'Cập nhật thông tin',
        details: actionDetail
      });
    }

    setEditedTask(updated);
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim() || !editedTask) return;

    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newChecklistItem.trim(),
      isDone: false
    };

    const updatedChecklist = [...editedTask.checklist, newItem];
    
    // Automatically recalculate progress if checklist changes (optional suggestion)
    let updatedProgress = editedTask.progress;
    if (updatedChecklist.length > 0) {
      const completedCount = updatedChecklist.filter(item => item.isDone).length;
      updatedProgress = Math.round((completedCount / updatedChecklist.length) * 100);
    }

    const updated = {
      ...editedTask,
      checklist: updatedChecklist,
      progress: updatedProgress,
      updatedAt: new Date().toISOString()
    };

    updated.history.push({
      date: new Date().toISOString(),
      user: currentUser?.name || 'Ẩn danh',
      action: 'Thêm mục checklist',
      details: `Thêm: "${newItem.text}"`
    });

    setEditedTask(updated);
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (id: string) => {
    if (!editedTask) return;

    const updatedChecklist = editedTask.checklist.map(item => {
      if (item.id === id) {
        return { ...item, isDone: !item.isDone };
      }
      return item;
    });

    // Suggest new progress based on checklist
    const completedCount = updatedChecklist.filter(item => item.isDone).length;
    const updatedProgress = Math.round((completedCount / updatedChecklist.length) * 100);

    const targetItem = editedTask.checklist.find(item => item.id === id);
    const actionText = targetItem?.isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành';

    const updated = {
      ...editedTask,
      checklist: updatedChecklist,
      progress: updatedProgress,
      updatedAt: new Date().toISOString()
    };

    updated.history.push({
      date: new Date().toISOString(),
      user: currentUser?.name || 'Ẩn danh',
      action: actionText,
      details: `Mục: "${targetItem?.text}"`
    });

    setEditedTask(updated);
  };

  const handleDeleteChecklistItem = (id: string) => {
    if (!editedTask) return;

    const targetItem = editedTask.checklist.find(item => item.id === id);
    const updatedChecklist = editedTask.checklist.filter(item => item.id !== id);
    
    let updatedProgress = editedTask.progress;
    if (updatedChecklist.length > 0) {
      const completedCount = updatedChecklist.filter(item => item.isDone).length;
      updatedProgress = Math.round((completedCount / updatedChecklist.length) * 100);
    }

    const updated = {
      ...editedTask,
      checklist: updatedChecklist,
      progress: updatedProgress,
      updatedAt: new Date().toISOString()
    };

    updated.history.push({
      date: new Date().toISOString(),
      user: currentUser?.name || 'Ẩn danh',
      action: 'Xóa mục checklist',
      details: `Xóa: "${targetItem?.text}"`
    });

    setEditedTask(updated);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !editedTask) return;

    const updated = {
      ...editedTask,
      updatedAt: new Date().toISOString()
    };

    updated.history.push({
      date: new Date().toISOString(),
      user: currentUser?.name || 'Ẩn danh',
      action: 'Thêm ghi chú',
      details: newComment.trim()
    });

    // Also append to task general notes for easy tracking
    const currentNotes = editedTask.notes ? editedTask.notes + '\n' : '';
    const dateFormatted = new Date().toLocaleDateString('vi-VN');
    updated.notes = `${currentNotes}[${dateFormatted} - ${currentUser?.name}]: ${newComment.trim()}`;

    setEditedTask(updated);
    setNewComment('');
  };

  const handleSave = () => {
    if (editedTask) {
      onSave(editedTask);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="badge badge-status-todo" style={{ width: 'fit-content' }}>
              {editedTask.id} ({editedTask.projectId === 'project-management' || editedTask.type === 'management' ? 'Quản lý' : 'Dự án'})
            </span>
            <h3 style={{ fontSize: '1.25rem', marginTop: '4px' }}>Chi Tiết Công Việc</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          {/* Main Info Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Tên công việc</label>
              <input
                type="text"
                className="form-control"
                value={editedTask.name}
                disabled={!canEditAllFields}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Thuộc dự án/công trình</label>
              <select
                className="form-control"
                value={editedTask.projectId || ''}
                disabled={!canEditAllFields}
                onChange={(e) => {
                  const p = projects.find(proj => proj.id === e.target.value);
                  if (p) {
                    handleFieldChange('projectId', p.id);
                    handleFieldChange('projectName', p.name);
                    // Automatically normalize type if they move to project-management or other projects
                    if (p.id === 'project-management') {
                      handleFieldChange('type', 'management');
                    } else {
                      handleFieldChange('type', 'project');
                    }
                  }
                }}
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả chi tiết</label>
              <textarea
                className="form-control"
                rows={3}
                value={editedTask.description}
                disabled={!canEditAllFields}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Nhập mô tả chi tiết công việc..."
              />
            </div>

            {/* Checklist Section */}
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckSquare size={16} /> Checklist Công Việc Con
              </h4>
              
              <div className="checklist-container">
                {editedTask.checklist.map((item) => (
                  <div key={item.id} className="checklist-item" style={{ justifyContent: 'space-between' }}>
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: canUpdateProgress ? 'pointer' : 'default', flex: 1 }}
                      onClick={() => canUpdateProgress && toggleChecklistItem(item.id)}
                    >
                      {item.isDone ? (
                        <CheckSquare size={18} className="badge-status-success" style={{ padding: 0, border: 'none', background: 'transparent' }} />
                      ) : (
                        <Square size={18} style={{ color: 'var(--text-muted)' }} />
                      )}
                      <span className={`checklist-text ${item.isDone ? 'completed' : ''}`}>
                        {item.text}
                      </span>
                    </div>
                    {canEditAllFields && (
                      <button 
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                        onClick={() => handleDeleteChecklistItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canUpdateProgress && (
                <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Thêm đầu việc nhỏ..."
                    style={{ flex: 1, padding: '8px 12px' }}
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                    <Plus size={16} />
                  </button>
                </form>
              )}
            </div>

            {/* Note History Comment log */}
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> Ghi Chú & Tình Trạng Xử Lý
              </h4>
              <textarea
                className="form-control"
                rows={4}
                value={editedTask.notes}
                disabled={isViewer}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Nội dung ghi chú, báo cáo khó khăn vướng mắc..."
              />
              
              {canUpdateProgress && (
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Thêm bình luận/cập nhật xử lý nhanh..."
                    style={{ flex: 1, padding: '8px 12px' }}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                    Gửi
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar Info Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-control"
                value={editedTask.status}
                disabled={!canUpdateProgress}
                onChange={(e) => handleFieldChange('status', e.target.value)}
              >
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
              <label className="form-label">Tiến độ: {editedTask.progress}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={editedTask.progress}
                disabled={!canUpdateProgress}
                style={{ width: '100%', cursor: 'pointer' }}
                onChange={(e) => handleFieldChange('progress', parseInt(e.target.value))}
              />
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                {[0, 25, 50, 75, 100].map(p => (
                  <button 
                    key={p} 
                    className="btn btn-secondary" 
                    style={{ padding: '2px 6px', fontSize: '0.75rem', flex: 1 }}
                    disabled={!canUpdateProgress}
                    onClick={() => handleFieldChange('progress', p)}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mức độ ưu tiên</label>
              <select
                className="form-control"
                value={editedTask.priority}
                disabled={!canEditAllFields}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
              >
                <option value="Thấp">Thấp</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Cao">Cao</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Người phụ trách chính</label>
              <select
                className="form-control"
                value={editedTask.assignee}
                disabled={!canEditAllFields}
                onChange={(e) => handleFieldChange('assignee', e.target.value)}
              >
                <option value="">Chưa giao việc</option>
                {users.map(u => (
                  <option key={u.email} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Hạn hoàn thành</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: '100%' }}
                  value={editedTask.dueDate || ''}
                  disabled={!canEditAllFields}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value || null)}
                />
              </div>
            </div>

            {/* Audit Log / History View */}
            <div style={{ marginTop: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Nhật Ký Lịch Sử ({editedTask.history.length})
              </h4>
              
              <div style={{ 
                flex: 1, 
                maxHeight: '200px', 
                overflowY: 'auto', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--border-radius-sm)',
                padding: '10px',
                backgroundColor: 'var(--bg-tertiary)'
              }}>
                <div className="timeline">
                  {editedTask.history.slice().reverse().map((item, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <span style={{ fontWeight: 600 }}>{item.user}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.action}</span>
                        {item.details && (
                          <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                            {item.details}
                          </span>
                        )}
                        <span className="timeline-time">
                          {new Date(item.date).toLocaleDateString('vi-VN')} {new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {canEditAllFields && onDelete && (
            <button 
              className="btn btn-danger" 
              style={{ marginRight: 'auto' }}
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn xóa công việc này không?")) {
                  onDelete(editedTask.id);
                }
              }}
            >
              <Trash2 size={16} /> Xóa việc
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
          {!isViewer && (
            <button className="btn btn-primary" onClick={handleSave}>
              Lưu thay đổi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
