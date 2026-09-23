import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

interface ItemCardProps {
  item: any;
}

const ItemCard = ({ item }: ItemCardProps) => {
  const navigate = useNavigate();

  // 1. ดึง ID (รองรับทั้ง item_id และ id)
  const itemId = item.item_id || item.id;

  // 2. ดึงราคา (เพิ่ม daily_price เข้าไปรองรับด้วย)
  const price = item.daily_price ?? item.price_per_day ?? item.rental_price_per_day ?? item.price;

  // 3. ดึงระยะทาง (รองรับทั้ง distance_km, distance หรือคำนวณจาก lat/lng ถ้ามี)
  const distance = item.distance_km ?? item.distance ?? item.lat_lng;

  // 4. ดึงชื่อผู้ลงประกาศ
  const ownerName = item.owner_name ?? item.users?.full_name ?? item.owner?.full_name;

  // 5. รูปสำรอง SVG กันรูปแตก/เน็ตบล็อก
  const fallbackImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="16">No Image</text></svg>';

  const BACKEND_URL = 'http://localhost:5000';
  let imageUrl = fallbackImage;

  try {
    let imagesArr = item.image_url || item.images || item.image;

    // ถ้ารูปเป็น String JSON สตริง (เช่น "[\"https://example.com/sony1.jpg\"]")
    if (typeof imagesArr === 'string') {
      if (imagesArr.startsWith('[')) {
        imagesArr = JSON.parse(imagesArr);
      } else {
        imagesArr = [imagesArr];
      }
    }

    if (Array.isArray(imagesArr) && imagesArr.length > 0 && imagesArr[0]) {
      const img = imagesArr[0];

      // ถ้าเป็นลิงก์ example.com ให้ดึงเอาเฉพาะชื่อไฟล์ข้างหลังมาต่อกับ Backend ของเรา
      if (typeof img === 'string' && img.includes('example.com')) {
        const parts = img.split('/');
        const fileName = parts[parts.length - 1]; // เช่น sony1.jpg
        imageUrl = `${BACKEND_URL}/uploads/${fileName}`;
      } else if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:'))) {
        imageUrl = img;
      } else if (typeof img === 'string' && img.startsWith('/')) {
        imageUrl = `${BACKEND_URL}${img}`;
      } else if (typeof img === 'string') {
        imageUrl = `${BACKEND_URL}/uploads/${img}`;
      }
    }
  } catch (e) {
    imageUrl = fallbackImage;
  }

  return (
    <div
      onClick={() => navigate(`/item/${itemId}`)}
      className="cursor-pointer overflow-hidden rounded-lg bg-card card-shadow transition-all duration-200 hover:card-shadow-hover hover:-translate-y-0.5 animate-fade-in"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={item.title || 'สินค้า'}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== fallbackImage) {
              target.src = fallbackImage;
            }
          }}
        />
        {item.status === 'rented' && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/50">
            <span className="rounded-full bg-warning px-3 py-1 text-xs font-semibold text-warning-foreground">
              กำลังให้เช่า
            </span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur-sm">
          <MapPin className="h-3 w-3" />
          {distance !== undefined && distance !== null && distance !== '' ? `${distance} กม.` : '- กม.'}
        </div>
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-card-foreground">{item.title}</h3>
        {ownerName && <p className="mt-0.5 text-xs text-muted-foreground">{ownerName}</p>}
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {item.category_name || item.category || 'ทั่วไป'}
          </span>
          <div className="text-right">
            <span className="text-sm font-bold text-primary">
              {price !== undefined && price !== null && price !== '' ? `฿${price}/วัน` : '- ฿/วัน'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;