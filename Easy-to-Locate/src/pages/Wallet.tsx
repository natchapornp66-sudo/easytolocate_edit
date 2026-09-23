import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';

const Wallet = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-primary px-4 pb-8 pt-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground font-display">กระเป๋าเงิน</h1>
        </div>
      </div>

      <div className="-mt-3 rounded-t-3xl bg-background px-4 pt-6">
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">ระบบกระเป๋าเงินถูกยกเลิกสำหรับเวอร์ชันนี้</p>
          <p className="mt-2 text-sm text-muted-foreground">การชำระค่าเช่าจะทำผ่านระบบการชำระเงินแบบง่ายและตรงตามเงื่อนไขการเช่า</p>
          <Button onClick={() => navigate('/')} className="mt-5 w-full">
            กลับหน้าแรก
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Wallet;
