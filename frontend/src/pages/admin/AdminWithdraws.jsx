import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { adminApi, authApi } from '../../api';

export default function AdminWithdraws() {
  const [withdraws, setWithdraws] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadWithdraws(); }, [statusFilter]);

  const loadWithdraws = async () => {
    const res = await adminApi.listWithdraws(statusFilter);
    setWithdraws(res.data.withdraws);
  };

  const updateStatus = async (id, status) => {
    await adminApi.updateWithdraw(id, { status });
    loadWithdraws();
  };

  const uploadProof = async (id, file) => {
    const res = await authApi.upload(file);
    await adminApi.updateWithdraw(id, { status: 'paid', payment_proof_url: res.data.url });
    loadWithdraws();
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="admin" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-6">List Request Withdraw</h1>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 mb-6 text-sm">
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>

        <div className="space-y-4">
          {withdraws.map((w) => (
            <div key={w.id} className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1">
                  <p className="font-semibold">{w.tutor_name}</p>
                  <p className="text-sm text-gray-500">{w.tutor_email}</p>
                  <p className="text-sm mt-1">Bank: {w.bank_name} - {w.bank_account} ({w.bank_holder})</p>
                  <p className="text-xl font-bold text-black mt-2">{formatPrice(w.amount)}</p>
                  <p className="text-xs text-gray-400">{new Date(w.created_at).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="flex flex-col gap-2 items-stretch sm:items-end w-full sm:w-auto">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    w.status === 'paid' ? 'bg-black text-white' :
                    w.status === 'rejected' ? 'bg-gray-200 text-gray-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>{w.status}</span>
                  {w.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="bg-black text-white px-3 py-1 rounded text-sm cursor-pointer">
                        Upload Bukti & PAID
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => e.target.files[0] && uploadProof(w.id, e.target.files[0])} />
                      </label>
                      <button onClick={() => updateStatus(w.id, 'rejected')}
                        className="bg-gray-800 text-white px-3 py-1 rounded text-sm">Reject</button>
                    </div>
                  )}
                  {w.payment_proof_url && (
                    <a href={w.payment_proof_url} target="_blank" rel="noreferrer"
                      className="text-sm text-gray-600 hover:underline">Lihat Bukti</a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
