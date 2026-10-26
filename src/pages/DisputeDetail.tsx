import { API_BASE_URL } from '@/lib/api';

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    FileImage,
    Loader2,
    Upload,
} from 'lucide-react';
import { apiGet } from '@/lib/api';

type Dispute = {
    dispute_id: string;
    rental_id: string | null;
    category: string | null;
    reason: string;
    status: string;
    decision: string | null;
    decision_reason: string | null;
    adjusted_fine_amount: number | string | null;
    created_at: string;
    resolved_at: string | null;
    item_title: string | null;
    reporter_name: string | null;
    borrower_name: string | null;
    lender_name: string | null;
};

type Evidence = {
    evidence_id: string;
    dispute_id: string;
    uploaded_by: string;
    uploader_name: string | null;
    description?: string | null;
    created_at: string;
};

type DisputeMessage = {
    message_id: string;
    dispute_id: string;
    sender_id: string;
    sender_name: string;
    sender_role: 'borrower' | 'lender' | 'admin';
    message: string;
    created_at: string;
};


type ApiResponse<T> = {
    success: boolean;
    data: T;
    error?: string;
};

const categoryLabels: Record<string, string> = {
    fine: 'ข้อโต้แย้งเรื่องค่าปรับ',
    damage: 'ความเสียหายของสิ่งของ',
    return: 'สภาพสิ่งของตอนคืน',
    other: 'เรื่องร้องเรียนทั่วไป',
};

const decisionLabels: Record<string, string> = {
    general: 'พิจารณาเรื่องร้องเรียนทั่วไป',
    uphold: 'ยืนยันค่าปรับเดิม',
    adjust: 'ปรับลดค่าปรับ',
    waive: 'ยกเลิกค่าปรับ',
};

const API_URL = API_BASE_URL;

const EvidenceImage = ({
    disputeId,
    evidenceId,
}: {
    disputeId: string;
    evidenceId: string;
}) => {
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        let objectUrl: string | null = null;

        const load = async () => {
            try {
                const token = localStorage.getItem('token');

                const response = await fetch(
                    `${API_URL}/api/disputes/${disputeId}/evidence/${evidenceId}/file`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error('ไม่สามารถเปิดภาพได้');
                }

                const blob = await response.blob();

                if (!['image/jpeg', 'image/png'].includes(blob.type)) {
                    throw new Error('ไฟล์ไม่ใช่ภาพที่รองรับ');
                }

                if (controller.signal.aborted) return;

                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(
                        err instanceof Error ? err.message : 'โหลดภาพไม่สำเร็จ'
                    );
                }
            }
        };

        void load();

        return () => {
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [disputeId, evidenceId]);

    if (error) {
        return <p className="text-sm text-red-500">{error}</p>;
    }

    if (!url) {
        return (
            <p className="text-sm text-muted-foreground">
                กำลังโหลดภาพ...
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <img
                src={url}
                alt="รูปหลักฐานข้อพิพาท"
                className="max-h-64 w-full rounded-xl border border-border object-contain"
            />
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline"
            >
                เปิดรูปภาพขนาดเต็ม
            </a>
        </div>
    );
};

const DisputeDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [dispute, setDispute] = useState<Dispute | null>(null);
    const [evidence, setEvidence] = useState<Evidence[]>([]);

    const [messages, setMessages] = useState<DisputeMessage[]>([]);
    const [messageText, setMessageText] = useState('');
    const [messageSubmitting, setMessageSubmitting] = useState(false);
    const [messageError, setMessageError] = useState('');
    const [messageSuccess, setMessageSuccess] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');

    const loadData = async () => {
        if (!id) return;

        setError('');

        try {
            const detailResult = await apiGet<
                ApiResponse<Dispute | { dispute: Dispute }>
            >(`/api/disputes/${id}`);

            if (!detailResult.success) {
                throw new Error(
                    detailResult.error || 'ไม่สามารถโหลดข้อพิพาทได้'
                );
            }

            const raw = detailResult.data;

            const detail =
                'dispute' in raw ? raw.dispute : raw;

            if (!detail?.dispute_id) {
                throw new Error('รูปแบบข้อมูลข้อพิพาทไม่ถูกต้อง');
            }

            setDispute(detail);

            const evidenceResult = await apiGet<ApiResponse<Evidence[]>>(
                `/api/disputes/${id}/evidence`
            );

            if (!evidenceResult.success ||
                !Array.isArray(evidenceResult.data)) {
                throw new Error(
                    evidenceResult.error || 'ไม่สามารถโหลดหลักฐานได้'
                );
            }

            setEvidence(evidenceResult.data);

            const messagesResult = await apiGet<
                ApiResponse<DisputeMessage[]>
            >(`/api/disputes/${id}/messages`);

            if (
                !messagesResult.success ||
                !Array.isArray(messagesResult.data)
            ) {
                throw new Error(
                    messagesResult.error || 'ไม่สามารถโหลดคำชี้แจงได้'
                );
            }

            setMessages(messagesResult.data);

        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        const run = async () => {
            if (active) await loadData();
        };

        void run();

        return () => {
            active = false;
        };
    }, [id]);

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selected = Array.from(event.target.files ?? []);

        setUploadError('');
        setUploadSuccess('');

        if (selected.length > 5) {
            setUploadError('เลือกได้สูงสุด 5 รูป');
            event.target.value = '';
            return;
        }

        const valid = selected.every(
            (file) =>
                ['image/jpeg', 'image/png'].includes(file.type) &&
                file.size <= 5 * 1024 * 1024
        );

        if (!valid) {
            setUploadError(
                'รองรับ JPG/PNG ขนาดไม่เกิน 5 MB ต่อรูป'
            );
            event.target.value = '';
            return;
        }

        setFiles(selected);
    };

    const handleUpload = async () => {
        if (!id || files.length === 0 || uploading) return;

        setUploading(true);
        setUploadError('');
        setUploadSuccess('');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
            }

            const formData = new FormData();

            files.forEach((file) => {
                formData.append('photos', file);
            });

            const response = await fetch(
                `${API_URL}/api/disputes/${id}/evidence`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || 'อัปโหลดหลักฐานไม่สำเร็จ'
                );
            }

            setFiles([]);
            setUploadSuccess('อัปโหลดหลักฐานเรียบร้อยแล้ว');

            await loadData();
        } catch (err) {
            setUploadError(
                err instanceof Error
                    ? err.message
                    : 'อัปโหลดไม่สำเร็จ'
            );
        } finally {
            setUploading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!id || messageSubmitting || dispute?.status !== 'open') {
            return;
        }

        const text = messageText.trim();

        if (text.length < 10 || text.length > 3000) {
            setMessageError('กรุณากรอกคำชี้แจง 10–3000 ตัวอักษร');
            return;
        }

        setMessageSubmitting(true);
        setMessageError('');
        setMessageSuccess('');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
            }

            const response = await fetch(
                `${API_URL}/api/disputes/${id}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        message: text,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || 'ไม่สามารถส่งคำชี้แจงได้'
                );
            }

            setMessageText('');

            // โหลดคำชี้แจงใหม่หลังส่งสำเร็จ
            const updated = await apiGet<
                ApiResponse<DisputeMessage[]>
            >(`/api/disputes/${id}/messages`);

            if (!updated.success || !Array.isArray(updated.data)) {
                throw new Error(
                    updated.error || 'ส่งสำเร็จ แต่ไม่สามารถโหลดรายการล่าสุดได้'
                );
            }

            setMessages(updated.data);
            setMessageSuccess('ส่งคำชี้แจงเรียบร้อยแล้ว');
        } catch (err) {
            setMessageError(
                err instanceof Error
                    ? err.message
                    : 'เกิดข้อผิดพลาดในการส่งคำชี้แจง'
            );
        } finally {
            setMessageSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-background pb-24 text-foreground">
            <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
                <button
                    type="button"
                    onClick={() => navigate('/disputes')}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    กลับไปข้อพิพาทของฉัน
                </button>

                <h1 className="text-2xl font-bold sm:text-3xl">
                    รายละเอียดข้อพิพาท
                </h1>

                {loading && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        กำลังโหลดข้อมูล...
                    </p>
                )}

                {error && (
                    <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-600">
                        {error}
                    </p>
                )}

                {!loading && dispute && (
                    <>
                        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-xl font-semibold">
                                    {dispute.item_title || 'รายการเช่า'}
                                </h2>

                                <span className={`rounded-full px-3 py-1 text-sm ${dispute.status === 'open'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-green-100 text-green-700'
                                    }`}>
                                    {dispute.status === 'open'
                                        ? 'รอการพิจารณา'
                                        : dispute.status === 'resolved'
                                            ? 'พิจารณาแล้ว'
                                            : dispute.status}
                                </span>
                            </div>

                            <p className="mt-3 text-sm text-muted-foreground">
                                ประเภท: {
                                    categoryLabels[dispute.category ?? ''] ||
                                    'ไม่ระบุประเภท'
                                }
                            </p>

                            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                ยื่นเมื่อ {
                                    new Date(dispute.created_at).toLocaleString('th-TH')
                                }
                            </p>

                            <div className="mt-5 space-y-2 text-sm">
                                <p>ผู้ร้องเรียน: {dispute.reporter_name || 'ไม่ระบุ'}</p>
                                <p>ผู้เช่า: {dispute.borrower_name || 'ไม่ระบุ'}</p>
                                <p>ผู้ให้เช่า: {dispute.lender_name || 'ไม่ระบุ'}</p>
                            </div>

                            <div className="mt-5 rounded-xl bg-muted/40 p-4">
                                <h3 className="font-semibold">รายละเอียดปัญหา</h3>
                                <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                                    {dispute.reason}
                                </p>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <FileImage className="h-5 w-5" />
                                หลักฐานเพิ่มเติมจากคู่กรณี
                            </h2>

                            {evidence.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    ยังไม่มีการแนบหลักฐานเพิ่มเติม
                                </p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {evidence.map((item) => (
                                        <div
                                            key={item.evidence_id}
                                            className="space-y-3 rounded-xl border border-border p-4"
                                        >
                                            <p className="text-sm font-medium">
                                                ผู้ส่ง: {item.uploader_name || 'ไม่ระบุ'}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {new Date(item.created_at).toLocaleString('th-TH')}
                                            </p>

                                            {item.description && (
                                                <p className="whitespace-pre-wrap text-sm">
                                                    {item.description}
                                                </p>
                                            )}

                                            <EvidenceImage
                                                disputeId={dispute.dispute_id}
                                                evidenceId={item.evidence_id}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {dispute.status === 'open' && (
                                <div className="mt-6 space-y-4 border-t border-border pt-5">
                                    <h3 className="font-semibold">
                                        แนบรูปหลักฐาน
                                    </h3>

                                    <p className="text-sm text-muted-foreground">
                                        JPG หรือ PNG สูงสุด 5 รูปต่อคนต่อข้อพิพาท
                                        ขนาดไม่เกิน 5 MB ต่อรูป
                                    </p>

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        multiple
                                        disabled={uploading}
                                        onChange={handleFileChange}
                                        className="block w-full rounded-lg border border-border p-3 text-sm"
                                    />

                                    {files.length > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            เลือกแล้ว {files.length} รูป
                                        </p>
                                    )}

                                    {uploadError && (
                                        <p role="alert" className="text-sm text-red-600">
                                            {uploadError}
                                        </p>
                                    )}

                                    {uploadSuccess && (
                                        <p className="flex items-center gap-2 text-sm text-green-700">
                                            <CheckCircle2 className="h-4 w-4" />
                                            {uploadSuccess}
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleUpload}
                                        disabled={uploading || files.length === 0}
                                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                                    >
                                        {uploading
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Upload className="h-4 w-4" />}
                                        {uploading
                                            ? 'กำลังอัปโหลด...'
                                            : 'อัปโหลดหลักฐาน'}
                                    </button>
                                </div>
                            )}

                            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                                <h2 className="text-lg font-semibold">
                                    คำชี้แจงจากคู่กรณี
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    ข้อความชี้แจงจะถูกเก็บเป็นประวัติ
                                    เพื่อให้ผู้ดูแลตรวจสอบข้อมูลจากทั้งสองฝ่าย
                                </p>

                                <div className="mt-5 space-y-3">
                                    {messages.length === 0 ? (
                                        <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                                            ยังไม่มีคำชี้แจงจากคู่กรณี
                                        </p>
                                    ) : (
                                        messages.map((item) => (
                                            <div
                                                key={item.message_id}
                                                className="rounded-xl border border-border bg-muted/20 p-4"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm font-semibold">
                                                            {item.sender_name || 'ไม่ระบุชื่อ'}
                                                        </span>

                                                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                                            {item.sender_role === 'borrower'
                                                                ? 'ผู้เช่า'
                                                                : item.sender_role === 'lender'
                                                                    ? 'ผู้ให้เช่า'
                                                                    : 'ผู้ดูแล'}
                                                        </span>
                                                    </div>

                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(item.created_at).toLocaleString('th-TH')}
                                                    </span>
                                                </div>

                                                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">
                                                    {item.message}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {dispute.status === 'open' && (
                                    <div className="mt-6 border-t border-border pt-5">
                                        <label
                                            htmlFor="dispute-message"
                                            className="text-sm font-semibold"
                                        >
                                            ส่งคำชี้แจงเพิ่มเติม
                                        </label>

                                        <textarea
                                            id="dispute-message"
                                            value={messageText}
                                            onChange={(event) => {
                                                setMessageText(event.target.value);
                                                setMessageError('');
                                                setMessageSuccess('');
                                            }}
                                            disabled={messageSubmitting}
                                            maxLength={3000}
                                            rows={5}
                                            placeholder="อธิบายข้อเท็จจริง เหตุการณ์ หรือโต้แย้งหลักฐานที่อีกฝ่ายส่งมา..."
                                            className="mt-3 w-full resize-y rounded-xl border border-input bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                                        />

                                        <p className="mt-1 text-right text-xs text-muted-foreground">
                                            {messageText.trim().length}/3000 ตัวอักษร
                                            (ขั้นต่ำ 10 ตัวอักษร)
                                        </p>

                                        {messageError && (
                                            <p role="alert" className="mt-3 text-sm text-red-600">
                                                {messageError}
                                            </p>
                                        )}

                                        {messageSuccess && (
                                            <p role="status" className="mt-3 text-sm text-green-700">
                                                {messageSuccess}
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            disabled={
                                                messageSubmitting ||
                                                messageText.trim().length < 10 ||
                                                messageText.trim().length > 3000
                                            }
                                            onClick={handleSendMessage}
                                            className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {messageSubmitting
                                                ? 'กำลังส่งคำชี้แจง...'
                                                : 'ส่งคำชี้แจง'}
                                        </button>
                                    </div>
                                )}
                            </section>

                        </section>

                        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                            <h2 className="text-lg font-semibold">
                                ผลการพิจารณาจาก Admin
                            </h2>

                            {dispute.status !== 'resolved' ? (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    คำร้องอยู่ระหว่างรอการตรวจสอบ
                                </p>
                            ) : (
                                <div className="mt-4 space-y-3 text-sm">
                                    <p className="font-medium text-green-700">
                                        {decisionLabels[dispute.decision ?? ''] ||
                                            'ปิดข้อพิพาทด้วยระบบเดิม'}
                                    </p>

                                    <p className="whitespace-pre-wrap break-words">
                                        {dispute.decision_reason ||
                                            'ไม่มีบันทึกเหตุผลการตัดสิน'}
                                    </p>

                                    {dispute.decision === 'adjust' &&
                                        dispute.adjusted_fine_amount !== null && (
                                            <p>
                                                ค่าปรับตามผลพิจารณา: ฿{
                                                    Number(
                                                        dispute.adjusted_fine_amount
                                                    ).toLocaleString('th-TH')
                                                }
                                            </p>
                                        )}

                                    {dispute.resolved_at && (
                                        <p className="text-muted-foreground">
                                            วันที่พิจารณา: {
                                                new Date(
                                                    dispute.resolved_at
                                                ).toLocaleString('th-TH')
                                            }
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default DisputeDetail;
