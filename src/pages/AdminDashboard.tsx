import { useEffect, useState } from 'react';
import { AlertTriangle, DollarSign, Shield, Users, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { mockUsers } from '@/data/mockData';
import { apiGet } from '@/lib/api';

const fallbackStats = [
  { label: 'Total Users', value: '1,284', icon: Users },
  { label: 'Active Disputes', value: '12', icon: AlertTriangle },
  { label: 'Gross Volume', value: '฿1.2M', icon: DollarSign },
  { label: 'Blocked Accounts', value: '8', icon: Shield },
];

const recentTransactions = [
  { id: 'TXN-1024', user: 'สมชาย ใจดี', amount: '฿1,200', status: 'Completed' },
  { id: 'TXN-1025', user: 'วิชัย สร้างบ้าน', amount: '฿2,400', status: 'Pending' },
  { id: 'TXN-1026', user: 'สุดา แคมป์เปอร์', amount: '฿860', status: 'Completed' },
];

const disputes = [
  { id: 'DIS-50', item: 'กล้อง Canon EOS R6', flag: 'Late return claim', severity: 'High' },
  { id: 'DIS-51', item: 'จักรยาน Trek', flag: 'Damage report', severity: 'Medium' },
  { id: 'DIS-52', item: 'เต็นท์ Coleman', flag: 'Misrepresentation', severity: 'Low' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(fallbackStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const data = await apiGet<{ totalUsers?: number; activeDisputes?: number; grossVolume?: string; blockedAccounts?: number }>('/api/admin/summary');
        if (isMounted) {
          setStats([
            { label: 'Total Users', value: `${data.totalUsers ?? 1284}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','), icon: Users },
            { label: 'Active Disputes', value: String(data.activeDisputes ?? 12), icon: AlertTriangle },
            { label: 'Gross Volume', value: data.grossVolume ?? '฿1.2M', icon: DollarSign },
            { label: 'Blocked Accounts', value: String(data.blockedAccounts ?? 8), icon: Shield },
          ]);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setStats(fallbackStats);
          setError('ไม่สามารถโหลดข้อมูลแผงผู้ดูแลได้ในขณะนี้');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section>
          <h2 className="mb-4 text-xl font-bold text-white">Overview</h2>
          {isLoading && <p className="mb-4 text-sm text-slate-400">กำลังโหลดข้อมูลแผงผู้ดูแล...</p>}
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-slate-400">{label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Users</h3>
              <span className="text-xs text-slate-400">{mockUsers.length} registered</span>
            </div>

            <div className="space-y-3">
              {mockUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div>
                    <p className="font-medium text-white">{user.full_name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                    <button className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300">
                      Suspend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Transactions</h3>
              <span className="text-xs text-slate-400">Live feed</span>
            </div>

            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div>
                    <p className="font-medium text-white">{tx.id}</p>
                    <p className="text-xs text-slate-400">{tx.user}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{tx.amount}</p>
                    <p className="text-[10px] text-slate-400">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Items</h3>
              <span className="text-xs text-slate-400">Moderation</span>
            </div>

            <div className="space-y-3">
              {['สว่านไฟฟ้า Bosch', 'จักรยาน Trek', 'กล้อง Canon EOS R6'].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="font-medium text-white">{item}</p>
                  <button className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300">
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Disputes</h3>
              <span className="text-xs text-slate-400">Review queue</span>
            </div>

            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium text-white">{dispute.item}</p>
                    <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-300">
                      {dispute.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{dispute.flag}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
