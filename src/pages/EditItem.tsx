import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import BottomNav from '@/components/BottomNav';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/api';

const API_URL = API_BASE_URL;

const EditItem = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [form, setForm] = useState({
        title: '',
        description: '',
        conditions: '',
        daily_price: '',
    });

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const update = (key: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        const loadItem = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    navigate('/login');
                    return;
                }

                // ใช้ API ที่ตรวจสอบ JWT และเจ้าของโพสต์แล้ว
                const response = await fetch(`${API_URL}/api/my-items`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'โหลดข้อมูลสินค้าไม่สำเร็จ');
                }

                const item = result.data.find(
                    (item: { item_id: string }) => item.item_id === id
                );

                if (!item) {
                    throw new Error('ไม่พบสินค้าหรือคุณไม่มีสิทธิ์แก้ไข');
                }

                setForm({
                    title: item.title || '',
                    description: item.description || '',
                    conditions: item.conditions || '',
                    daily_price: String(item.daily_price ?? ''),
                });
            } catch (error) {
                toast({
                    title: 'เกิดข้อผิดพลาด',
                    description:
                        error instanceof Error ? error.message : 'โหลดข้อมูลไม่สำเร็จ',
                    variant: 'destructive',
                });
                navigate('/my-items');
            } finally {
                setLoading(false);
            }
        };

        loadItem();
    }, [id, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting || !id) return;

        const price = Number(form.daily_price);

        if (
            !form.title.trim() ||
            !form.description.trim() ||
            !form.conditions.trim() ||
            !Number.isFinite(price) ||
            price <= 0
        ) {
            toast({
                title: 'ข้อมูลไม่ครบ',
                description: 'กรุณากรอกข้อมูลให้ครบและระบุราคาเช่ามากกว่า 0',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/api/items/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    conditions: form.conditions,
                    daily_price: price,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'แก้ไขโพสต์ไม่สำเร็จ');
            }

            toast({
                title: 'แก้ไขโพสต์สำเร็จ',
                description: 'บันทึกข้อมูลสินค้าเรียบร้อยแล้ว',
            });

            navigate('/my-items');
        } catch (error) {
            toast({
                title: 'เกิดข้อผิดพลาด',
                description:
                    error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-50 pb-24">

            {/* Header */}
            <header className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 px-4 pb-20 pt-10 text-white">
                <div className="mx-auto max-w-6xl">

                    <button
                        type="button"
                        onClick={() => navigate('/my-items')}
                        className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        กลับไปจัดการสิ่งของ
                    </button>

                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        แก้ไขประกาศสิ่งของ
                    </h1>

                    <p className="mt-2 text-sm text-blue-100">
                        ปรับปรุงชื่อ รายละเอียด เงื่อนไข และราคาเช่าของสิ่งของ
                    </p>

                </div>
            </header>

            {/* พื้นที่แบบฟอร์ม */}
            <main className="relative mx-auto -mt-12 max-w-6xl px-4">

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-8">

                    <div className="mb-6 border-b border-slate-100 pb-5">
                        <h2 className="text-lg font-bold text-blue-950">
                            ข้อมูลประกาศสิ่งของ
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            แก้ไขรายละเอียดที่ต้องการ แล้วกดบันทึกการเปลี่ยนแปลง
                        </p>
                    </div>


                    {loading ? (
                        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl bg-slate-50">
                            <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
                            <p className="text-sm font-medium text-slate-500">
                                กำลังโหลดข้อมูลสิ่งของ...
                            </p>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="mx-auto max-w-3xl space-y-6"
                        >
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    ชื่อสิ่งของ
                                </label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => update('title', e.target.value)}
                                    className="min-h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus-visible:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    รายละเอียดสิ่งของ
                                </label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => update('description', e.target.value)}
                                    rows={4}
                                    className="rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus-visible:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    เงื่อนไขการเช่า
                                </label>
                                <Textarea
                                    value={form.conditions}
                                    onChange={(e) => update('conditions', e.target.value)}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    ราคาเช่าต่อวัน (บาท)
                                </label>
                                <Input
                                    type="number"
                                    min="0.01"
                                    max="99999999.99"
                                    step="0.01"
                                    value={form.daily_price}
                                    onChange={(e) => update('daily_price', e.target.value)}

                                    required
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/my-items')}
                                    className="min-h-11 w-full rounded-xl border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
                                >
                                    ยกเลิก
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="min-h-11 w-full rounded-xl bg-blue-950 px-8 font-semibold text-white hover:bg-blue-800 sm:w-auto"
                                >
                                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                                </Button>

                            </div>
                        </form>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default EditItem;
