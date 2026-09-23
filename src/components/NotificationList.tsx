import React, { useEffect, useState } from 'react';
import { Notification } from '../types';
import { fetchNotifications, markNotificationAsRead } from '../services/api';

export const NotificationList: React.FC<{ userId: string }> = ({ userId }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const loadNotifications = () => {
        fetchNotifications(userId).then((res) => {
            if (res.success) setNotifications(res.data);
        });
    };

    useEffect(() => {
        loadNotifications();
    }, [userId]);

    const handleRead = async (id: string) => {
        await markNotificationAsRead(id);
        loadNotifications();
    };

    return (
        <div className="p-4 border rounded max-w-md">
            <h2 className="text-lg font-bold mb-3">การแจ้งเตือน</h2>
            <div className="space-y-2">
                {notifications.map((notif) => (
                    <div
                        key={notif.notification_id}
                        onClick={() => handleRead(notif.notification_id)}
                        className={`p-3 rounded cursor-pointer border ${notif.is_read ? 'bg-gray-50' : 'bg-blue-50 font-semibold'
                            }`}
                    >
                        <p className="text-sm font-bold">{notif.title}</p>
                        <p className="text-xs text-gray-600">{notif.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};