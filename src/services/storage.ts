import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';
import { Project, Task, User, FirebaseConfig } from '../types';
import initialData from '../data/initialData.json';

const STORAGE_KEYS = {
  PROJECTS: 'bnc_projects',
  TASKS: 'bnc_tasks',
  USERS: 'bnc_users',
  FB_CONFIG: 'bnc_firebase_config',
  CURRENT_USER: 'bnc_current_user',
  THEME: 'bnc_theme'
};

// Default users matching roles
const DEFAULT_USERS: User[] = [
  { email: 'nguyenhuyphidn@gmail.com', name: 'Huy Phi (Lãnh đạo)', role: 'manager' },
  { email: 'admin@bnc.com', name: 'Quản trị hệ thống', role: 'admin' },
  { email: 'luan@bnc.com', name: 'Nguyễn Văn Luân (Hạ tầng)', role: 'assignee' },
  { email: 'nguyen@bnc.com', name: 'Trần Văn Nguyên (Hạ tầng)', role: 'assignee' },
  { email: 'triet@bnc.com', name: 'Lê Minh Triết (Hạ tầng)', role: 'assignee' },
  { email: 'bach@bnc.com', name: 'Trương Văn Bách (Hạ tầng)', role: 'assignee' },
  { email: 'trang@bnc.com', name: 'Phạm Thị Quỳnh Trang (Hạ tầng)', role: 'assignee' },
  { email: 'khanh@bnc.com', name: 'Nguyễn Quốc Khánh (Hạ tầng)', role: 'assignee' },
  { email: 'viewer@bnc.com', name: 'Người xem báo cáo', role: 'viewer' }
];

// Helper to check if Firebase is configured
export function getFirebaseConfig(): FirebaseConfig | null {
  // Check localStorage first
  const localConfig = localStorage.getItem(STORAGE_KEYS.FB_CONFIG);
  if (localConfig) {
    try {
      return JSON.parse(localConfig);
    } catch (e) {
      console.error("Invalid local Firebase config", e);
    }
  }

  // Fallback to environment variables
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig as FirebaseConfig;
  }

  return null;
}

// Initialize Firebase if config exists
let db: any = null;
function initFirebase() {
  const config = getFirebaseConfig();
  if (config) {
    try {
      const app = getApps().length === 0 ? initializeApp(config) : getApp();
      db = getFirestore(app);
      console.log("Firebase Firestore initialized successfully.");
      return true;
    } catch (e) {
      console.error("Failed to initialize Firebase", e);
    }
  }
  db = null;
  return false;
}

// Run initial check
initFirebase();

export function saveFirebaseConfig(config: FirebaseConfig | null) {
  if (config) {
    localStorage.setItem(STORAGE_KEYS.FB_CONFIG, JSON.stringify(config));
  } else {
    localStorage.removeItem(STORAGE_KEYS.FB_CONFIG);
  }
  // Re-initialize
  return initFirebase();
}

// Seed local storage if empty
function seedLocalStorageIfEmpty() {
  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    const uppercaseProjects = initialData.projects.map(p => ({
      ...p,
      name: p.name.toUpperCase()
    }));
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(uppercaseProjects));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    // Modify tasks to make sure dates are current relative to year 2026
    const updatedTasks = initialData.tasks.map(task => {
      // Set status properly based on dueDate
      let status = task.status;
      if (task.dueDate) {
        const today = new Date("2026-05-21");
        const due = new Date(task.dueDate);
        if (due < today && task.status !== 'Hoàn thành' && task.status !== 'Tạm dừng' && task.status !== 'Hủy bỏ') {
          status = 'Quá hạn';
        }
      }
      return {
        ...task,
        projectName: task.projectName ? task.projectName.toUpperCase() : '',
        status: status as any
      };
    });
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
}

// Run seed immediately
seedLocalStorageIfEmpty();

// --- PROJECTS SERVICE ---
export async function getProjects(): Promise<Project[]> {
  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projects: Project[] = [];
      querySnapshot.forEach((doc) => {
        projects.push(doc.data() as Project);
      });
      
      // If Firestore is empty, seed it from local and return
      if (projects.length === 0) {
        console.log("Firestore projects collection is empty, seeding from local data...");
        const localProjects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
        const batch = writeBatch(db);
        localProjects.forEach((p: Project) => {
          const docRef = doc(db, 'projects', p.id);
          batch.set(docRef, p);
        });
        await batch.commit();
        return localProjects.map((p: Project) => ({
          ...p,
          name: p.name.toUpperCase()
        }));
      }
      
      return projects.map((p: Project) => ({
        ...p,
        name: p.name.toUpperCase()
      }));
    } catch (e) {
      console.error("Firestore error, falling back to LocalStorage:", e);
    }
  }
  
  const localProjects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  return localProjects.map((p: Project) => ({
    ...p,
    name: p.name.toUpperCase()
  }));
}

export async function saveProject(project: Project): Promise<void> {
  const formattedProject = {
    ...project,
    name: project.name.toUpperCase()
  };
  // Save locally first
  const localProjects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const index = localProjects.findIndex((p: Project) => p.id === formattedProject.id);
  if (index >= 0) {
    localProjects[index] = formattedProject;
  } else {
    localProjects.push(formattedProject);
  }
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(localProjects));

  // Sync to Firestore if online
  if (db) {
    try {
      await setDoc(doc(db, 'projects', formattedProject.id), formattedProject);
    } catch (e) {
      console.error("Firestore sync failed for project", e);
    }
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  // Delete locally
  const localProjects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const filtered = localProjects.filter((p: Project) => p.id !== projectId);
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));

  // Also delete tasks belonging to this project locally
  const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
  const remainingTasks = localTasks.filter((t: Task) => t.projectId !== projectId);
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(remainingTasks));

  // Sync to Firestore
  if (db) {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      // In firestore, we would also need to delete tasks. For simplicity, let the user clean them up or delete manually.
    } catch (e) {
      console.error("Firestore sync delete failed for project", e);
    }
  }
}

// --- TASKS SERVICE ---
export async function getTasks(): Promise<Task[]> {
  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push(doc.data() as Task);
      });
      
      // If Firestore is empty, seed it
      if (tasks.length === 0) {
        console.log("Firestore tasks collection is empty, seeding from local data...");
        const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
        const batch = writeBatch(db);
        // Firestore batches can handle up to 500 operations, our data is ~58 tasks, which is safe
        localTasks.forEach((t: Task) => {
          const docRef = doc(db, 'tasks', t.id);
          batch.set(docRef, t);
        });
        await batch.commit();
        return localTasks.map((t: Task) => ({
          ...t,
          projectName: t.projectName ? t.projectName.toUpperCase() : ''
        }));
      }
      
      return tasks.map((t: Task) => ({
        ...t,
        projectName: t.projectName ? t.projectName.toUpperCase() : ''
      }));
    } catch (e) {
      console.error("Firestore error for tasks, falling back to LocalStorage:", e);
    }
  }
  
  const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
  return localTasks.map((t: Task) => ({
    ...t,
    projectName: t.projectName ? t.projectName.toUpperCase() : ''
  }));
}

export async function saveTask(task: Task): Promise<void> {
  const formattedTask = {
    ...task,
    projectName: task.projectName ? task.projectName.toUpperCase() : ''
  };
  // Save locally first
  const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
  const index = localTasks.findIndex((t: Task) => t.id === formattedTask.id);
  if (index >= 0) {
    localTasks[index] = formattedTask;
  } else {
    localTasks.push(formattedTask);
  }
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(localTasks));

  // Sync to Firestore if online
  if (db) {
    try {
      await setDoc(doc(db, 'tasks', formattedTask.id), formattedTask);
    } catch (e) {
      console.error("Firestore sync failed for task", e);
    }
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  // Delete locally (both the task itself and any subtasks belonging to it)
  const localTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
  const filtered = localTasks.filter((t: Task) => t.id !== taskId && t.parentTaskId !== taskId);
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));

  // Sync to Firestore
  if (db) {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      // Delete subtasks in Firestore
      const subtasks = localTasks.filter((t: Task) => t.parentTaskId === taskId);
      for (const st of subtasks) {
        await deleteDoc(doc(db, 'tasks', st.id));
      }
    } catch (e) {
      console.error("Firestore sync delete failed for task", e);
    }
  }
}

// --- USERS SERVICE ---
export async function getUsers(): Promise<User[]> {
  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      
      if (users.length === 0) {
        console.log("Firestore users collection is empty, seeding from local data...");
        const localUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const batch = writeBatch(db);
        localUsers.forEach((u: User) => {
          const docRef = doc(db, 'users', u.email.replace(/\./g, '_'));
          batch.set(docRef, u);
        });
        await batch.commit();
        return localUsers;
      }
      
      return users;
    } catch (e) {
      console.error("Firestore error for users, falling back to LocalStorage:", e);
    }
  }
  
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}

export async function saveUser(user: User): Promise<void> {
  const localUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const index = localUsers.findIndex((u: User) => u.email === user.email);
  if (index >= 0) {
    localUsers[index] = user;
  } else {
    localUsers.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(localUsers));

  if (db) {
    try {
      // Email contains dots which is not recommended as document IDs in some systems, replace dots with underscores
      const docId = user.email.replace(/\./g, '_');
      await setDoc(doc(db, 'users', docId), user);
    } catch (e) {
      console.error("Firestore sync failed for user", e);
    }
  }
}

export async function deleteUser(email: string): Promise<void> {
  const localUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const filtered = localUsers.filter((u: User) => u.email !== email);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));

  if (db) {
    try {
      const docId = email.replace(/\./g, '_');
      await deleteDoc(doc(db, 'users', docId));
    } catch (e) {
      console.error("Firestore sync delete failed for user", e);
    }
  }
}

// --- CURRENT USER AUTH SIMULATION ---
export function getCurrentUser(): User | null {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// --- CONFIG THEME ---
export function getSavedTheme(): 'light' | 'dark' {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'dark';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  document.documentElement.setAttribute('data-theme', theme);
}
