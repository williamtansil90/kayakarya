import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';
import { getAvailableRoles, resolveActiveRole } from '../utils/roleUtils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const [activeRole, setActiveRole] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      return resolveActiveRole(u, localStorage.getItem('activeRole'));
    } catch {
      return 'student';
    }
  });

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setActiveRole('student');
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    authApi.getMe()
      .then((res) => {
        const userData = res.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        const role = resolveActiveRole(userData, localStorage.getItem('activeRole'));
        setActiveRole(role);
        localStorage.setItem('activeRole', role);
      })
      .catch(() => {
        setUser(null);
        setActiveRole('student');
        localStorage.removeItem('user');
        localStorage.removeItem('activeRole');
      });
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    const role = resolveActiveRole(userData, null);
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
  };

  const logout = () => {
    setUser(null);
    setActiveRole('student');
    localStorage.removeItem('user');
    localStorage.removeItem('activeRole');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    const role = resolveActiveRole(userData, activeRole);
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
  };

  const switchRole = (role) => {
    if (!user) return;
    const available = getAvailableRoles(user.role);
    if (!available.includes(role)) return;
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, login, logout, updateUser, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
