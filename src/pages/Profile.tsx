import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Shield, MapPin, Phone, Mail, Edit, LogOut, ChevronRight, MessageSquare, Package, Landmark, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currentUser, mockTransactions } from '@/data/mockData';
import { mockReviews } from '@/data/mockReviews';
import BottomNav from '@/components/BottomNav';
import { getAuthSession } from '@/lib/auth';

const Profile = () => {
  const navigate = useNavigate();
  const session = getAuthSession();
  const [showReviews, setShowReviews] = useState(false);
  const completedCount = mockTransactions.filter((t) => t.status === 'completed').length;

  // Reviews about the current user
  const myReviews = mockReviews.filter((r) => r.reviewee_id === currentUser.id);
  // Reviews written by the current user
  const writtenReviews = mockReviews.filter((r) => r.reviewer_id === currentUser.id);
  const allMyReviews = [...myReviews, ...writtenReviews];

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
      action: () => { },
    },
    {
      icon: Shield,
      label: 'ยืนยันตัวตน',
      action: () => { },
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

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">

          {/* Avatar + Info */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 sm:flex-row sm:items-center md:p-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-blue-950 text-2xl font-bold text-white shadow-md">
              {(session.fullName || '?').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="break-words text-center text-xl font-bold text-blue-950 sm:text-left">
                {session.fullName}
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
              <span className="min-w-0 break-all">{session.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              {currentUser.phone}
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              {currentUser.address}
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
            onClick={() => navigate('/login')}
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>

        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
