import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import CourseInfoPreview from '../../components/CourseInfoPreview';
import { tutorApi } from '../../api';
import { Users, CheckCircle, Clock, MessageSquare, Send, Pencil } from 'lucide-react';

export default function TutorCourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState('info');
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    const res = await tutorApi.getCourse(id);
    setCourse(res.data.course);
  };

  const loadCommunity = async () => {
    const { coursesApi } = await import('../../api');
    const res = await coursesApi.getCommunity(id);
    setTopics(res.data.topics);
  };

  useEffect(() => {
    if (tab === 'community') loadCommunity();
  }, [tab]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    await tutorApi.createTopic(id, { ...newTopic, is_main_topic: true });
    setNewTopic({ title: '', content: '' });
    loadCommunity();
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim()) return;
    await tutorApi.createTopic(id, { title: 'Reply', content: replyText, parent_id: parentId });
    setReplyTo(null);
    setReplyText('');
    loadCommunity();
  };

  if (!course) return <div className="min-h-screen"><Navbar variant="tutor" /><div className="animate-pulse h-96 m-4 bg-gray-200 rounded-xl" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="tutor" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/tutor/courses" className="text-black hover:underline text-sm mb-4 inline-block">
          ← Kembali ke daftar course
        </Link>
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold text-black">{course.title}</h1>
          <Link
            to={`/tutor/courses/${id}/edit`}
            className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 text-sm"
          >
            <Pencil className="w-4 h-4" /> Edit Course
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <Users className="w-8 h-8 text-black mx-auto mb-2" />
            <p className="text-2xl font-bold">{course.total_buyers}</p>
            <p className="text-sm text-gray-500">Total Pembeli</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <CheckCircle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-2xl font-bold">{course.total_completed}</p>
            <p className="text-sm text-gray-500">Selesai Belajar</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm text-center">
            <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{course.total_incomplete}</p>
            <p className="text-sm text-gray-500">Belum Selesai</p>
          </div>
        </div>

        <div className="flex gap-1 border-b mb-6">
          {[
            { key: 'info', label: 'Informasi' },
            { key: 'stats', label: 'Statistik Siswa' },
            { key: 'community', label: 'Community' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 font-medium ${
                tab === t.key ? 'text-black border-b-2 border-black' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <CourseInfoPreview course={course} courseId={id} />
        )}

        {tab === 'stats' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Sudah Selesai ({course.completed_users?.length})</h3>
              {course.completed_users?.map((u) => (
                <div key={u.user_id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  {u.user_avatar && <img src={u.user_avatar} alt="" className="w-8 h-8 rounded-full" />}
                  <div>
                    <p className="font-medium">{u.user_name}</p>
                    <p className="text-xs text-gray-700">{u.progress_percent}%</p>
                  </div>
                </div>
              ))}
              {!course.completed_users?.length && <p className="text-gray-400 text-sm">Belum ada</p>}
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-3">Belum Selesai ({course.incomplete_users?.length})</h3>
              {course.incomplete_users?.map((u) => (
                <div key={u.user_id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  {u.user_avatar && <img src={u.user_avatar} alt="" className="w-8 h-8 rounded-full" />}
                  <div>
                    <p className="font-medium">{u.user_name}</p>
                    <p className="text-xs text-gray-600">{u.progress_percent}%</p>
                  </div>
                </div>
              ))}
              {!course.incomplete_users?.length && <p className="text-gray-400 text-sm">Belum ada</p>}
            </div>
          </div>
        )}

        {tab === 'community' && (
          <div className="space-y-4">
            <form onSubmit={handleCreateTopic} className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Buat Topik Utama
              </h3>
              <input
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                placeholder="Judul topik"
                className="w-full border rounded-lg px-3 py-2 mb-2"
                required
              />
              <textarea
                value={newTopic.content}
                onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                placeholder="Isi topik..."
                className="w-full border rounded-lg px-3 py-2 mb-3 h-24"
              />
              <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg">
                Posting Topik Utama
              </button>
            </form>

            {topics.map((topic) => (
              <div key={topic.id} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {topic.user_avatar && <img src={topic.user_avatar} alt="" className="w-8 h-8 rounded-full" />}
                  <span className="font-medium">{topic.user_name}</span>
                  {topic.is_main_topic && (
                    <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">Utama</span>
                  )}
                </div>
                <h4 className="font-semibold">{topic.title}</h4>
                <p className="text-gray-600 mt-1">{topic.content}</p>

                <button
                  onClick={() => setReplyTo(replyTo === topic.id ? null : topic.id)}
                  className="text-sm text-black mt-3 hover:underline"
                >
                  Balas ({topic.replies?.length || 0})
                </button>

                {replyTo === topic.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tulis balasan..."
                      className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    />
                    <button onClick={() => handleReply(topic.id)} className="bg-black text-white px-3 py-2 rounded-lg">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {topic.replies?.map((reply) => (
                  <div key={reply.id} className="ml-8 mt-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-sm">{reply.user_name}: </span>
                    <span className="text-sm text-gray-600">{reply.content}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
