import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { adminApi } from '../../api';
import { Search, Edit2, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminTutors() {
  const [tutors, setTutors] = useState([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { loadTutors(); }, [search]);

  const loadTutors = async () => {
    const res = await adminApi.listTutors(search);
    setTutors(res.data.tutors);
  };

  const startEdit = (tutor) => {
    setEditing(tutor.id);
    setForm({
      name: tutor.name, email: tutor.email, phone: tutor.phone || '',
      bank_name: tutor.bank_name || '', bank_account: tutor.bank_account || '',
      bank_holder: tutor.bank_holder || '',
    });
  };

  const saveEdit = async () => {
    await adminApi.updateTutor(editing, form);
    setEditing(null);
    loadTutors();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="admin" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-6">List Tutor</h1>
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari tutor..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <div className="space-y-4">
          {tutors.map((tutor) => (
            <div key={tutor.id} className="bg-white rounded-xl shadow-sm p-5">
              {editing === tutor.id ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['name', 'email', 'phone', 'bank_name', 'bank_account', 'bank_holder'].map((f) => (
                    <input key={f} value={form[f]} onChange={(e) => setForm({...form, [f]: e.target.value})}
                      placeholder={f} className="border rounded px-3 py-2" />
                  ))}
                  <div className="col-span-2 flex gap-2">
                    <button onClick={saveEdit} className="bg-black text-white px-4 py-2 rounded">Simpan</button>
                    <button onClick={() => setEditing(null)} className="bg-gray-300 px-4 py-2 rounded">Batal</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {tutor.avatar_url && <img src={tutor.avatar_url} alt="" className="w-10 h-10 rounded-full" />}
                      <div>
                        <p className="font-semibold">{tutor.name}</p>
                        <p className="text-sm text-gray-500">{tutor.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(tutor)} className="text-black"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setExpanded(expanded === tutor.id ? null : tutor.id)}>
                        {expanded === tutor.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {expanded === tutor.id && tutor.courses?.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">Courses:</p>
                      <table className="w-full text-sm block sm:table">
                        <thead className="hidden sm:table-header-group"><tr className="text-gray-400">
                          <th className="text-left py-1">Judul</th>
                          <th className="text-left py-1">Pembeli</th>
                          <th className="text-left py-1">Selesai</th>
                        </tr></thead>
                        <tbody>
                          {tutor.courses.map((c) => (
                            <tr key={c.id} className="border-t">
                              <td className="py-2">{c.title}</td>
                              <td className="py-2">{c.total_buyers}</td>
                              <td className="py-2">{c.total_completed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
