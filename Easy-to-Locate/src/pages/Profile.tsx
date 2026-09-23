import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Shield, MapPin, Phone, Mail, Edit, LogOut, ChevronRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currentUser, mockTransactions } from '@/data/mockData';
import { mockReviews } from '@/data/mockReviews';
import BottomNav from '@/components/BottomNav';

const Profile = () => {
  const navigate = useNavigate();
  const [showReviews, setShowReviews] = useState(false);
  const completedCount = mockTransactions.filter((t) => t.status === 'completed').length;

  // Reviews about the current user
  const myReviews = mockReviews.filter((r) => r.reviewee_id === currentUser.id);
  // Reviews written by the current user
  const writtenReviews = mockReviews.filter((r) => r.reviewer_id === currentUser.id);
  const allMyReviews = [...myReviews, ...writtenReviews];

  const menuItems = [
    { icon: Edit, label: 'แก้ไขข้อมูลส่วนตัว', action: () => {} },
    { icon: Shield, label: 'ยืนยันตัวตน', action: () => {} },
    { icon: MessageSquare, label: 'รีวิวของฉัน', action: () => setShowReviews(!showReviews) },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-primary px-4 pb-10 pt-10">
        <h1 className="text-lg font-bold text-primary-foreground font-display">โปรไฟล์</h1>
      </div>

      <div className="-mt-6 rounded-t-3xl bg-background px-4 pt-6">
        {/* Avatar + Info */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 card-shadow -mt-10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
            {currentUser.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-card-foreground">{currentUser.full_name}</h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
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
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
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
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground">ข้อมูลติดต่อ</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            {currentUser.email}
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

      <BottomNav />
    </div>
  );
};

export default Profile;
