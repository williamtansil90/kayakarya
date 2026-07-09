import { useState } from 'react';

export default function CourseThumbnail({ url, title, className = 'w-full h-full object-cover' }) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className={`bg-gradient-to-br from-black to-gray-800 flex items-center justify-center ${className}`}>
        <span className="text-white text-4xl font-bold opacity-30">
          {title?.charAt(0) || '?'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title || 'Course thumbnail'}
      className={className}
      onError={() => setError(true)}
    />
  );
}
