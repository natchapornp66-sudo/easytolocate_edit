// ==========================================
// 1. Types ตรงตาม Database Schema (PostgreSQL/Backend)
// ==========================================

export interface User {
  id?: string;
  user_id: string; // ตรง DB (เดิมใช้ id)
  email: string;
  full_name: string;
  phone?: string;
  phone_number?: string; // ตรง DB (เดิมใช้ phone)
  address?: string;
  gps_location?: { lat: number; lng: number };
  trust_score: number;
  status: 'active' | 'suspended' | 'banned';
  role?: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
}

export interface Item {
  id?: string;
  item_id: string; // ตรง DB (เดิมใช้ id)
  owner_id?: string;
  lender_id: string; // ตรง DB (เดิมใช้ owner_id)
  category_id?: number;
  title: string;
  description: string;
  conditions?: string;
  rental_price_per_day?: number;
  daily_price: number; // ตรง DB (เดิมใช้ rental_price_per_day)
  deposit_amount?: number;
  images?: string[];
  status: 'active' | 'rented' | 'maintenance' | 'inactive' | 'available';
  rental_conditions?: string;
  created_at: string;
  updated_at?: string;

  // Extra fields จาก JOIN Query
  category?: string;
  category_name?: string;
  lender_name?: string;
  owner_name?: string;
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
  id_card_last4?: string;
  verified_at?: string | null;
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

export interface ChatThread {
  id: string;
  other_user_name: string;
  last_message: string;
  last_timestamp: string;
  unread_count: number;
  item_title: string;
}

export interface Notification {
  id?: string;
  notification_id: string; // ตรง DB (เดิมใช้ id)
  user_id?: string;
  title: string;
  message: string;
  type?: 'request' | 'approval' | 'reminder' | 'review' | 'system' | 'payment' | 'dispute_resolved';
  read?: boolean;
  is_read: boolean; // ตรง DB (เดิมใช้ read)
  created_at: string;
}

export interface Review {
  id: string;
  transaction_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewee_id: string;
  item_id: string;
  item_title: string;
  rating: number;
  comment: string;
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

export type Category = CategoryName;

export type TransactionStatus = | 'pending' | 'approved' | 'borrowing' | 'return_requested' | "inspection_pending" | 'fine_pending' | 'completed' | 'damaged' | 'rejected';

export interface Transaction {
  id: string;
  item_id: string;
  borrower_id: string;

  owner_id?: string;
  lender_id?: string;      // เพิ่ม
  has_review?: boolean;    // เพิ่ม

  fine_amount?: number;
  fine_reason?: string | null;
  fine_status?: string;

  start_date: string;
  end_date: string;
  total_days: number;
  total_rental_price: number;
  rental_price_per_day: number;
  status: TransactionStatus;

  item_title: string;
  item_image: string;

  borrower_name: string;
  owner_name?: string;

  return_requested?: boolean;
  images_before_rental?: string[];
  images_before_use?: string[];
  images_after_use?: string[];

  platform_fee?: number;
  owner_earnings?: number;

  payment_status?: 'pending' | 'paid' | 'failed';

  latest_slip_status?: 'submitted' | 'verified' | 'rejected' | null;

}
export type RentalPaymentStatus =
  | 'submitted'
  | 'verified'
  | 'rejected';

export interface RentalPayment {
  payment_id: string;
  rental_id: string;
  payment_type: 'rental' | 'fine';
  amount: number;
  bank_account_id: string | null;
  slip_url: string;
  status: RentalPaymentStatus;
  submitted_by: string;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}
