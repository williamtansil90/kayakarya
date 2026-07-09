import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import Navbar from '../../components/Navbar';
import { authApi } from '../../api';
import { GraduationCap, Plus, BookOpen } from 'lucide-react';

export default function TutorHome() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'tutor' || user?.role === 'admin') {
      navigate('/tutor/courses', { replace: true });
    }
  }, [user, navigate]);

  if (user?.role === 'tutor' || user?.role === 'admin') {
    return null;
  }

  const handleLogin = async (userData) => {
    if (userData.role !== 'tutor' && userData.role !== 'admin') {
      try {
        const res = await authApi.registerTutor({});
        updateUser(res.data.user);
        navigate('/tutor/courses');
      } catch {
        navigate('/tutor/courses');
      }
    } else {
      navigate('/tutor/courses');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar variant="tutor" />
      <section className="bg-gradient-to-r from-black to-gray-800 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-4xl font-bold mb-4">Area Tutor KayaKarya</h1>
          <p className="text-lg text-gray-300 mb-8">
            Bagikan ilmu dan karya Anda. Buat course, kelola komunitas, dan dapatkan penghasilan.
          </p>

          {!user ? (
            <div className="bg-white rounded-xl p-8 shadow-lg inline-block">
              <p className="text-gray-700 mb-4 font-medium">Login / Register dengan Google</p>
              <GoogleAuthButton role="tutor" onSuccess={handleLogin} />
            </div>
          ) : user.role === 'tutor' || user.role === 'admin' ? (
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/tutor/courses')}
                className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" /> Kelola Course
              </button>
              <button
                onClick={() => navigate('/tutor/courses/new')}
                className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Buat Course Baru
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-lg inline-block">
              <p className="text-gray-700 mb-4">Daftar sebagai Tutor</p>
              <GoogleAuthButton role="tutor" onSuccess={handleLogin} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
