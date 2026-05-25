import React, { useState, useEffect } from 'react';
import { Task, Project, User } from './types';
import { 
  getProjects, saveProject, deleteProject,
  getTasks, saveTask, deleteTask,
  getUsers, saveUser, deleteUser,
  getCurrentUser, setCurrentUser as setStorageCurrentUser,
  getSavedTheme
} from './services/storage';

import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { TaskDetailModal } from './components/TaskDetailModal';
import { Reports } from './components/Reports';
import { UserManagement } from './components/UserManagement';
import { Settings } from './components/Settings';

import { 
  LayoutDashboard, CheckSquare, 
  BarChart3, Users2, Settings as SettingsIcon, LogOut,
  User as UserIcon, Cloud, CloudOff, Loader2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import { getFirebaseConfig } from './services/storage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'reports' | 'users' | 'settings'>('dashboard');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<string>('');

  // Synchronize state with URL search query params
  const navigateTo = (tab: typeof activeTab, projectId: string = '', replace = false) => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    if (projectId) {
      params.set('project', projectId);
    } else {
      params.delete('project');
    }
    const newSearch = params.toString() ? `?${params.toString()}` : '';
    const newUrl = `${window.location.pathname}${newSearch}`;

    if (replace) {
      window.history.replaceState({ tab, projectId }, '', newUrl);
    } else {
      if (window.location.search !== newSearch) {
        window.history.pushState({ tab, projectId }, '', newUrl);
      }
    }
    setActiveTab(tab);
    setFilterProjectId(projectId);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = (params.get('tab') || 'dashboard') as typeof activeTab;
      const projectId = params.get('project') || '';
      
      const validTabs: Array<typeof activeTab> = ['dashboard', 'tasks', 'reports', 'users', 'settings'];
      const targetTab = validTabs.includes(tab) ? tab : 'dashboard';
      
      setActiveTab(targetTab);
      setFilterProjectId(projectId);
    };

    // Parse initial URL query params on mount
    const params = new URLSearchParams(window.location.search);
    const tab = (params.get('tab') || 'dashboard') as typeof activeTab;
    const projectId = params.get('project') || '';
    const validTabs: Array<typeof activeTab> = ['dashboard', 'tasks', 'reports', 'users', 'settings'];
    const targetTab = validTabs.includes(tab) ? tab : 'dashboard';

    setActiveTab(targetTab);
    setFilterProjectId(projectId);
    
    // Initialize history state with current params
    const initParams = new URLSearchParams();
    initParams.set('tab', targetTab);
    if (projectId) {
      initParams.set('project', projectId);
    }
    const newUrl = `${window.location.pathname}?${initParams.toString()}`;
    window.history.replaceState({ tab: targetTab, projectId }, '', newUrl);

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Apply Theme on load
  useEffect(() => {
    const savedTheme = getSavedTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Check Firebase Connection State
  useEffect(() => {
    const config = getFirebaseConfig();
    setIsFirebaseConnected(!!config);
  }, []);

  // Fetch Database
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const fetchedProjects = await getProjects();
      const fetchedTasks = await getTasks();
      const fetchedUsers = await getUsers();
      
      setProjects(fetchedProjects);
      setTasks(fetchedTasks);
      setUsers(fetchedUsers);
      
      const activeUser = getCurrentUser();
      if (activeUser) {
        // Double check they still exist in current user list
        const exists = fetchedUsers.find(u => u.email.toLowerCase() === activeUser.email.toLowerCase());
        setCurrentUser(exists || activeUser);
      }
    } catch (e) {
      console.error("Error loading database", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleLogin = (user: User) => {
    setStorageCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setStorageCurrentUser(null);
    setCurrentUser(null);
    navigateTo('dashboard', '', true);
  };

  // --- CRUD CALLBACKS ---
  const handleSaveTask = async (task: Task) => {
    await saveTask(task);
    await fetchAllData();
    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    await fetchAllData();
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const handleSaveProject = async (project: Project) => {
    await saveProject(project);
    await fetchAllData();
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    await fetchAllData();
  };

  const handleSaveUser = async (user: User) => {
    await saveUser(user);
    await fetchAllData();
  };

  const handleDeleteUser = async (email: string) => {
    await deleteUser(email);
    await fetchAllData();
  };

  // --- SETTINGS OPERATIONS ---
  const handleResetData = async () => {
    localStorage.removeItem('bnc_projects');
    localStorage.removeItem('bnc_tasks');
    localStorage.removeItem('bnc_users');
    localStorage.removeItem('bnc_firebase_config');
    localStorage.removeItem('bnc_current_user');
  };

  const handleForceSync = async () => {
    const config = getFirebaseConfig();
    if (!config) return;
    
    try {
      const firebaseApp = initializeApp(config);
      const db = getFirestore(firebaseApp);
      const batch = writeBatch(db);
      
      const localProjects = JSON.parse(localStorage.getItem('bnc_projects') || '[]');
      const localTasks = JSON.parse(localStorage.getItem('bnc_tasks') || '[]');
      const localUsers = JSON.parse(localStorage.getItem('bnc_users') || '[]');
      
      localProjects.forEach((p: any) => {
        batch.set(doc(db, 'projects', p.id), p);
      });
      
      localTasks.forEach((t: any) => {
        batch.set(doc(db, 'tasks', t.id), t);
      });
      
      localUsers.forEach((u: any) => {
        batch.set(doc(db, 'users', u.email.replace(/\./g, '_')), u);
      });
      
      await batch.commit();
      await fetchAllData();
    } catch (e) {
      console.error("Force sync failed", e);
      throw e;
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        gap: '16px'
      }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: '1rem', fontWeight: 500 }}>Đang tải cơ sở dữ liệu BNC...</span>
      </div>
    );
  }

  // Auth Guard
  if (!currentUser) {
    return <Login users={users.length > 0 ? users : []} onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar no-print">
        {/* Brand Logo */}
        <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '24px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '1rem'
          }}>B</div>
          <div>
            <h1 style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.05em' }}>BAN HẠ TẦNG</h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sun World Ba Na Hills</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-menu">
          <button 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Trang tổng quan</span>
          </button>
          

          <button 
            className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => navigateTo('tasks')}
          >
            <CheckSquare size={18} />
            <span>Danh sách công việc</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => navigateTo('reports')}
          >
            <BarChart3 size={18} />
            <span>Báo cáo & In ấn</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => navigateTo('users')}
          >
            <Users2 size={18} />
            <span>Nhân sự & Vai trò</span>
          </button>

          <div style={{ margin: 'auto 0 0 0', height: '1px', backgroundColor: 'var(--border-color)', marginBottom: '10px' }} />

          <button 
            className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => navigateTo('settings')}
          >
            <SettingsIcon size={18} />
            <span>Cài đặt hệ thống</span>
          </button>
        </nav>

        {/* User Card footer */}
        <div className="user-profile-card" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-glow)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserIcon size={16} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '110px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {currentUser.name.split(' (')[0]}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {currentUser.role === 'manager' ? 'Lãnh đạo' : currentUser.role === 'admin' ? 'Quản trị' : currentUser.role === 'assignee' ? 'Nhân viên' : 'Xem báo cáo'}
              </span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-danger)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {/* Top bar header */}
        <header className="top-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Cơ sở dữ liệu:</span>
            <span className={`badge ${isFirebaseConnected ? 'badge-status-success' : 'badge-status-paused'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.75rem' }}>
              {isFirebaseConnected ? <Cloud size={10} /> : <CloudOff size={10} />}
              {isFirebaseConnected ? 'Cloud Firebase' : 'LocalStorage Offline'}
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Phiên làm việc: <strong>{currentUser.email}</strong>
          </div>
        </header>

        {/* Tab switcher renderer */}
        <div className="page-container">
          {activeTab === 'dashboard' && (
            <Dashboard 
              tasks={tasks} 
              projects={projects} 
              users={users} 
              currentUser={currentUser}
              onSelectTask={setSelectedTask} 
              onSelectProject={(projectId) => {
                navigateTo('tasks', projectId);
              }}
              onAddProject={handleSaveProject}
            />
          )}


          {activeTab === 'tasks' && (
            <TaskList 
              tasks={tasks} 
              projects={projects} 
              users={users} 
              currentUser={currentUser}
              onSelectTask={setSelectedTask}
              onAddTask={handleSaveTask}
              onUpdateTask={handleSaveTask}
              filterProject={filterProjectId}
              onFilterProjectChange={(projectId) => {
                setFilterProjectId(projectId);
                const params = new URLSearchParams(window.location.search);
                if (projectId) {
                  params.set('project', projectId);
                } else {
                  params.delete('project');
                }
                const newUrl = `${window.location.pathname}?${params.toString()}`;
                window.history.replaceState({ tab: 'tasks', projectId }, '', newUrl);
              }}
            />
          )}

          {activeTab === 'reports' && (
            <Reports 
              tasks={tasks} 
              projects={projects} 
              users={users} 
              currentUser={currentUser} 
            />
          )}

          {activeTab === 'users' && (
            <UserManagement 
              users={users} 
              currentUser={currentUser}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'settings' && (
            <Settings 
              onResetData={handleResetData}
              onForceSync={handleForceSync}
            />
          )}
        </div>
      </main>

      {/* Shared Task Detail modal */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          projects={projects}
          users={users}
          currentUser={currentUser}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default App;
