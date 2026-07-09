import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { adminApi } from '../../api';
import ResponsiveTable, { thClass, tdClass } from '../../components/ResponsiveTable';
import { Search } from 'lucide-react';

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', date_from: '', date_to: '' });

  useEffect(() => { loadSales(); }, [filters]);

  const loadSales = async () => {
    const res = await adminApi.listSales(filters);
    setSales(res.data.sales);
  };

  const updateStatus = async (id, status) => {
    await adminApi.updateSale(id, { status });
    loadSales();
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="admin" />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">List Penjualan</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 sm:mb-6">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Keyword..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
          </div>
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Semua Status</option>
            <option value="waiting_payment">Waiting Payment</option>
            <option value="paid">Paid</option>
            <option value="cancel">Cancel</option>
          </select>
          <input type="date" value={filters.date_from} onChange={(e) => setFilters({...filters, date_from: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={filters.date_to} onChange={(e) => setFilters({...filters, date_to: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm" />
        </div>

        <ResponsiveTable minWidth="800px">
          <thead className="bg-gray-50">
            <tr>
              <th className={thClass}>ID</th>
              <th className={thClass}>Course</th>
              <th className={`${thClass} hidden sm:table-cell`}>Pembeli</th>
              <th className={`${thClass} hidden md:table-cell`}>Tutor</th>
              <th className={thClass}>Jumlah</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} hidden lg:table-cell`}>Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className={tdClass}>#{sale.id}</td>
                <td className={`${tdClass} max-w-[160px] truncate`}>{sale.course_title}</td>
                <td className={`${tdClass} hidden sm:table-cell`}>{sale.user_name}</td>
                <td className={`${tdClass} hidden md:table-cell`}>{sale.tutor_name}</td>
                <td className={tdClass}>{formatPrice(sale.amount)}</td>
                <td className={tdClass}>
                  <select value={sale.status} onChange={(e) => updateStatus(sale.id, e.target.value)}
                    className="text-xs border rounded px-2 py-1 max-w-[100px]">
                    <option value="waiting_payment">Waiting</option>
                    <option value="paid">Paid</option>
                    <option value="cancel">Cancel</option>
                  </select>
                </td>
                <td className={`${tdClass} text-gray-500 hidden lg:table-cell`}>
                  {new Date(sale.created_at).toLocaleDateString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
      </div>
    </div>
  );
}
