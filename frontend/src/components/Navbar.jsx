import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from './GoogleAuthButton';
import ProfileMenu from './ProfileMenu';
import { Menu, X } from 'lucide-react';

function NavLinks({ navVariant, user, onNavigate, mobile = false }) {
  const linkClass = mobile
    ? 'block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-black font-medium border-b border-gray-100 last:border-0'
    : 'text-gray-600 hover:text-black font-medium text-sm lg:text-base';

  const wrap = (children) =>
    mobile ? <div className="py-2">{children}</div> : <>{children}</>;

  if (navVariant === 'student') {
    return wrap(
      <>
        <Link to="/" onClick={onNavigate} className={linkClass}>Home</Link>
        {user && (
          <Link to="/my-courses" onClick={onNavigate} className={linkClass}>My Courses</Link>
        )}
      </>
    );
  }

  if (navVariant === 'tutor' && user) {
    return wrap(
      <>
        <Link to="/tutor/courses" onClick={onNavigate} className={linkClass}>My Courses</Link>
        <Link to="/tutor/sales" onClick={onNavigate} className={linkClass}>Penjualan</Link>
      </>
    );
  }

  if (navVariant === 'admin' && user) {
    const adminLinks = [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/tutors', label: 'Tutors' },
      { to: '/admin/courses', label: 'Courses' },
      { to: '/admin/sales', label: 'Sales' },
      { to: '/admin/withdraws', label: 'Withdraws' },
      { to: '/admin/community', label: 'Community' },
      { to: '/admin/homepage', label: 'Homepage' },
    ];
    return wrap(
      adminLinks.map((item) => (
        <Link key={item.to} to={item.to} onClick={onNavigate} className={linkClass}>
          {item.label}
        </Link>
      ))
    );
  }

  return null;
}

export default function Navbar({ variant = 'student' }) {
  const { user, activeRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navVariant = user ? activeRole : variant;
  const basePath = navVariant === 'tutor' ? '/tutor/courses' : navVariant === 'admin' ? '/admin' : '/';
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-black"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to={basePath} className="flex items-center" onClick={closeMenu}>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-black tracking-tight leading-none">
                KayaKarya
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <NavLinks navVariant={navVariant} user={user} onNavigate={closeMenu} />
            {user ? <ProfileMenu /> : <GoogleAuthButton role="student" compact />}
          </div>

          <div className="lg:hidden flex items-center">
            {user ? <ProfileMenu /> : <GoogleAuthButton role="student" compact />}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-inner max-h-[70vh] overflow-y-auto">
          <NavLinks navVariant={navVariant} user={user} onNavigate={closeMenu} mobile />
        </div>
      )}
    </nav>
  );
}
