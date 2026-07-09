import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export default function CourseInfoPreview({ course, courseId, showPublicLink = true }) {
  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const embedUrl = (url) => {
    if (!url) return '';
    return url.includes('embed/') ? url : url.replace('watch?v=', 'embed/');
  };

  return (
    <div>
      <div className="bg-black text-white rounded-xl mb-6 overflow-hidden">
        <div className="px-6 py-8">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Preview — Tampilan Student Sebelum Beli</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{course.title}</h2>
          <div className="flex items-center gap-4 text-sm">
            {course.tutor_avatar && (
              <img src={course.tutor_avatar} alt="" className="w-9 h-9 rounded-full" />
            )}
            <span>oleh <strong>{course.tutor_name}</strong></span>
            <span className="text-gray-400">{course.total_buyers || 0} students</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {course.intro_video_url && (
            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
              <iframe
                src={embedUrl(course.intro_video_url)}
                className="w-full h-full"
                allowFullScreen
                title="Intro video"
              />
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-black mb-4">Tentang Course</h3>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
              {course.information || 'Belum ada informasi.'}
            </p>

            <h4 className="text-lg font-semibold mt-6 mb-3">
              Daftar Materi ({course.materials?.length || 0})
            </h4>
            <ul className="space-y-2">
              {(course.materials || []).map((m, i) => (
                <li key={m.id || i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <p className="font-medium">{m.title}</p>
                </li>
              ))}
              {!course.materials?.length && (
                <p className="text-gray-400 text-sm">Belum ada materi.</p>
              )}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24 space-y-4">
            <p className="text-3xl font-bold text-black">{formatPrice(course.price)}</p>
            <div className="bg-gray-100 text-gray-600 p-3 rounded-lg text-center text-sm font-medium">
              Beli Course
            </div>
            <p className="text-xs text-gray-400 text-center">
              Tombol ini hanya preview. Student akan melihat tombol beli di halaman publik.
            </p>
            {showPublicLink && courseId && (
              <Link
                to={`/course/${courseId}`}
                target="_blank"
                className="flex items-center justify-center gap-2 text-sm text-black hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Buka halaman publik
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
