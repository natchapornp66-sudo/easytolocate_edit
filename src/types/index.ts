// ==========================================
// 1. Types ตรงตาม Database Schema (PostgreSQL/Backend)
// ==========================================

export interface User {
  user_id: string; // ตรง DB (เดิมใช้ id)
  email: string;
  full_name: string;
  phone_number?: string; // ตรง DB (เดิมใช้ phone)
  address?: string;
  trust_score: number;
  status: 'active' | 'suspended' | 'banned';
  role?: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
}

export interface Item {
  item_id: string; // ตรง DB (เดิมใช้ id)
  lender_id: string; // ตรง DB (เดิมใช้ owner_id)
  category_id?: number;
  title: string;
  description: string;
  conditions?: string;
  daily_price: number; // ตรง DB (เดิมใช้ rental_price_per_day)
  deposit_amount?: number;
  images?: string[];
  status: 'active' | 'rented' | 'maintenance' | 'inactive';
  rental_conditions?: string;
  created_at: string;
  updated_at?: string;

  // Extra fields จาก JOIN Query
  category_name?: string;
  lender_name?: string;
  distance_km?: number;
}

export interface Rental {
  rental_id: string;
  item_id: string;
  borrower_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  deposit_status: 'pending' | 'holding' | 'refunded' | 'forfeited';
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
  updated_at?: string;

  // Extra fields จาก JOIN Query
  item_title?: string;
  borrower_name?: string;
}

// ==========================================
// 2. Types สำหรับ 4 ตารางใหม่
// ==========================================

export interface UserVerification {
  verification_id: string;
  user_id: string;
  id_card_number: string;
  id_card_image_url: string;
  selfie_image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
}

export interface Agreement {
  agreement_id: string;
  rental_id: string;
  contract_terms: string;
  borrower_accepted: boolean;
  lender_accepted: boolean;
  accepted_at?: string;
  created_at: string;

  // Extra fields จาก JOIN
  rental_status?: string;
  item_title?: string;
}

export interface ChatMessage {
  message_id: string; // ตรง DB
  sender_id: string;
  receiver_id: string;
  rental_id?: string;
  message: string;
  is_read: boolean;
  created_at: string; // ตรง DB (เดิมใช้ timestamp)

  // Extra fields จาก JOIN
  sender_name?: string;
}

export interface Notification {
  notification_id: string; // ตรง DB (เดิมใช้ id)
  user_id: string;
  title: string;
  message: string;
  type?: 'request' | 'approval' | 'reminder' | 'review' | 'system' | 'payment';
  is_read: boolean; // ตรง DB (เดิมใช้ read)
  created_at: string;
}

// ==========================================
// 3. Category Type
// ==========================================

export type CategoryName =
  | 'ทั้งหมด'
  | 'เครื่องมือช่าง'
  | 'เครื่องใช้ไฟฟ้า'
  | 'กีฬา'
  | 'แคมป์ปิ้ง'
  | 'อิเล็กทรอนิกส์'
  | 'เฟอร์นิเจอร์'
  | 'อื่นๆ';