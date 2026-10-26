import { buildApiUrl } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Search, Bell, MapPin, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // รัศมีโลก หน่วย km

  const toRad = (value: number) =>
    (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );

  return R * c;
};
const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [maxDistance, setMaxDistance] = useState(Infinity);
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // ขอพิกัดของผู้ใช้
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('Browser ไม่รองรับ Geolocation');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.log('ไม่สามารถอ่านตำแหน่งผู้ใช้:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // โหลดสิ่งของ
  useEffect(() => {
    let isMounted = true;



    const loadItems = async () => {
      try {
        const res = await fetch(buildApiUrl('/items'));
        if (!res.ok) throw new Error('โหลดสิ่งของไม่สำเร็จ');
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

              title:
                item.title ||
                item.name ||
                'ไม่มีชื่อสิ่งของ',

              price_per_day: Number(
                item.daily_price ??
                item.price_per_day ??
                item.rental_price_per_day ??
                item.price ??
                item.rental_fee ??
                0
              ),

              rental_price_per_day: Number(
                item.daily_price ??
                item.price_per_day ??
                item.rental_price_per_day ??
                item.price ??
                item.rental_fee ??
                0
              ),

              image_url:
                item.image_url ||
                item.images ||
                item.image ||
                item.photo,

              images:
                item.images ||
                item.image_url ||
                item.image ||
                [],

              category_name:
                item.category_name ||
                item.category ||
                'ทั่วไป',

              search_keywords:
                item.search_keywords || '',

              distance_km:
                userLocation &&
                  item.latitude != null &&
                  item.longitude != null
                  ? Number(
                    calculateDistanceKm(
                      userLocation.latitude,
                      userLocation.longitude,
                      Number(item.latitude),
                      Number(item.longitude)
                    ).toFixed(1)
                  )
                  : null,
            }));

            setItems(mappedData);
            setError('');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('ไม่สามารถโหลดรายการสิ่งของได้ในขณะนี้');
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
  }, [userLocation]);

  // โหลดจำนวนการแจ้งเตือนที่ยังไม่ได้อ่านจาก Backend
  useEffect(() => {
    const loadNotifications = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setUnreadCount(0);
        return;
      }

      try {
        const response = await fetch(
          buildApiUrl('/notifications'),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดการแจ้งเตือนได้');
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const count = result.data.filter(
            (notification: { is_read: boolean }) =>
              notification.is_read === false
          ).length;

          setUnreadCount(count);
        }
      } catch (error) {
        console.error('Load notifications error:', error);
      }
    };

    loadNotifications();
  }, []);

  const normalizeText = (value: unknown) =>
    String(value ?? '')
      .toLowerCase()
      .trim();

  // คำค้นที่ผู้ใช้อาจพิมพ์ → คำที่ควรนำไปค้นสิ่งของ
  const searchIntents: Record<string, string[]> = {
    // กล้อง / ถ่ายภาพ
    'ถ่ายรูป': [
      'กล้อง',
      'sony',
      'dji',
      'โดรน',
      'กล้องและอุปกรณ์ถ่ายภาพ',
    ],
    'ถ่ายภาพ': [
      'กล้อง',
      'sony',
      'dji',
      'โดรน',
      'กล้องและอุปกรณ์ถ่ายภาพ',
    ],
    'ถ่ายวิดีโอ': [
      'กล้อง',
      'sony',
      'dji',
      'โดรน',
      'กล้องและอุปกรณ์ถ่ายภาพ',
    ],
    'กล้องบิน': [
      'โดรน',
      'dji',
    ],
    'ถ่ายรูปบนฟ้า': [
      'โดรน',
      'dji',
    ],

    // เกม
    'เล่นเกม': [
      'playstation',
      'ps5',
      'เกม',
      'เครื่องใช้ไฟฟ้าและเกม',
    ],
    'เกมส์': [
      'playstation',
      'ps5',
      'เกม',
      'เครื่องใช้ไฟฟ้าและเกม',
    ],

    // แคมป์
    'เที่ยวป่า': [
      'เต็นท์',
      'เก้าอี้แคมป์',
      'แคมป์',
      'อุปกรณ์แคมป์ปิ้ง',
    ],
    'กางเต็นท์': [
      'เต็นท์',
      'แคมป์',
      'อุปกรณ์แคมป์ปิ้ง',
    ],
    'ไปแคมป์': [
      'เต็นท์',
      'เก้าอี้แคมป์',
      'อุปกรณ์แคมป์ปิ้ง',
    ],

    // เครื่องมือ
    'เจาะผนัง': [
      'สว่าน',
      'bosch',
      'เครื่องมือช่าง',
      'diy',
    ],
    'เจาะกำแพง': [
      'สว่าน',
      'bosch',
      'เครื่องมือช่าง',
      'diy',
    ],
    'เจาะไม้': [
      'สว่าน',
      'bosch',
      'เครื่องมือช่าง',
    ],

    // เสื้อผ้า / งาน
    'ออกงาน': [
      'เดรส',
      'ชุดเดรส',
      'เสื้อผ้าและแฟชั่น',
    ],
    'ชุดไปงาน': [
      'เดรส',
      'ชุดเดรส',
      'เสื้อผ้าและแฟชั่น',
    ],
    'งานแต่ง': [
      'เดรส',
      'ชุดเดรส',
      'เสื้อผ้าและแฟชั่น',
    ],

    // กีฬา
    'ออกกำลังกาย': [
      'กีฬา',
      'surfskate',
      'เซิร์ฟสเก็ต',
      'อุปกรณ์กีฬาและออกกำลังกาย',
    ],
    'เล่นสเก็ต': [
      'surfskate',
      'เซิร์ฟสเก็ต',
      'สเก็ต',
    ],

    // เดินทาง
    'กระเป๋าเที่ยว': [
      'กระเป๋า',
      'samsonite',
      'กระเป๋าเดินทาง',
    ],
    'กระเป๋าไปเที่ยว': [
      'กระเป๋า',
      'samsonite',
      'กระเป๋าเดินทาง',
    ],
  };
  const typoAliases: Record<string, string[]> = {
    // สว่าน
    'สว่าน': [
      'สวาน',
      'สว่านไฟฟ้า',
      'สวานไฟฟ้า',
      'bosch',
    ],

    // PlayStation
    'playstation': [
      'เพลสเตชั่น',
      'เพลย์สเตชั่น',
      'เพสเตชั่น',
      'เพลสเตชัน',
      'ps5',
    ],

    // เต็นท์
    'เต็นท์': [
      'เต้น',
      'เต๊นท์',
      'เต๊น',
      'tent',
    ],

    // กล้อง
    'กล้อง': [
      'กลอง',
      'camera',
      'คาเมร่า',
    ],

    // โดรน
    'โดรน': [
      'โดน',
      'drone',
      'dji',
    ],

    // สกู๊ตเตอร์
    'สกู๊ตเตอร์': [
      'สกูตเตอร์',
      'สกุตเตอร์',
      'scooter',
    ],

    // เซิร์ฟสเก็ต
    'เซิร์ฟสเก็ต': [
      'เซิฟสเก็ต',
      'เซิร์ฟสเกต',
      'surfskate',
    ],

    // กระเป๋า
    'กระเป๋า': [
      'กะเป๋า',
      'กระเป๋าเดินทาง',
      'bag',
      'samsonite',
    ],
    'ถ่ายภาพทางอากาศ': [
      'ถ่ายภาพอากาศ',
      'ถ่ายรูปทางอากาศ',
      'ถ่ายรูปอากาศ',
      'ถ่ายภาพบนฟ้า',
      'ถ่ายรูปบนฟ้า',
    ],
  };

  // คืนคะแนนความเกี่ยวข้องของสิ่งของ
  const getSearchScore = (item: any, rawQuery: string) => {
    const query = normalizeText(rawQuery);

    if (!query) return 0;

    const title = normalizeText(item.title);
    const description = normalizeText(item.description);
    const categoryName = normalizeText(item.category_name);
    const searchKeywords = normalizeText(item.search_keywords);

    let score = 0;

    // แปลงคำสะกดผิด / ชื่อเรียกอื่น
    let correctedQuery = query;

    for (const [correctWord, aliases] of Object.entries(typoAliases)) {
      const normalizedCorrectWord = normalizeText(correctWord);

      const matchedAlias = aliases.some(
        (alias) => normalizeText(alias) === query
      );

      if (matchedAlias) {
        correctedQuery = normalizedCorrectWord;
        break;
      }
    }

    // 1. ชื่อสิ่งของตรงคำค้น
    if (title === correctedQuery || title === query) {
      score += 200;
    } else if (title.includes(correctedQuery) || title.includes(query)) {
      score += 120;
    }

    // 2. keyword ของสิ่งของตรงกับคำค้น
    // สำคัญมากสำหรับคำอย่าง "ดีดกีตาร์", "เครื่องฉาย", "ถ่ายภาพอากาศ"
    if (searchKeywords) {
      if (searchKeywords.includes(correctedQuery) || searchKeywords.includes(query)) {
        score += 150;
      }
    }

    // 3. หมวดหมู่
    if (categoryName === correctedQuery || categoryName === query) {
      score += 100;
    } else if (categoryName.includes(correctedQuery) || categoryName.includes(query)) {
      score += 70;
    }

    // 4. description
    if (description.includes(correctedQuery) || description.includes(query)) {
      score += 50;
    }

    // 5. Intent Search
    const matchedIntent = Object.entries(searchIntents).find(
      ([intent, keywords]) => {
        const normalizedIntent = normalizeText(intent);

        return (
          normalizedIntent === correctedQuery ||
          keywords.some(
            (keyword) => normalizeText(keyword) === correctedQuery
          )
        );
      }
    );

    if (matchedIntent) {
      const [, keywords] = matchedIntent;

      for (const keyword of keywords) {
        const word = normalizeText(keyword);

        if (!word) continue;

        if (title.includes(word)) {
          score += 40;
        }

        if (categoryName.includes(word)) {
          score += 20;
        }

        if (description.includes(word)) {
          score += 10;
        }

        if (searchKeywords.includes(word)) {
          score += 20;
        }
      }
    }

    return score;
  };

  const filtered = items
    .map((item) => ({
      ...item,
      searchScore: getSearchScore(item, search),
    }))
    .filter((item) => {
      const hasSearch = normalizeText(search) !== '';

      const matchSearch =
        !hasSearch || item.searchScore > 0;

      const matchCategory =
        category === 'ทั้งหมด' ||
        item.category_name?.includes(category) ||
        item.category?.includes(category) ||
        String(item.category_id) === String(category);

      const matchDistance =
        maxDistance === Infinity ||
        (
          item.distance_km !== null &&
          item.distance_km !== undefined &&
          item.distance_km <= maxDistance
        );

      return matchSearch && matchCategory && matchDistance;
    })
    .sort((a, b) => {
      // ถ้ามีการค้นหา → เรียงความเกี่ยวข้องก่อน
      if (normalizeText(search)) {
        if (b.searchScore !== a.searchScore) {
          return b.searchScore - a.searchScore;
        }
      }

      // คะแนนเท่ากัน → ใกล้กว่าขึ้นก่อน
      return (
        (a.distance_km || 999) -
        (b.distance_km || 999)
      );
    });

  const distanceLabel = maxDistance === Infinity ? 'ทั้งหมด' : `≤ ${maxDistance} กม.`;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 text-white">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-16 pt-10 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <MapPin className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">Easy to Locate</h1>
                <p className="text-xs text-blue-100/80">เช่าของใกล้ตัว ง่ายกว่าที่เคย</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="การแจ้งเตือน"
              onClick={() => navigate('/notifications')}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 transition hover:bg-white/20"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-10 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <MapPin className="h-3.5 w-3.5" />
              {userLocation ? 'พร้อมค้นหาสิ่งของตามระยะทาง' : 'ค้นหาสิ่งของให้เช่าได้ทุกที่'}
            </div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              ของที่อยากใช้ <span className="text-emerald-300">ไม่จำเป็นต้องซื้อ</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-blue-100/85 sm:text-base">
              ค้นหาสิ่งของที่ต้องการ เช่าได้สะดวก และเลือกจากสิ่งของที่มีอยู่ในระบบ
            </p>
          </div>

          <div className="relative mt-7 max-w-3xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              aria-label="ค้นหาสิ่งของให้เช่า"
              placeholder="ลองค้นหา กล้อง, สว่าน, เต็นท์ หรือ PS5..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 rounded-2xl border-0 bg-white pl-12 pr-4 text-base text-slate-900 shadow-xl shadow-slate-950/20 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-300"
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-8 w-full max-w-[1440px] space-y-8 px-5 sm:px-8 lg:px-12">
        <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/70 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">เลือกหมวดหมู่ที่สนใจ</h2>
              <p className="mt-1 text-xs text-slate-500">ค้นหาของที่ใช่ได้เร็วขึ้น</p>
            </div>
          </div>
          <CategoryFilter selected={category} onSelect={setCategory} options={[
            { value: 'ทั้งหมด', label: 'ทั้งหมด' },
            ...Array.from(new Map(items.filter(item => item.category_id && item.category_name).map(item => [
              String(item.category_id), { value: String(item.category_id), label: String(item.category_name) },
            ])).values()),
          ]} />
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-7 lg:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">สำรวจสิ่งของให้เช่า</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isLoading ? 'กำลังค้นหาสิ่งของ...' : `พบ ${filtered.length} รายการที่ตรงกับการค้นหา`}
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                aria-expanded={showDistanceFilter}
                onClick={() => setShowDistanceFilter(!showDistanceFilter)}
                className="flex min-h-10 items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <SlidersHorizontal className="h-4 w-4" />
                ระยะทาง: {distanceLabel}
              </button>
              {showDistanceFilter && (
                <div className="absolute right-0 top-12 z-30 min-w-[160px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  {distanceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setMaxDistance(opt.value);
                        setShowDistanceFilter(false);
                      }}
                      className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${maxDistance === opt.value
                        ? 'bg-blue-600 font-semibold text-white'
                        : 'text-slate-700 hover:bg-slate-100'
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
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              กำลังโหลดรายการสิ่งของ...
            </div>
          )}
          {!isLoading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
              {error}
            </div>
          )}
          {!isLoading && !error && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filtered.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center rounded-2xl bg-slate-50 px-4 py-16 text-center text-slate-500">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Search className="h-7 w-7" />
                  </div>
                  <p className="font-semibold text-slate-700">ไม่พบสิ่งของที่ค้นหา</p>
                  <p className="mt-1 text-sm">ลองเปลี่ยนคำค้น หมวดหมู่ หรือระยะทาง</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Home;
