import { useEffect, useState } from 'react';
import { Search, Bell, MapPin, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CategoryName } from '@/types';
import { mockNotifications } from '@/data/mockData';
import BottomNav from '@/components/BottomNav';
import ItemCard from '@/components/ItemCard';
import CategoryFilter from '@/components/CategoryFilter';
import { useNavigate } from 'react-router-dom';

const distanceOptions = [
  { label: 'ทั้งหมด', value: Infinity },
  { label: '1 กม.', value: 1 },
  { label: '2 กม.', value: 2 },
  { label: '5 กม.', value: 5 },
  { label: '10 กม.', value: 10 },
];

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryName>('ทั้งหมด');
  const [maxDistance, setMaxDistance] = useState(Infinity);
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      try {
        const res = await fetch('/api/items');
        if (res.ok) {
          const response = await res.json();
          if (isMounted) {
            const rawData = Array.isArray(response)
              ? response
              : Array.isArray(response?.data)
                ? response.data
                : [];

            // ทำการ Map ฟิลด์ข้อมูลให้ครอบคลุมชื่อคอลัมน์จาก DB ทุกรูปแบบ
            const mappedData = rawData.map((item: any) => ({
              ...item,
              id: item.item_id || item.id,
              title: item.title || item.name || 'ไม่มีชื่อสินค้า',
              // ดึงราคาจากทุกชื่อฟิลด์ที่เป็นไปได้
              price_per_day: Number(item.price_per_day || item.rental_price_per_day || item.price || item.rental_fee || 0),
              rental_price_per_day: Number(item.price_per_day || item.rental_price_per_day || item.price || item.rental_fee || 0),
              // ดึงรูปภาพจากทุกชื่อฟิลด์
              image_url: item.image_url || item.images || item.image || item.photo,
              images: item.images || item.image_url || item.image || [],
              category_name: item.category_name || item.category || 'ทั่วไป',
              distance_km: item.distance_km || item.distance || 0,
            }));

            setItems(mappedData);
            setError('');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('ไม่สามารถโหลดรายการสินค้าได้ในขณะนี้');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = mockNotifications.filter((n: any) => !(n.is_read ?? n.read)).length;

  const filtered = items
    .filter((item) => {
      const matchSearch =
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());

      const matchCategory = category === 'ทั้งหมด' || item.category_name === category || item.category === category;
      const matchDistance = !item.distance_km || item.distance_km <= maxDistance;

      return matchSearch && matchCategory && matchDistance;
    })
    .sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));

  const distanceLabel = maxDistance === Infinity ? 'ทั้งหมด' : `≤ ${maxDistance} กม.`;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary px-4 pb-6 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary-foreground font-display">Easy to Locate</h1>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-primary-foreground/70">
              <MapPin className="h-3 w-3" />
              กรุงเทพมหานคร
            </div>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ค้นหาสิ่งของที่ต้องการเช่า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-0 bg-card pl-10 shadow-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 pt-4">
        <CategoryFilter selected={category as any} onSelect={(cat) => setCategory(cat as any)} />
      </div>

      {/* Items Grid */}
      <div className="px-4 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            สิ่งของให้เช่า ({filtered.length})
          </h2>
          <div className="relative">
            <button
              onClick={() => setShowDistanceFilter(!showDistanceFilter)}
              className="flex items-center gap-1 text-xs text-primary font-medium"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              ระยะทาง: {distanceLabel}
            </button>
            {showDistanceFilter && (
              <div className="absolute right-0 top-7 z-20 rounded-xl border border-border bg-card p-2 shadow-lg min-w-[130px]">
                {distanceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setMaxDistance(opt.value);
                      setShowDistanceFilter(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${maxDistance === opt.value
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-foreground hover:bg-muted'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            กำลังโหลดรายการสินค้า...
          </div>
        )}

        {!isLoading && error && (
          <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Search className="mb-2 h-8 w-8" />
                <p className="text-sm">ไม่พบสิ่งของที่ค้นหา</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;