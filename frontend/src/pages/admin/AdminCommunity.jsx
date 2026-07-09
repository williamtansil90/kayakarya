import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { adminApi } from '../../api';
import { Search, Trash2 } from 'lucide-react';

export default function AdminCommunity() {
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { loadTopics(); }, [search]);

  const loadTopics = async () => {
    const res = await adminApi.listCommunity(search);
    setTopics(res.data.topics);
  };

  const deleteTopic = async (id) => {
    if (!confirm('Hapus topik ini?')) return;
    await adminApi.deleteTopic(id);
    loadTopics();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="admin" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-6">List Community</h1>
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari topik..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <div className="space-y-4">
          {topics.map((topic) => (
            <div key={topic.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{topic.course_title}</span>
                  {topic.is_main_topic && <span className="text-xs bg-black text-white px-2 py-0.5 rounded ml-2">Utama</span>}
                  <h3 className="font-semibold mt-2">{topic.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{topic.content}</p>
                  <p className="text-xs text-gray-400 mt-2">oleh {topic.user_name} • {new Date(topic.created_at).toLocaleDateString('id-ID')}</p>
                  {topic.replies?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{topic.replies.length} balasan</p>
                  )}
                </div>
                <button onClick={() => deleteTopic(topic.id)} className="text-gray-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
