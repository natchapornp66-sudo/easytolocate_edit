import { useEffect, useState } from 'react';
import { apiGet, apiPatch, buildApiUrl } from '@/lib/api';
import { UserVerification } from '@/types';

type Entry = UserVerification & { full_name: string; email: string };
function DocumentImage({ id, type }: { id: string; type: 'id-card' | 'selfie' }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let objectUrl = '';
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(buildApiUrl(`/verifications/${id}/files/${type}`), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }, signal: controller.signal,
        });
        if (!response.ok) throw new Error('Document unavailable');
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
      } catch { if (!controller.signal.aborted) setFailed(true); }
    };
    void load();
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, type]);
  if (!url) return <p className="text-sm">{failed ? 'ไม่พบภาพเอกสารในระบบ' : 'กำลังโหลดเอกสาร...'}</p>;
  return <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={type === 'id-card' ? 'ภาพบัตรประชาชนที่ส่งตรวจ' : 'ภาพเซลฟีที่ส่งตรวจ'} className="max-h-64 w-full rounded-lg object-contain" /></a>;
}

export default function AdminVerifications() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    apiGet<{ success: boolean; data: Entry[] }>('/verifications/admin').then(result => {
      if (active) setEntries(result.data.filter(row => row.status === 'pending'));
    }).catch(() => { if (active) setError('ไม่สามารถโหลดคำขอยืนยันตัวตนได้'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const review = async (id: string, status: 'approved' | 'rejected') => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await apiPatch(`/verifications/${id}/review`, { status });
      setEntries(current => current.filter(row => row.verification_id !== id)); setSelected(null);
    } catch { setError('บันทึกผลไม่สำเร็จ คำขออาจถูกตรวจแล้ว กรุณาโหลดรายการอีกครั้ง'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-100">
    <h3 className="text-lg font-semibold">คำขอยืนยันตัวตน</h3>
    <button type="button" className="mt-2 text-sm text-blue-300 underline" disabled={busy || loading} onClick={() => setReload(n => n + 1)}>โหลดรายการใหม่</button>
    {loading && <p className="mt-3 text-sm">กำลังโหลด...</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    {!loading && !error && entries.length === 0 && <p className="mt-3 text-sm">ไม่มีคำขอที่รอตรวจสอบ</p>}
    <div className="mt-3 space-y-3">{entries.map(row => <div key={row.verification_id} className="rounded-xl border border-slate-700 p-4">
      <p>{row.full_name}</p><p className="break-all text-sm text-slate-400">{row.email}</p>
      <p className="text-sm">เลขท้ายบัตร: {row.id_card_last4 || '-'}</p>
      <button type="button" disabled={busy} className="mt-2 text-sm text-blue-300 underline" onClick={() => setSelected(selected === row.verification_id ? null : row.verification_id)}>ดูเอกสาร</button>
      {selected === row.verification_id && <div className="mt-3 space-y-3">
        <DocumentImage id={row.verification_id} type="id-card" /><DocumentImage id={row.verification_id} type="selfie" />
        <div className="flex gap-3"><button type="button" disabled={busy} className="rounded bg-blue-700 px-3 py-2 text-sm disabled:opacity-50" onClick={() => void review(row.verification_id, 'approved')}>อนุมัติการยืนยันตัวตน</button>
          <button type="button" disabled={busy} className="rounded border border-red-400 px-3 py-2 text-sm disabled:opacity-50" onClick={() => void review(row.verification_id, 'rejected')}>ไม่ผ่านการตรวจสอบ</button></div>
      </div>}
    </div>)}</div>
  </section>;
}
