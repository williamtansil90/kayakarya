import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api';
import { Users, GraduationCap, BookOpen, DollarSign, Wallet } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') loadStats();
  }, [user]);

  const loadStats = async () => {
    const res = await adminApi.dashboard();
    setStats(res.data);
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar variant="admin" />
        <div className="max-w-md mx-auto mt-20 text-center p-6">
          <h2 className="text-xl font-bold mb-4">Admin Login</h2>
          <GoogleAuthButton role="admin" onSuccess={() => navigate('/admin')} />
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen">
        <Navbar variant="admin" />
        <div className="text-center py-20 text-gray-700">Akses ditolak. Hanya admin.</div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats?.total_users, icon: Users, color: 'text-gray-600' },
    { label: 'Total Tutors', value: stats?.total_tutors, icon: GraduationCap, color: 'text-gray-700' },
    { label: 'Total Courses', value: stats?.total_courses, icon: BookOpen, color: 'text-gray-700' },
    { label: 'Total Sales', value: stats?.total_sales, icon: DollarSign, color: 'text-black' },
    { label: 'Total Revenue', value: stats?.total_revenue ? `Rp ${stats.total_revenue.toLocaleString('id-ID')}` : 0, icon: Wallet, color: 'text-gray-600' },
    { label: 'Pending Withdraws', value: stats?.pending_withdraws, icon: Wallet, color: 'text-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="admin" />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">Dashboard Admin</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm">
              <card.icon className={`w-8 h-8 ${card.color} mb-3`} />
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value ?? '...'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
