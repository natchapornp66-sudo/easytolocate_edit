import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCircle, Clock, Star, AlertCircle, CreditCard } from 'lucide-react';
import { Notification } from '@/types';
import { getAuthSession } from '@/lib/auth';

const iconMap: Record<string, React.ElementType> = {
  rental_request: Bell,
  approved: CheckCircle,
  rejected: AlertCircle,
  borrowing: Clock,
  due_return: Clock,
  chat: Bell,
  review: Star,
  system: AlertCircle,
  payment: CreditCard,
};

const colorMap: Record<string, string> = {
  rental_request: 'bg-primary/10 text-primary',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  borrowing: 'bg-primary/10 text-primary',
  due_return: 'bg-warning/10 text-warning',
  chat: 'bg-primary/10 text-primary',
  review: 'bg-warning/10 text-warning',
  system: 'bg-muted text-muted-foreground',
  payment: 'bg-primary/10 text-primary',
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);

        const session = getAuthSession();

        console.log('AUTH SESSION:', session);
        console.log('NOTIFICATION USER ID:', session.userId);

        if (!session.userId) {
          if (isMounted) {
            setNotifications([]);
          }
          return;
        }

        if (!session.userId) {
          if (isMounted) {
            setNotifications([]);
          }
          return;
        }

        const token = localStorage.getItem('token');

        const res = await fetch(
          'http://localhost:5000/api/notifications',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const response = await res.json();

        if (isMounted) {
          const actualData = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : [];

          setNotifications(actualData);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);

        if (isMounted) {
          setNotifications([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleMarkAsRead = async (id: string | number) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบก่อน');
      }

      const res = await fetch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setNotifications((prev) =>
        prev.map((n: any) =>
          String(n.notification_id || n.id) === String(id)
            ? { ...n, is_read: true, read: true }
            : n
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="bg-gradient-primary px-4 pb-6 pt-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground font-display">การแจ้งเตือน</h1>
        </div>
      </div>

      <div className="-mt-3 rounded-t-3xl bg-background px-4 pt-4">
        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
            กำลังโหลดการแจ้งเตือน...
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif: any) => {
              const type = notif.type || 'system';
              const Icon = iconMap[type] || AlertCircle;
              const isRead = notif.is_read ?? notif.read ?? false;
              const notifId = notif.notification_id || notif.id;

              return (
                <div
                  key={notifId}
                  onClick={() => !isRead && handleMarkAsRead(notifId)}
                  className={`flex gap-3 rounded-xl border p-3 animate-fade-in transition-colors cursor-pointer ${isRead ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'
                    }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorMap[type] || 'bg-muted text-muted-foreground'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${isRead ? 'text-card-foreground' : 'font-semibold text-foreground'}`}>
                        {notif.title}
                      </p>
                      {!isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{notif.message}</p>
                    {notif.created_at && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(notif.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Bell className="mb-2 h-8 w-8" />
                <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;