import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { adminApi } from '../../api';
import ResponsiveTable, { thClass, tdClass } from '../../components/ResponsiveTable';
import { Search, Edit2, X, Check } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { loadUsers(); }, [search]);

  const loadUsers = async () => {
    const res = await adminApi.listUsers(search);
    setUsers(res.data.users);
  };

  const startEdit = (user) => {
    setEditing(user.id);
    setForm({ name: user.name, email: user.email, phone: user.phone || '', role: user.role });
  };

  const saveEdit = async () => {
    await adminApi.updateUser(editing, form);
    setEditing(null);
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="admin" />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">List User</h1>
        <div className="relative w-full max-w-md mb-4 sm:mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari user..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <ResponsiveTable minWidth="520px">
          <thead className="bg-gray-50">
            <tr>
              <th className={thClass}>Nama</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Role</th>
              <th className={thClass}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id}>
                {editing === user.id ? (
                  <>
                    <td className={tdClass}><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="border rounded px-2 py-1 w-full min-w-[120px]" /></td>
                    <td className={tdClass}><input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="border rounded px-2 py-1 w-full min-w-[160px]" /></td>
                    <td className={tdClass}>
                      <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="border rounded px-2 py-1">
                        <option value="student">student</option>
                        <option value="tutor">tutor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className={tdClass}>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="text-gray-700"><Check className="w-5 h-5" /></button>
                        <button onClick={() => setEditing(null)} className="text-gray-700"><X className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`${tdClass} font-medium`}>{user.name}</td>
                    <td className={tdClass}>{user.email}</td>
                    <td className={tdClass}><span className="text-xs bg-gray-100 px-2 py-1 rounded">{user.role}</span></td>
                    <td className={tdClass}>
                      <button onClick={() => startEdit(user)} className="text-black"><Edit2 className="w-4 h-4" /></button>
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
