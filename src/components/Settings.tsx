import React, { useState, useEffect } from 'react';
import { FirebaseConfig } from '../types';
import { getFirebaseConfig, saveFirebaseConfig, getSavedTheme, saveTheme } from '../services/storage';
import { Settings as SettingsIcon, Cloud, CloudOff, Sun, Moon, Database, RotateCcw, Upload, Download, RefreshCw } from 'lucide-react';

interface SettingsProps {
  onResetData: () => Promise<void>;
  onForceSync: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ onResetData, onForceSync }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isFirebaseOnline, setIsFirebaseOnline] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load configuration on mount
  useEffect(() => {
    const activeTheme = getSavedTheme();
    setTheme(activeTheme);

    const config = getFirebaseConfig();
    if (config) {
      setApiKey(config.apiKey || '');
      setAuthDomain(config.authDomain || '');
      setProjectId(config.projectId || '');
      setStorageBucket(config.storageBucket || '');
      setMessagingSenderId(config.messagingSenderId || '');
      setAppId(config.appId || '');
      setIsFirebaseOnline(true);
    } else {
      setIsFirebaseOnline(false);
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  const handleSaveFirebase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setSyncMessage('');
    setErrorMessage('');

    if (!apiKey || !projectId) {
      setErrorMessage('API Key và Project ID là bắt buộc để kết nối Firestore.');
      setIsSavingConfig(false);
      return;
    }

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    try {
      const success = saveFirebaseConfig(config);
      if (success) {
        setIsFirebaseOnline(true);
        setSyncMessage('Đã kết nối cơ sở dữ liệu Cloud Firebase Firestore thành công! Hệ thống đang ở chế độ Online.');
        // Trigger page reload after 1.5 seconds to restart services with new connection
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error("Init fail");
      }
    } catch (err) {
      setErrorMessage('Kết nối Firebase thất bại. Vui lòng kiểm tra lại các thông số cấu hình.');
      setIsFirebaseOnline(false);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDisconnectFirebase = () => {
    if (window.confirm("Bạn có chắc chắn muốn ngắt kết nối với Cloud Firebase? Hệ thống sẽ quay về chế độ Offline/LocalStorage.")) {
      saveFirebaseConfig(null);
      setIsFirebaseOnline(false);
      setApiKey('');
      setAuthDomain('');
      setProjectId('');
      setStorageBucket('');
      setMessagingSenderId('');
      setAppId('');
      setSyncMessage('Đã chuyển hệ thống sang chế độ Offline/LocalStorage.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleReset = async () => {
    if (window.confirm("CẢNH BÁO: Thao tác này sẽ xóa toàn bộ các thay đổi hiện có và tải lại dữ liệu gốc (25 dự án, 58 công việc) từ file Excel ban đầu. Bạn có chắc chắn muốn tiếp tục không?")) {
      try {
        await onResetData();
        setSyncMessage('Đã đặt lại dữ liệu gốc thành công!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (e) {
        setErrorMessage('Không thể đặt lại dữ liệu.');
      }
    }
  };

  const handleSyncCloud = async () => {
    setSyncMessage('Đang đồng bộ dữ liệu cục bộ lên Cloud...');
    try {
      await onForceSync();
      setSyncMessage('Đã hoàn thành đồng bộ cơ sở dữ liệu hai chiều!');
    } catch (e) {
      setErrorMessage('Đồng bộ thất bại. Vui lòng kiểm tra kết nối mạng hoặc cấu hình Firebase.');
    }
  };

  const handleBackupLocal = () => {
    const backupData = {
      projects: JSON.parse(localStorage.getItem('bnc_projects') || '[]'),
      tasks: JSON.parse(localStorage.getItem('bnc_tasks') || '[]'),
      users: JSON.parse(localStorage.getItem('bnc_users') || '[]')
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `BNC_CVIEC_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.projects && parsed.tasks) {
            localStorage.setItem('bnc_projects', JSON.stringify(parsed.projects));
            localStorage.setItem('bnc_tasks', JSON.stringify(parsed.tasks));
            if (parsed.users) {
              localStorage.setItem('bnc_users', JSON.stringify(parsed.users));
            }
            setSyncMessage('Khôi phục dữ liệu sao lưu thành công! Đang tải lại trang...');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            setErrorMessage('Tập tin sao lưu không đúng định dạng chuẩn.');
          }
        } catch (err) {
          setErrorMessage('Không thể đọc file JSON này.');
        }
      };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-heading)' }}>Cấu hình & Thiết lập</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Thiết lập giao diện, cấu hình Cloud Firebase và quản trị sao lưu phục hồi dữ liệu.
        </p>
      </div>

      {syncMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--color-success)', fontSize: '0.9rem' }}>
          {syncMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--border-radius-sm)', color: 'var(--color-danger)', fontSize: '0.9rem' }}>
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
        
        {/* Left Column: Visual settings & Database operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Theme card */}
          <div className="panel-card">
            <h3 className="panel-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
              Chủ đề giao diện
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                onClick={() => handleThemeChange('light')}
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
              >
                <Sun size={18} /> Giao diện Sáng
              </button>
              <button 
                onClick={() => handleThemeChange('dark')}
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
              >
                <Moon size={18} /> Giao diện Tối
              </button>
            </div>
          </div>

          {/* Local DB operations card */}
          <div className="panel-card">
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
              <Database size={18} /> Cơ sở dữ liệu Cục bộ
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handleBackupLocal} 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%' }}
              >
                <Download size={16} /> Sao lưu dữ liệu (.JSON)
              </button>

              <label 
                className="btn btn-secondary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%', cursor: 'pointer', margin: 0 }}
              >
                <Upload size={16} /> Phục hồi dữ liệu (.JSON)
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleRestoreLocal} 
                  style={{ display: 'none' }} 
                />
              </label>

              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />

              <button 
                onClick={handleReset} 
                className="btn" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-border)' }}
              >
                <RotateCcw size={16} /> Đặt lại dữ liệu Excel gốc
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Firebase configuration panel */}
        <div className="panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={18} /> Cấu hình Cloud Firebase Firestore
            </h3>
            <span className={`badge ${isFirebaseOnline ? 'badge-status-success' : 'badge-status-paused'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {isFirebaseOnline ? <Cloud size={12} /> : <CloudOff size={12} />}
              {isFirebaseOnline ? 'Online' : 'Offline Mode'}
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            BNC TaskManager mặc định chạy trên bộ nhớ trình duyệt **LocalStorage (Offline Mode)**, giúp ứng dụng sẵn sàng chạy lập tức mà không cần mây. 
            Để cộng tác nhiều người dùng, đồng bộ tiến độ thời gian thực qua điện thoại và PC, hãy nhập thông số Project Firebase Firestore của bạn bên dưới:
          </p>

          <form onSubmit={handleSaveFirebase} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Project ID *</label>
                <input 
                  type="text" 
                  value={projectId} 
                  onChange={(e) => setProjectId(e.target.value)} 
                  placeholder="bnc-task-manager"
                  style={{ padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>API Key *</label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  placeholder="AIzaSyA..."
                  style={{ padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Auth Domain</label>
                <input 
                  type="text" 
                  value={authDomain} 
                  onChange={(e) => setAuthDomain(e.target.value)} 
                  placeholder="bnc-task-manager.firebaseapp.com"
                  style={{ padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Storage Bucket</label>
                <input 
                  type="text" 
                  value={storageBucket} 
                  onChange={(e) => setStorageBucket(e.target.value)} 
                  placeholder="bnc-task-manager.appspot.com"
                  style={{ padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Messaging Sender ID</label>
                <input 
                  type="text" 
                  value={messagingSenderId} 
                  onChange={(e) => setMessagingSenderId(e.target.value)} 
                  placeholder="829104812391"
                  style={{ padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>App ID</label>
                <input 
                  type="text" 
                  value={appId} 
                  onChange={(e) => setAppId(e.target.value)} 
                  placeholder="1:829104812391:web:12abc8f321"
                  style={{ padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                disabled={isSavingConfig}
              >
                {isSavingConfig ? 'Đang lưu...' : 'Lưu cấu hình & Chuyển mây'}
              </button>

              {isFirebaseOnline && (
                <>
                  <button 
                    type="button" 
                    onClick={handleSyncCloud} 
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <RefreshCw size={16} /> Đồng bộ dữ liệu
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={handleDisconnectFirebase} 
                    className="btn" 
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                  >
                    Ngắt kết nối
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
