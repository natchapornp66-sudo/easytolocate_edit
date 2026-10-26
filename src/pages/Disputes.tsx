
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    MessageSquareWarning,
    CalendarDays,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import { apiGet } from '@/lib/api';

type Dispute = {
    dispute_id: string;
    rental_id: string;
    reported_by: string;
    category: string | null;
    reason: string;
    status: string;
    decision: string | null;
    decision_reason: string | null;
    created_at: string;
    resolved_at: string | null;
    item_title: string | null;
    borrower_name: string | null;
    lender_name: string | null;
    reporter_name: string | null;
};

type DisputesResponse = {
    success: boolean;
    data: Dispute[];
    error?: string;
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'open':
            return 'รอการพิจารณา';
        case 'resolved':
            return 'พิจารณาแล้ว';
        default:
            return status;
    }
};

const getCategoryLabel = (category: string | null) => {
    switch (category) {
        case 'fine':
            return 'ข้อโต้แย้งเรื่องค่าปรับ';
        case 'damage':
            return 'ความเสียหายของสิ่งของ';
        case 'return':
            return 'สภาพสิ่งของตอนคืน';
        case 'other':
            return 'เรื่องร้องเรียนทั่วไป';
        default:
            return 'ไม่ระบุประเภท';
    }
};

const Disputes = () => {
    const navigate = useNavigate();

    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadDisputes = async () => {
            try {
                const response =
                    await apiGet<DisputesResponse>('/api/disputes');

                if (!response.success || !Array.isArray(response.data)) {
                    throw new Error(
                        response.error || 'ไม่สามารถโหลดข้อพิพาทได้'
                    );
                }

                if (mounted) {
                    setDisputes(response.data);
                    setError('');
                }
            } catch (err) {
                if (mounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
                    );
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void loadDisputes();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="min-h-screen bg-background pb-24 text-foreground">
            <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
                <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            ย้อนกลับ
                        </button>

                        <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
                            <MessageSquareWarning className="h-7 w-7 text-primary" />
                            ข้อพิพาทของฉัน
                        </h1>

                        <p className="mt-2 text-sm text-muted-foreground">
                            ตรวจสอบคำร้อง หลักฐาน และผลการพิจารณา
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/disputes/new')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        ยื่นข้อพิพาท
                    </button>
                </div>

                {loading && (
                    <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card p-10 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        กำลังโหลดข้อพิพาท...
                    </div>
                )}

                {!loading && error && (
                    <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5">
                        <p className="text-sm text-destructive">{error}</p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-3 text-sm font-medium underline"
                        >
                            ลองอีกครั้ง
                        </button>
                    </div>
                )}

                {!loading && !error && disputes.length === 0 && (
                    <div className="rounded-2xl border border-border bg-card px-5 py-14 text-center">
                        <MessageSquareWarning className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                        <h2 className="text-lg font-semibold">
                            ยังไม่มีข้อพิพาท
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            เมื่อคุณยื่นข้อพิพาทหรือเป็นคู่กรณี รายการจะปรากฏที่นี่
                        </p>
                    </div>
                )}

                {!loading && !error && disputes.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            ทั้งหมด {disputes.length} รายการ
                        </p>

                        {disputes.map((dispute) => (
                            <button
                                key={dispute.dispute_id}
                                type="button"
                                onClick={() =>
                                    navigate(`/disputes/${dispute.dispute_id}`)
                                }
                                className="w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-accent/40"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h2 className="truncate text-base font-semibold sm:text-lg">
                                            {dispute.item_title || 'ไม่พบชื่อสิ่งของ'}
                                        </h2>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {getCategoryLabel(dispute.category)}
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${dispute.status === 'open'
                                                ? 'bg-amber-500/10 text-amber-600'
                                                : dispute.status === 'resolved'
                                                    ? 'bg-green-500/10 text-green-600'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {getStatusLabel(dispute.status)}
                                    </span>
                                </div>

                                <p className="mt-3 line-clamp-2 whitespace-pre-wrap break-words text-sm text-foreground/80">
                                    {dispute.reason}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <CalendarDays className="h-4 w-4" />
                                        {new Date(dispute.created_at).toLocaleDateString('th-TH')}
                                    </span>

                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                                        ดูรายละเอียด
                                        <ChevronRight className="h-4 w-4" />
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Disputes;
