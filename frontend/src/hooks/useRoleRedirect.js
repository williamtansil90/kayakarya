import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TUTOR_HOME = '/tutor/courses';
const ADMIN_HOME = '/admin';

const TUTOR_REDIRECT_PATHS = ['/', '/my-courses', '/tutor'];

export function useRoleRedirect() {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    if (activeRole === 'tutor' && TUTOR_REDIRECT_PATHS.includes(location.pathname)) {
      navigate(TUTOR_HOME, { replace: true });
    } else if (activeRole === 'admin' && (location.pathname === '/' || location.pathname === '/tutor')) {
      navigate(ADMIN_HOME, { replace: true });
    }
  }, [user, activeRole, location.pathname, navigate]);
}
