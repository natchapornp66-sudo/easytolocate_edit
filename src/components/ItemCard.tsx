import { API_BASE_URL } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';

interface ItemCardProps {
  item: any;
}

const BACKEND_URL = API_BASE_URL;
const fallbackImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="16">No Image</text></svg>';

const getItemImageUrl = (item: any): string => {
  try {
    let imagesArr = item.image_url || item.images || item.image;
    if (typeof imagesArr === 'string') {
      imagesArr = imagesArr.trim().startsWith('[')
        ? JSON.parse(imagesArr)
        : [imagesArr];
    }
    if (!Array.isArray(imagesArr) || !imagesArr.length) return fallbackImage;
    const img = imagesArr[0];
    if (typeof img !== 'string' || !img.trim()) return fallbackImage;

    // Preserve the existing mapping of placeholder example.com images.
    if (img.includes('example.com')) {
      const fileName = img.split('/').pop();
      return fileName ? `${BACKEND_URL}/uploads/${fileName}` : fallbackImage;
    }
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
      return img;
    }
    if (img.startsWith('/')) return `${BACKEND_URL}${img}`;
    return `${BACKEND_URL}/uploads/${img}`;
  } catch {
    return fallbackImage;
  }
};

const ItemCard = ({ item }: ItemCardProps) => {
  const navigate = useNavigate();
  const itemId = item.item_id || item.id;
  const price = item.daily_price ?? item.price_per_day ?? item.rental_price_per_day ?? item.price;
  const distance = item.distance_km ?? item.distance ?? item.lat_lng;
  const ownerName = item.lender_name ?? item.owner_name ?? item.users?.full_name ?? item.owner?.full_name;
  const priceEvaluation = item.price_evaluation;
  const recommendedMinPrice = item.recommended_min_price;
  const recommendedMaxPrice = item.recommended_max_price;

  const evaluation = (() => {
    switch (priceEvaluation) {
      case 'BELOW_MARKET':
        return { text: 'ต่ำกว่าช่วงราคาอ้างอิง', className: 'bg-blue-50 text-blue-700' };
      case 'FAIR':
        return { text: 'ราคาอยู่ในช่วงเหมาะสม', className: 'bg-emerald-50 text-emerald-700' };
      case 'ABOVE_MARKET':
        return { text: 'สูงกว่าช่วงราคาอ้างอิง', className: 'bg-amber-50 text-amber-700' };
      case 'INSUFFICIENT_DATA':
        return { text: 'ข้อมูลราคาอ้างอิงยังไม่เพียงพอ', className: 'bg-slate-100 text-slate-600' };
      default:
        return null;
    }
  })();

  const hasPrice = price !== undefined && price !== null && price !== '' && Number.isFinite(Number(price));
  const hasReferenceRange =
    priceEvaluation !== 'INSUFFICIENT_DATA' &&
    recommendedMinPrice !== null && recommendedMinPrice !== undefined &&
    recommendedMaxPrice !== null && recommendedMaxPrice !== undefined;

  return (
    <button
      type="button"
      onClick={() => navigate(`/item/${itemId}`)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={`ดูรายละเอียด ${item.title || 'สิ่งของ'}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={getItemImageUrl(item)}
          alt={item.title || 'สิ่งของ'}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== fallbackImage) target.src = fallbackImage;
          }}
        />
        {item.status === 'rented' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
              กำลังให้เช่า
            </span>
          </div>
        )}
        <span className="absolute bottom-3 left-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full border border-white/60 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur-sm">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-600" />
          <span className="truncate">
            {distance !== undefined && distance !== null && distance !== '' ? `${distance} กม.` : '- กม.'}
          </span>
        </span>
      </div>

      <div className="flex w-full flex-1 flex-col p-3.5 sm:p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {item.category_name || item.category || 'ทั่วไป'}
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600" />
        </div>

        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-slate-900 sm:text-[15px]">
          {item.title || 'ไม่มีชื่อสิ่งของ'}
        </h3>
        {ownerName && <p className="mt-1 truncate text-xs text-slate-500">ผู้ให้เช่า: {ownerName}</p>}

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-1 border-t border-slate-100 pt-3">
            <span className="text-lg font-extrabold tracking-tight text-blue-700 sm:text-xl">
              {hasPrice ? `฿${Number(price).toLocaleString('th-TH')}` : '- ฿'}
            </span>
            <span className="text-xs font-medium text-slate-500">/วัน</span>
          </div>

          {evaluation && (
            <div className="mt-2.5">
              <span className={`inline-block max-w-full rounded-lg px-2 py-1 text-[11px] font-semibold leading-4 ${evaluation.className}`}>
                {evaluation.text}
              </span>
              {hasReferenceRange && (
                <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
                  ช่วงราคาอ้างอิง ฿{Number(recommendedMinPrice).toLocaleString('th-TH')} - ฿{Number(recommendedMaxPrice).toLocaleString('th-TH')}/วัน
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default ItemCard;
