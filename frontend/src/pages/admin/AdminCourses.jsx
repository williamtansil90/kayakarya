import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { adminApi } from '../../api';
import ResponsiveTable, { thClass, tdClass } from '../../components/ResponsiveTable';
import { Search } from 'lucide-react';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => { loadCourses(); }, [search]);

  const loadCourses = async () => {
    const res = await adminApi.listCourses(search);
    setCourses(res.data.courses);
  };

  const toggleActive = async (course) => {
    const nextActive = !course.is_active;
    if (!nextActive && !confirm(`Non aktifkan "${course.title}"? Course tidak akan tampil di halaman utama.`)) {
      return;
    }
    setTogglingId(course.id);
    try {
      await adminApi.updateCourse(course.id, { is_active: nextActive });
      // #region agent log
      fetch('http://localhost:7454/ingest/b83563f1-55a3-4588-9237-377b1e3571ce',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'749551'},body:JSON.stringify({sessionId:'749551',location:'AdminCourses.jsx:toggleActive',message:'course active toggled',data:{courseId:course.id,nextActive},timestamp:Date.now(),hypothesisId:'toggle',runId:'admin-toggle'})}).catch(()=>{});
      // #endregion
      await loadCourses();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah status course');
    } finally {
      setTogglingId(null);
    }
  };

  const startEdit = (course) => {
    setEditing(course.id);
    setForm({ title: course.title, information: course.information || '', price: course.price, is_active: course.is_active });
  };

  const saveEdit = async () => {
    await adminApi.updateCourse(editing, form);
    setEditing(null);
    loadCourses();
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="admin" />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">List Course</h1>
        <div className="relative w-full max-w-md mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari course..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <ResponsiveTable minWidth="700px">
          <thead className="bg-gray-50">
            <tr>
              <th className={thClass}>Judul</th>
              <th className={`${thClass} hidden md:table-cell`}>Tutor</th>
              <th className={thClass}>Harga</th>
              <th className={`${thClass} hidden sm:table-cell`}>Pembeli</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {courses.map((course) => (
              <tr key={course.id}>
                {editing === course.id ? (
                  <>
                    <td className={tdClass}><input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="border rounded px-2 py-1 w-full min-w-[140px]" /></td>
                    <td className={`${tdClass} hidden md:table-cell`}>{course.tutor_name}</td>
                    <td className={tdClass}><input type="number" value={form.price} onChange={(e) => setForm({...form, price: parseFloat(e.target.value)})} className="border rounded px-2 py-1 w-24" /></td>
                    <td className={`${tdClass} hidden sm:table-cell`}>{course.total_buyers}</td>
                    <td className={tdClass}>
                      <select value={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.value === 'true'})} className="border rounded px-2 py-1">
                        <option value="true">Aktif</option>
                        <option value="false">Non Aktif</option>
                      </select>
                    </td>
                    <td className={tdClass}>
                      <button onClick={saveEdit} className="text-gray-700 text-sm mr-2">Simpan</button>
                      <button onClick={() => setEditing(null)} className="text-gray-700 text-sm">Batal</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`${tdClass} font-medium max-w-[200px] truncate`}>{course.title}</td>
                    <td className={`${tdClass} hidden md:table-cell`}>{course.tutor_name}</td>
                    <td className={tdClass}>{formatPrice(course.price)}</td>
                    <td className={`${tdClass} hidden sm:table-cell`}>{course.total_buyers}</td>
                    <td className={tdClass}>
                      <span className={`text-xs px-2 py-1 rounded ${course.is_active ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'}`}>
                        {course.is_active ? 'Aktif' : 'Non Aktif'}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 sm:items-center">
                        <button onClick={() => startEdit(course)} className="text-black text-sm hover:underline text-left">
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(course)}
                          disabled={togglingId === course.id}
                          className={`text-sm hover:underline text-left disabled:opacity-50 ${
                            course.is_active ? 'text-gray-600' : 'text-black font-medium'
                          }`}
                        >
                          {togglingId === course.id
                            ? '...'
                            : course.is_active
                            ? 'Non Aktif'
                            : 'Aktifkan'}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
      </div>
    </div>
  );
}
