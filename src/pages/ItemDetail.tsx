import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Shield, MessageCircle, Calculator, Info, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockItems } from '@/data/mockData';
import { mockReviews } from '@/data/mockReviews';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { getAuthSession } from '@/lib/auth';
import { apiPost } from '@/lib/api';

const PLATFORM_FEE_RATE = 0.10;

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = getAuthSession();
  const item = mockItems.find((i) => i.id === id);
  const [days, setDays] = useState(1);
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [lateFee, setLateFee] = useState('');

  const itemReviews = mockReviews.filter((r) => r.item_id === id);

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">ไม่พบสิ่งของ</p>
      </div>
    );
  }

  const totalRental = item.rental_price_per_day * days;
  const platformFee = Math.round(totalRental * PLATFORM_FEE_RATE);
  const totalPayment = totalRental;
  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];

  const handleBorrow = () => {
    if (session.role === 'guest') {
      navigate('/login');
      return;
    }

    if (session.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }

    setShowAgreement(true);
  };

  const handleAcceptAgreement = async () => {
    if (!agreementAccepted) {
      toast({ title: 'กรุณายอมรับสัญญาก่อน', variant: 'destructive' });
      return;
    }

    setShowAgreement(false);
    setAgreementAccepted(false);
    await handleSubmitRequest();
  };

  const handleSubmitRequest = async () => {
    try {
      await apiPost('/api/rentals', {
        item_id: item.id,
        item_title: item.title,
        item_image: item.images[0],
        borrower_id: 'user-1',
        borrower_name: session.fullName || 'สมชาย ใจดี',
        owner_id: item.owner_id,
        owner_name: item.owner_name,
        status: 'pending',
        total_days: days,
        rental_price_per_day: item.rental_price_per_day,
        total_rental_price: totalRental,
        platform_fee: platformFee,
        owner_earnings: totalRental - platformFee,
        payment_status: 'pending',
      });

      toast({
        title: 'ส่งคำขอเช่าเรียบร้อยแล้ว',
        description: `คำขอเช่า ${item.title} ${days} วัน ถูกส่งไปยังเจ้าของแล้ว`,
      });
    } catch (error) {
      toast({
        title: 'ส่งคำขอเช่าไม่สำเร็จ',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const avgRating = itemReviews.length > 0
    ? (itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Image */}
      <div className="relative">
        <img src={item.images[0]} alt={item.title} className="h-64 w-full object-cover sm:h-80" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-10 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm"
        >
          <ArrowLeft className="h-5 w-5 text-card-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="-mt-4 rounded-t-3xl bg-background px-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-foreground font-display">{item.title}</h1>
          <div className="shrink-0 text-right">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              ฿{item.rental_price_per_day}/วัน
            </span>
          </div>
        </div>

        {/* Owner */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {item.owner_name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-card-foreground">{item.owner_name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-warning text-warning" />
              4.8
              <span>•</span>
              <MapPin className="h-3 w-3" />
              {item.distance_km} กม.
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/chat')}>
            <MessageCircle className="h-3.5 w-3.5" />
            แชท
          </Button>
        </div>

        {/* Description */}
        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">รายละเอียด</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        </div>

        {/* Conditions */}
        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">เงื่อนไขการเช่า</h2>
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">{item.conditions}</p>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Star className="h-4 w-4 text-warning" />
            รีวิวจากผู้เช่า {avgRating && `(${avgRating})`}
          </h2>
          {itemReviews.length > 0 ? (
            <div className="space-y-2">
              {itemReviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {review.reviewer_name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-card-foreground">{review.reviewer_name}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-warning text-warning' : 'text-border'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{review.comment}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{review.created_at}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground rounded-xl border border-border bg-muted/50 p-3">ยังไม่มีรีวิว</p>
          )}
        </div>

        {/* Rental Calculator */}
        <div className="mt-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Calculator className="h-4 w-4 text-primary" />
            คำนวณค่าเช่า
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">จำนวนวัน</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setDays(Math.max(1, days - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold">-</button>
                <span className="w-8 text-center text-lg font-bold text-foreground">{days}</span>
                <button onClick={() => setDays(days + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">+</button>
              </div>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ค่าเช่า ({days} วัน × ฿{item.rental_price_per_day})</span>
                <span className="font-medium text-foreground">฿{totalRental.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">ค่าธรรมเนียม (10%)<Info className="h-3 w-3" /></span>
                <span className="font-medium text-muted-foreground">-฿{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">เจ้าของได้รับ</span>
                <span className="font-medium text-success">{`฿${(totalRental - platformFee).toLocaleString()}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card px-5 py-3 safe-bottom">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">ยอดชำระ ({days} วัน)</p>
            <p className="text-lg font-bold text-primary">฿{totalPayment.toLocaleString()}</p>
          </div>
          <Button
            onClick={handleBorrow}
            disabled={item.status === 'rented'}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {item.status === 'rented' ? 'ไม่ว่าง' : 'ขอเช่า'}
          </Button>
        </div>
      </div>

      {/* e-Agreement Dialog */}
      <Dialog open={showAgreement} onOpenChange={setShowAgreement}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-display">
              <FileText className="h-5 w-5 text-primary" />
              สัญญาเช่าสิ่งของ (e-Agreement)
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground space-y-3 leading-relaxed">
            <p className="text-[10px] text-muted-foreground/60">เลขที่สัญญา: AGR-{Date.now()} | วันที่: {today}</p>

            <div>
              <h4 className="font-semibold text-foreground mb-1">1. คู่สัญญา</h4>
              <p><strong>ผู้ให้เช่า:</strong> {item.owner_name}</p>
              <p><strong>ผู้เช่า:</strong> สมชาย ใจดี</p>
              <p className="mt-1">ทั้งสองฝ่ายตกลงทำสัญญาเช่าสิ่งของผ่านระบบ Easy to Locate</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-1">2. รายละเอียดสิ่งของ</h4>
              <p>ชื่อสิ่งของ: {item.title}</p>
              <p>หมวดหมู่: {item.category}</p>
              <p>ค่าเช่า: ฿{item.rental_price_per_day}/วัน</p>
              <p>ระยะเวลา: {today} ถึง {endDate} ({days} วัน)</p>
              <p>รวมค่าเช่า: ฿{totalRental.toLocaleString()}</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-1">3. เงื่อนไขการชำระเงิน</h4>
              <p>ผู้เช่าต้องชำระค่าเช่าในระบบภายในแอป</p>
              <p>เงินค่าเช่าจะถูกโอนให้ผู้ให้เช่าหลังจากยืนยันการส่งมอบ</p>
              <p>หากมีความเสียหายหรือส่งคืนล่าช้า จะถูกพิจารณาตามเงื่อนไขที่ตกลงไว้</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-1">4. ข้อผูกพัน</h4>
              <p>ผู้เช่าจะต้องคืนสิ่งของตรงเวลา หากเกินกำหนดจะมีค่าปรับตามที่ได้ตกลง</p>
              <p className="mt-1">ค่าปรับล่าช้า: ฿{lateFee || '0'} ต่อวัน</p>
              <Input value={lateFee} onChange={(e) => setLateFee(e.target.value)} placeholder="กรอกค่าปรับล่าช้า" />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <Checkbox checked={agreementAccepted} onCheckedChange={(checked) => setAgreementAccepted(Boolean(checked))} />
                <span className="text-muted-foreground">ฉันยอมรับเงื่อนไขสัญญา และเห็นด้วยกับการชำระเงินตามรายการที่ระบุ</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAgreement(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAcceptAgreement}>ยอมรับและดำเนินการต่อ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemDetail;
