import React, { useState } from 'react';
import { Task, Project, User } from '../types';
import { FileSpreadsheet, Printer, Presentation, ChevronLeft, ChevronRight, X, Calendar, Filter, Users, Briefcase } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportsProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  currentUser: User | null;
}

export const Reports: React.FC<ReportsProps> = ({ tasks, projects, users, currentUser }) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [reportType, setReportType] = useState<'weekly' | 'project' | 'assignee'>('weekly');
  const [slideshowActive, setSlideshowActive] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const today = new Date("2026-05-21"); // System Mock Date

  // Filters logic
  const filteredTasks = tasks.filter(t => {
    if (selectedProject !== 'all' && t.projectId !== selectedProject) return false;
    if (selectedAssignee !== 'all' && t.assignee !== selectedAssignee) return false;
    return true;
  });

  // 1. Weekly Report Logic
  // Weekly reports typically cover tasks updated or due within a +/- 7 day window
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  const oneWeekAhead = new Date(today);
  oneWeekAhead.setDate(today.getDate() + 7);

  const completedThisWeek = filteredTasks.filter(t => {
    if (t.status !== 'Hoàn thành') return false;
    const updateDate = new Date(t.updatedAt || t.startDate);
    return updateDate >= oneWeekAgo && updateDate <= today;
  });

  const inProgressThisWeek = filteredTasks.filter(t => {
    return t.status === 'Đang thực hiện' || t.status === 'Chờ phản hồi' || t.status === 'Chờ phê duyệt';
  });

  const overdueThisWeek = filteredTasks.filter(t => {
    if (t.status === 'Hoàn thành' || t.status === 'Tạm dừng' || t.status === 'Hủy bỏ' || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due < today;
  });

  // 2. Project Report Logic
  const projectStats = projects.map(p => {
    const projTasks = tasks.filter(t => t.projectId === p.id);
    const total = projTasks.length;
    const completed = projTasks.filter(t => t.status === 'Hoàn thành').length;
    const progress = total > 0 ? Math.round(projTasks.reduce((sum, t) => sum + t.progress, 0) / total) : 0;
    const overdue = projTasks.filter(t => {
      if (t.status === 'Hoàn thành' || t.status === 'Tạm dừng' || t.status === 'Hủy bỏ' || !t.dueDate) return false;
      return new Date(t.dueDate) < today;
    }).length;

    return {
      ...p,
      total,
      completed,
      progress,
      overdue
    };
  });

  // 3. Assignee Report Logic
  const assigneeStats = users.map(u => {
    const userTasks = tasks.filter(t => t.assignee === u.name);
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.status === 'Hoàn thành').length;
    const inProgress = userTasks.filter(t => t.status === 'Đang thực hiện').length;
    const pending = userTasks.filter(t => t.status === 'Chờ phản hồi' || t.status === 'Chờ phê duyệt').length;
    const overdue = userTasks.filter(t => {
      if (t.status === 'Hoàn thành' || t.status === 'Tạm dừng' || t.status === 'Hủy bỏ' || !t.dueDate) return false;
      return new Date(t.dueDate) < today;
    }).length;

    return {
      name: u.name,
      role: u.role,
      email: u.email,
      total,
      completed,
      inProgress,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }).filter(stat => stat.total > 0);

  // --- EXPORT TO EXCEL ---
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Danh sách công việc hiện tại
    const taskRows = filteredTasks.map((t, idx) => ({
      'STT': idx + 1,
      'Mã CV': t.id,
      'Tên công việc': t.name,
      'Dự án/Công trình': t.projectName || '',
      'Người thực hiện': t.assignee,
      'Ngày bắt đầu': t.startDate,
      'Hạn hoàn thành': t.dueDate || 'Không hạn',
      'Trạng thái': t.status,
      'Tiến độ (%)': t.progress,
      'Độ ưu tiên': t.priority,
      'Mô tả': t.description,
      'Ghi chú': t.notes
    }));
    const wsTasks = XLSX.utils.json_to_sheet(taskRows);
    XLSX.utils.book_append_sheet(wb, wsTasks, "Danh sách công việc");

    // Sheet 2: Thống kê Dự án
    const projRows = projectStats.map((p, idx) => ({
      'STT': idx + 1,
      'Mã DA': p.code,
      'Tên dự án': p.name,
      'Phân loại': p.category,
      'Người phụ trách': p.manager,
      'Trạng thái': p.status,
      'Tổng số việc': p.total,
      'Đã hoàn thành': p.completed,
      'Tiến độ trung bình (%)': p.progress,
      'Số việc quá hạn': p.overdue
    }));
    const wsProj = XLSX.utils.json_to_sheet(projRows);
    XLSX.utils.book_append_sheet(wb, wsProj, "Báo cáo Dự án");

    // Sheet 3: Thống kê Nhân sự
    const userRows = assigneeStats.map((u, idx) => ({
      'STT': idx + 1,
      'Họ và tên': u.name,
      'Email': u.email,
      'Tổng số việc được giao': u.total,
      'Đã hoàn thành': u.completed,
      'Đang thực hiện': u.inProgress,
      'Chờ phê duyệt/phản hồi': u.pending,
      'Đã quá hạn': u.overdue,
      'Tỷ lệ hoàn thành (%)': u.completionRate
    }));
    const wsUsers = XLSX.utils.json_to_sheet(userRows);
    XLSX.utils.book_append_sheet(wb, wsUsers, "Hiệu suất Nhân sự");

    // Save File
    XLSX.writeFile(wb, `BNC_Bao_Cao_Cong_Viec_${today.toISOString().split('T')[0]}.xlsx`);
  };

  // --- PRINT TRIGGER ---
  const handlePrint = () => {
    window.print();
  };

  // --- SLIDESHOW GENERATOR ---
  // Create slides based on:
  // Slide 0: General Overview
  // Slide 1: Critical Overdue Tasks
  // Slide 2..N: Individual Project Overview (only for projects with active tasks)
  const slideshowProjects = projectStats.filter(p => p.total > 0).slice(0, 10); // Limit to top 10 projects to keep it manageable
  const totalSlides = 2 + slideshowProjects.length;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const renderSlideshowContent = () => {
    if (currentSlide === 0) {
      // General overview slide
      const completed = tasks.filter(t => t.status === 'Hoàn thành').length;
      const progress = tasks.filter(t => t.status === 'Đang thực hiện').length;
      const pending = tasks.filter(t => t.status === 'Chờ phản hồi' || t.status === 'Chờ phê duyệt').length;
      const overdue = tasks.filter(t => {
        if (t.status === 'Hoàn thành' || t.status === 'Tạm dừng' || t.status === 'Hủy bỏ' || !t.dueDate) return false;
        return new Date(t.dueDate) < today;
      }).length;

      const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

      return (
        <div className="slide-content">
          <span className="slide-subtitle">BÁO CÁO GIAO BAN BAN KỸ THUẬT HẠ TẦNG (BNC)</span>
          <h2 className="slide-title">TỔNG QUAN HỆ THỐNG CÔNG VIỆC</h2>
          <div className="slide-date"><Calendar size={16} /> Ngày báo cáo: 21/05/2026</div>

          <div className="slide-stats-grid">
            <div className="slide-stat-card" style={{ borderColor: 'var(--primary)' }}>
              <span className="slide-stat-num">{tasks.length}</span>
              <span className="slide-stat-label">Tổng Công Việc</span>
            </div>
            <div className="slide-stat-card" style={{ borderColor: 'var(--color-success)' }}>
              <span className="slide-stat-num" style={{ color: 'var(--color-success)' }}>{completed}</span>
              <span className="slide-stat-label">Đã Hoàn Thành ({completionRate}%)</span>
            </div>
            <div className="slide-stat-card" style={{ borderColor: 'var(--color-info)' }}>
              <span className="slide-stat-num" style={{ color: 'var(--color-info)' }}>{progress}</span>
              <span className="slide-stat-label">Đang Triển Khai</span>
            </div>
            <div className="slide-stat-card" style={{ borderColor: 'var(--color-danger)' }}>
              <span className="slide-stat-num" style={{ color: 'var(--color-danger)' }}>{overdue}</span>
              <span className="slide-stat-label">Đã Quá Hạn Cần Xử Lý</span>
            </div>
          </div>

          <div className="slide-footer-text">
            * Hệ thống đang giám sát {projects.length} dự án & mảng công việc.
          </div>
        </div>
      );
    }

    if (currentSlide === 1) {
      // Overdue tasks slide
      const overdueList = tasks.filter(t => {
        if (t.status === 'Hoàn thành' || t.status === 'Tạm dừng' || t.status === 'Hủy bỏ' || !t.dueDate) return false;
        return new Date(t.dueDate) < today;
      }).slice(0, 6); // Limit to top 6 to prevent layout break

      return (
        <div className="slide-content">
          <span className="slide-subtitle">DANH SÁCH KHẨN CẤP</span>
          <h2 className="slide-title" style={{ color: 'var(--color-danger)' }}>CÁC CÔNG VIỆC QUÁ HẠN CẦN GIẢI QUYẾT NGAY</h2>
          <div className="slide-date"><Calendar size={16} /> Yêu cầu rà soát và cập nhật tiến độ</div>

          {overdueList.length === 0 ? (
            <div className="slide-empty-state">
              Không có công việc quá hạn trên hệ thống. Trạng thái vận hành xuất sắc!
            </div>
          ) : (
            <table className="slide-table">
              <thead>
                <tr>
                  <th>Tên Công Việc</th>
                  <th>Dự án</th>
                  <th>Phụ trách</th>
                  <th>Hạn chót</th>
                  <th>Tiến độ</th>
                </tr>
              </thead>
              <tbody>
                {overdueList.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</td>
                    <td>{t.projectName || ''}</td>
                    <td style={{ fontWeight: 600 }}>{t.assignee}</td>
                    <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{t.dueDate}</td>
                    <td>
                      <span className="slide-table-badge" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                        {t.progress}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    // Projects slides (currentSlide - 2)
    const projIndex = currentSlide - 2;
    const proj = slideshowProjects[projIndex];
    const projTasks = tasks.filter(t => t.projectId === proj.id).slice(0, 5); // top 5 tasks

    return (
      <div className="slide-content">
        <span className="slide-subtitle">CHI TIẾT DỰ ÁN ({proj.code})</span>
        <h2 className="slide-title">{proj.name}</h2>
        <div className="slide-project-meta">
          <span><strong>Phân loại:</strong> {proj.category}</span>
          <span><strong>Quản lý:</strong> {proj.manager}</span>
          <span><strong>Trạng thái:</strong> {proj.status}</span>
          <span>
            <strong>Tiến độ:</strong> 
            <span style={{ marginLeft: '6px', color: 'var(--primary)', fontWeight: 700 }}>{proj.progress}%</span>
          </span>
        </div>

        <h3 style={{ fontSize: '1.2rem', margin: '20px 0 10px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
          Tình hình thực hiện công việc ({proj.completed}/{proj.total} hoàn thành)
        </h3>

        {projTasks.length === 0 ? (
          <div className="slide-empty-state">
            Không có công việc trực thuộc dự án này.
          </div>
        ) : (
          <table className="slide-table">
            <thead>
              <tr>
                <th>Nhiệm vụ</th>
                <th>Người thực hiện</th>
                <th>Thời hạn</th>
                <th>Trạng thái</th>
                <th>Tiến độ</th>
              </tr>
            </thead>
            <tbody>
              {projTasks.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.name}</td>
                  <td style={{ fontWeight: 600 }}>{t.assignee}</td>
                  <td>{t.dueDate || 'Không hạn'}</td>
                  <td>
                    <span className={`badge ${
                      t.status === 'Hoàn thành' ? 'badge-status-success' : 
                      t.status === 'Đang thực hiện' ? 'badge-status-progress' : 
                      t.status === 'Quá hạn' ? 'badge-status-danger' : 'badge-status-paused'
                    }`} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{t.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className="reports-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header and Action Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)' }}>Báo cáo & Xuất dữ liệu</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Tổng hợp dữ liệu, báo cáo tuần và chuẩn bị nội dung họp giao ban định kỳ.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }} className="no-print">
          <button onClick={handleExportExcel} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={16} /> Xuất Excel
          </button>
          <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={16} /> In Báo Cáo / PDF
          </button>
          <button onClick={() => { setSlideshowActive(true); setCurrentSlide(0); }} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Presentation size={16} /> Trình Chiếu Giao Ban
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="panel-card no-print" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <Filter size={16} /> Bộ lọc báo cáo:
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Dự án/Công trình</label>
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{ padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <option value="all">Tất cả dự án ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Nhân sự phụ trách</label>
            <select 
              value={selectedAssignee} 
              onChange={(e) => setSelectedAssignee(e.target.value)}
              style={{ padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <option value="all">Tất cả nhân sự ({users.length})</option>
              {users.map(u => (
                <option key={u.email} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="report-tabs" style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden' }}>
          <button 
            className={`tab-btn ${reportType === 'weekly' ? 'active' : ''}`}
            onClick={() => setReportType('weekly')}
            style={{ padding: '8px 16px', border: 'none', background: reportType === 'weekly' ? 'var(--primary)' : 'transparent', color: reportType === 'weekly' ? '#fff' : 'inherit', cursor: 'pointer', fontWeight: 500 }}
          >
            Báo cáo Tuần
          </button>
          <button 
            className={`tab-btn ${reportType === 'project' ? 'active' : ''}`}
            onClick={() => setReportType('project')}
            style={{ padding: '8px 16px', border: 'none', background: reportType === 'project' ? 'var(--primary)' : 'transparent', color: reportType === 'project' ? '#fff' : 'inherit', cursor: 'pointer', fontWeight: 500 }}
          >
            Tiến độ Dự án
          </button>
          <button 
            className={`tab-btn ${reportType === 'assignee' ? 'active' : ''}`}
            onClick={() => setReportType('assignee')}
            style={{ padding: '8px 16px', border: 'none', background: reportType === 'assignee' ? 'var(--primary)' : 'transparent', color: reportType === 'assignee' ? '#fff' : 'inherit', cursor: 'pointer', fontWeight: 500 }}
          >
            Hiệu suất Nhân viên
          </button>
        </div>
      </div>

      {/* Report Render Content */}
      <div className="print-area">
        {/* Print Header (hidden on web, visible on print) */}
        <div className="print-header-only" style={{ display: 'none', marginBottom: '30px', borderBottom: '2px solid var(--text-primary)', paddingBottom: '10px' }}>
          <h2 style={{ textTransform: 'uppercase', fontSize: '1.4rem' }}>Cộng hòa xã hội chủ nghĩa Việt Nam</h2>
          <h3 style={{ textTransform: 'uppercase', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Ban Kỹ thuật Hạ tầng - Sun World Ba Na Hills</h3>
          <h1 style={{ marginTop: '20px', textAlign: 'center', fontSize: '1.8rem' }}>
            {reportType === 'weekly' ? 'BÁO CÁO CÔNG VIỆC TUẦN' : reportType === 'project' ? 'BÁO CÁO TIẾN ĐỘ DỰ ÁN & CÔNG TRÌNH' : 'BÁO CÁO HIỆU SUẤT NHÂN SỰ'}
          </h1>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', fontStyle: 'italic' }}>Ngày xuất bản: 21 tháng 05 năm 2026</p>
        </div>

        {reportType === 'weekly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Summary widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="panel-card" style={{ borderLeft: '4px solid var(--color-success)', padding: '16px' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Hoàn thành trong tuần</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', color: 'var(--color-success)' }}>{completedThisWeek.length}</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Công việc đã đóng hồ sơ</p>
              </div>
              <div className="panel-card" style={{ borderLeft: '4px solid var(--color-info)', padding: '16px' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Đang triển khai</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', color: 'var(--color-info)' }}>{inProgressThisWeek.length}</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Công việc đang vận hành</p>
              </div>
              <div className="panel-card" style={{ borderLeft: '4px solid var(--color-danger)', padding: '16px' }}>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Đang trễ hạn</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0', color: 'var(--color-danger)' }}>{overdueThisWeek.length}</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cần đôn đốc khẩn cấp</p>
              </div>
            </div>

            {/* List 1: Hoàn thành trong tuần */}
            <div className="panel-card">
              <h3 className="panel-title" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
                ✓ ĐÃ HOÀN THÀNH TRONG TUẦN ({completedThisWeek.length})
              </h3>
              {completedThisWeek.length === 0 ? (
                <p style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>Không ghi nhận công việc hoàn thành mới.</p>
              ) : (
                <table className="list-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Mã CV</th>
                      <th>Tên Công Việc</th>
                      <th>Dự án/Công trình</th>
                      <th>Người thực hiện</th>
                      <th>Thời hạn</th>
                      <th>Ghi chú báo cáo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedThisWeek.map(t => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.projectName || ''}</td>
                        <td style={{ fontWeight: 500 }}>{t.assignee}</td>
                        <td>{t.dueDate || 'Không hạn'}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.notes || 'Đã kiểm tra & xác nhận hoàn tất.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* List 2: Đang triển khai */}
            <div className="panel-card">
              <h3 className="panel-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
                ⚡ CÁC CÔNG VIỆC ĐANG TRIỂN KHAI ({inProgressThisWeek.length})
              </h3>
              {inProgressThisWeek.length === 0 ? (
                <p style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>Không có công việc đang triển khai nào trùng khớp.</p>
              ) : (
                <table className="list-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Mã</th>
                      <th>Tên Công Việc</th>
                      <th>Dự án</th>
                      <th>Người thực hiện</th>
                      <th>Thời hạn</th>
                      <th>Tiến độ</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inProgressThisWeek.map(t => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.projectName || ''}</td>
                        <td style={{ fontWeight: 500 }}>{t.assignee}</td>
                        <td>{t.dueDate || 'Không hạn'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.progress}%</td>
                        <td>
                          <span className={`badge ${
                            t.status === 'Đang thực hiện' ? 'badge-status-progress' : 'badge-status-pending'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {reportType === 'project' && (
          <div className="panel-card">
            <h3 className="panel-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
              <Briefcase size={18} /> TỔNG HỢP TIẾN ĐỘ DỰ ÁN & CÔNG TRÌNH ({projects.length})
            </h3>
            <table className="list-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Mã dự án</th>
                  <th>Tên Dự Án/Công Trình</th>
                  <th>Phân loại</th>
                  <th>Người phụ trách</th>
                  <th style={{ textAlign: 'center' }}>Số việc con</th>
                  <th style={{ textAlign: 'center' }}>Việc trễ hạn</th>
                  <th>Tiến độ trung bình</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {projectStats.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.code}</td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.manager}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.total}</td>
                    <td style={{ textAlign: 'center', color: p.overdue > 0 ? 'var(--color-danger)' : 'inherit', fontWeight: p.overdue > 0 ? 700 : 'normal' }}>
                      {p.overdue}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${p.progress}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                        </div>
                        <span style={{ fontWeight: 700 }}>{p.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === 'Hoàn thành' ? 'badge-status-success' : 
                        p.status === 'Đang triển khai' ? 'badge-status-progress' : 'badge-status-paused'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'assignee' && (
          <div className="panel-card">
            <h3 className="panel-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
              <Users size={18} /> PHÂN TÍCH HIỆU SUẤT NHÂN SỰ BAN HẠ TẦNG ({assigneeStats.length})
            </h3>
            <table className="list-table">
              <thead>
                <tr>
                  <th>Họ và Tên Nhân Sự</th>
                  <th>Vai trò</th>
                  <th style={{ textAlign: 'center' }}>Tổng việc giao</th>
                  <th style={{ textAlign: 'center', color: 'var(--color-success)' }}>Hoàn thành</th>
                  <th style={{ textAlign: 'center', color: 'var(--color-info)' }}>Đang làm</th>
                  <th style={{ textAlign: 'center', color: 'var(--color-pending)' }}>Chờ duyệt</th>
                  <th style={{ textAlign: 'center', color: 'var(--color-danger)' }}>Quá hạn</th>
                  <th>Tỷ lệ hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {assigneeStats.map(u => (
                  <tr key={u.email}>
                    <td style={{ fontWeight: 700 }}>{u.name}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'manager' ? 'badge-status-progress' : 
                        u.role === 'admin' ? 'badge-status-success' : 'badge-status-todo'
                      }`}>
                        {u.role === 'manager' ? 'Lãnh đạo' : u.role === 'admin' ? 'Quản trị' : 'Nhân sự thực hiện'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{u.total}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-success)' }}>{u.completed}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-info)' }}>{u.inProgress}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-pending)' }}>{u.pending}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-danger)' }}>{u.overdue}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${u.completionRate}%`, height: '100%', backgroundColor: u.completionRate > 75 ? 'var(--color-success)' : 'var(--primary)' }} />
                        </div>
                        <span style={{ fontWeight: 700 }}>{u.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fullscreen Meeting Slideshow Modal */}
      {slideshowActive && (
        <div className="slideshow-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'var(--bg-primary)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          boxSizing: 'border-box'
        }}>
          {/* Header Controls */}
          <div className="slideshow-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '20px',
            marginBottom: '40px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-status-progress" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Chế độ Trình chiếu</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Dùng nút mũi tên hoặc click để chuyển trang</span>
            </div>
            <button 
              onClick={() => setSlideshowActive(false)} 
              style={{
                background: 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'var(--transition-smooth)'
              }}
              title="Thoát trình chiếu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Slide Panel */}
          <div className="slide-panel-container" style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {renderSlideshowContent()}
          </div>

          {/* Navigation Bar */}
          <div className="slideshow-navigation" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '20px',
            marginTop: '40px'
          }}>
            <button 
              onClick={prevSlide} 
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1rem' }}
            >
              <ChevronLeft size={20} /> Trang trước
            </button>

            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Slide {currentSlide + 1} / {totalSlides}
            </span>

            <button 
              onClick={nextSlide} 
              className="btn btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1rem' }}
            >
              Trang sau <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
