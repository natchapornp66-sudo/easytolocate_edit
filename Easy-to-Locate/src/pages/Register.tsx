import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, ArrowLeft, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const policyContent = [
  { title: '1. นโยบายการสมัครสมาชิกและยืนยันตัวตน', items: ['ผู้ใช้งานต้องให้ข้อมูลที่ถูกต้องและเป็นความจริง', 'ระบบอาจมีการยืนยันอีเมลหรือเบอร์โทรศัพท์ก่อนใช้งาน', 'ห้ามสร้างบัญชีปลอมหรือแอบอ้างบุคคลอื่น', 'ระบบมีสิทธิ์ระงับบัญชีหากพบการกระทำผิดกฎ'] },
  { title: '2. นโยบายการลงประกาศให้เช่า', items: ['ผู้ให้เช่าต้องลงรายละเอียดสิ่งของตามความเป็นจริง', 'ต้องระบุค่าเช่าต่อวันอย่างชัดเจน', 'ห้ามลงประกาศสิ่งของผิดกฎหมาย เช่น อาวุธ ยาเสพติด หรือของละเมิดลิขสิทธิ์', 'ระบบมีสิทธิ์ลบหรือระงับโพสต์ที่ไม่เหมาะสม'] },
  { title: '3. นโยบายการชำระเงิน', items: ['การชำระค่าเช่าจะต้องทำผ่านระบบชำระเงินภายในแอป', 'ระบบอาจเรียกเก็บค่าธรรมเนียมการให้บริการ เช่น 10% ต่อธุรกรรม', 'เงินค่าเช่าจะถูกโอนให้ผู้ให้เช่าหลังจากยืนยันการส่งมอบสำเร็จ', 'หากมีปัญหาความเสียหายหรือคืนล่าช้า จะถูกพิจารณาตามเงื่อนไขที่ระบุ', 'ระบบมีสิทธิ์ระงับธุรกรรมหากพบพฤติกรรมผิดปกติ'] },
  { title: '4. นโยบายการคืนสินค้าและความเสียหาย', items: ['ผู้เช่าต้องคืนสิ่งของตามกำหนดเวลา', 'หากคืนล่าช้า อาจมีค่าปรับตามที่กำหนด', 'หากเกิดความเสียหาย ผู้เช่าต้องรับผิดชอบตามที่ตกลง', 'หากความเสียหายเกินกว่าที่ตกลง ผู้เช่าต้องรับผิดชอบส่วนต่าง'] },
  { title: '5. นโยบายการยกเลิก', items: ['ผู้เช่าสามารถยกเลิกก่อนวันเริ่มเช่า ตามเวลาที่กำหนด', 'การคืนเงินขึ้นอยู่กับช่วงเวลาที่ยกเลิก', 'หากยกเลิกหลังเริ่มเช่า อาจไม่สามารถคืนเงินค่าเช่าได้'] },
  { title: '6. นโยบายคะแนนความน่าเชื่อถือ', items: ['ผู้ใช้สามารถให้คะแนนและรีวิวหลังจบธุรกรรม', 'ห้ามใช้ถ้อยคำหยาบคาย หมิ่นประมาท หรือข้อมูลเท็จ', 'ระบบสามารถลบรีวิวที่ไม่เหมาะสมได้'] },
  { title: '7. นโยบายความปลอดภัยและข้อมูลส่วนบุคคล', items: ['ระบบจะเก็บข้อมูลผู้ใช้ตามวัตถุประสงค์ของบริการเท่านั้น', 'ข้อมูลจะไม่ถูกเปิดเผยแก่บุคคลภายนอกโดยไม่ได้รับอนุญาต', 'ระบบมีมาตรการรักษาความปลอดภัยข้อมูล เช่น การเข้ารหัสรหัสผ่าน'] },
  { title: '8. นโยบายการระงับบัญชี', items: ['ระบบมีสิทธิ์ระงับบัญชีชั่วคราวหรือถาวร หากพบว่า:', '• มีพฤติกรรมฉ้อโกง', '• หลอกลวงผู้ใช้รายอื่น', '• ใช้งานผิดวัตถุประสงค์ของระบบ', '• ฝ่าฝืนนโยบายอย่างร้ายแรง'] },
  { title: '9. ค่าธรรมเนียมการให้บริการ', items: ['ระบบเรียกเก็บค่าธรรมเนียม 10% ของค่าเช่าทั้งหมดต่อหนึ่งธุรกรรม', 'ค่าธรรมเนียมจะถูกหักอัตโนมัติจากยอดเงินก่อนโอนเข้าบัญชีของผู้ให้เช่า'] },
  { title: '10. นโยบายการจัดการข้อพิพาท', items: ['หากเกิดข้อพิพาท ผู้ใช้สามารถแจ้งเรื่องผ่านระบบภายใน 3 วันหลังธุรกรรมเสร็จสิ้น', 'ทั้งสองฝ่ายต้องแนบหลักฐาน เช่น รูปภาพก่อน-หลังการเช่า', 'ผู้ดูแลระบบจะทำหน้าที่เป็นตัวกลางพิจารณาข้อพิพาทอย่างเป็นธรรม', 'ระบบมีสิทธิ์ตัดสินใจขั้นสุดท้ายตามหลักฐานที่ได้รับ'] },
  { title: '11. ข้อจำกัดความรับผิด', items: ['ระบบเป็นเพียงแพลตฟอร์มตัวกลางในการเชื่อมต่อระหว่างผู้ให้เช่าและผู้เช่า', 'ระบบไม่เป็นเจ้าของสิ่งของที่ลงประกาศ และไม่รับประกันคุณภาพ', 'ระบบไม่รับผิดชอบต่อความเสียหาย การสูญหาย หรือข้อพิพาทระหว่างผู้ใช้', 'ผู้ใช้ตกลงยอมรับความเสี่ยงที่อาจเกิดขึ้นจากการทำธุรกรรม'] },
];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [gpsConfirmed, setGpsConfirmed] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    address: '',
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGpsConfirmed(true);
          toast({ title: 'ยืนยัน GPS สำเร็จ', description: 'ตำแหน่งของคุณได้รับการบันทึกแล้ว' });
        },
        () => {
          toast({ title: 'ไม่สามารถเข้าถึง GPS', description: 'กรุณาอนุญาตการเข้าถึงตำแหน่ง', variant: 'destructive' });
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (form.password !== form.confirmPassword) {
        toast({ title: 'รหัสผ่านไม่ตรงกัน', variant: 'destructive' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!gpsConfirmed) {
        toast({ title: 'กรุณายืนยัน GPS', variant: 'destructive' });
        return;
      }
      setStep(4);
    } else {
      if (!policyAccepted) {
        toast({ title: 'กรุณายอมรับนโยบายการใช้งาน', variant: 'destructive' });
        return;
      }
      toast({ title: 'สมัครสมาชิกสำเร็จ!', description: 'กรุณาตรวจสอบอีเมลเพื่อยืนยัน' });
      navigate('/login');
    }
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary px-6 pb-8 pt-12">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate('/login'))} className="mb-4 text-primary-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-primary-foreground font-display">สมัครสมาชิก</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">ขั้นตอนที่ {step} จาก {totalSteps}</p>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary-foreground' : 'bg-primary-foreground/30'}`} />
          ))}
        </div>
      </div>

      <div className="-mt-4 rounded-t-3xl bg-background px-6 pt-6 pb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold font-display text-foreground">ข้อมูลเข้าสู่ระบบ</h2>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">อีเมล</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" placeholder="your@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">รหัสผ่าน</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={(e) => update('password', e.target.value)} className="pl-10 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="pl-10" required />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-bold font-display text-foreground">ข้อมูลส่วนตัว</h2>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">ชื่อ-นามสกุล</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="ชื่อ นามสกุล" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">เบอร์โทรศัพท์</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="tel" placeholder="08X-XXX-XXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">ที่อยู่</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด" value={form.address} onChange={(e) => update('address', e.target.value)} className="min-h-[80px] pl-10" required />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-bold font-display text-foreground">ยืนยันตำแหน่ง GPS</h2>
              <p className="text-sm text-muted-foreground">กรุณายืนยันตำแหน่งปัจจุบันของคุณเพื่อค้นหาสิ่งของใกล้เคียง</p>
              <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/50 p-8">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${gpsConfirmed ? 'bg-success/15' : 'bg-primary/10'}`}>
                  <Navigation className={`h-8 w-8 ${gpsConfirmed ? 'text-success' : 'text-primary'}`} />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {gpsConfirmed ? 'ยืนยันตำแหน่งเรียบร้อยแล้ว ✓' : 'กดปุ่มด้านล่างเพื่อยืนยันตำแหน่ง'}
                </p>
                {!gpsConfirmed && (
                  <Button type="button" onClick={handleGPS} variant="outline" className="gap-2">
                    <Navigation className="h-4 w-4" />
                    ยืนยันตำแหน่ง GPS
                  </Button>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-lg font-bold font-display text-foreground">ยอมรับนโยบายการใช้งาน</h2>
              <p className="text-sm text-muted-foreground">กรุณาอ่านและยอมรับนโยบายก่อนสมัครสมาชิก</p>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-card-foreground mb-2">นโยบายการใช้งานระบบ</h3>
                <p className="text-xs text-muted-foreground mb-3">กรุณาอ่านนโยบายทั้งหมดก่อนยอมรับ</p>
                <Button type="button" variant="outline" className="w-full" onClick={() => setShowPolicy(true)}>
                  อ่านนโยบายทั้งหมด
                </Button>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-4">
                <Checkbox id="policy" checked={policyAccepted} onCheckedChange={(c) => setPolicyAccepted(!!c)} className="mt-0.5" />
                <label htmlFor="policy" className="text-sm text-foreground cursor-pointer leading-relaxed">
                  ข้าพเจ้าได้อ่านและยอมรับ <button type="button" onClick={() => setShowPolicy(true)} className="text-primary underline font-medium">นโยบายการใช้งานระบบ</button> ทั้งหมดแล้ว
                </label>
              </div>
            </>
          )}

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            {step < totalSteps ? 'ถัดไป' : 'สมัครสมาชิก'}
          </Button>
        </form>
      </div>

      {/* Policy Dialog */}
      <Dialog open={showPolicy} onOpenChange={setShowPolicy}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-display">นโยบายการใช้งานระบบ (System Policy)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {policyContent.map((section, i) => (
              <div key={i}>
                <h4 className="text-sm font-semibold text-foreground mb-1">{section.title}</h4>
                <ul className="space-y-1">
                  {section.items.map((item, j) => (
                    <li key={j} className="text-xs text-muted-foreground leading-relaxed">• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Button onClick={() => setShowPolicy(false)} className="w-full mt-2">ปิด</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;
