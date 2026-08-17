import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Developer' | 'Stakeholder';
  avatarInitials: string;
  company?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, role?: 'Admin' | 'Developer' | 'Stakeholder', name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('mldevops_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null; // Start logged out so Sign In page is shown first!
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('mldevops_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mldevops_user');
    }
  }, [user]);

  const login = (email: string, role: 'Admin' | 'Developer' | 'Stakeholder' = 'Developer', name?: string) => {
    const calculatedName = name || email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    const initials = calculatedName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: calculatedName,
      email,
      role,
      avatarInitials: initials,
      company: 'Enterprise Platform',
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
