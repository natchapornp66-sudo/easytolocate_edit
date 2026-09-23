import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = Number(process.env.PORT || 5000);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  process.env.FRONTEND_URL,
  process.env.VITE_API_URL,
  process.env.NEXT_PUBLIC_API_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS policy rejected this origin'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));

const mockUsers = [
  {
    id: 'user-1',
    email: 'somchai@example.com',
    full_name: 'สมชาย ใจดี',
    role: 'user',
    status: 'active',
  },
  {
    id: 'admin-1',
    email: 'admin@easytolocate.com',
    full_name: 'Administrator',
    role: 'admin',
    status: 'active',
  },
];

const mockItems = [
  {
    id: 'item-1',
    owner_id: 'user-2',
    owner_name: 'วิชัย สร้างบ้าน',
    title: 'สว่านไฟฟ้า Bosch GSB 13RE',
    description: 'สว่านไฟฟ้ากระแทก Bosch รุ่น GSB 13RE สภาพดีมาก',
    category: 'เครื่องมือช่าง',
    conditions: 'คืนภายใน 3 วัน',
    rental_price_per_day: 150,
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop'],
    status: 'available',
    distance_km: 1.2,
    created_at: '2024-03-01',
  },
  {
    id: 'item-2',
    owner_id: 'user-3',
    owner_name: 'สุดา แคมป์เปอร์',
    title: 'เต็นท์แคมป์ปิ้ง 4 คน Coleman',
    description: 'เต็นท์กันน้ำดีสำหรับแคมป์ปิ้ง 4 คน',
    category: 'แคมป์ปิ้ง',
    conditions: 'ยืมได้สูงสุด 7 วัน',
    rental_price_per_day: 300,
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop'],
    status: 'available',
    distance_km: 2.5,
    created_at: '2024-03-05',
  },
  {
    id: 'item-3',
    owner_id: 'user-4',
    owner_name: 'อนุชา เทคโน',
    title: 'กล้อง Canon EOS R6',
    description: 'กล้องอเนกประสงค์สำหรับถ่ายภาพและวิดีโอ',
    category: 'อิเล็กทรอนิกส์',
    conditions: 'ต้องมีประสบการณ์ใช้กล้อง',
    rental_price_per_day: 800,
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop'],
    status: 'available',
    distance_km: 0.8,
    created_at: '2024-03-10',
  },
];

const mockRentals = [
  {
    id: 'txn-1',
    item_id: 'item-1',
    item_title: 'สว่านไฟฟ้า Bosch GSB 13RE',
    item_image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100&h=100&fit=crop',
    borrower_id: 'user-1',
    borrower_name: 'สมชาย ใจดี',
    owner_id: 'user-2',
    owner_name: 'วิชัย สร้างบ้าน',
    status: 'pending',
    start_date: '2024-03-20',
    end_date: '2024-03-23',
    total_days: 3,
    rental_price_per_day: 150,
    total_rental_price: 450,
    platform_fee: 45,
    owner_earnings: 405,
    payment_status: 'pending',
    images_before_rental: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop'],
    images_before_use: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop'],
    images_after_use: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop'],
  },
  {
    id: 'txn-2',
    item_id: 'item-2',
    item_title: 'เต็นท์แคมป์ปิ้ง 4 คน Coleman',
    item_image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=100&h=100&fit=crop',
    borrower_id: 'user-1',
    borrower_name: 'สมชาย ใจดี',
    owner_id: 'user-3',
    owner_name: 'สุดา แคมป์เปอร์',
    status: 'approved',
    start_date: '2024-03-22',
    end_date: '2024-03-29',
    total_days: 7,
    rental_price_per_day: 300,
    total_rental_price: 2100,
    platform_fee: 210,
    owner_earnings: 1890,
    payment_status: 'paid',
    images_before_rental: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop'],
    images_before_use: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop'],
    images_after_use: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop'],
  },
  {
    id: 'txn-3',
    item_id: 'item-3',
    item_title: 'กล้อง Canon EOS R6',
    item_image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&h=100&fit=crop',
    borrower_id: 'user-1',
    borrower_name: 'สมชาย ใจดี',
    owner_id: 'user-4',
    owner_name: 'อนุชา เทคโน',
    status: 'borrowing',
    return_requested: true,
    start_date: '2024-03-15',
    end_date: '2024-03-20',
    total_days: 5,
    rental_price_per_day: 800,
    total_rental_price: 4000,
    platform_fee: 400,
    owner_earnings: 3600,
    payment_status: 'paid',
    images_before_rental: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop'],
    images_before_use: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop'],
    images_after_use: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop'],
  },
  {
    id: 'txn-4',
    item_id: 'item-4',
    item_title: 'จักรยานเสือภูเขา Trek',
    item_image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=100&h=100&fit=crop',
    borrower_id: 'user-1',
    borrower_name: 'สมชาย ใจดี',
    owner_id: 'user-5',
    owner_name: 'มานะ สปอร์ต',
    status: 'completed',
    start_date: '2024-03-01',
    end_date: '2024-03-04',
    total_days: 3,
    rental_price_per_day: 400,
    total_rental_price: 1200,
    platform_fee: 120,
    owner_earnings: 1080,
    payment_status: 'paid',
  },
  {
    id: 'txn-5',
    item_id: 'item-5',
    item_title: 'เครื่องฉีดน้ำแรงดันสูง Karcher',
    item_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=100&h=100&fit=crop',
    borrower_id: 'user-6',
    borrower_name: 'นภัสสร ปั้นสุข',
    owner_id: 'user-1',
    owner_name: 'สมชาย ใจดี',
    status: 'pending',
    start_date: '2024-03-25',
    end_date: '2024-03-27',
    total_days: 2,
    rental_price_per_day: 200,
    total_rental_price: 400,
    platform_fee: 40,
    owner_earnings: 360,
    payment_status: 'pending',
  },
  {
    id: 'txn-6',
    item_id: 'item-6',
    item_title: 'โปรเจกเตอร์ Epson EB-W06',
    item_image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=100&h=100&fit=crop',
    borrower_id: 'user-7',
    borrower_name: 'กนกพร ชินวัฒน์',
    owner_id: 'user-1',
    owner_name: 'สมชาย ใจดี',
    status: 'borrowing',
    return_requested: true,
    start_date: '2024-03-18',
    end_date: '2024-03-21',
    total_days: 3,
    rental_price_per_day: 500,
    total_rental_price: 1500,
    platform_fee: 150,
    owner_earnings: 1350,
    payment_status: 'paid',
  },
];

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'easy-to-locate-api',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'configured' : 'mock-mode',
  });
});

app.get('/api/items', (req, res) => {
  res.json(mockItems);
});

app.get('/api/users', (req, res) => {
  res.json(mockUsers);
});

app.get('/api/rentals', (req, res) => {
  const view = String(req.query.view || 'all');
  let result = mockRentals;

  if (view === 'borrowed') {
    result = mockRentals.filter((entry) => entry.borrower_id === 'user-1');
  }

  if (view === 'lent') {
    result = mockRentals.filter((entry) => entry.owner_id === 'user-1');
  }

  res.json(result);
});

app.post('/api/rentals', (req, res) => {
  const payload = req.body || {};
  const {
    item_id,
    item_title,
    item_image,
    borrower_id,
    borrower_name,
    owner_id,
    owner_name,
    total_days,
    rental_price_per_day,
    total_rental_price,
    platform_fee,
    owner_earnings,
  } = payload;

  if (!item_id || !item_title || !owner_id || !borrower_id) {
    return res.status(400).json({ message: 'Missing rental request data' });
  }

  const request = {
    id: `txn-${Date.now()}`,
    item_id,
    item_title,
    item_image: item_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
    borrower_id,
    borrower_name: borrower_name || 'ผู้เช่า',
    owner_id,
    owner_name: owner_name || 'เจ้าของ',
    status: 'pending',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + Number(total_days || 1) * 86400000).toISOString().split('T')[0],
    total_days: Number(total_days || 1),
    rental_price_per_day: Number(rental_price_per_day || 0),
    total_rental_price: Number(total_rental_price || 0),
    platform_fee: Number(platform_fee || 0),
    owner_earnings: Number(owner_earnings || 0),
    payment_status: 'pending',
  };

  mockRentals.unshift(request);

  return res.status(201).json(request);
});

app.get('/api/disputes', (req, res) => {
  res.json(mockDisputes);
});

app.get('/api/admin/summary', (req, res) => {
  res.json({
    totalUsers: mockUsers.length,
    activeDisputes: mockDisputes.filter((d) => d.status === 'open' || d.status === 'pending').length,
    grossVolume: '฿1.2M',
    blockedAccounts: 8,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = mockUsers.find((entry) => entry.email === email);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json({
    user,
    token: 'demo-token',
    role: user.role,
  });
});

app.use((err, req, res, next) => {
  if (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
  next();
});

app.listen(port, () => {
  console.log(`Easy to Locate API running on http://localhost:${port}`);
});
