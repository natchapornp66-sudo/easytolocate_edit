import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCircle, Clock, Star, AlertCircle, CreditCard } from 'lucide-react';
import { Notification } from '@/types';
import { getAuthSession } from '@/lib/auth';
import { buildApiUrl } from '@/lib/api';

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
  dispute_resolved: CheckCircle,
};

const colorMap: Record<string, string> = {
  dispute_resolved: 'bg-success/10 text-success',
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
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        setError('');

        const session = getAuthSession();


        if (!session.userId) {
          if (isMounted) {
            setNotifications([]);
          }
          return;
        }



        const token = localStorage.getItem('token');

        const res = await fetch(
          buildApiUrl('/notifications'),
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
          setError('ไม่สามารถโหลดการแจ้งเตือนได้ กรุณาลองใหม่');
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
  }, [reload]);

  const handleMarkAsRead = async (id: string | number) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบก่อน');
      }

      const res = await fetch(
        buildApiUrl(`/notifications/${id}/read`),
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
      return true;
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError('ทำเครื่องหมายอ่านแล้วไม่สำเร็จ กรุณาลองใหม่');
      return false;
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    const item = notif as Notification & {
      notification_id?: string;
      id?: string | number;
      type?: string;
      message?: string;
      is_read?: boolean;
      read?: boolean;
    };

    const notifId = item.notification_id || item.id;
    const isRead = item.is_read ?? item.read ?? false;

    // ทำเครื่องหมายอ่านแล้ว หากยังไม่อ่าน
    if (notifId && !isRead) {
      if (!await handleMarkAsRead(notifId)) return;
    }

    // การแจ้งเตือนประเภทอื่นยังคงทำงานแบบเดิม
    if (item.type?.startsWith('verification_')) {
      navigate('/profile');
      return;
    }
    if (item.type !== 'dispute_resolved') {
      return;
    }

    // อ่าน UUID ของข้อพิพาทจากข้อความแจ้งเตือน
    // รูปแบบที่ Backend บันทึกไว้: รหัสข้อพิพาท: UUID
    const match = String(item.message || '').match(
      /รหัสข้อพิพาท:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    );

    if (!match) {
      console.warn('ไม่พบรหัสข้อพิพาทในแจ้งเตือน');
      return;
    }

    navigate(`/disputes/${match[1]}`);
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
        {error && <div role="alert" className="mb-3 rounded border border-red-200 bg-white p-3 text-sm text-red-600"><p>{error}</p><button type="button" className="mt-2 underline" onClick={() => setReload(n => n + 1)}>ลองใหม่</button></div>}
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
                <button type="button"
                  key={notifId}
                  onClick={() => void handleNotificationClick(notif)}
                  className={`flex w-full gap-3 rounded-xl border p-3 text-left animate-fade-in transition-colors cursor-pointer ${isRead ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'
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
                </button>
              );
            })}

            {!error && notifications.length === 0 && (
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
