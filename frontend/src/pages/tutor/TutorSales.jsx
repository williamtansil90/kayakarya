import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { tutorApi } from '../../api';
import ResponsiveTable, { thClass, tdClass } from '../../components/ResponsiveTable';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';

export default function TutorSales() {
  const [data, setData] = useState(null);
  const [withdraws, setWithdraws] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesRes, withdrawRes] = await Promise.all([
        tutorApi.getSales(),
        tutorApi.listWithdraws(),
      ]);
      setData(salesRes.data);
      setWithdraws(withdrawRes.data.withdraws);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      await tutorApi.requestWithdraw(parseFloat(amount));
      setAmount('');
      loadData();
      alert('Request withdraw berhasil dikirim');
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal request withdraw');
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  if (loading) return <div className="min-h-screen"><Navbar variant="tutor" /><div className="animate-pulse h-96 m-4 bg-gray-200 rounded-xl" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="tutor" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-6">Penjualan</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <TrendingUp className="w-8 h-8 text-gray-700 mb-2" />
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">{formatPrice(data?.total_revenue || 0)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <Wallet className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">Saldo Tersedia</p>
            <p className="text-2xl font-bold">{formatPrice(data?.available_balance || 0)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <DollarSign className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">Pending Withdraw</p>
            <p className="text-2xl font-bold">{formatPrice(data?.pending_withdraw || 0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h2 className="font-semibold mb-4">Request Withdraw</h2>
          <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Jumlah (IDR)"
              className="flex-1 border rounded-lg px-3 py-2"
              min="1"
              required
            />
            <button type="submit" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 w-full sm:w-auto">
              Request
            </button>
          </form>
        </div>

        <h2 className="font-semibold mb-4">Riwayat Penjualan</h2>
        <div className="mb-8">
          <ResponsiveTable minWidth="640px">
            <thead className="bg-gray-50">
              <tr>
                <th className={thClass}>Course</th>
                <th className={`${thClass} hidden sm:table-cell`}>Pembeli</th>
                <th className={thClass}>Jumlah</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} hidden md:table-cell`}>Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.sales || []).map((sale) => (
                <tr key={sale.id}>
                  <td className={`${tdClass} max-w-[160px] truncate`}>{sale.course_title}</td>
                  <td className={`${tdClass} hidden sm:table-cell`}>{sale.user_name}</td>
                  <td className={tdClass}>{formatPrice(sale.amount)}</td>
                  <td className={tdClass}>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sale.status === 'paid' ? 'bg-black text-white' :
                      sale.status === 'cancel' ? 'bg-gray-200 text-gray-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className={`${tdClass} text-gray-500 hidden md:table-cell`}>
                    {new Date(sale.created_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </div>

        <h2 className="font-semibold mb-4">Riwayat Withdraw</h2>
        <ResponsiveTable minWidth="400px">
          <thead className="bg-gray-50">
            <tr>
              <th className={thClass}>Jumlah</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {withdraws.map((w) => (
              <tr key={w.id}>
                <td className={tdClass}>{formatPrice(w.amount)}</td>
                <td className={tdClass}>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      w.status === 'paid' ? 'bg-black text-white' :
                      w.status === 'rejected' ? 'bg-gray-200 text-gray-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {w.status}
                    </span>
                  </td>
                  <td className={`${tdClass} text-gray-500`}>
                    {new Date(w.created_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
      </div>
    </div>
  );
}
