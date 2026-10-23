import { useEffect, useState } from 'react';
import { Package, ClipboardList, Shield, Users, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { apiGet, apiPatch } from '@/lib/api';

const fallbackStats = [
  { label: 'Total Users', value: '—', icon: Users },
  { label: 'Total Items', value: '—', icon: Package },
  { label: 'Total Rentals', value: '—', icon: ClipboardList },
  { label: 'Blocked Accounts', value: '—', icon: Shield },
];




type AdminUser = {
  user_id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  status: string;
  created_at: string;
};

type AdminItem = {
  item_id: string;
  title: string;
  description: string | null;
  daily_price: number | string;
  status: string;
  images: unknown;
  created_at: string;
  lender_id: string;
  lender_name: string | null;
  lender_email: string | null;
};

type AdminRental = {
  rental_id: string;
  item_id: string;
  item_title: string | null;
  borrower_id: string;
  borrower_name: string | null;
  lender_name: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  total_price: number | string;
  status: string;
  payment_status: string | null;
  fine_amount: number | string | null;
  fine_status: string | null;
  received_confirmed_at: string | null;
  created_at: string;
};

type AdminDispute = {
  dispute_id: string;
  rental_id: string | null;
  reported_by: string | null;
  reason: string;
  status: string;
  created_at: string;
  reporter_name: string | null;
  reporter_email: string | null;
  rental_status: string | null;
  total_price: number | string | null;
  item_title: string | null;
  borrower_name: string | null;
  lender_name: string | null;
};

type RentalInspection = {
  inspection_id: string;
  rental_id: string;
  inspector_id: string | null;
  inspection_type: string | null;
  condition_notes: string | null;
  photo_urls: unknown;
  created_at: string;
};

type DisputeEvidence = {
  dispute: {
    dispute_id: string;
    rental_id: string | null;
    reason: string;
    status: string;
  };
  inspections: RentalInspection[];
};

const getEvidenceImageUrl = (url: string) => {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `http://localhost:5000${url.startsWith("/") ? url : `/${url}`}`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(fallbackStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [usersError, setUsersError] = useState('');
  const [items, setItems] = useState<AdminItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [rentals, setRentals] = useState<AdminRental[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [rentalsError, setRentalsError] = useState('');
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(true);
  const [disputesError, setDisputesError] = useState('');
  const [selectedEvidence, setSelectedEvidence] =
    useState<DisputeEvidence | null>(null);

  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState('');
  const [evidenceOpen, setEvidenceOpen] = useState(false);


  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const response = await apiGet<{
          success: boolean;
          data: {
            totalUsers: number;
            totalItems: number;
            totalRentals: number;
            blockedAccounts: number;
          };
        }>('/api/admin/summary');

        if (!response.success || !response.data) {
          throw new Error('ไม่สามารถโหลดข้อมูล Dashboard ได้');
        }

        const data = response.data;

        if (isMounted) {
          setStats([
            {
              label: 'Total Users',
              value: data.totalUsers.toLocaleString('th-TH'),
              icon: Users,
            },
            {
              label: 'Total Items',
              value: data.totalItems.toLocaleString('th-TH'),
              icon: Package,
            },
            {
              label: 'Total Rentals',
              value: data.totalRentals.toLocaleString('th-TH'),
              icon: ClipboardList,
            },
            {
              label: 'Blocked Accounts',
              value: data.blockedAccounts.toLocaleString('th-TH'),
              icon: Shield,
            },
          ]);

          setError('');
        }
      } catch (err) {
        console.error('Load admin summary error:', err);

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

  // โหลดข้อมูลสมาชิกจาก Backend
  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      try {
        const response = await apiGet<{
          success: boolean;
          data: AdminUser[];
        }>('/api/admin/users');

        if (!response.success) {
          throw new Error('โหลดสมาชิกไม่สำเร็จ');
        }

        if (mounted) {
          setUsers(response.data);
          setUsersError('');
        }
      } catch (err) {
        console.error('Load admin users error:', err);

        if (mounted) {
          setUsersError('ไม่สามารถโหลดรายชื่อสมาชิกได้');
        }
      } finally {
        if (mounted) {
          setUsersLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  // โหลดรายการสิ่งของจริงจาก PostgreSQL
  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      try {
        const response = await apiGet<{
          success: boolean;
          data: AdminItem[];
        }>('/api/admin/items');

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('โหลดรายการสิ่งของไม่สำเร็จ');
        }

        if (mounted) {
          setItems(response.data);
          setItemsError('');
        }
      } catch (err) {
        console.error('Load admin items error:', err);

        if (mounted) {
          setItemsError('ไม่สามารถโหลดรายการสิ่งของได้');
        }
      } finally {
        if (mounted) {
          setItemsLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      mounted = false;
    };
  }, []);

  // โหลดรายการเช่าจริงจาก PostgreSQL
  useEffect(() => {
    let mounted = true;

    const loadRentals = async () => {
      try {
        const response = await apiGet<{
          success: boolean;
          data: AdminRental[];
        }>('/api/admin/rentals');

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('โหลดรายการเช่าไม่สำเร็จ');
        }

        if (mounted) {
          setRentals(response.data);
          setRentalsError('');
        }
      } catch (err) {
        console.error('Load admin rentals error:', err);

        if (mounted) {
          setRentalsError('ไม่สามารถโหลดรายการเช่าได้');
        }
      } finally {
        if (mounted) {
          setRentalsLoading(false);
        }
      }
    };

    loadRentals();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDisputes = async () => {
      try {
        const response = await apiGet<{
          success: boolean;
          data: AdminDispute[];
        }>('/api/admin/disputes');

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error('โหลดข้อพิพาทไม่สำเร็จ');
        }

        if (mounted) {
          setDisputes(response.data);
          setDisputesError('');
        }
      } catch (error) {
        console.error('Load admin disputes error:', error);

        if (mounted) {
          setDisputesError('ไม่สามารถโหลดรายการข้อพิพาทได้');
        }
      } finally {
        if (mounted) {
          setDisputesLoading(false);
        }
      }
    };

    loadDisputes();

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleUserStatus = async (user: AdminUser) => {
    const nextStatus =
      user.status === 'active' ? 'suspended' : 'active';

    const confirmed = window.confirm(
      `ต้องการ${nextStatus === 'suspended' ? 'ระงับ' : 'เปิดใช้งาน'}บัญชี ${user.full_name} ใช่หรือไม่?`
    );

    if (!confirmed) return;

    setUpdatingUserId(user.user_id);

    try {
      const response = await apiPatch<{
        success: boolean;
        data: AdminUser;
      }>(`/api/admin/users/${user.user_id}/status`, {
        status: nextStatus,
      });

      if (!response.success) {
        throw new Error('เปลี่ยนสถานะไม่สำเร็จ');
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id
            ? { ...u, status: response.data.status }
            : u
        )
      );

      setUsersError('');
    } catch (err) {
      setUsersError('ไม่สามารถเปลี่ยนสถานะสมาชิกได้');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleItemStatus = async (item: AdminItem) => {
    const nextStatus = item.status === 'hidden' ? 'active' : 'hidden';

    const confirmed = window.confirm(
      `ต้องการ${nextStatus === 'hidden' ? 'ซ่อน' : 'เปิดใช้งาน'}โพสต์ "${item.title}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    setUpdatingItemId(item.item_id);
    setItemsError('');

    try {
      const response = await apiPatch<{
        success: boolean;
        data: {
          item_id: string;
          status: string;
        };
        error?: string;
      }>(`/api/admin/items/${item.item_id}/status`, {
        status: nextStatus,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'เปลี่ยนสถานะโพสต์ไม่สำเร็จ');
      }

      setItems((prev) =>
        prev.map((current) =>
          current.item_id === item.item_id
            ? { ...current, status: response.data.status }
            : current
        )
      );
    } catch (err) {
      console.error('Update item status error:', err);
      setItemsError('ไม่สามารถเปลี่ยนสถานะโพสต์ได้');
    } finally {
      setUpdatingItemId(null);
    }
  };
  const handleViewEvidence = async (disputeId: string) => {
    setEvidenceOpen(true);
    setEvidenceLoading(true);
    setEvidenceError('');
    setSelectedEvidence(null);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/admin/disputes/${disputeId}/evidence`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ไม่สามารถโหลดหลักฐานได้');
      }

      setSelectedEvidence(result.data);
    } catch (error) {
      setEvidenceError(
        error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      );
    } finally {
      setEvidenceLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string) => {
    const confirmed = window.confirm(
      "ยืนยันการปิดข้อพิพาทนี้หรือไม่?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/admin/disputes/${disputeId}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || "ไม่สามารถจัดการข้อพิพาทได้");
        return;
      }

      alert("จัดการข้อพิพาทเรียบร้อยแล้ว");

      // โหลดข้อมูลใหม่เพื่อให้สถานะอัปเดต
      window.location.reload();
    } catch (error) {
      console.error("Resolve dispute error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ Backend");
    }
  };
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
              <span className="text-xs text-slate-400">{users.length} registered</span>
            </div>

            <div className="space-y-3">
              {usersLoading && (
                <p className="text-sm text-slate-400">กำลังโหลดสมาชิก...</p>
              )}

              {usersError && (
                <p className="text-sm text-red-400">{usersError}</p>
              )}

              {!usersLoading && users.length === 0 && (
                <p className="text-sm text-slate-400">ไม่พบสมาชิก</p>
              )}

              {users.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <div>
                    <p className="font-medium text-white">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      สถานะ: {user.status === 'active' ? 'ใช้งานปกติ' : 'ถูกระงับ'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>

                    {user.role !== 'admin' && (
                      <button
                        type="button"
                        disabled={updatingUserId === user.user_id}
                        onClick={() => handleToggleUserStatus(user)}
                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300 disabled:opacity-50"
                      >
                        {updatingUserId === user.user_id
                          ? 'กำลังบันทึก...'
                          : user.status === 'active'
                            ? 'Suspend'
                            : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Transactions
              </h3>
              <span className="text-xs text-slate-400">
                {rentals.length} rentals
              </span>
            </div>

            <div className="max-h-[600px] space-y-3 overflow-y-auto">
              {rentalsLoading && (
                <p className="text-sm text-slate-400">
                  กำลังโหลดรายการเช่า...
                </p>
              )}

              {rentalsError && (
                <p className="text-sm text-red-400">
                  {rentalsError}
                </p>
              )}

              {!rentalsLoading && rentals.length === 0 && (
                <p className="text-sm text-slate-400">
                  ไม่พบรายการเช่า
                </p>
              )}

              {rentals.map((rental) => (
                <div
                  key={rental.rental_id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {rental.item_title || 'ไม่พบชื่อสิ่งของ'}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        ผู้เช่า: {rental.borrower_name || 'ไม่ระบุ'}
                      </p>

                      <p className="text-xs text-slate-400">
                        ผู้ให้เช่า: {rental.lender_name || 'ไม่ระบุ'}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Rental ID: {rental.rental_id.slice(0, 8)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-primary">
                        ฿{Number(rental.total_price).toLocaleString('th-TH')}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {rental.status}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-slate-800 pt-2">
                    <p className="text-xs text-slate-400">
                      การชำระเงิน: {rental.payment_status || 'ไม่ระบุ'}
                    </p>

                    <p className="text-xs text-slate-400">
                      ระยะเวลาเช่า: {rental.total_days} วัน
                    </p>

                    <p className="text-xs text-slate-400">
                      ค่าปรับ: ฿{Number(rental.fine_amount ?? 0).toLocaleString('th-TH')}
                    </p>
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
              <span className="text-xs text-slate-400">
                {items.length} posts
              </span>
            </div>

            <div className="max-h-[600px] space-y-3 overflow-y-auto">
              {itemsLoading && (
                <p className="text-sm text-slate-400">
                  กำลังโหลดรายการสิ่งของ...
                </p>
              )}

              {itemsError && (
                <p className="text-sm text-red-400">
                  {itemsError}
                </p>
              )}

              {!itemsLoading && items.length === 0 && (
                <p className="text-sm text-slate-400">
                  ไม่พบรายการสิ่งของ
                </p>
              )}

              {items.map((item) => (
                <div
                  key={item.item_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {item.title}
                    </p>

                    <p className="text-xs text-slate-400">
                      เจ้าของ: {item.lender_name || 'ไม่ระบุ'}
                    </p>

                    <p className="text-xs text-slate-400">
                      ฿{Number(item.daily_price).toLocaleString('th-TH')} / วัน
                    </p>

                    <p
                      className={`mt-1 text-xs ${item.status === 'active'
                        ? 'text-green-400'
                        : 'text-amber-400'
                        }`}
                    >
                      สถานะ: {item.status}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={updatingItemId === item.item_id}
                    onClick={() => handleToggleItemStatus(item)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold disabled:opacity-50 ${item.status === 'hidden'
                      ? 'border-green-500/40 bg-green-500/10 text-green-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      }`}
                  >
                    {updatingItemId === item.item_id
                      ? 'กำลังบันทึก...'
                      : item.status === 'hidden'
                        ? 'Restore'
                        : 'Hide'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Disputes
              </h3>

              <span className="text-xs text-slate-400">
                {disputes.length} disputes
              </span>
            </div>

            <div className="max-h-[600px] space-y-3 overflow-y-auto">
              {disputesLoading && (
                <p className="text-sm text-slate-400">
                  กำลังโหลดข้อพิพาท...
                </p>
              )}

              {disputesError && (
                <p className="text-sm text-red-400">
                  {disputesError}
                </p>
              )}

              {!disputesLoading && !disputesError && disputes.length === 0 && (
                <p className="text-sm text-slate-400">
                  ไม่พบรายการข้อพิพาท
                </p>
              )}
              {evidenceOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                  <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">
                        Dispute Evidence
                      </h2>

                      <button
                        type="button"
                        onClick={() => setEvidenceOpen(false)}
                        className="rounded-lg px-3 py-1 text-slate-300 hover:bg-slate-800"
                      >
                        Close
                      </button>
                    </div>

                    {evidenceLoading && <p>กำลังโหลดหลักฐาน...</p>}

                    {evidenceError && (
                      <p className="text-red-400">{evidenceError}</p>
                    )}

                    {!evidenceLoading && selectedEvidence && (
                      <>
                        <p className="mb-4 text-sm text-slate-300">
                          เหตุผลร้องเรียน: {selectedEvidence.dispute.reason}
                        </p>

                        {selectedEvidence.inspections.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            ไม่พบหลักฐานการตรวจสภาพสำหรับรายการเช่านี้
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {selectedEvidence.inspections.map((inspection) => {
                              const rawPhotos = inspection.photo_urls;

                              const photos: string[] = Array.isArray(rawPhotos)
                                ? rawPhotos.filter(
                                  (url): url is string =>
                                    typeof url === "string" && url.trim().length > 0
                                )
                                : typeof rawPhotos === "string"
                                  ? (() => {
                                    try {
                                      const parsed: unknown = JSON.parse(rawPhotos);
                                      return Array.isArray(parsed)
                                        ? parsed.filter(
                                          (url): url is string =>
                                            typeof url === "string" && url.trim().length > 0
                                        )
                                        : typeof parsed === "string"
                                          ? [parsed]
                                          : [];
                                    } catch {
                                      return rawPhotos.trim() ? [rawPhotos] : [];
                                    }
                                  })()
                                  : [];

                              return (
                                <div
                                  key={inspection.inspection_id}
                                  className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                                >
                                  <p className="font-medium text-blue-400">
                                    {inspection.inspection_type || 'ไม่ระบุประเภท'}
                                  </p>

                                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                                    {inspection.condition_notes || 'ไม่มีบันทึกสภาพ'}
                                  </p>

                                  <p className="mt-2 text-xs text-slate-500">
                                    {new Date(inspection.created_at).toLocaleString('th-TH')}
                                  </p>

                                  {photos.length === 0 ? (
                                    <p className="mt-3 text-sm text-slate-500">
                                      ไม่มี URL รูปภาพ
                                    </p>
                                  ) : (
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                      {photos.map((url, index) => (
                                        <div key={`${inspection.inspection_id}-${index}`}>
                                          <img
                                            src={getEvidenceImageUrl(url)}
                                            alt="รูปหลักฐาน"
                                            className="w-full rounded-lg object-contain"
                                          />
                                          <a
                                            href={getEvidenceImageUrl(url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 block text-xs text-blue-400 underline"
                                          >
                                            เปิดรูปภาพ
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {disputes.map((dispute) => (
                <div
                  key={dispute.dispute_id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white">
                        {dispute.item_title || 'ไม่พบชื่อสิ่งของ'}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        ผู้แจ้ง: {dispute.reporter_name || 'ไม่ระบุ'}
                      </p>
                      {dispute.status === "open" && (
                        <button
                          type="button"
                          onClick={() => handleResolveDispute(dispute.dispute_id)}
                          className="mt-2 rounded-lg border border-green-500 px-3 py-1 text-xs text-green-400 hover:bg-green-500/10"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleViewEvidence(dispute.dispute_id)}
                        className="mt-3 rounded-lg border border-blue-500 px-3 py-2 text-xs text-blue-400 hover:bg-blue-500/10"
                      >
                        View Evidence
                      </button>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs ${dispute.status === 'open'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-green-500/10 text-green-400'
                        }`}
                    >
                      {dispute.status}
                    </span>
                  </div>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-300">
                    {dispute.reason}
                  </p>

                  <div className="mt-3 space-y-1 border-t border-slate-800 pt-2">
                    <p className="text-xs text-slate-400">
                      ผู้เช่า: {dispute.borrower_name || 'ไม่ระบุ'}
                    </p>

                    <p className="text-xs text-slate-400">
                      ผู้ให้เช่า: {dispute.lender_name || 'ไม่ระบุ'}
                    </p>

                    <p className="text-xs text-slate-400">
                      Rental ID: {dispute.rental_id?.slice(0, 8) || 'ไม่ระบุ'}
                    </p>

                    <p className="text-xs text-slate-400">
                      วันที่แจ้ง:{' '}
                      {new Date(dispute.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
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
