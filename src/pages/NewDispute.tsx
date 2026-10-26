import { buildApiUrl } from '@/lib/api';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    AlertCircle,
    FileWarning,
    Loader2,
    Send,
} from 'lucide-react';
import { apiGet } from '@/lib/api';

type EligibleRental = {
    rental_id: string;
    rental_status: string;
    created_at: string;
    fine_amount: string | number | null;
    fine_status: string | null;
    item_title: string;
    borrower_name: string | null;
    lender_name: string | null;
    my_role: 'borrower' | 'lender';
    has_open_dispute: boolean;
};

type EligibleRentalsResponse = {
    success: boolean;
    data: EligibleRental[];
    error?: string;
};

type CreateDisputeResponse = {
    success: boolean;
    data?: {
        dispute_id: string;
    };
    error?: string;
    message?: string;
};

const categories = [
    { value: 'fine', label: 'ข้อโต้แย้งเรื่องค่าปรับ' },
    { value: 'damage', label: 'ความเสียหายของสิ่งของ' },
    { value: 'return', label: 'สภาพสิ่งของตอนคืน' },
    { value: 'other', label: 'เรื่องร้องเรียนทั่วไป' },
] as const;

const NewDispute = () => {
    const navigate = useNavigate();

    const [rentals, setRentals] = useState<EligibleRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [rentalId, setRentalId] = useState('');
    const [category, setCategory] = useState('');
    const [reason, setReason] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadRentals = async () => {
            try {
                const result = await apiGet<EligibleRentalsResponse>(
                    '/api/disputes/eligible-rentals'
                );

                if (!result.success || !Array.isArray(result.data)) {
                    throw new Error(
                        result.error || 'ไม่สามารถโหลดรายการเช่าได้'
                    );
                }

                if (mounted) {
                    setRentals(result.data);
                }
            } catch (err) {
                if (mounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'เกิดข้อผิดพลาดในการโหลดรายการเช่า'
                    );
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void loadRentals();

        return () => {
            mounted = false;
        };
    }, []);

    const selectedRental = rentals.find(
        (rental) => rental.rental_id === rentalId
    );

    const canSubmit =
        !loading &&
        !submitting &&
        !!selectedRental &&
        !selectedRental.has_open_dispute &&
        categories.some((item) => item.value === category) &&
        reason.trim().length >= 10 &&
        reason.trim().length <= 3000;

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!canSubmit) return;

        setSubmitting(true);
        setSubmitError('');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
            }

            const response = await fetch(
                buildApiUrl('/disputes'),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        rental_id: rentalId,
                        category,
                        reason: reason.trim(),
                    }),
                }
            );

            const result: CreateDisputeResponse =
                await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || 'ไม่สามารถส่งคำร้องได้'
                );
            }

            // ไปหน้ารายการข้อพิพาทที่เปิดใช้งานแล้ว
            navigate('/disputes', { replace: true });
        } catch (err) {
            setSubmitError(
                err instanceof Error
                    ? err.message
                    : 'เกิดข้อผิดพลาดในการส่งคำร้อง'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24 text-foreground">
            <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
                <button
                    type="button"
                    onClick={() => navigate('/disputes')}
                    className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    กลับไปข้อพิพาทของฉัน
                </button>

                <div className="mb-7">
                    <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
                        <FileWarning className="h-7 w-7 text-primary" />
                        ยื่นข้อพิพาทใหม่
                    </h1>

                    <p className="mt-2 text-sm text-muted-foreground">
                        แจ้งปัญหาที่เกิดขึ้นจากการเช่า เพื่อให้ผู้ดูแลตรวจสอบ
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"
                >
                    <div className="space-y-2">
                        <label
                            htmlFor="dispute-rental"
                            className="text-sm font-semibold"
                        >
                            1. เลือกรายการเช่า
                        </label>

                        {loading ? (
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                กำลังโหลดรายการเช่า...
                            </p>
                        ) : error ? (
                            <p role="alert" className="text-sm text-destructive">
                                {error}
                            </p>
                        ) : rentals.length === 0 ? (
                            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                                ไม่พบรายการเช่าที่คุณเกี่ยวข้อง
                            </div>
                        ) : (
                            <select
                                id="dispute-rental"
                                value={rentalId}
                                onChange={(event) =>
                                    setRentalId(event.target.value)
                                }
                                required
                                disabled={submitting}
                                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">-- เลือกรายการเช่า --</option>

                                {rentals.map((rental) => (
                                    <option
                                        key={rental.rental_id}
                                        value={rental.rental_id}
                                        disabled={rental.has_open_dispute}
                                    >
                                        {rental.item_title} (
                                        {rental.my_role === 'borrower'
                                            ? 'ผู้เช่า'
                                            : 'ผู้ให้เช่า'}
                                        ) - {rental.rental_status}
                                        {rental.has_open_dispute
                                            ? ' - มีข้อพิพาทค้างอยู่'
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        )}

                        {selectedRental && (
                            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                                <p className="font-semibold">
                                    {selectedRental.item_title}
                                </p>

                                <p className="mt-2 text-muted-foreground">
                                    สถานะรายการเช่า: {selectedRental.rental_status}
                                </p>

                                <p className="mt-1 text-muted-foreground">
                                    บทบาทของคุณ:{' '}
                                    {selectedRental.my_role === 'borrower'
                                        ? 'ผู้เช่า'
                                        : 'ผู้ให้เช่า'}
                                </p>

                                <p className="mt-1 text-muted-foreground">
                                    ค่าปรับปัจจุบัน:{' '}
                                    ฿{Number(
                                        selectedRental.fine_amount ?? 0
                                    ).toLocaleString('th-TH')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="dispute-category"
                            className="text-sm font-semibold"
                        >
                            2. ประเภทข้อพิพาท
                        </label>

                        <select
                            id="dispute-category"
                            value={category}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                            required
                            disabled={submitting}
                            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">-- เลือกประเภทข้อพิพาท --</option>

                            {categories.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="dispute-reason"
                            className="text-sm font-semibold"
                        >
                            3. รายละเอียดข้อพิพาท
                        </label>

                        <textarea
                            id="dispute-reason"
                            value={reason}
                            onChange={(event) =>
                                setReason(event.target.value)
                            }
                            required
                            minLength={10}
                            maxLength={3000}
                            disabled={submitting}
                            rows={6}
                            placeholder="อธิบายเหตุการณ์ที่เกิดขึ้น ปัญหาที่พบ และสิ่งที่ต้องการให้ผู้ดูแลตรวจสอบ..."
                            className="w-full resize-y rounded-xl border border-input bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />

                        <p className="text-right text-xs text-muted-foreground">
                            {reason.trim().length}/3000 ตัวอักษร
                            (ขั้นต่ำ 10 ตัวอักษร)
                        </p>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <p>
                            กรุณาระบุข้อมูลตามความเป็นจริง
                            หลังส่งคำร้องแล้วจะสามารถติดตามสถานะได้ที่หน้าข้อพิพาทของฉัน
                            และจะเพิ่มหลักฐานประกอบได้ในหน้ารายละเอียดคำร้อง
                        </p>
                    </div>

                    {submitError && (
                        <p
                            role="alert"
                            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                        >
                            {submitError}
                        </p>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => navigate('/disputes')}
                            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    กำลังส่งคำร้อง...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    ส่งคำร้องข้อพิพาท
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default NewDispute;
