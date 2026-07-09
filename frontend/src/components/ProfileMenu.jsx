import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, ChevronDown, Shield, GraduationCap, User } from 'lucide-react';
import { getAvailableRoles, ROLE_CONFIG } from '../utils/roleUtils';

const ROLE_ICONS = { admin: Shield, tutor: GraduationCap, student: User };

export default function ProfileMenu() {
  const { user, logout, activeRole, switchRole } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const availableRoles = getAvailableRoles(user.role);

  const handleSwitchRole = (role) => {
    switchRole(role);
    setOpen(false);
    navigate(ROLE_CONFIG[role].home);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <span className="text-sm text-gray-700 hidden sm:block max-w-[120px] truncate">{user.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-black truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          {availableRoles.length > 1 && (
            <div className="py-1">
              <p className="px-4 py-1.5 text-xs text-gray-400 uppercase tracking-wide">Berperan sebagai</p>
              {availableRoles.map((role) => {
                const cfg = ROLE_CONFIG[role];
                const Icon = ROLE_ICONS[role];
                const isActive = activeRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => handleSwitchRole(role)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                      isActive ? 'text-black font-medium bg-gray-50' : 'text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cfg.label}</span>
                    {isActive && <span className="ml-auto text-xs text-gray-400">aktif</span>}
                  </button>
                );
              })}
            </div>
          )}

          {availableRoles.length === 1 && (
            <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
              <User className="w-4 h-4" />
              User
            </div>
          )}

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
