import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Pencil, Trash2, Power, } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface MyItem {
    item_id: string;
    title: string;
    daily_price: number | string;
    images: string[] | string | null;
    status: string;
    category_name?: string;
}

const API_URL = 'http://localhost:5000';

const MyItems = () => {
    const navigate = useNavigate();

    const [items, setItems] = useState<MyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadMyItems = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch(`${API_URL}/api/my-items`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'โหลดรายการสินค้าไม่สำเร็จ');
                }

                setItems(result.data);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
                );
            } finally {
                setLoading(false);
            }
        };

        loadMyItems();
    }, [navigate]);

    const getImageUrl = (images: MyItem['images']) => {
        let imageList: string[] = [];

        if (Array.isArray(images)) {
            imageList = images;
        } else if (typeof images === 'string') {
            try {
                const parsed = JSON.parse(images);
                if (Array.isArray(parsed)) imageList = parsed;
            } catch {
                return null;
            }
        }

        const firstImage = imageList[0];

        if (!firstImage) return null;

        if (firstImage.startsWith('http')) return firstImage;

        return `${API_URL}${firstImage.startsWith('/') ? '' : '/'}${firstImage}`;
    };
    const handleDelete = async (itemId: string, itemTitle: string) => {
        const confirmed = window.confirm(
            `คุณต้องการลบโพสต์ "${itemTitle}" ใช่หรือไม่?\n\nการลบนี้ไม่สามารถย้อนกลับได้`
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_URL}/api/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'ลบโพสต์ไม่สำเร็จ');
            }

            // ลบรายการออกจากหน้าจอโดยไม่ต้อง Refresh
            setItems((prev) => prev.filter((item) => item.item_id !== itemId));

            alert('ลบโพสต์สำเร็จ');
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : 'เกิดข้อผิดพลาดในการลบโพสต์'
            );
        }
    };
    const handleToggleStatus = async (
        itemId: string,
        currentStatus: string
    ) => {
        if (updatingStatusId) return;

        const newStatus =
            currentStatus === 'active' ? 'inactive' : 'active';

        const confirmed = window.confirm(
            newStatus === 'inactive'
                ? 'คุณต้องการปิดการให้เช่าสินค้านี้ชั่วคราวใช่หรือไม่?'
                : 'คุณต้องการเปิดให้เช่าสินค้านี้อีกครั้งใช่หรือไม่?'
        );

        if (!confirmed) return;

        setUpdatingStatusId(itemId);

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(
                `${API_URL}/api/items/${itemId}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status: newStatus,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || 'เปลี่ยนสถานะสินค้าไม่สำเร็จ'
                );
            }

            // อัปเดตสถานะบนหน้าจอโดยไม่ต้อง Refresh
            setItems((prev) =>
                prev.map((item) =>
                    item.item_id === itemId
                        ? { ...item, status: result.data.status }
                        : item
                )
            );

            alert(
                newStatus === 'active'
                    ? 'เปิดให้เช่าสำเร็จ'
                    : 'ปิดการให้เช่าชั่วคราวสำเร็จ'
            );
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ'
            );
        } finally {
            setUpdatingStatusId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24">

            {/* Header */}
            <header className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 px-4 pb-20 pt-10 text-white">
                <div className="mx-auto max-w-6xl">

                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        กลับไปหน้าโปรไฟล์
                    </button>

                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        จัดการสิ่งของของฉัน
                    </h1>

                    <p className="mt-2 text-sm text-blue-100">
                        จัดการประกาศสิ่งของ แก้ไขรายละเอียด และเปิดหรือปิดการให้เช่า
                    </p>

                </div>
            </header>

            {/* พื้นที่เนื้อหา */}
            <main className="relative mx-auto -mt-12 max-w-6xl px-4">

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">

                    {/* หัวข้อรายการและปุ่มเพิ่มสิ่งของ */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <h2 className="text-lg font-bold text-blue-950">
                                สิ่งของที่ลงประกาศ
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                รายการสิ่งของทั้งหมดของคุณ ({items.length} รายการ)
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/post-item')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
                        >
                            <Plus className="h-4 w-4" />
                            เพิ่มสิ่งของให้เช่า
                        </button>

                    </div>

                    {loading && (
                        <p className="text-sm text-muted-foreground">
                            กำลังโหลดรายการสินค้า...
                        </p>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    {!loading && !error && items.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">

                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                                <Package className="h-8 w-8 text-blue-700" />
                            </div>

                            <h3 className="mt-5 text-lg font-bold text-blue-950">
                                ยังไม่มีสิ่งของที่ลงประกาศ
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                                เริ่มลงประกาศสิ่งของที่คุณต้องการให้เช่า
                                เพื่อให้ผู้ใช้งานคนอื่นสามารถค้นหาและส่งคำขอเช่าได้
                            </p>

                            <button
                                type="button"
                                onClick={() => navigate('/post-item')}
                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                            >
                                <Plus className="h-4 w-4" />
                                ลงประกาศสิ่งของ
                            </button>
                        </div>
                    )}

                    {!loading && !error && items.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {items.map((item) => {
                                const imageUrl = getImageUrl(item.images);

                                return (
                                    <div
                                        key={item.item_id}
                                        className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md sm:flex-row"
                                    >
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={item.title}
                                                className="flex h-44 w-full shrink-0 items-center justify-center rounded-xl bg-slate-100 sm:h-32 sm:w-32"
                                            />
                                        ) : (
                                            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <Package className="h-7 w-7 text-muted-foreground" />
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <h3 className="line-clamp-2 text-base font-bold text-slate-900">
                                                {item.title}
                                            </h3>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {item.category_name || 'ไม่ระบุหมวดหมู่'}
                                            </p>

                                            <p className="mt-2 text-lg font-bold text-blue-700">
                                                ฿{Number(item.daily_price).toLocaleString('th-TH')}/วัน
                                            </p>

                                            <span
                                                className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${item.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {item.status === 'active'
                                                    ? 'กำลังเปิดให้เช่า'
                                                    : item.status === 'inactive'
                                                        ? 'ปิดให้เช่าชั่วคราว'
                                                        : item.status === 'hidden'
                                                            ? 'ซ่อนประกาศ'
                                                            : item.status}
                                            </span>
                                            <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-3">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/my-items/${item.item_id}/edit`)}
                                                    className="inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-blue-200 bg-blue-50 px-2 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    แก้ไขโพสต์
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.item_id, item.title)}
                                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    ลบโพสต์
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleStatus(item.item_id, item.status)
                                                    }
                                                    disabled={updatingStatusId === item.item_id}
                                                    className={`col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 xl:col-span-1 ${item.status === 'active'
                                                        ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                                        : 'border-green-200 text-green-600 hover:bg-green-50'
                                                        }`}
                                                >
                                                    <Power className="h-3.5 w-3.5" />
                                                    {updatingStatusId === item.item_id
                                                        ? 'กำลังอัปเดต...'
                                                        : item.status === 'active'
                                                            ? 'ปิดให้เช่า'
                                                            : 'เปิดให้เช่า'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default MyItems;