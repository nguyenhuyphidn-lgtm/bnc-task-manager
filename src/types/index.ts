export interface Project {
  id: string;
  name: string;
  code: string;
  category: string;
  manager: string;
  status: 'Chưa triển khai' | 'Đang triển khai' | 'Hoàn thành' | 'Tạm dừng';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isDone: boolean;
}

export interface HistoryItem {
  date: string;
  user: string;
  action: string;
  details?: string;
}

export interface Task {
  id: string;
  projectId: string | null;
  projectName: string | null;
  type: 'management' | 'project';
  parentTaskId: string | null; // ID of the parent task if subtask
  name: string;
  description: string;
  assignee: string;
  collaborators: string[];
  startDate: string;
  dueDate: string | null;
  status: 'Chưa thực hiện' | 'Đang thực hiện' | 'Chờ phản hồi' | 'Chờ phê duyệt' | 'Hoàn thành' | 'Tạm dừng' | 'Quá hạn' | 'Hủy bỏ';
  progress: number; // 0 - 100
  priority: 'Cao' | 'Trung bình' | 'Thấp';
  notes: string;
  createdBy: string;
  updatedAt: string;
  checklist: ChecklistItem[];
  history: HistoryItem[];
}

export interface User {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'assignee' | 'viewer';
  avatar?: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
