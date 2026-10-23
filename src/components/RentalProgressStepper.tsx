
import { Check } from "lucide-react";

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

type SlipStatus = "submitted" | "verified" | "rejected" | null;

type FineStatus =
    | "pending_confirmation"
    | "confirmed"
    | "pending"
    | "paid"
    | "waived"
    | "rejected"
    | null;

interface RentalProgressStepperProps {
    status: RentalStatus;
    paymentStatus?: "pending" | "paid" | "failed";
    slipStatus?: SlipStatus;
    fineAmount?: number | string | null;
    fineStatus?: FineStatus;
    fineSlipStatus?: SlipStatus;
    borrowerAccepted?: boolean;
    lenderAccepted?: boolean;

}

type Step = {
    key: string;
    label: string;
};

export default function RentalProgressStepper({
    status,
    paymentStatus = "pending",
    slipStatus = null,
    borrowerAccepted = false,
    lenderAccepted = false,
    fineAmount = null,
    fineStatus = null,
    fineSlipStatus = null,
}: RentalProgressStepperProps) {
    const isPaid = paymentStatus === "paid";
    const hasSubmittedSlip =
        slipStatus === "submitted" || slipStatus === "verified" || isPaid;
    const hasFine = Number(fineAmount ?? 0) > 0;
    const finePaid = fineStatus === "paid";
    const isCompleted = status === "completed";


    const steps: Step[] = [
        { key: "request", label: "ส่งคำขอ" },
        { key: "agreement", label: "ยอมรับสัญญา" },
        { key: "approved", label: "อนุมัติ" },
        { key: "payment", label: "รอชำระเงิน" },
        { key: "slip", label: "ตรวจสอบสลิป" },
        { key: "borrowing", label: "กำลังเช่า" },
        { key: "return", label: "คืนสิ่งของ" },
        { key: "inspection", label: "ตรวจสภาพสิ่งของ" },
        ...(hasFine
            ? [
                { key: "fine", label: "แจ้งค่าปรับ" },
                { key: "finePayment", label: "ชำระค่าปรับ" },
                { key: "fineSlip", label: "ตรวจสลิปค่าปรับ" },
            ]
            : []),
        { key: "completed", label: "เสร็จสิ้น" },
    ];

    const reachedApproval = [
        "approved",
        "borrowing",
        "return_requested",
        "inspection_pending",
        "fine_pending",
        "completed",
        "damaged",
    ].includes(status);

    const reachedBorrowing = [
        "borrowing",
        "return_requested",
        "inspection_pending",
        "fine_pending",
        "completed",
        "damaged",
    ].includes(status);

    const reachedReturn = [
        "return_requested",
        "inspection_pending",
        "fine_pending",
        "completed",
        "damaged",
    ].includes(status);

    const reachedInspection = [
        "inspection_pending",
        "fine_pending",
        "completed",
        "damaged",
    ].includes(status);

    // ขั้นตอนที่ผ่านแล้วต้องมีหลักฐานยืนยัน
    const done: Record<string, boolean> = {
        request: true,
        agreement:
            (borrowerAccepted && lenderAccepted) || reachedApproval,

        approved: reachedApproval,
        payment: reachedApproval && hasSubmittedSlip,
        slip: reachedApproval && isPaid,
        borrowing: reachedReturn,
        return: reachedInspection,
        inspection: status === "fine_pending" || isCompleted,
        fine:
            hasFine &&
            fineStatus !== null &&
            fineStatus !== "pending_confirmation" &&
            fineStatus !== "rejected",

        finePayment: hasFine && finePaid,
        fineSlip: hasFine && finePaid,
        completed: isCompleted,
    };

    // ป้องกันการแสดงขั้นตอนหลังการชำระเงินว่าเสร็จแล้ว
    // ถ้าฐานข้อมูลยังระบุว่าไม่ชำระ
    if (!isPaid) {
        for (const key of [
            "borrowing",
            "return",
            "inspection",
            "fine",
            "finePayment",
            "fineSlip",
            "completed",
        ]) {
            done[key] = false;
        }
    }

    // กรณีมีค่าปรับ ห้ามแสดงเสร็จสิ้นจนกว่าค่าปรับจะผ่าน
    if (hasFine && !finePaid) {
        done.completed = false;
    }

    const currentIndex = steps.findIndex((step) => !done[step.key]);
    const activeIndex =
        currentIndex === -1 ? steps.length - 1 : currentIndex;

    const paymentMessage = isPaid
        ? "ชำระเงินและตรวจสอบสลิปสำเร็จ"
        : slipStatus === "submitted"
            ? "ส่งสลิปแล้ว รอผู้ให้เช่าตรวจสอบ"
            : slipStatus === "rejected"
                ? "สลิปถูกปฏิเสธ กรุณาอัปโหลดใหม่"
                : "รอชำระเงิน";

    const fineMessage = finePaid
        ? "ผู้ให้เช่ายืนยันค่าปรับแล้ว"
        : fineSlipStatus === "submitted"
            ? "รอตรวจสอบสลิปค่าปรับ"
            : fineSlipStatus === "rejected"
                ? "สลิปค่าปรับถูกปฏิเสธ"
                : fineStatus === "pending_confirmation"
                    ? "รอผู้เช่ายืนยันค่าปรับ"
                    : "รอชำระค่าปรับ";

    if (status === "rejected") {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                รายการเช่านี้ถูกปฏิเสธ
            </div>
        );
    }


    return (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
            <div className="mb-6">
                <h2 className="text-base font-bold text-blue-950">
                    ความคืบหน้าการเช่าสิ่งของ
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                    ติดตามขั้นตอนการเช่าตั้งแต่ส่งคำขอจนเสร็จสิ้น
                </p>
            </div>

            <div className="space-y-0">
                {steps.map((step, index) => {
                    const completed = done[step.key];
                    const current = index === activeIndex && !completed;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.key} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${completed
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : current
                                            ? "border-blue-600 bg-blue-600 text-white"
                                            : "border-slate-200 bg-slate-50 text-slate-400"
                                        }`}
                                >
                                    {completed ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>

                                {!isLast && (
                                    <div
                                        className={`min-h-8 w-0.5 flex-1 ${completed && done[steps[index + 1].key]
                                            ? "bg-emerald-400"
                                            : "bg-slate-200"
                                            }`}
                                    />
                                )}
                            </div>

                            <div className={`flex-1 ${isLast ? "" : "pb-6"}`}>
                                <p
                                    className={`pt-2 text-sm ${completed
                                        ? "font-semibold text-emerald-700"
                                        : current
                                            ? "font-bold text-blue-700"
                                            : "font-medium text-slate-400"
                                        }`}
                                >
                                    {step.label}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {completed
                                        ? "ดำเนินการแล้ว"
                                        : current
                                            ? "กำลังดำเนินการ"
                                            : "ยังไม่ถึงขั้นตอนนี้"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
                {reachedApproval ? (
                    <p>
                        <span className="font-semibold text-slate-800">
                            สถานะการชำระเงิน:{" "}
                        </span>
                        <span className={isPaid ? "text-emerald-700" : "text-amber-700"}>
                            {paymentMessage}
                        </span>
                    </p>
                ) : (
                    <p>
                        <span className="font-semibold text-slate-800">
                            สถานะปัจจุบัน:{" "}
                        </span>
                        <span className="text-amber-700">
                            {borrowerAccepted && lenderAccepted
                                ? "รอผู้ให้เช่าอนุมัติคำขอ"
                                : "รอการยอมรับสัญญาให้ครบทั้งสองฝ่าย"}
                        </span>
                    </p>
                )}

                {hasFine && (
                    <p>
                        <span className="font-semibold text-slate-800">
                            ค่าปรับ:{" "}
                        </span>
                        ฿{Number(fineAmount).toLocaleString("th-TH")} —{" "}
                        <span className={finePaid ? "text-emerald-700" : "text-amber-700"}>
                            {fineMessage}
                        </span>
                    </p>
                )}

                {!isPaid && reachedBorrowing && (
                    <p className="text-xs font-medium text-red-600">
                        พบข้อมูลไม่สอดคล้องกัน: รายการเช่าดำเนินไปแล้ว
                        แต่ยังไม่มีการยืนยันชำระเงิน
                    </p>
                )}
            </div>
        </div>
    );

}
