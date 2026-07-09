import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useAuth } from '../context/AuthContext';
import { coursesApi } from '../api';
import { BookOpen } from 'lucide-react';

export default function MyCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadCourses();
    else setLoading(false);
  }, [user]);

  const loadCourses = async () => {
    try {
      const res = await coursesApi.myCourses();
      setCourses(res.data.courses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-md mx-auto mt-20 text-center p-6">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Login untuk melihat course Anda</h2>
          <GoogleAuthButton role="student" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-6">My Courses</h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Belum ada course yang diikuti</p>
            <Link to="/" className="text-black hover:underline mt-2 inline-block">
              Jelajahi course →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.course_id || course.id}
                to={`/course/${course.course_id || course.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-5"
              >
                <h3 className="font-semibold text-black text-lg">{course.title}</h3>
                <p className="text-sm text-gray-500 mt-1">oleh {course.tutor_name}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span className="font-bold text-black">{course.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full"
                      style={{ width: `${course.progress_percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {course.completed_count}/{course.total_materials} materi selesai
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
