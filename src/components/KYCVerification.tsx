import { useEffect, useState, type FormEvent } from 'react';
import { UserVerification } from '@/types';
import { fetchUserVerification, submitVerification } from '@/services/api';

const labels = { pending: 'รอการตรวจสอบ', approved: 'ยืนยันตัวตนแล้ว', rejected: 'ยังไม่ผ่าน กรุณาตรวจสอบเอกสารและส่งใหม่' };
export const KYCVerification = ({ userId }: { userId: string }) => {
  const [kyc, setKyc] = useState<UserVerification | null>(null);
  const [idCard, setIdCard] = useState('');
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    fetchUserVerification(userId).then(result => {
      if (active) setKyc(result.data);
    }).catch(() => { if (active) setError('ไม่สามารถโหลดสถานะยืนยันตัวตนได้'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId, reload]);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !cardImage || !selfie) return;
    if (!/^[0-9]{13}$/.test(idCard) || [cardImage, selfie].some(f => !['image/jpeg', 'image/png'].includes(f.type) || f.size > 5 * 1024 * 1024)) {
      setError('กรุณาตรวจเลขบัตร 13 หลัก และเลือก JPG/PNG ขนาดไม่เกิน 5 MB ต่อภาพ'); return;
    }
    setSubmitting(true); setError('');
    try {
      const data = new FormData();
      data.set('id_card_number', idCard); data.set('id_card_image', cardImage); data.set('selfie_image', selfie);
      const result = await submitVerification(data);
      setKyc(result.data); setIdCard(''); setCardImage(null); setSelfie(null);
    } catch { setError('ส่งข้อมูลไม่สำเร็จ กรุณาตรวจเลขบัตรและภาพเอกสาร หรือลองโหลดสถานะอีกครั้ง'); }
    finally { setSubmitting(false); }
  };
  return <section className="mt-4 rounded-xl border border-border bg-card p-4">
    <h3 className="mb-3 font-semibold">ยืนยันตัวตน (KYC)</h3>
    {loading && <p>กำลังโหลดสถานะ...</p>}
    {error && <div role="alert"><p className="text-sm text-red-600">{error}</p>
      <button type="button" className="mt-2 text-sm text-primary underline" onClick={() => setReload(n => n + 1)}>โหลดสถานะอีกครั้ง</button></div>}
    {!loading && kyc && <p className="mb-3 text-sm">สถานะ: {labels[kyc.status]} {kyc.id_card_last4 ? `(เลขท้ายบัตร ${kyc.id_card_last4})` : ''}</p>}
    {!loading && (!kyc || kyc.status === 'rejected') && <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm">เลขบัตรประชาชน 13 หลัก
        <input aria-label="เลขบัตรประชาชน 13 หลัก" className="mt-1 block w-full rounded border p-2" value={idCard} onChange={e => setIdCard(e.target.value)} inputMode="numeric" maxLength={13} required disabled={submitting} />
      </label>
      <label className="block text-sm">ภาพบัตรประชาชน
        <input aria-label="ภาพบัตรประชาชน" className="mt-1 block w-full" type="file" accept="image/jpeg,image/png" required disabled={submitting} onChange={e => setCardImage(e.target.files?.[0] || null)} />
      </label>
      <label className="block text-sm">ภาพเซลฟี
        <input aria-label="ภาพเซลฟี" className="mt-1 block w-full" type="file" accept="image/jpeg,image/png" required disabled={submitting} onChange={e => setSelfie(e.target.files?.[0] || null)} />
      </label>
      <p className="text-xs text-muted-foreground">JPG/PNG ขนาดไม่เกิน 5 MB ต่อภาพ เอกสารเปิดได้เฉพาะเจ้าของบัญชีและผู้ดูแลระบบ</p>
      <button className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50" disabled={submitting || !cardImage || !selfie}>{submitting ? 'กำลังส่ง...' : 'ส่งข้อมูลยืนยันตัวตน'}</button>
    </form>}
  </section>;
};
