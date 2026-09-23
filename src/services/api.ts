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
export const fetchAgreementByRentalId = async (rentalId: string): Promise<{ success: boolean; data: Agreement | null }> => {
    const res = await fetch(`${API_BASE_URL}/agreements/rental/${rentalId}`);
    return res.json();
};

export const signAgreement = async (payload: {
    rental_id: string;
    contract_terms: string;
    borrower_accepted: boolean;
    lender_accepted: boolean;
}) => {
    const res = await fetch(`${API_BASE_URL}/agreements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return res.json();
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
export const fetchNotifications = async (userId: string): Promise<{ success: boolean; data: Notification[] }> => {
    const res = await fetch(`${API_BASE_URL}/notifications/user/${userId}`);
    return res.json();
};

export const markNotificationAsRead = async (notificationId: string) => {
    const res = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
    });
    return res.json();
};