import { Link } from 'react-router-dom';
import { Users, Star } from 'lucide-react';
import CourseThumbnail from './CourseThumbnail';

export default function CourseCard({ course }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link
      to={`/course/${course.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
    >
      <div className="aspect-video relative overflow-hidden">
        <CourseThumbnail
          url={course.thumbnail_url}
          title={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all pointer-events-none" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-black line-clamp-2 group-hover:text-gray-600 transition-colors">
          {course.title}
        </h3>
        {course.tutor_name && (
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Users className="w-3 h-3" /> {course.tutor_name}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-black">
            {formatPrice(course.price)}
          </span>
          {course.total_buyers > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Star className="w-3 h-3" /> {course.total_buyers} students
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
