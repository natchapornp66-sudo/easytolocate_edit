
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import RentalProgressStepper from "@/components/RentalProgressStepper";
import { apiGet, fetchRentalPayments, } from "@/lib/api";

type RentalStatus =
    | "pending"
    | "approved"
    | "borrowing"
    | "return_requested"
    | "inspection_pending"
    | "fine_pending"
    | "completed"
    | "damaged"
    | "rejected";

interface RentalDetailData {
    id: string;
    item_title: string;
    borrower_name: string;
    owner_name: string;
    status: RentalStatus;
    payment_status: "pending" | "paid" | "failed";
    total_price: number | string;
    fine_amount?: number | string | null;
    fine_status?: "pending_confirmation" | "confirmed" | "pending" | "paid" | "waived" | "rejected" | null;
    borrower_accepted: boolean;
    lender_accepted: boolean;
}
type SlipStatus =
    | "submitted"
    | "verified"
    | "rejected"
    | null;

const rentalStatusLabels: Record<RentalStatus, string> = {
    pending: "รอผู้ให้เช่าพิจารณาคำขอ",
    approved: "อนุมัติแล้ว รอชำระเงินและส่งมอบสิ่งของ",
    borrowing: "กำลังเช่า",
    return_requested: "แจ้งคืนสิ่งของแล้ว รอผู้ให้เช่าตรวจรับ",
    inspection_pending: "อยู่ระหว่างตรวจสอบสภาพสิ่งของ",
    fine_pending: "รอดำเนินการเรื่องค่าปรับ",
    completed: "เสร็จสิ้นการเช่า",
    damaged: "พบความเสียหายของสิ่งของ",
    rejected: "คำขอเช่าถูกปฏิเสธ",
};
const RentalDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [slipStatus, setSlipStatus] = useState<SlipStatus>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [rental, setRental] = useState<RentalDetailData | null>(null);

    useEffect(() => {
        if (!id) {
            setError("ไม่พบหมายเลขรายการเช่า");
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const loadRental = async () => {
            setIsLoading(true);
            setError("");

            try {
                const response = await apiGet<{
                    success: boolean;
                    data: RentalDetailData;
                }>(`/api/rentals/${id}`);

                if (!response.success || !response.data) {
                    throw new Error("ไม่พบข้อมูลรายการเช่า");
                }

                const paymentsResponse = await fetchRentalPayments(id);

                // รองรับกรณี API ส่งเป็น array โดยตรง
                // หรือส่งในรูปแบบ { success: true, data: [...] }
                const paymentData = paymentsResponse as unknown;

                const payments = Array.isArray(paymentData)
                    ? paymentData
                    : (
                        paymentData &&
                            typeof paymentData === "object" &&
                            "data" in paymentData &&
                            Array.isArray(paymentData.data)
                            ? paymentData.data
                            : []
                    );

                const rentalPayments = payments.filter(
                    (payment: {
                        payment_type?: string;
                    }) => payment.payment_type === "rental"
                );

                const latestPayment = [...rentalPayments].sort(
                    (
                        a: { created_at?: string },
                        b: { created_at?: string }
                    ) =>
                        new Date(b.created_at || 0).getTime() -
                        new Date(a.created_at || 0).getTime()
                )[0];

                if (isMounted) {
                    setRental(response.data);

                    const status = latestPayment?.status;

                    setSlipStatus(
                        status === "submitted" ||
                            status === "verified" ||
                            status === "rejected"
                            ? status
                            : null
                    );
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "โหลดรายละเอียดการเช่าไม่สำเร็จ"
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadRental();

        return () => {
            isMounted = false;
        };
    }, [id]);


    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* ส่วนหัว */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 px-4 pb-20 pt-8 text-white">
                <div className="mx-auto max-w-6xl">
                    <button
                        type="button"
                        onClick={() => navigate("/transactions")}
                        className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        กลับไปรายการเช่า
                    </button>

                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        รายละเอียดการเช่าสิ่งของ
                    </h1>

                    <p className="mt-2 text-sm text-blue-100">
                        ติดตามสถานะและขั้นตอนการเช่าสิ่งของของคุณ
                    </p>
                </div>
            </div>

            {/* พื้นที่เนื้อหา */}
            <main className="relative mx-auto -mt-12 max-w-6xl px-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                    <p className="break-all text-xs text-slate-500">
                        หมายเลขรายการเช่า: {id}
                    </p>

                    {isLoading && (
                        <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                            กำลังโหลดรายละเอียดการเช่า...
                        </div>
                    )}

                    {!isLoading && error && (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && rental && (
                        <>
                            {/* ข้อมูลสิ่งของ */}
                            <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <h2 className="text-base font-bold text-slate-900">
                                    ข้อมูลการเช่าสิ่งของ
                                </h2>

                                <div className="mt-4 space-y-4 text-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <span className="text-slate-500">สิ่งของ</span>
                                        <span className="break-words text-left font-semibold text-slate-900 sm:text-right">
                                            {rental.item_title}
                                        </span>
                                    </div>

                                    <div className="flex items-start justify-between gap-4">
                                        <span className="text-slate-500">ผู้เช่า</span>
                                        <span className="break-words text-left font-medium text-slate-800 sm:text-right">
                                            {rental.borrower_name}
                                        </span>
                                    </div>

                                    <div className="flex items-start justify-between gap-4">
                                        <span className="text-slate-500">ผู้ให้เช่า</span>
                                        <span className="break-words text-left font-medium text-slate-800 sm:text-right">
                                            {rental.owner_name}
                                        </span>
                                    </div>

                                    <div className="border-t border-dashed border-slate-200 pt-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="font-semibold text-slate-800">
                                                ค่าเช่ารวม
                                            </span>
                                            <span className="text-xl font-bold text-blue-700">
                                                ฿{Number(rental.total_price).toLocaleString("th-TH")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ขั้นตอนการเช่า */}
                            <section className="mt-6">
                                <div className="mb-5">
                                    <h2 className="text-lg font-bold text-blue-950">
                                        ขั้นตอนการเช่าสิ่งของ
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        แสดงความคืบหน้าของรายการเช่าปัจจุบัน
                                    </p>
                                </div>

                                <RentalProgressStepper
                                    status={rental.status}
                                    paymentStatus={rental.payment_status ?? "pending"}
                                    slipStatus={slipStatus}
                                    borrowerAccepted={rental.borrower_accepted}
                                    lenderAccepted={rental.lender_accepted}
                                    fineAmount={rental.fine_amount}
                                    fineStatus={rental.fine_status}
                                />
                            </section>

                            {/* สถานะปัจจุบัน */}
                            <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                                <h2 className="text-sm font-semibold text-blue-950">
                                    สถานะการเช่าปัจจุบัน
                                </h2>

                                <p className="mt-2 text-base font-semibold text-blue-700">
                                    {rentalStatusLabels[rental.status] ?? "ไม่ทราบสถานะ"}
                                </p>
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    );

};

export default RentalDetail;
