import { Item, Rental, Agreement, ChatMessage, Notification, UserVerification } from '../types';

// URL ของ Express Backend Server
const API_BASE_URL = 'http://localhost:5000/api';

// --- Items & Rentals ---
export const fetchItems = async (): Promise<Item[]> => {
    const res = await fetch(`${API_BASE_URL}/items`);
    return res.json();
};

export const fetchRentals = async (): Promise<Rental[]> => {
    const res = await fetch(`${API_BASE_URL}/rentals`);
    return res.json();
};

// --- KYC / Verifications ---
export const fetchUserVerification = async (userId: string): Promise<{ success: boolean; data: UserVerification | null }> => {
    const res = await fetch(`${API_BASE_URL}/verifications/user/${userId}`);
    return res.json();
};

export const submitVerification = async (payload: {
    user_id: string;
    id_card_number: string;
    id_card_image_url: string;
    selfie_image_url: string;
}) => {
    const res = await fetch(`${API_BASE_URL}/verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
};

// --- E-Agreements ---

export const fetchAgreementByRentalId = async (
    rentalId: string
): Promise<{ success: boolean; data: Agreement | null }> => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบก่อน');
    }

    const res = await fetch(
        `${API_BASE_URL}/agreements/rental/${rentalId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const result = await res.json();

    if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถโหลดข้อมูลสัญญาได้');
    }

    return result;
};

export const signAgreement = async (payload: {
    rental_id: string;
}) => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบก่อน');
    }

    const res = await fetch(`${API_BASE_URL}/agreements`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            rental_id: payload.rental_id,
        }),
    });

    const result = await res.json();

    if (!res.ok) {
        throw new Error(result.error || 'ไม่สามารถยอมรับสัญญาได้');
    }

    return result;
};

// --- Chat Messages ---
export const fetchChatHistory = async (rentalId: string): Promise<{ success: boolean; data: ChatMessage[] }> => {
    const res = await fetch(`${API_BASE_URL}/chats/messages?rental_id=${rentalId}`);
    return res.json();
};

export const sendChatMessage = async (payload: {
    sender_id: string;
    receiver_id: string;
    rental_id?: string;
    message: string;
}) => {
    const res = await fetch(`${API_BASE_URL}/chats/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
};

// --- Notifications ---

export const fetchNotifications = async (): Promise<{
    success: boolean;
    data: Notification[];
}> => {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error('ไม่สามารถโหลดการแจ้งเตือนได้');
    }

    return res.json();
};

export const markNotificationAsRead = async (
    notificationId: string
) => {
    const token = localStorage.getItem('token');

    const res = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        throw new Error('ไม่สามารถอัปเดตสถานะการแจ้งเตือนได้');
    }

    return res.json();
};