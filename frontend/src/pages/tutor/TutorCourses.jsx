import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { tutorApi } from '../../api';
import ResponsiveTable, { thClass, tdClass } from '../../components/ResponsiveTable';
import { Plus, Users, Eye, Pencil } from 'lucide-react';

export default function TutorCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      const res = await tutorApi.listCourses();
      setCourses(res.data.courses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen">
      <Navbar variant="tutor" />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-black">Course Saya</h1>
          <button
            onClick={() => navigate('/tutor/courses/new')}
            className="bg-black text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Buat Course
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-4">Belum ada course</p>
            <button onClick={() => navigate('/tutor/courses/new')} className="text-black hover:underline">
              Buat course pertama →
            </button>
          </div>
        ) : (
          <ResponsiveTable minWidth="560px">
            <thead className="bg-gray-50">
              <tr>
                <th className={thClass}>Judul</th>
                <th className={thClass}>Harga</th>
                <th className={`${thClass} hidden sm:table-cell`}>Pembeli</th>
                <th className={thClass}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className={`${tdClass} font-medium max-w-[200px] truncate`}>{course.title}</td>
                  <td className={tdClass}>{formatPrice(course.price)}</td>
                  <td className={`${tdClass} hidden sm:table-cell`}>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" /> {course.total_buyers}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <Link to={`/tutor/courses/${course.id}`} className="text-black hover:underline flex items-center gap-1 text-sm">
                        <Eye className="w-4 h-4" /> Detail
                      </Link>
                      <Link to={`/tutor/courses/${course.id}/edit`} className="text-black hover:underline flex items-center gap-1 text-sm">
                        <Pencil className="w-4 h-4" /> Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </div>
    </div>
  );
}
