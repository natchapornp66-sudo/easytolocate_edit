import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCircle, Clock, Star, AlertCircle, CreditCard } from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import { Notification } from '@/types';

const iconMap: Record<Notification['type'], React.ElementType> = {
  request: Bell,
  approval: CheckCircle,
  reminder: Clock,
  review: Star,
  system: AlertCircle,
  payment: CreditCard,
};

const colorMap: Record<Notification['type'], string> = {
  request: 'bg-primary/10 text-primary',
  approval: 'bg-success/10 text-success',
  reminder: 'bg-warning/10 text-warning',
  review: 'bg-warning/10 text-warning',
  system: 'bg-muted text-muted-foreground',
  payment: 'bg-primary/10 text-primary',
};

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary px-4 pb-6 pt-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground font-display">การแจ้งเตือน</h1>
        </div>
      </div>

      <div className="-mt-3 rounded-t-3xl bg-background px-4 pt-4">
        <div className="space-y-2">
          {mockNotifications.map((notif) => {
            const Icon = iconMap[notif.type];
            return (
              <div
                key={notif.id}
                className={`flex gap-3 rounded-xl border p-3 animate-fade-in transition-colors ${
                  notif.read ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorMap[notif.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${notif.read ? 'text-card-foreground' : 'font-semibold text-foreground'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{notif.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(notif.created_at).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
