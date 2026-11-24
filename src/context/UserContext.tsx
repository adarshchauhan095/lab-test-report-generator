import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import { db } from '@/database/db';
import { defaultUsers } from '@/database/seedData';

interface UserContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  can: (action: PermissionAction) => boolean;
  refreshUsers: () => Promise<void>;
}

export type PermissionAction =
  | 'create_report'
  | 'edit_report'
  | 'finalize_report'
  | 'delete_report'
  | 'create_invoice'
  | 'record_payment'
  | 'manage_customers'
  | 'manage_commodities'
  | 'manage_users'
  | 'manage_settings'
  | 'backup_restore';

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [availableUsers, setAvailableUsers] = useState<User[]>(defaultUsers);
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const saved = localStorage.getItem('labmanager_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return defaultUsers[0]; // Admin by default
  });

  const refreshUsers = async () => {
    try {
      const users = await db.users.toArray();
      if (users.length > 0) {
        setAvailableUsers(users);
        const exists = users.find((u) => u.id === currentUser.id);
        if (exists) {
          setCurrentUserState(exists);
        } else {
          setCurrentUserState(users[0]);
          localStorage.setItem('labmanager_current_user', JSON.stringify(users[0]));
        }
      }
    } catch (e) {
      console.error('Failed to load users from DB:', e);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem('labmanager_current_user', JSON.stringify(user));
  };

  const can = (action: PermissionAction): boolean => {
    const role: UserRole = currentUser.role;
    if (role === 'admin') return true;

    switch (action) {
      case 'create_report':
      case 'edit_report':
      case 'finalize_report':
        return role === 'lab_operator';

      case 'create_invoice':
      case 'record_payment':
        return role === 'billing_operator';

      case 'manage_customers':
      case 'manage_commodities':
        return role === 'lab_operator' || role === 'billing_operator';

      case 'delete_report':
      case 'manage_users':
      case 'manage_settings':
      case 'backup_restore':
        return false;

      default:
        return false;
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, availableUsers, can, refreshUsers }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
