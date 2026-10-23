import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Transaction, TransactionStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle2, FileText, MapPin, ShieldAlert, XCircle, Star, ListChecks, } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAuthSession } from '@/lib/auth';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  apiGet, apiPost, apiPatch, fetchAgreementByRentalId, signAgreement, uploadRentalPhotos, uploadRentalPaymentSlip, fetchRentalPayments, verifyRentalPayment, type RentalPayment,
} from '@/lib/api';

type RentalView = 'borrowed' | 'lent';
type RentalFilter = 'all' | TransactionStatus;

const mainTabs: { key: RentalView; label: string }[] = [
  { key: 'borrowed', label: 'ของที่ฉันเช่า' },
  { key: 'lent', label: 'ของที่คนอื่นเช่า' },
];

const filterTabs: { key: RentalFilter; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รออนุมัติ' },
  { key: 'approved', label: 'อนุมัติ' },
  { key: 'borrowing', label: 'กำลังเช่า' },
  { key: 'return_requested', label: 'รอตรวจรับคืน' },
  { key: 'completed', label: 'เสร็จสิ้น' },
  { key: 'damaged', label: 'เสียหาย' },
  { key: 'inspection_pending', label: 'กำลังตรวจสภาพ' },
];

const formatPrice = (value?: number) => `฿${(value ?? 0).toLocaleString()}`;
const formatDate = (value?: string) => {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
const ReviewPhotoPreview = ({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) => {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="relative">
      <img
        src={previewUrl}
        alt="รูปภาพประกอบรีวิว"
        className="h-24 w-full rounded-lg border object-cover"
      />

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-red-600 px-2 py-1 text-xs text-white"
      >
        ✕
      </button>
    </div>
  );
};

const Transactions = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<RentalView>('borrowed');
  const [activeFilter, setActiveFilter] = useState<RentalFilter>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentRentalId, setPaymentRentalId] = useState<string | null>(null);
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [showPaymentReviewDialog, setShowPaymentReviewDialog] = useState(false);
  const [reviewPayments, setReviewPayments] = useState<RentalPayment[]>([]);
  const [paymentReviewLoading, setPaymentReviewLoading] = useState(false);
  const [paymentReviewSubmitting, setPaymentReviewSubmitting] = useState(false);
  const [paymentRejectionReason, setPaymentRejectionReason] = useState('');
  type SlipStatus = 'submitted' | 'verified' | 'rejected' | null;

  const [slipStatuses, setSlipStatuses] = useState<
    Record<string, SlipStatus>
  >({});
  const [handoverPhotos, setHandoverPhotos] = useState<
    Record<string, boolean>
  >({});
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);

  type Agreement = {
    agreement_id: string;
    rental_id: string;
    contract_terms: string;
    borrower_accepted: boolean;
    lender_accepted: boolean;
    borrower_accepted_at: string | null;
    lender_accepted_at: string | null;
    accepted_at: string | null;
  };

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [agreementSubmitting, setAgreementSubmitting] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [inspectionFine, setInspectionFine] = useState('');
  const [inspectionFineReason, setInspectionFineReason] = useState('');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRental, setReviewRental] = useState<Transaction | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const handleReviewPhotosChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    const validFiles = files.filter(
      (file) =>
        allowedTypes.includes(file.type) &&
        file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== files.length) {
      toast({
        title: 'รูปภาพบางไฟล์ไม่ถูกต้อง',
        description: 'รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 5 MB ต่อรูป',
        variant: 'destructive',
      });
    }

    setReviewPhotos((current) => [...current, ...validFiles].slice(0, 5));

    event.target.value = '';
  };

  const removeReviewPhoto = (index: number) => {
    setReviewPhotos((current) =>
      current.filter((_, i) => i !== index)
    );
  };
  type PhotoUploadMode = 'lenderBefore' | 'beforeUse' | 'afterUse';
  const [photoUploadMode, setPhotoUploadMode] =
    useState<PhotoUploadMode>('afterUse');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  type RentalInspection = {
    inspection_id: string;
    inspection_type: string;
    photo_urls: string[];
    created_at: string;
  };

  const [inspectionPhotos, setInspectionPhotos] = useState<RentalInspection[]>([]);
  const [inspectionPhotosLoading, setInspectionPhotosLoading] = useState(false);
  const [inspectionPhotosError, setInspectionPhotosError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadTransactions = async () => {
      setIsLoading(true);
      setError('');

      try {
        const session = getAuthSession();

        if (!session.userId) {
          if (isMounted) {
            setTransactions([]);
            setError('ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
          }
          return;
        }

        const response = await apiGet<Transaction[]>(
          `/api/rentals?view=${activeView}&userId=${session.userId}`
        );

        const rentalList = Array.isArray(response) ? response : [];

        const handoverEntries = await Promise.all(
          rentalList.map(async (txn) => {
            try {
              const response = await apiGet<{
                success: boolean;
                data: RentalInspection[];
              }>(`/api/rentals/${txn.id}/photos`);

              const hasPhoto = (response.data ?? []).some(
                (photo) => photo.inspection_type === 'lender_before'
              );

              return [txn.id, hasPhoto] as const;
            } catch {
              return [txn.id, false] as const;
            }
          })
        );

        const slipEntries = await Promise.all(
          rentalList.map(async (txn) => {
            try {
              const result = await fetchRentalPayments(txn.id);

              const payments = (result.data ?? [])
                .filter((payment) => payment.payment_type === 'rental')
                .sort(
                  (a, b) =>
                    new Date(b.created_at ?? 0).getTime() -
                    new Date(a.created_at ?? 0).getTime()
                );

              const status = payments[0]?.status;

              const slipStatus: SlipStatus =
                status === 'submitted' ||
                  status === 'verified' ||
                  status === 'rejected'
                  ? status
                  : null;

              return [txn.id, slipStatus] as const;
            } catch (err) {
              console.error(`Load slip status error: ${txn.id}`, err);
              return [txn.id, null] as const;
            }
          })
        );

        if (isMounted) {
          setTransactions(rentalList);
          setSlipStatuses(Object.fromEntries(slipEntries));
          setHandoverPhotos(Object.fromEntries(handoverEntries));
        }
      } catch (err) {
        console.error('Load transactions error:', err);

        if (isMounted) {
          setTransactions([]);
          setError('ไม่สามารถโหลดข้อมูลรายการเช่าได้ในขณะนี้');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      isMounted = false;
    };
  }, [activeView]);

  const visibleTransactions = useMemo(() => {
    if (activeFilter === 'all') {
      return transactions;
    }

    if (activeFilter === 'damaged') {
      return transactions.filter(
        (txn) =>
          txn.status === 'damaged' ||
          txn.status === 'fine_pending' ||
          (txn.status === 'completed' && (txn.fine_amount ?? 0) > 0)
      );
    }

    return transactions.filter(
      (txn) => txn.status === activeFilter
    );
  }, [activeFilter, transactions]);

  const updateTransactionStatus = (
    txnId: string,
    nextStatus: TransactionStatus,
    extra: Partial<Transaction> = {},
  ) => {
    setTransactions((current) =>
      current.map((txn) => {
        if (txn.id !== txnId) return txn;
        return { ...txn, ...extra, status: nextStatus };
      }),
    );
  };

  const selectedTransaction =
    visibleTransactions.find((txn) => txn.id === selectedId) ?? visibleTransactions[0] ?? null;

  const photoSets: Record<'beforeRental' | 'beforeUse' | 'afterUse', string[]> = {
    beforeRental: [],
    beforeUse: [],
    afterUse: [],
  };

  const apiOrigin = 'http://localhost:5000';

  const toImageUrl = (url: string) => {
    if (!url) return '';

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return `${apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const latestPhotoSets = new Set<string>();

  inspectionPhotos.forEach((photo) => {
    const type = photo.inspection_type;

    if (latestPhotoSets.has(type)) return;

    latestPhotoSets.add(type);

    const urls = (photo.photo_urls ?? []).map(toImageUrl);

    switch (type) {
      case 'lender_before':
        photoSets.beforeRental = urls;
        break;

      case 'borrower_before':
        photoSets.beforeUse = urls;
        break;

      case 'borrower_after':
        photoSets.afterUse = urls;
        break;
    }
  });
  const openContractDialog = async (txnId: string) => {
    setSelectedId(txnId);
    setAgreement(null);
    setAgreementChecked(false);
    setShowContractDialog(true);
    setAgreementLoading(true);

    try {
      const response = await fetchAgreementByRentalId(txnId);

      setAgreement(response.data);
    } catch (err) {
      console.error('Load agreement error:', err);

      toast({
        title: 'โหลดสัญญาไม่สำเร็จ',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setAgreementLoading(false);
    }
  };

  const handleStartInspection = async (txnId: string) => {
    try {
      await apiPatch(`/rentals/${txnId}/status`, {
        status: 'inspection_pending',
      });

      updateTransactionStatus(txnId, 'inspection_pending');

      toast({
        title: 'เริ่มตรวจสภาพสิ่งของแล้ว',
        description: 'กรุณาตรวจสอบสภาพสิ่งของก่อนยืนยันผล',
      });
    } catch (err: any) {
      toast({
        title: 'เริ่มตรวจสภาพไม่สำเร็จ',
        description: err?.message || 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const openInspectionDialog = async (txnId: string) => {
    setSelectedId(txnId);
    setInspectionFine('');
    setInspectionFineReason('');
    setInspectionPhotos([]);
    setInspectionPhotosError('');
    setShowInspectionDialog(true);
    setInspectionPhotosLoading(true);

    try {
      const response = await apiGet<{
        success: boolean;
        data: RentalInspection[];
      }>(`/api/rentals/${txnId}/photos`);

      setInspectionPhotos(response.data ?? []);

    } catch (err) {
      console.error('Load inspection photos error:', err);

      setInspectionPhotosError('ไม่สามารถโหลดภาพตรวจสอบสภาพได้');

      toast({
        title: 'โหลดรูปภาพไม่สำเร็จ',
        description: 'กรุณาปิดหน้าต่างแล้วลองใหม่อีกครั้ง',
        variant: 'destructive',
      });

    } finally {
      setInspectionPhotosLoading(false);
    }
  };

  const openPhotoUploadDialog = (
    txnId: string,
    mode: PhotoUploadMode
  ) => {
    setSelectedId(txnId);
    setPhotoUploadMode(mode);
    setUploadedFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setShowReturnDialog(true);
  };


  const openReviewDialog = (txnId: string) => {
    setSelectedId(txnId);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewDialog(true);
  };

  const handlePhotoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const validFiles = files.filter((file) => /image\/(jpeg|png)/i.test(file.type));
    setUploadedFiles(validFiles.slice(0, 5));
  };

  const openPaymentDialog = (rentalId: string) => {
    setPaymentRentalId(rentalId);
    setPaymentSlip(null);
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentRentalId || !paymentSlip || paymentSubmitting) return;

    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(paymentSlip.type) ||
      paymentSlip.size > 5 * 1024 * 1024
    ) {
      toast({
        title: 'ไฟล์ไม่ถูกต้อง',
        description: 'รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5 MB',
        variant: 'destructive',
      });
      return;
    }

    setPaymentSubmitting(true);

    try {
      await uploadRentalPaymentSlip(paymentRentalId, paymentSlip);
      setSlipStatuses((current) => ({
        ...current,
        [paymentRentalId]: 'submitted',
      }));

      toast({
        title: 'อัปโหลดสลิปสำเร็จ',
        description: 'ส่งหลักฐานการชำระเงินแล้ว รอผู้ให้เช่าตรวจสอบ',
      });

      setShowPaymentDialog(false);
      setPaymentRentalId(null);
      setPaymentSlip(null);
    } catch (err: any) {
      toast({
        title: 'อัปโหลดสลิปไม่สำเร็จ',
        description: err?.message || 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleConfirmReceipt = async (txnId: string) => {
    if (receiptSubmitting) return;

    setReceiptSubmitting(true);

    try {
      await apiPatch(`/rentals/${txnId}/confirm-receipt`, {});

      updateTransactionStatus(txnId, 'borrowing', {
        return_requested: false,
      });

      toast({
        title: 'ยืนยันได้รับสิ่งของสำเร็จ',
        description: 'รายการเข้าสู่สถานะกำลังเช่าแล้ว',
      });
    } catch (err: any) {
      toast({
        title: 'ยืนยันรับสิ่งของไม่สำเร็จ',
        description: err?.message || 'กรุณาตรวจสอบภาพส่งมอบและการชำระเงิน',
        variant: 'destructive',
      });
    } finally {
      setReceiptSubmitting(false);
    }
  };

  const handlePhotoUploadSubmit = async () => {
    if (!selectedId || uploadedFiles.length === 0) return;

    try {
      const result = await uploadRentalPhotos(
        selectedId,
        photoUploadMode,
        uploadedFiles
      );

      const imageUrls = result.image_urls;

      if (photoUploadMode === 'lenderBefore') {
        setHandoverPhotos((current) => ({
          ...current,
          [selectedId]: true,
        }));
        toast({
          title: 'บันทึกรูปก่อนให้เช่าแล้ว',
          description: 'รูปภาพสภาพสินค้าก่อนส่งมอบถูกบันทึกเรียบร้อยแล้ว',
        });

      } else if (photoUploadMode === 'beforeUse') {
        setTransactions((current) =>
          current.map((txn) =>
            txn.id === selectedId
              ? { ...txn, images_before_use: imageUrls }
              : txn
          )
        );

        toast({
          title: 'บันทึกรูปก่อนใช้งานแล้ว',
          description: 'รูปภาพถูกส่งไปยังระบบเรียบร้อยแล้ว',
        });

      } else {
        await apiPatch(`/rentals/${selectedId}/status`, {
          status: 'return_requested',
        });

        updateTransactionStatus(selectedId, 'return_requested', {
          images_after_use: imageUrls,
          return_requested: true,
        });

        toast({
          title: 'ส่งคำขอคืนของแล้ว',
          description: 'ส่งรูปภาพให้เจ้าของตรวจสอบแล้ว',
        });
      }

      setShowReturnDialog(false);
      setUploadedFiles([]);
      setSelectedId(null);
    } catch (err: any) {
      console.error('Photo upload error:', err);

      toast({
        title: 'อัปโหลดรูปภาพไม่สำเร็จ',
        description: err?.message || 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptRentalAgreement = async () => {
    if (!selectedId || !agreement || !agreementChecked) {
      toast({
        title: 'กรุณาอ่านและยอมรับสัญญาก่อน',
        variant: 'destructive',
      });
      return;
    }

    const session = getAuthSession();

    if (!session.userId) {
      toast({
        title: 'กรุณาเข้าสู่ระบบใหม่',
        variant: 'destructive',
      });
      return;
    }

    setAgreementSubmitting(true);

    try {
      const response = await signAgreement({
        rental_id: selectedId,
      });

      setAgreement(response.data);
      setAgreementChecked(false);

      toast({
        title: 'ยอมรับสัญญาสำเร็จ',
        description: response.fully_accepted
          ? 'ทั้งสองฝ่ายยอมรับสัญญาครบแล้ว สามารถอนุมัติคำขอเช่าได้'
          : 'บันทึกการยอมรับของคุณแล้ว',
      });
    } catch (err: any) {
      console.error('Accept agreement error:', err);

      toast({
        title: 'ยอมรับสัญญาไม่สำเร็จ',
        description: err?.message || 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setAgreementSubmitting(false);
    }
  };
  const openPaymentReviewDialog = async (rentalId: string) => {
    setPaymentRentalId(rentalId);
    setReviewPayments([]);
    setPaymentRejectionReason('');
    setShowPaymentReviewDialog(true);
    setPaymentReviewLoading(true);

    try {
      const response = await fetchRentalPayments(rentalId);
      setReviewPayments(response.data ?? []);
    } catch (err: any) {
      toast({
        title: 'โหลดข้อมูลการชำระเงินไม่สำเร็จ',
        description: err?.message || 'กรุณาลองใหม่',
        variant: 'destructive',
      });
    } finally {
      setPaymentReviewLoading(false);
    }
  };

  const handleVerifyPayment = async (
    paymentId: string,
    action: 'verify' | 'reject'
  ) => {
    if (paymentReviewSubmitting) return;

    if (action === 'reject' && !paymentRejectionReason.trim()) {
      toast({
        title: 'กรุณาระบุเหตุผลที่ปฏิเสธ',
        variant: 'destructive',
      });
      return;
    }

    setPaymentReviewSubmitting(true);

    try {
      const response = await verifyRentalPayment(
        paymentId,
        action,
        paymentRejectionReason.trim()
      );

      setReviewPayments((current) =>
        current.map((payment) =>
          payment.payment_id === paymentId
            ? response.data
            : payment
        )
      );
      if (paymentRentalId) {
        setSlipStatuses((current) => ({
          ...current,
          [paymentRentalId]: action === 'verify' ? 'verified' : 'rejected',
        }));

        if (action === 'verify') {
          setTransactions((current) =>
            current.map((txn) =>
              txn.id === paymentRentalId
                ? { ...txn, payment_status: 'paid' }
                : txn
            )
          );
        }
      }

      toast({
        title:
          action === 'verify'
            ? 'ยืนยันการรับเงินสำเร็จ'
            : 'ปฏิเสธสลิปเรียบร้อยแล้ว',
      });

      setPaymentRejectionReason('');
    } catch (err: any) {
      toast({
        title: 'ตรวจสอบการชำระเงินไม่สำเร็จ',
        description: err?.message || 'กรุณาลองใหม่',
        variant: 'destructive',
      });
    } finally {
      setPaymentReviewSubmitting(false);
    }
  };

  const handleLenderApprove = async (txnId: string): Promise<boolean> => {
    try {
      await apiPatch(`/rentals/${txnId}/status`, {
        status: 'approved',
      });

      updateTransactionStatus(txnId, 'approved');

      toast({
        title: 'อนุมัติคำขอเช่าแล้ว',
        description: 'ผู้เช่าได้รับการแจ้งเตือนแล้ว',
      });

      return true; // อนุมัติสำเร็จ

    } catch (err) {
      console.error('Approve rental error:', err);

      toast({
        title: 'อนุมัติไม่สำเร็จ',
        description: 'ไม่สามารถอัปเดตสถานะรายการเช่าได้',
        variant: 'destructive',
      });

      return false; // อนุมัติไม่สำเร็จ
    }
  };


  const handleLenderReject = async (txnId: string) => {
    try {
      await apiPatch(`/rentals/${txnId}/status`, {
        status: 'rejected',
      });

      updateTransactionStatus(txnId, 'rejected');

      toast({
        title: 'ปฏิเสธคำขอเช่าแล้ว',
        description: 'ผู้เช่าได้รับการแจ้งเตือนแล้ว',
      });

    } catch (err) {
      console.error('Reject rental error:', err);

      toast({
        title: 'ปฏิเสธไม่สำเร็จ',
        description: 'ไม่สามารถอัปเดตสถานะรายการเช่าได้',
        variant: 'destructive',
      });
    }
  };
  const handleConfirmFine = async (txnId: string) => {
    const session = getAuthSession();

    if (!session.userId) {
      toast({
        title: 'ไม่พบข้อมูลผู้ใช้',
        description: 'กรุณาเข้าสู่ระบบใหม่',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiPatch(`/rentals/${txnId}/fine/confirm`, {});

      updateTransactionStatus(txnId, 'completed', {
        fine_status: 'confirmed',
      });

      toast({
        title: 'ยืนยันค่าปรับเรียบร้อย',
        description: 'รายการเช่าเสร็จสิ้นแล้ว',
      });
    } catch (err) {
      console.error('Confirm fine error:', err);

      toast({
        title: 'ยืนยันค่าปรับไม่สำเร็จ',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const handleInspectionResult = async (
    decision: 'completed' | 'damaged'
  ) => {
    if (!selectedId) return;

    const fineAmount = Number(inspectionFine || 0);

    if (fineAmount < 0 || Number.isNaN(fineAmount)) {
      toast({
        title: 'ค่าปรับไม่ถูกต้อง',
        description: 'กรุณากรอกค่าปรับตั้งแต่ 0 บาทขึ้นไป',
        variant: 'destructive',
      });
      return;
    }


    try {
      // กรณีไม่มีความเสียหาย
      if (decision === 'completed') {
        await apiPatch(`/rentals/${selectedId}/status`, {
          status: 'completed',
        });

        updateTransactionStatus(selectedId, 'completed', {
          return_requested: false,
        });

        setShowInspectionDialog(false);
        setSelectedId(null);
        setInspectionFine('');
        setInspectionFineReason('');

        toast({
          title: 'ยืนยันรับคืนเรียบร้อย',
          description: 'รายการเช่าเสร็จสิ้นแล้ว ผู้เช่าสามารถเขียนรีวิวได้',
        });

        return;
      }

      // กรณีมีความเสียหาย
      if (fineAmount <= 0) {
        toast({
          title: 'กรุณากรอกค่าปรับ',
          description: 'กรณีมีความเสียหาย กรุณาระบุค่าปรับมากกว่า 0 บาท',
          variant: 'destructive',
        });
        return;
      }

      if (!inspectionFineReason.trim()) {
        toast({
          title: 'กรุณาระบุรายละเอียดความเสียหาย',
          description: 'กรุณากรอกเหตุผลหรือรายละเอียดก่อนกำหนดค่าปรับ',
          variant: 'destructive',
        });
        return;
      }

      await apiPatch(`/rentals/${selectedId}/status`, {
        status: 'fine_pending',
        fine_amount: fineAmount,
        fine_reason: inspectionFineReason.trim(),
      });

      setTransactions((current) =>
        current.map((txn) =>
          txn.id === selectedId
            ? {
              ...txn,
              status: 'fine_pending',
              fine_amount: fineAmount,
              fine_reason: inspectionFineReason.trim(),
              fine_status: 'pending_confirmation',
              return_requested: false,
            }
            : txn
        )
      );

      setShowInspectionDialog(false);
      setSelectedId(null);
      setInspectionFine('');
      setInspectionFineReason('');

      toast({
        title: 'กำหนดค่าปรับแล้ว',
        description: `กำหนดค่าปรับ ฿${fineAmount.toLocaleString()} รอผู้เช่ายืนยัน`,
      });

    } catch (err) {
      console.error('Inspection result error:', err);

      toast({
        title: 'ดำเนินการไม่สำเร็จ',
        description: 'ไม่สามารถอัปเดตสถานะรายการเช่าได้',
        variant: 'destructive',
      });
    }
  };


  // 👇👇 วาง handleSubmitReview ตรงนี้ 👇👇
  const handleSubmitReview = async () => {
    if (!reviewRental || reviewSubmitting) return;

    const session = getAuthSession();
    const token = localStorage.getItem('token');

    if (!session.userId || !token) {
      toast({
        title: 'กรุณาเข้าสู่ระบบใหม่',
        description: 'ไม่พบข้อมูลเข้าสู่ระบบ',
        variant: 'destructive',
      });
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      toast({
        title: 'กรุณาให้คะแนน',
        description: 'เลือกคะแนนตั้งแต่ 1 ถึง 5 ดาว',
        variant: 'destructive',
      });
      return;
    }

    if (!reviewComment.trim()) {
      toast({
        title: 'กรุณาเขียนความคิดเห็น',
        description: 'กรุณากรอกความคิดเห็นก่อนส่งรีวิว',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();

    formData.append('rental_id', reviewRental.id);
    formData.append('rating', String(reviewRating));
    formData.append('comment', reviewComment.trim());

    reviewPhotos.forEach((photo) => {
      formData.append('photos', photo);
    });

    setReviewSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ไม่สามารถส่งรีวิวได้');
      }

      setTransactions((current) =>
        current.map((txn) =>
          txn.id === reviewRental.id
            ? { ...txn, has_review: true }
            : txn
        )
      );

      toast({
        title: 'ส่งรีวิวสำเร็จ',
        description: 'บันทึกคะแนน ความคิดเห็น และรูปภาพเรียบร้อยแล้ว',
      });

      setShowReviewDialog(false);
      setReviewRental(null);
      setReviewComment('');
      setReviewRating(0);
      setReviewPhotos([]);

    } catch (err: any) {
      console.error('Submit review error:', err);

      toast({
        title: 'ส่งรีวิวไม่สำเร็จ',
        description: err?.message || 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    } finally {
      setReviewSubmitting(false);
    }
  };


  // 👇 ของเดิม ห้ามลบ

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ส่วนหัว */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 px-4 pb-20 pt-10 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            รายการของฉัน
          </h1>
          <p className="mt-2 text-sm text-blue-100">
            ติดตามสถานะคำขอเช่า การชำระเงิน การส่งมอบ และการคืนสิ่งของ
          </p>
        </div>
      </div>

      {/* พื้นที่รายการ */}
      <div className="relative mx-auto -mt-12 max-w-6xl px-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">

          {/* แท็บหลัก */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
            {mainTabs.map((tab) => (
              <button
                key={`main-tab-${tab.key}`}
                type="button"
                onClick={() => {
                  setActiveView(tab.key);
                  setActiveFilter('all');
                }}
                className={`rounded-xl px-2 py-3 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${activeView === tab.key
                  ? 'bg-blue-950 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:text-slate-900'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ตัวกรองสถานะ */}
          <div className="mt-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              กรองตามสถานะ
            </h2>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {filterTabs.map((tab) => (
                <button
                  key={`filter-tab-${tab.key}`}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-all ${activeFilter === tab.key
                    ? 'border-blue-950 bg-blue-950 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-1">


            {isLoading && (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
                กำลังโหลดรายการเช่า...
              </div>
            )}

            {!isLoading && error && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!isLoading && (
              <div className="mt-4 space-y-4">
                {visibleTransactions.map((txn, index) => {
                  const isBorrowerView = activeView === 'borrowed';
                  const partnerLabel = isBorrowerView ? `เจ้าของ: ${txn.owner_name}` : `ผู้เช่า: ${txn.borrower_name}`;
                  const cardUniqueKey = txn.id ? `txn-card-${txn.id}` : `txn-index-${index}`;

                  return (
                    <div
                      key={cardUniqueKey}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md md:p-5" >
                      <div className="flex items-start gap-4">
                        <img
                          src={txn.item_image}
                          alt={txn.item_title}
                          className="h-24 w-24 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-cover sm:h-28 sm:w-28"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-card-foreground">{txn.item_title}</h3>
                              <p className="mt-1 text-xs text-muted-foreground">{partnerLabel}</p>
                            </div>
                            <StatusBadge status={txn.status} />
                          </div>

                          <div className="mt-3 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>ระยะเวลา</span>
                              <span className="font-medium text-foreground">
                                {txn.total_days} วัน
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>วันที่เริ่มเช่า</span>
                              <span className="font-medium text-foreground">
                                {formatDate(txn.start_date)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>วันที่คืน</span>
                              <span className="font-medium text-foreground">
                                {formatDate(txn.end_date)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ปุ่มดูรายละเอียดและขั้นตอนการเช่า */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full rounded-xl border-blue-200 bg-blue-50 font-semibold text-blue-800 hover:bg-blue-100"
                        onClick={() => navigate(`/transactions/${txn.id}`)}
                      >
                        <ListChecks className="mr-2 h-4 w-4" />
                        ดูรายละเอียดและขั้นตอนการเช่า
                      </Button>


                      <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>ค่าเช่า ({txn.total_days} วัน × {formatPrice(txn.rental_price_per_day)})</span>
                          <span className="font-medium text-foreground">{formatPrice(txn.total_rental_price)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-sm">
                          <span className="font-medium text-foreground">ยอดรวมสุทธิ</span>
                          <span className="text-lg font-bold tracking-tight text-blue-700">
                            {formatPrice(txn.total_rental_price)}
                          </span>
                        </div>


                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            สถานะการชำระเงิน
                          </span>

                          <span
                            className={
                              txn.payment_status === 'paid'
                                ? 'font-semibold text-green-600'
                                : 'font-semibold text-amber-600'
                            }
                          >
                            {txn.payment_status === 'paid'
                              ? 'ชำระเงินสำเร็จ'
                              : slipStatuses[txn.id] === 'submitted'
                                ? 'รอตรวจสอบสลิป'
                                : slipStatuses[txn.id] === 'rejected'
                                  ? isBorrowerView
                                    ? 'กรุณาอัปโหลดสลิปใหม่'
                                    : 'รอผู้เช่าอัปโหลดสลิปใหม่'
                                  : isBorrowerView
                                    ? 'รอชำระเงิน'
                                    : 'รอผู้เช่าชำระเงิน'}
                          </span>
                        </div>


                        {/* ปุ่มดูสัญญาสำหรับทั้งผู้เช่าและผู้ให้เช่า */}
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 text-xs"
                            onClick={() => openContractDialog(txn.id)}
                          >
                            <FileText className="h-4 w-4" />
                            ดูสัญญาเช่า
                          </Button>
                        </div>
                      </div>
                      {txn.status === 'completed' && (txn.fine_amount ?? 0) > 0 && (
                        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">

                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-destructive" />

                            <p className="text-sm font-semibold text-destructive">
                              ประวัติความเสียหาย
                            </p>
                          </div>

                          <div className="mt-3 space-y-2 text-xs">

                            <div className="flex items-start justify-between gap-3">
                              <span className="text-muted-foreground">
                                เหตุผล
                              </span>

                              <span className="text-right font-medium text-foreground">
                                {txn.fine_reason || 'พบความเสียหายหลังการใช้งาน'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                ค่าปรับ
                              </span>

                              <span className="font-bold text-destructive">
                                {formatPrice(txn.fine_amount)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                สถานะค่าปรับ
                              </span>

                              <span className="font-semibold">
                                {txn.fine_status === 'confirmed'
                                  ? 'ผู้เช่ายืนยันแล้ว'
                                  : txn.fine_status === 'pending_confirmation'
                                    ? 'รอผู้เช่ายืนยัน'
                                    : '-'}
                              </span>
                            </div>

                          </div>
                        </div>
                      )}

                      {isBorrowerView && (
                        <div className="mt-4 space-y-2">

                          {/* 1. อัปโหลดสลิปชำระค่าเช่า */}
                          {txn.status === 'approved' &&
                            txn.payment_status !== 'paid' &&
                            slipStatuses[txn.id] !== 'submitted' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full rounded-xl border-blue-200 bg-blue-50 font-semibold text-blue-700 hover:bg-blue-100"
                                onClick={() => openPaymentDialog(txn.id)}
                              >
                                อัปโหลดสลิปชำระค่าเช่า
                              </Button>
                            )}

                          {/* 2. รอยืนยันรับสิ่งของ */}
                          {txn.status === 'approved' && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-xs"
                                onClick={() => openContractDialog(txn.id)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                ดูสัญญา
                              </Button>

                              <Button
                                size="sm"
                                className="gap-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
                                disabled={
                                  txn.payment_status !== 'paid' ||
                                  !handoverPhotos[txn.id] ||
                                  receiptSubmitting
                                }
                                onClick={() => handleConfirmReceipt(txn.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {handoverPhotos[txn.id]
                                  ? 'ยืนยันได้รับสิ่งของ'
                                  : 'รอผู้ให้เช่าส่งมอบ'}
                              </Button>
                            </div>
                          )}

                          {/* 3. เมื่อยืนยันรับสิ่งของแล้ว */}
                          {txn.status === 'borrowing' && (
                            <>
                              {/* ถ่ายรูปก่อนใช้งาน */}
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full gap-2 text-xs"
                                onClick={() => openPhotoUploadDialog(txn.id, 'beforeUse')}
                              >
                                <Camera className="h-3.5 w-3.5" />
                                ถ่ายรูปสภาพสิ่งของก่อนใช้งาน
                              </Button>

                              {/* ถ่ายรูปหลังใช้งานและขอคืน */}
                              <Button
                                size="sm"
                                className="w-full gap-2 rounded-xl bg-blue-950 text-xs font-semibold text-white hover:bg-blue-900"
                                onClick={() => openPhotoUploadDialog(txn.id, 'afterUse')}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                ยืนยันการคืน
                              </Button>
                            </>
                          )}

                          {/* โค้ดส่วน fine_pending เดิมของคุณต่อจากตรงนี้ */}
                          {txn.status === 'fine_pending' && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">

                              <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-destructive" />

                                <p className="text-sm font-semibold text-destructive">
                                  มีค่าปรับจากความเสียหาย
                                </p>
                              </div>

                              <div className="mt-3 space-y-2 text-xs">

                                <div className="flex justify-between gap-3">
                                  <span className="text-muted-foreground">
                                    เหตุผล
                                  </span>

                                  <span className="text-right font-medium">
                                    {txn.fine_reason || 'พบความเสียหายหลังการใช้งาน'}
                                  </span>
                                </div>

                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    ค่าปรับ
                                  </span>

                                  <span className="font-bold text-destructive">
                                    {formatPrice(txn.fine_amount)}
                                  </span>
                                </div>

                              </div>

                              <Button
                                size="sm"
                                className="mt-3 w-full"
                                onClick={() => handleConfirmFine(txn.id)}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                ยืนยันค่าปรับ {formatPrice(txn.fine_amount)}
                              </Button>

                            </div>
                          )}

                        </div>
                      )}
                      {activeView === 'borrowed' && txn.status === 'completed' && (
                        txn.has_review ? (
                          <Button
                            variant="outline"
                            disabled
                            className="w-full"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            รีวิวแล้ว
                          </Button>
                        ) : (
                          <Button
                            className="w-full rounded-xl bg-amber-500 font-semibold text-white hover:bg-amber-600"
                            onClick={() => {
                              setReviewRental(txn);
                              setReviewRating(0);
                              setReviewComment('');
                              setShowReviewDialog(true);
                            }}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            เขียนรีวิว
                          </Button>
                        )
                      )}

                      {!isBorrowerView && (
                        <div className="mt-4 space-y-2">
                          {(txn.status === 'approved' || txn.status === 'borrowing') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => openPaymentReviewDialog(txn.id)}
                            >
                              ตรวจสอบการชำระเงิน
                            </Button>
                          )}
                          {txn.status === 'approved' &&
                            txn.payment_status === 'paid' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full gap-2 text-xs"
                                onClick={() =>
                                  openPhotoUploadDialog(txn.id, 'lenderBefore')
                                }
                              >
                                <Camera className="h-3.5 w-3.5" />
                                ถ่ายรูปสภาพสิ่งของก่อนส่งมอบ
                              </Button>
                            )}
                          {txn.status === 'pending' && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-xs"
                                onClick={() => openContractDialog(txn.id)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                ดูสัญญา
                              </Button>
                              <Button
                                size="sm"
                                className="gap-2 text-xs"
                                onClick={() => openContractDialog(txn.id)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                ตรวจสัญญาและอนุมัติ
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2 text-xs"
                                onClick={() => handleLenderReject(txn.id)}
                              >
                                ปฏิเสธ
                              </Button>
                            </div>
                          )}


                          {txn.status === 'return_requested' && (
                            <Button
                              size="sm"
                              className="w-full gap-2 text-xs"
                              onClick={() => handleStartInspection(txn.id)}
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              เริ่มตรวจสภาพสิ่งของ
                            </Button>
                          )}

                          {txn.status === 'inspection_pending' && (
                            <Button
                              size="sm"
                              className="w-full gap-2 text-xs"
                              onClick={() => openInspectionDialog(txn.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              ตรวจสภาพและบันทึกผล
                            </Button>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}

                {visibleTransactions.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                      <ListChecks className="h-7 w-7 text-blue-700" />
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-slate-800">
                      ยังไม่มีรายการเช่า
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {activeFilter === 'all'
                        ? activeView === 'borrowed'
                          ? 'เมื่อคุณส่งคำขอเช่าสิ่งของ รายการจะแสดงที่นี่'
                          : 'เมื่อมีผู้ส่งคำขอเช่าสิ่งของของคุณ รายการจะแสดงที่นี่'
                        : 'ไม่พบรายการเช่าที่ตรงกับสถานะที่เลือก'}
                    </p>

                    {activeFilter !== 'all' && (
                      <Button
                        variant="outline"
                        className="mt-5 rounded-xl border-blue-200 text-blue-700"
                        onClick={() => setActiveFilter('all')}
                      >
                        ดูรายการทั้งหมด
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-blue-950">
              <FileText className="h-5 w-5 text-blue-700" />
              อัปโหลดหลักฐานการชำระเงิน
            </DialogTitle>
            <DialogDescription>
              แนบสลิปโอนเงินค่าเช่าเพื่อส่งให้ผู้ให้เช่าตรวจสอบ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={paymentSubmitting}
              onChange={(e) => setPaymentSlip(e.target.files?.[0] ?? null)}
            />

            <p className="text-xs text-muted-foreground">
              รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5 MB
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={paymentSubmitting}
              onClick={() => setShowPaymentDialog(false)}
            >
              ยกเลิก
            </Button>

            <Button
              disabled={!paymentSlip || paymentSubmitting}
              onClick={handlePaymentSubmit}
            >
              {paymentSubmitting ? 'กำลังอัปโหลด...' : 'ส่งสลิป'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-display">
              <FileText className="h-5 w-5 text-primary" />
              สัญญาเช่าสิ่งของอิเล็กทรอนิกส์ (e-Contract)
            </DialogTitle>
            <DialogDescription>
              รายละเอียดและเงื่อนไขสัญญาเช่าอิเล็กทรอนิกส์ระหว่างคู่สัญญา
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-950 to-blue-800 p-4 text-white">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold">Easy to Locate</p>
                  <p className="text-xs text-primary-foreground/75">เอกสารสัญญาเช่าอิเล็กทรอนิกส์</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3">
                <div>
                  <p className="text-xs text-muted-foreground">เลขที่สัญญา</p>
                  <p className="mt-1 font-semibold text-foreground">
                    EC-{selectedTransaction.id ? String(selectedTransaction.id).toUpperCase() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">สถานะสัญญา</p>
                  <p className="mt-1 font-semibold">
                    {agreement?.borrower_accepted && agreement?.lender_accepted
                      ? 'ยอมรับครบทั้งสองฝ่าย'
                      : 'รอการยอมรับสัญญา'}
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">คู่สัญญา</h3>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p><span className="text-muted-foreground">ผู้ให้เช่า:</span> {selectedTransaction.owner_name}</p>
                  <p className="mt-1"><span className="text-muted-foreground">ผู้เช่า:</span> {selectedTransaction.borrower_name}</p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">ข้อมูลสิ่งของและค่าเช่า</h3>
                <div className="rounded-xl border border-border p-3">
                  <div className="flex gap-3">
                    <img src={selectedTransaction.item_image} alt={selectedTransaction.item_title} className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{selectedTransaction.item_title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">ระยะเวลาเช่า {selectedTransaction.total_days} วัน</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">อัตราค่าเช่า/วัน</span><span className="font-medium">{formatPrice(selectedTransaction.rental_price_per_day)}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">ยอดรวม</span><span className="font-bold text-primary">{formatPrice(selectedTransaction.total_rental_price)}</span></div>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-foreground">เงื่อนไขการเช่า</h3>
                <section className="space-y-3 rounded-xl border p-3">
                  <h3 className="font-semibold">สถานะการยอมรับสัญญา</h3>

                  {agreementLoading ? (
                    <p className="text-sm text-muted-foreground">
                      กำลังโหลดข้อมูลสัญญา...
                    </p>
                  ) : !agreement ? (
                    <p className="text-sm text-destructive">
                      ยังไม่พบข้อมูลสัญญาในระบบ
                    </p>
                  ) : (
                    <>
                      <div className="flex justify-between gap-3">
                        <span>ผู้เช่า</span>
                        <span className={agreement.borrower_accepted ? 'text-green-600' : 'text-amber-600'}>
                          {agreement.borrower_accepted ? '✓ ยอมรับแล้ว' : 'รอยอมรับ'}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span>ผู้ให้เช่า</span>
                        <span className={agreement.lender_accepted ? 'text-green-600' : 'text-amber-600'}>
                          {agreement.lender_accepted ? '✓ ยอมรับแล้ว' : 'รอยอมรับ'}
                        </span>
                      </div>

                      <div className="border-t pt-2 text-xs text-muted-foreground">
                        <p>ผู้เช่ายอมรับเมื่อ: {agreement.borrower_accepted_at ? new Date(agreement.borrower_accepted_at).toLocaleString('th-TH') : '-'}</p>
                        <p>ผู้ให้เช่ายอมรับเมื่อ: {agreement.lender_accepted_at ? new Date(agreement.lender_accepted_at).toLocaleString('th-TH') : '-'}</p>
                      </div>
                    </>
                  )}
                </section>
                <div className="whitespace-pre-wrap rounded-xl bg-muted/50 p-3 text-muted-foreground">
                  {agreementLoading
                    ? 'กำลังโหลดสัญญา...'
                    : agreement?.contract_terms || 'ไม่พบข้อมูลสัญญา'}
                </div>
              </section>
            </div>
          )}
          {selectedTransaction &&
            activeView === 'lent' &&
            selectedTransaction.status === 'pending' &&
            agreement &&
            !agreement.lender_accepted && (
              <div className="space-y-3 border-t pt-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={agreementChecked}
                    onChange={(e) => setAgreementChecked(e.target.checked)}
                    disabled={agreementSubmitting}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    ข้าพเจ้าได้อ่านรายละเอียดสัญญาเช่าฉบับนี้
                    และยอมรับข้อตกลงในฐานะผู้ให้เช่า
                  </span>
                </label>

                <Button
                  className="w-full"
                  disabled={!agreementChecked || agreementSubmitting}
                  onClick={handleAcceptRentalAgreement}
                >
                  {agreementSubmitting
                    ? 'กำลังบันทึก...'
                    : 'ยอมรับสัญญาเช่า'}
                </Button>
              </div>
            )}
          {selectedTransaction &&
            activeView === 'lent' &&
            selectedTransaction.status === 'pending' &&
            agreement?.borrower_accepted &&
            agreement?.lender_accepted && (
              <Button
                className="w-full"
                disabled={agreementSubmitting}
                onClick={async () => {
                  setAgreementSubmitting(true);

                  try {
                    const approved = await handleLenderApprove(selectedTransaction.id);

                    if (approved) {
                      setShowContractDialog(false);
                    }
                  } finally {
                    setAgreementSubmitting(false);
                  }
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                อนุมัติคำขอเช่า
              </Button>
            )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPaymentReviewDialog}
        onOpenChange={setShowPaymentReviewDialog}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ตรวจสอบการชำระเงินค่าเช่า</DialogTitle>
            <DialogDescription>
              ตรวจสอบสลิปที่ผู้เช่าส่งมา ก่อนยืนยันการรับเงิน
            </DialogDescription>
          </DialogHeader>

          {paymentReviewLoading ? (
            <p>กำลังโหลดข้อมูลการชำระเงิน...</p>
          ) : reviewPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ผู้เช่ายังไม่ได้ส่งสลิปการชำระเงิน
            </p>
          ) : (
            <div className="space-y-4">
              {reviewPayments.map((payment) => (
                <div
                  key={payment.payment_id}
                  className="space-y-3 rounded-xl border p-3"
                >
                  <p className="text-sm">
                    ยอดชำระ: ฿{Number(payment.amount).toLocaleString()}
                  </p>

                  <p className="text-sm">
                    สถานะ: {
                      payment.status === 'submitted'
                        ? 'รอตรวจสอบ'
                        : payment.status === 'verified'
                          ? 'ยืนยันแล้ว'
                          : 'ปฏิเสธแล้ว'
                    }
                  </p>

                  {payment.slip_url && (
                    <a
                      href={`http://localhost:5000${payment.slip_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={`http://localhost:5000${payment.slip_url}`}
                        alt="สลิปการชำระเงิน"
                        className="max-h-72 w-full rounded-lg object-contain"
                      />
                    </a>
                  )}

                  {payment.status === 'submitted' && (
                    <>
                      <Textarea
                        value={paymentRejectionReason}
                        onChange={(e) =>
                          setPaymentRejectionReason(e.target.value)
                        }
                        placeholder="เหตุผลที่ปฏิเสธ (กรอกเมื่อต้องการปฏิเสธ)"
                      />

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          disabled={paymentReviewSubmitting}
                          onClick={() =>
                            handleVerifyPayment(payment.payment_id, 'verify')
                          }
                        >
                          ยืนยันรับเงิน
                        </Button>

                        <Button
                          variant="destructive"
                          className="flex-1"
                          disabled={paymentReviewSubmitting}
                          onClick={() =>
                            handleVerifyPayment(payment.payment_id, 'reject')
                          }
                        >
                          ปฏิเสธ
                        </Button>
                      </div>
                    </>
                  )}

                  {payment.status === 'rejected' &&
                    payment.rejection_reason && (
                      <p className="text-xs text-destructive">
                        เหตุผล: {payment.rejection_reason}
                      </p>
                    )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-display">
              <Camera className="h-5 w-5 text-primary" />

              {photoUploadMode === 'lenderBefore'
                ? 'ถ่ายรูปสภาพสิ่งของก่อนส่งมอบ'
                : photoUploadMode === 'beforeUse'
                  ? 'ถ่ายรูปสภาพสิ่งของก่อนใช้งาน'
                  : 'ยืนยันการคืนสิ่งของ'}

            </DialogTitle>

            <DialogDescription>
              {photoUploadMode === 'lenderBefore'
                ? 'อัปโหลดภาพเพื่อบันทึกสภาพสิ่งของก่อนส่งมอบให้ผู้เช่า'
                : photoUploadMode === 'beforeUse'
                  ? 'อัปโหลดภาพเพื่อบันทึกสภาพสิ่งของก่อนเริ่มใช้งานจริง'
                  : 'อัปโหลดภาพเพื่อส่งให้เจ้าของตรวจสอบสภาพสินค้าก่อนคืน'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {photoUploadMode === 'beforeUse'
                ? 'อัปโหลดภาพสภาพสิ่งของก่อนใช้งาน (รองรับ JPG, PNG สูงสุด 5 รูป)'
                : 'อัปโหลดภาพสภาพสิ่งของหลังใช้งาน (รองรับ JPG, PNG สูงสุด 5 รูป)'}
            </p>

            <div
              className="rounded-2xl border-2 border-dashed border-border bg-slate-50 p-4 text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">เลือกไฟล์ภาพ</p>
              <p className="mt-1 text-xs text-muted-foreground">{uploadedFiles.length} / 5 รูป</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              multiple
              className="hidden"
              onChange={handlePhotoSelection}
            />

            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={`upload-file-${index}-${file.name}`} className="overflow-hidden rounded-lg border border-border bg-muted">
                    <img src={URL.createObjectURL(file)} alt={`upload-${index}`} className="h-20 w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="sm:flex-col">
            <Button className="w-full" onClick={handlePhotoUploadSubmit} disabled={uploadedFiles.length === 0}>
              {photoUploadMode === 'lenderBefore'
                ? 'บันทึกภาพก่อนส่งมอบ'
                : photoUploadMode === 'beforeUse'
                  ? 'บันทึกภาพก่อนใช้งาน'
                  : 'ยืนยันการคืน'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowReturnDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInspectionDialog} onOpenChange={setShowInspectionDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-display">
              <ShieldAlert className="h-5 w-5 text-primary" />
              ตรวจสอบสภาพและยืนยันรับคืน
            </DialogTitle>
            <DialogDescription>
              เปรียบเทียบรูปภาพก่อนให้เช่าและหลังใช้งานเพื่อตรวจสอบความเสียหาย
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {inspectionPhotosLoading ? (
              <p className="text-sm text-muted-foreground">
                กำลังโหลดรูปภาพจากฐานข้อมูล...
              </p>
            ) : inspectionPhotosError ? (
              <p className="text-sm text-destructive">
                {inspectionPhotosError}
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {([
                  { key: 'beforeRental', label: 'รูปก่อนให้เช่า' },
                  { key: 'beforeUse', label: 'รูปก่อนใช้งาน' },
                  { key: 'afterUse', label: 'รูปหลังใช้งาน' },
                ] as const).map(({ key, label }) => (
                  <div
                    key={`inspection-set-${key}`}
                    className="rounded-xl border border-border bg-slate-50 p-2"
                  >
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {label}
                    </p>

                    {photoSets[key].length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {photoSets[key].map((url, index) => (
                          <a
                            key={`${key}-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={url}
                              alt={`${label} รูปที่ ${index + 1}`}
                              className="h-28 w-full rounded-lg object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                        ยังไม่มีรูปภาพ
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-border p-3">
              <label className="text-sm font-semibold text-foreground">
                ค่าปรับ
              </label>

              <p className="mt-1 text-xs text-muted-foreground">
                ผู้ให้เช่าเป็นผู้กำหนดค่าปรับ หากไม่มีค่าปรับให้กรอก 0
              </p>

              <Input
                type="number"
                min="0"
                value={inspectionFine}
                onChange={(e) => setInspectionFine(e.target.value)}
                placeholder="กรอกค่าปรับ เช่น 0 หรือ 200"
                className="mt-3"
              />
              <div className="space-y-2">
                <Label>รายละเอียดความเสียหาย</Label>

                <Textarea
                  value={inspectionFineReason}
                  onChange={(e) => setInspectionFineReason(e.target.value)}
                  placeholder="เช่น ใบพัดด้านหน้าหัก มีรอยแตกบริเวณตัวเครื่อง"
                />
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                ค่าปรับที่กำหนด: ฿{Number(inspectionFine || 0).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2"></div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => handleInspectionResult('completed')}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                ไม่มีความเสียหาย
              </Button>
              <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleInspectionResult('damaged')}>
                <XCircle className="mr-2 h-4 w-4" />
                มีความเสียหาย
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              รีวิวการเช่า
            </DialogTitle>

            <DialogDescription>
              ให้คะแนนและแสดงความคิดเห็นเกี่ยวกับการเช่าครั้งนี้
            </DialogDescription>
          </DialogHeader>

          {reviewRental && (
            <div className="space-y-4">

              <div className="flex items-center gap-3 rounded-xl border p-3">
                <img
                  src={reviewRental.item_image}
                  alt={reviewRental.item_title}
                  className="h-16 w-16 rounded-lg object-cover"
                />

                <div>
                  <p className="font-semibold">
                    {reviewRental.item_title}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    เจ้าของ: {reviewRental.owner_name}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">
                  คะแนน
                </p>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                    >
                      <Star
                        className={`h-8 w-8 ${star <= reviewRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  ความคิดเห็น
                </label>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="เขียนความคิดเห็นเกี่ยวกับการเช่า..."
                  className="mt-2 min-h-24 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none"
                />
              </div>

            </div>
          )}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              รูปภาพประกอบรีวิว (สูงสุด 5 รูป)
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleReviewPhotosChange}
              disabled={reviewSubmitting || reviewPhotos.length >= 5}
              className="block w-full rounded-md border p-2 text-sm"
            />

            {reviewPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {reviewPhotos.map((photo, index) => (
                  <ReviewPhotoPreview
                    key={`${photo.name}-${index}`}
                    file={photo}
                    onRemove={() => removeReviewPhoto(index)}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              เลือกแล้ว {reviewPhotos.length}/5 รูป
              (JPG, PNG, WEBP ไม่เกิน 5 MB ต่อรูป)
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
            >
              ยกเลิก
            </Button>

            <Button
              onClick={handleSubmitReview}
              disabled={
                reviewSubmitting ||
                !reviewRental ||
                reviewRating === 0 ||
                !reviewComment.trim()
              }
            >
              {reviewSubmitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิว'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Transactions;