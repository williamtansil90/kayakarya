export const ROLE_CONFIG = {
  admin: { label: 'Admin', home: '/admin' },
  tutor: { label: 'Tutor', home: '/tutor/courses' },
  student: { label: 'User', home: '/' },
};

export function getAvailableRoles(userRole) {
  if (userRole === 'admin') return ['admin', 'tutor', 'student'];
  if (userRole === 'tutor') return ['tutor', 'student'];
  return ['student'];
}

export function resolveActiveRole(user, stored) {
  if (!user) return 'student';
  const available = getAvailableRoles(user.role);
  if (stored && available.includes(stored)) return stored;
  return available[0];
}
