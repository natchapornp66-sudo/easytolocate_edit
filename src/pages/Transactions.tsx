import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { currentUser, mockTransactions } from '@/data/mockData';
import { Transaction, TransactionStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle2, FileText, MapPin, ShieldAlert, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { apiGet } from '@/lib/api';

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
  { key: 'completed', label: 'เสรจสิ้น' },
  { key: 'damaged', label: 'เสียหาย' },
];

const formatPrice = (value: number) => `฿${value.toLocaleString()}`;

const Transactions = () => {
  const [activeView, setActiveView] = useState<RentalView>('borrowed');
  const [activeFilter, setActiveFilter] = useState<RentalFilter>('all');
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [photoUploadMode, setPhotoUploadMode] = useState<'beforeUse' | 'afterUse'>('afterUse');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTransactions = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await apiGet<Transaction[]>(`/api/rentals?view=${activeView}`);
        if (isMounted) {
          const nextItems = Array.isArray(response) && response.length ? response : mockTransactions;
          setTransactions(nextItems);
        }
      } catch (err) {
        if (isMounted) {
          const fallback = mockTransactions.filter((txn) =>
            activeView === 'borrowed' ? txn.borrower_id === currentUser.id : txn.owner_id === currentUser.id,
          );
          setTransactions(fallback.length ? fallback : mockTransactions);
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
    const list = transactions.filter((txn) =>
      activeView === 'borrowed' ? txn.borrower_id === currentUser.id : txn.owner_id === currentUser.id,
    );

    return activeFilter === 'all' ? list : list.filter((txn) => txn.status === activeFilter);
  }, [activeFilter, activeView, transactions]);

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

  const photoSets = selectedTransaction
    ? {
        beforeRental: selectedTransaction.images_before_rental?.length
          ? selectedTransaction.images_before_rental
          : [selectedTransaction.item_image],
        beforeUse: selectedTransaction.images_before_use?.length
          ? selectedTransaction.images_before_use
          : [selectedTransaction.item_image],
        afterUse: selectedTransaction.images_after_use?.length
          ? selectedTransaction.images_after_use
          : [selectedTransaction.item_image],
      }
    : { beforeRental: [] as string[], beforeUse: [] as string[], afterUse: [] as string[] };

  const openContractDialog = (txnId: string) => {
    setSelectedId(txnId);
    setShowContractDialog(true);
  };

  const openPhotoUploadDialog = (txnId: string, mode: 'beforeUse' | 'afterUse') => {
    setSelectedId(txnId);
    setPhotoUploadMode(mode);
    setUploadedFiles([]);
    setShowReturnDialog(true);
  };

  const openInspectionDialog = (txnId: string) => {
    setSelectedId(txnId);
    setShowInspectionDialog(true);
  };

  const handlePhotoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const validFiles = files.filter((file) => /image\/(jpeg|png)/i.test(file.type));
    setUploadedFiles(validFiles.slice(0, 5));
  };

  const handleLoanAgreementAccept = (txnId: string) => {
    updateTransactionStatus(txnId, 'borrowing', { return_requested: false });
    toast({
      title: 'ยอมรับสัญญาแล้ว',
      description: 'ระบบจะเริ่มสถานะการเช่าและพร้อมให้ยืนยันการคืนเมื่อครบกำหนด',
    });
  };

  const handlePhotoUploadSubmit = () => {
    if (!selectedId) return;

    const imageUrls = uploadedFiles.map((file) => URL.createObjectURL(file));
    if (photoUploadMode === 'beforeUse') {
      updateTransactionStatus(selectedId, 'approved', { images_before_use: imageUrls });
    } else {
      updateTransactionStatus(selectedId, 'borrowing', {
        images_after_use: imageUrls,
        return_requested: true,
      });
    }
    setShowReturnDialog(false);
    setUploadedFiles([]);
    setSelectedId(null);
    toast({
      title: photoUploadMode === 'beforeUse' ? 'บันทึกภาพก่อนใช้งานแล้ว' : 'ส่งภาพสภาพสิ่งของหลังใช้งานแล้ว',
      description:
        photoUploadMode === 'beforeUse'
          ? 'ระบบบันทึกภาพสภาพสิ่งของก่อนเริ่มใช้งานแล้ว'
          : 'เจ้าของจะตรวจสอบสภาพและยืนยันรับคืนต่อไป',
    });
  };

  const handleLenderApprove = (txnId: string) => {
    updateTransactionStatus(txnId, 'approved');
    toast({ title: 'อนุมัติคำขอเช่าแล้ว', description: 'ผู้เช่าสามารถยอมรับสัญญาได้ทันที' });
  };

  const handleLenderReject = (txnId: string) => {
    updateTransactionStatus(txnId, 'rejected');
    toast({ title: 'ปฏิเสธคำขอเช่า', description: 'ระบบได้บันทึกการปฏิเสธคำขอแล้ว' });
  };

  const handleInspectionResult = (decision: 'completed' | 'damaged') => {
    if (!selectedId) return;

    updateTransactionStatus(
      selectedId,
      decision === 'completed' ? 'completed' : 'damaged',
      { return_requested: false },
    );
    setShowInspectionDialog(false);
    setSelectedId(null);

    toast({
      title: decision === 'completed' ? 'ปิดการเช่าสำเร็จ' : 'ส่งเรื่องไปยัง Admin แล้ว',
      description:
        decision === 'completed'
          ? 'สภาพสิ่งของอยู่ในสภาพปกติและปิดการเช่าสำเร็จแล้ว'
          : 'มีความเสียหายและระบบได้ส่งเรื่องให้แอดมินพิจารณาแล้ว',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-primary px-4 pb-6 pt-10">
        <h1 className="text-lg font-bold text-primary-foreground font-display">รายการของฉัน</h1>
        <p className="mt-0.5 text-sm text-primary-foreground/75">ติดตามสถานะการเช่าและการคืน</p>
      </div>

      <div className="-mt-3 rounded-t-3xl bg-background px-4 pt-4">
        <div className="flex gap-2 rounded-full bg-slate-100 p-1">
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveView(tab.key)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-all ${
                activeView === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                activeFilter === tab.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
            กำลังหลดรายการเช่า...
          </div>
        )}

        {!isLoading && error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!isLoading && (
          <div className="mt-4 space-y-4">
            {visibleTransactions.map((txn) => {
              const isBorrowerView = activeView === 'borrowed';
              const partnerLabel = isBorrowerView ? `เจ้าของ: ${txn.owner_name}` : `ผู้เช่า: ${txn.borrower_name}`;

              return (
                <div key={txn.id} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                  <div className="flex gap-3">
                    <img src={txn.item_image} alt={txn.item_title} className="h-20 w-20 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-card-foreground">{txn.item_title}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{partnerLabel}</p>
                        </div>
                        <StatusBadge status={txn.status} />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>ระยะเวลา</span>
                        <span className="font-medium text-foreground">{txn.total_days} วัน</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>ค่าเช่า ({txn.total_days} วัน × {formatPrice(txn.rental_price_per_day)})</span>
                      <span className="font-medium text-foreground">{formatPrice(txn.total_rental_price)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-dashed border-border pt-2 text-sm">
                      <span className="font-medium text-foreground">ยอดรวมสุทธิ</span>
                      <span className="font-bold text-primary">{formatPrice(txn.total_rental_price)}</span>
                    </div>
                  </div>

                  {isBorrowerView && (
                    <div className="mt-4 space-y-2">
                      {txn.status === 'approved' && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => openContractDialog(txn.id)}>
                              <FileText className="h-3.5 w-3.5" />
                              ดูสัญญา
                            </Button>
                            <Button size="sm" className="gap-2 text-xs" onClick={() => handleLoanAgreementAccept(txn.id)}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              ยอมรับสัญญา
                            </Button>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full gap-2 text-xs"
                            onClick={() => openPhotoUploadDialog(txn.id, 'beforeUse')}
                          >
                            <Camera className="h-3.5 w-3.5" />
                            ถ่ายรูปสภาพสิ่งของก่อนใช้งาน
                          </Button>
                        </>
                      )}

                      {txn.status === 'borrowing' && (
                        <Button size="sm" className="w-full gap-2 text-xs" onClick={() => openPhotoUploadDialog(txn.id, 'afterUse')}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ยืนยันการคืน
                        </Button>
                      )}
                    </div>
                  )}

                  {!isBorrowerView && (
                    <div className="mt-4 space-y-2">
                      {txn.status === 'pending' && (
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => openContractDialog(txn.id)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            ดูสัญญา
                          </Button>
                          <Button size="sm" className="gap-2 text-xs" onClick={() => handleLenderApprove(txn.id)}>
                            อนุมัติ
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

                      {txn.status === 'borrowing' && txn.return_requested && (
                        <Button size="sm" className="w-full gap-2 text-xs" onClick={() => openInspectionDialog(txn.id)}>
                          <ShieldAlert className="h-3.5 w-3.5" />
                          ตรวจสอบสภาพและยืนยันรับคืน
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {visibleTransactions.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                ไม่มีรายการในกลุ่มนี้
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-display">
              <FileText className="h-5 w-5 text-primary" />
              สัญญาสิ่งเช่าสิ่งของอิเล็กทรอนิกส์ (e-Contract)
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 rounded-xl bg-primary p-4 text-primary-foreground">
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
                  <p className="mt-1 font-semibold text-foreground">EC-{selectedTransaction.id.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">สถานะสัญญา</p>
                  <p className="mt-1 font-semibold text-success">รอเริ่มใช้งาน</p>
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
                <div className="rounded-xl bg-muted/50 p-3 text-muted-foreground">
                  ผู้เช่าต้องดูแลรักษาสิ่งของให้อยู่ในสภาพเดิม และถ่ายรูปก่อนใช้งานและหลังใช้งานเพื่อยืนยันสภาพสิ่งของ
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-display">
              <Camera className="h-5 w-5 text-primary" />
              {photoUploadMode === 'beforeUse' ? 'ถ่ายรูปสภาพสิ่งของก่อนใช้งาน' : 'ยืนยันการคืนสิ่งของ'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {photoUploadMode === 'beforeUse'
                ? 'อัปโหลดภาพสภาพสิ่งของก่อนใช้งาน (รองรับ JPG, PNG สูงสุด 5 รูป)'
                : 'อัปโหลดภาพสภาพสิ่งของหลังใช้งาน (รองรับ JPG, PNG สูงสุด 5 รูป)'}
            </p>

            <div
              className="rounded-2xl border-2 border-dashed border-border bg-slate-50 p-4 text-center"
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
                  <div key={`${file.name}-${index}`} className="overflow-hidden rounded-lg border border-border bg-muted">
                    <img src={URL.createObjectURL(file)} alt={`upload-${index}`} className="h-20 w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="sm:flex-col">
            <Button className="w-full" onClick={handlePhotoUploadSubmit} disabled={uploadedFiles.length === 0}>
              {photoUploadMode === 'beforeUse' ? 'บันทึกภาพก่อนใช้งาน' : 'ยืนยันการคืน'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowReturnDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInspectionDialog} onOpenChange={setShowInspectionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-display">
              <ShieldAlert className="h-5 w-5 text-primary" />
              ตรวจสอบสภาพและยืนยันรับคืน
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { key: 'beforeRental', label: 'รปก่อนให้เช่า' },
                { key: 'beforeUse', label: 'รปก่อนใช้งาน' },
                { key: 'afterUse', label: 'รปหลังใช้งาน' },
              ].map(({ key, label }) => (
                <div key={key} className="rounded-xl border border-border bg-slate-50 p-2">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
                  <img
                    src={photoSets[key as keyof typeof photoSets][0] ?? selectedTransaction?.item_image}
                    alt={label}
                    className="h-28 w-full rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>

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

      <BottomNav />
    </div>
  );
};

export default Transactions;
