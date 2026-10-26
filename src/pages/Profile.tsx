import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Shield, Phone, Mail, Edit, LogOut, ChevronRight, MessageSquare, Package, Landmark, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { clearAuthSession, getAuthSession, setAuthSession } from '@/lib/auth';
import { apiGet, apiPatch } from '@/lib/api';
import { KYCVerification } from '@/components/KYCVerification';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type ProfileData = {
  user_id: string; full_name: string; email: string; phone_number: string | null;
  trust_score: number; completed_count: number;
  reviews: { id: string; reviewer_id: string; reviewee_id: string; rating: number; comment: string; created_at: string; item_title: string; reviewer_name: string }[];
};

const Profile = () => {
  const navigate = useNavigate();
  const session = getAuthSession();
  const [showReviews, setShowReviews] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    apiGet<{ success: boolean; data: ProfileData }>('/auth/me').then(result => {
      if (active) setProfile(result.data);
    }).catch(() => { if (active) setError('ไม่สามารถโหลดโปรไฟล์ได้ กรุณาลองใหม่'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (saving) return;
    setSaving(true); setSaveError('');
    try {
      const result = await apiPatch<{ success: boolean; data: { full_name: string; phone_number: string | null } }>('/auth/me', { full_name: name, phone_number: phone });
      setProfile(current => current ? { ...current, ...result.data } : current);
      setAuthSession({ ...session, fullName: result.data.full_name });
      setEditing(false);
    } catch { setSaveError('บันทึกไม่สำเร็จ กรุณาตรวจชื่อและเบอร์โทรศัพท์'); }
    finally { setSaving(false); }
  };
  const currentUser = { id: profile?.user_id || session.userId, trust_score: profile?.trust_score || 0, phone: profile?.phone_number || 'ยังไม่ได้ระบุเบอร์โทรศัพท์' };
  const completedCount = profile?.completed_count || 0;
  const allMyReviews = profile?.reviews || [];

  const menuItems = [
    {
      icon: Package,
      label: 'โพสต์ของฉัน',
      action: () => navigate('/my-items'),
    },
    {
      icon: Landmark,
      label: 'จัดการบัญชีธนาคาร',
      action: () => navigate('/bank-account'),
    },
    {
      icon: Edit,
      label: 'แก้ไขข้อมูลส่วนตัว',
      action: () => { setName(profile?.full_name || ''); setPhone(profile?.phone_number || ''); setSaveError(''); setEditing(true); },
    },
    {
      icon: Shield,
      label: 'ยืนยันตัวตน',
      action: () => setShowKyc(value => !value),
    },
    {
      icon: MessageSquare,
      label: 'รีวิวของฉัน',
      action: () => setShowReviews(!showReviews),
    },
  ];


  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 px-4 pb-20 pt-10 text-white">
        <div className="mx-auto max-w-6xl">

          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            โปรไฟล์ของฉัน
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            ดูข้อมูลส่วนตัว คะแนนความน่าเชื่อถือ และจัดการบัญชีของคุณ
          </p>

        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto -mt-12 max-w-6xl px-4">

        {loading && <p className="rounded-xl bg-white p-5">กำลังโหลดโปรไฟล์...</p>}
        {!loading && error && <div role="alert" className="rounded-xl bg-white p-5"><p>{error}</p><button className="mt-2 text-primary underline" onClick={() => setReload(n => n + 1)}>ลองใหม่</button></div>}
        {!loading && !error && profile && <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">

          {/* Avatar + Info */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 sm:flex-row sm:items-center md:p-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-blue-950 text-2xl font-bold text-white shadow-md">
              {(session.fullName || '?').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="break-words text-center text-xl font-bold text-blue-950 sm:text-left">
                {profile.full_name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500 sm:justify-start">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span className="font-semibold text-card-foreground">{currentUser.trust_score}</span>
                </div>
                <span>•</span>
                <span>{completedCount} รายการสำเร็จ</span>
              </div>
            </div>
          </div>

          {/* Trust Score */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">คะแนนความน่าเชื่อถือ</h3>
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-5 w-5 ${star <= Math.round(currentUser.trust_score) ? 'fill-warning text-warning' : 'text-border'}`} />
                ))}
              </div>
              <span className="text-lg font-bold text-card-foreground">{currentUser.trust_score}/5</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${(currentUser.trust_score / 5) * 100}%` }} />
            </div>
          </div>

          {/* Info */}
          <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-card-foreground">ข้อมูลติดต่อ</h3>
            <div className="flex min-w-0 items-center gap-3 text-sm text-slate-600">
              <Mail className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="min-w-0 break-all">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              {currentUser.phone}
            </div>
          </div>

          {/* Menu */}
          <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-card-foreground hover:bg-muted/50 transition-colors border-b border-border last:border-0"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>

          {/* My Reviews Section */}
          {showKyc && <KYCVerification userId={profile.user_id} />}
          {showReviews && (
            <div className="mt-4 rounded-xl border border-border bg-card p-4 animate-fade-in">
              <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-1.5">
                <Star className="h-4 w-4 text-warning" />
                รีวิวของฉัน ({allMyReviews.length})
              </h3>
              {allMyReviews.length > 0 ? (
                <div className="space-y-3">
                  {allMyReviews.map((review) => {
                    const isWritten = review.reviewer_id === currentUser.id;
                    return (
                      <div key={review.id} className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-primary">
                            {isWritten ? `ฉันรีวิว → ${review.item_title}` : `ได้รับจาก ${review.reviewer_name}`}
                          </span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-warning text-warning' : 'text-border'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{review.comment}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{review.created_at}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">ยังไม่มีรีวิว</p>
              )}
            </div>
          )}

          <Button
            variant="outline"
            className="mt-4 w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => { clearAuthSession(); navigate('/login', { replace: true }); }}
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>

        </div>}
      </main>

      <Dialog open={editing} onOpenChange={value => { if (!saving) setEditing(value); }}>
        <DialogContent><DialogHeader><DialogTitle>แก้ไขข้อมูลส่วนตัว</DialogTitle><DialogDescription>แก้ไขชื่อและเบอร์โทรศัพท์ของบัญชีคุณ</DialogDescription></DialogHeader>
          <form onSubmit={saveProfile} className="space-y-4">
            <label className="block text-sm">ชื่อ–นามสกุล<input aria-label="ชื่อ–นามสกุล" className="mt-1 w-full rounded border p-2" maxLength={100} required value={name} onChange={e => setName(e.target.value)} disabled={saving} /></label>
            <label className="block text-sm">เบอร์โทรศัพท์<input aria-label="เบอร์โทรศัพท์" className="mt-1 w-full rounded border p-2" type="tel" pattern="[0-9]{9,15}|^$" value={phone} onChange={e => setPhone(e.target.value)} disabled={saving} /></label>
            {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}
            <Button disabled={saving || !name.trim()} type="submit">{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Profile;
