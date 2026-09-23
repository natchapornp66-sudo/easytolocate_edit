export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  gps_location: { lat: number; lng: number } | null;
  trust_score: number;
  role?: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
}

export interface Item {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_avatar?: string;
  title: string;
  description: string;
  category: string;
  conditions: string;
  rental_price_per_day: number;
  images: string[];
  status: 'available' | 'rented' | 'unavailable';
  distance_km?: number;
  created_at: string;
}

export type TransactionStatus = 'pending' | 'approved' | 'borrowing' | 'completed' | 'damaged' | 'rejected';
export type PaymentStatus = 'pending' | 'paid';

export interface Transaction {
  id: string;
  item_id: string;
  item_title: string;
  item_image: string;
  borrower_id: string;
  borrower_name: string;
  owner_id: string;
  owner_name: string;
  status: TransactionStatus;
  start_date: string;
  end_date: string;
  total_days: number;
  rental_price_per_day: number;
  total_rental_price: number;
  platform_fee: number;
  owner_earnings: number;
  payment_status: PaymentStatus;
  return_requested?: boolean;
  images_before_rental?: string[];
  images_before_use?: string[];
  images_after_use?: string[];
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

export interface Message {
  id: string;
  transaction_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  timestamp: string;
}

export interface ChatThread {
  id: string;
  other_user_name: string;
  other_user_avatar?: string;
  last_message: string;
  last_timestamp: string;
  unread_count: number;
  item_title: string;
}

export interface Notification {
  id: string;
  type: 'request' | 'approval' | 'reminder' | 'review' | 'system' | 'payment';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export type Category =
  | 'ทั้งหมด'
  | 'เครื่องมือช่าง'
  | 'เครื่องใช้ไฟฟ้า'
  | 'กีฬา'
  | 'แคมป์ปิ้ง'
  | 'อิเล็กทรอนิกส์'
  | 'เฟอร์นิเจอร์'
  | 'อื่นๆ';
