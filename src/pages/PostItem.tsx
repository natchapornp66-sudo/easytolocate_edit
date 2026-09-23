import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories } from '@/data/mockData';
import BottomNav from '@/components/BottomNav';
import { toast } from '@/hooks/use-toast';

const PostItem = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    conditions: '',
    rental_price_per_day: '',
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const rentalPrice = Number(form.rental_price_per_day) || 0;
  const platformFee = Math.round(rentalPrice * 0.10);
  const ownerEarnings = rentalPrice - platformFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'โพสต์สำเร็จ!', description: 'สิ่งของของคุณพร้อมให้เช่าแล้ว' });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-primary px-4 pb-6 pt-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground font-display">โพสต์สิ่งของให้เช่า</h1>
        </div>
      </div>

      <div className="-mt-3 rounded-t-3xl bg-background px-4 pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">รูปภาพ</label>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Camera className="h-6 w-6" />
                <span className="text-[10px]">เพิ่มรูป</span>
              </button>
              <button
                type="button"
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">ชื่อสิ่งของ</label>
            <Input placeholder="เช่น สว่านไฟฟ้า Bosch" value={form.title} onChange={(e) => update('title', e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">หมวดหมู่</label>
            <Select value={form.category} onValueChange={(v) => update('category', v)}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter((c) => c !== 'ทั้งหมด').map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">รายละเอียด</label>
            <Textarea placeholder="อธิบายสิ่งของ สภาพ อุปกรณ์เสริม..." value={form.description} onChange={(e) => update('description', e.target.value)} className="min-h-[100px]" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">เงื่อนไขการเช่า</label>
            <Textarea placeholder="ระยะเวลาเช่า, การดูแลรักษา, ข้อจำกัด..." value={form.conditions} onChange={(e) => update('conditions', e.target.value)} className="min-h-[80px]" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">ค่าเช่าต่อวัน (บาท)</label>
            <Input type="number" placeholder="0" value={form.rental_price_per_day} onChange={(e) => update('rental_price_per_day', e.target.value)} required />
            {rentalPrice > 0 && (
              <div className="rounded-lg bg-muted/50 p-2.5 text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>ค่าธรรมเนียมแพลตฟอร์ม (10%)</span>
                  <span>-฿{platformFee}</span>
                </div>
                <div className="flex justify-between font-medium text-foreground">
                  <span>คุณจะได้รับต่อวัน</span>
                  <span className="text-primary">฿{ownerEarnings}</span>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            ลงประกาศ
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
};

export default PostItem;
