import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useAuth } from '../context/AuthContext';
import { coursesApi, settingsApi } from '../api';
import { Search, Sparkles } from 'lucide-react';

const DEFAULTS = {
  tagline: 'Belajar Kreatif, Raih Karya',
  title: 'Temukan Course Kreatif Terbaik',
  subtitle: 'Belajar langsung dari para ahli. Dari desain, ilustrasi, hingga fotografi.',
  cta_text: 'Mulai dengan Google Account',
  wallpaper_url: '',
};

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [hero, setHero] = useState(DEFAULTS);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
    loadHero();
  }, [search]);

  const loadHero = async () => {
    try {
      const res = await settingsApi.getHomepage();
      setHero({ ...DEFAULTS, ...res.data.settings });
    } catch (err) {
      console.error(err);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await coursesApi.list(search);
      setCourses(res.data.courses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const heroStyle = hero.wallpaper_url
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${hero.wallpaper_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <div className="min-h-screen">
      <Navbar />
      <section
        className={`text-white py-10 sm:py-16 ${hero.wallpaper_url ? '' : 'bg-gradient-to-r from-black to-gray-800'}`}
        style={heroStyle}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-gray-300" />
            <span className="text-gray-300 font-medium">{hero.tagline}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
            {hero.title}
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            {hero.subtitle}
          </p>
          {!user && (
            <div className="flex justify-center">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <p className="text-gray-700 mb-3 font-medium">{hero.cta_text}</p>
                <GoogleAuthButton role="student" onSuccess={() => navigate('/')} />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Semua Course</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">Belum ada course tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
