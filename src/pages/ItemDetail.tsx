import { buildApiUrl } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Shield, MessageCircle, Calculator, Info, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { apiGet, API_BASE_URL } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { getRentalDates } from '@/lib/rental-dates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

const PLATFORM_FEE_RATE = 0.10;
const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<any>(null);
  const [itemReviews, setItemReviews] = useState<any[]>([]);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewsReload, setReviewsReload] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [days, setDays] = useState(1);
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementStart, setAgreementStart] = useState(() => new Date());
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [lateFee, setLateFee] = useState('');
  const [user, setUser] = useState<any>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  useEffect(() => { setSelectedImage(0); }, [id]);

  // ดึงข้อมูล User จาก LocalStorage
  useEffect(() => {
    const session = getAuthSession();

    if (session.role === 'user' && session.userId) {
      setUser({
        id: session.userId,
        user_id: session.userId,
        full_name: session.fullName,
        email: session.email,
        role: session.role,
      });
    } else {
      setUser(null);
    }
  }, []);

  // ดึงข้อมูลสิ่งของและรีวิวจาก API
  useEffect(() => {
    let isMounted = true;

    const fetchItemAndReviews = async () => {
      setIsLoading(true);
      setReviewsError('');
      try {
        // 1. ดึงข้อมูลรายละเอียดสิ่งของ
        const itemData = await apiGet<any>(
          `/api/items/${id}`
        );


        if (isMounted) {
          setItem(itemData.data || itemData);
        }

        // 2. ดึงข้อมูลรีวิวของสิ่งของนี้
        try {
        const reviewsData = await apiGet<any>(
          `/api/items/${id}/reviews`
        );

        const actualReviews = Array.isArray(reviewsData)
          ? reviewsData
          : Array.isArray(reviewsData?.data)
            ? reviewsData.data
            : [];

        if (isMounted) {
          setItemReviews(actualReviews);
        }
        } catch {
          if (isMounted) { setItemReviews([]); setReviewsError('ไม่สามารถโหลดรีวิวได้ กรุณาลองใหม่'); }
        }

      } catch (err) {
        console.error(
          'Failed to fetch item details or reviews:',
          err
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (id) {
      fetchItemAndReviews();
    }

    return () => {
      isMounted = false;
    };
  }, [id, reviewsReload]);
  useEffect(() => {
    if (!item?.latitude || !item?.longitude) {
      setDistanceKm(null);
      return;
    }

    if (!navigator.geolocation) {
      setDistanceKm(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        const itemLat = Number(item.latitude);
        const itemLon = Number(item.longitude);

        const distance = calculateDistanceKm(
          userLat,
          userLon,
          itemLat,
          itemLon
        );

        setDistanceKm(distance);
      },
      (error) => {
        console.log('ไม่สามารถอ่านตำแหน่งผู้ใช้:', error.message);
        setDistanceKm(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [item]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">กำลังโหลดรายละเอียดสิ่งของ...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">ไม่พบสิ่งของ</p>
      </div>
    );
  }

  const pricePerDay = Number(item.rental_price_per_day || item.price_per_day || item.price || item.daily_price || 0);
  // Rental Price Evaluation
  const priceEvaluation = item.price_evaluation;


  const recommendedMinPrice =
    item.recommended_min_price !== null &&
      item.recommended_min_price !== undefined
      ? Number(item.recommended_min_price)
      : null;

  const recommendedMaxPrice =
    item.recommended_max_price !== null &&
      item.recommended_max_price !== undefined
      ? Number(item.recommended_max_price)
      : null;

  const getPriceEvaluation = () => {
    switch (priceEvaluation) {
      case 'BELOW_MARKET':
        return {
          text: 'ต่ำกว่าช่วงราคาอ้างอิง',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };

      case 'FAIR':
        return {
          text: 'ราคาอยู่ในช่วงเหมาะสม',
          className: 'bg-green-50 text-green-700 border-green-200',
        };

      case 'ABOVE_MARKET':
        return {
          text: 'สูงกว่าช่วงราคาอ้างอิง',
          className: 'bg-orange-50 text-orange-700 border-orange-200',
        };

      case 'INSUFFICIENT_DATA':
        return {
          text: 'ข้อมูลราคาอ้างอิงยังไม่เพียงพอ',
          className: 'bg-gray-50 text-gray-600 border-gray-200',
        };

      default:
        return null;
    }
  };

  const evaluation = getPriceEvaluation();
  const totalRental = pricePerDay * days;
  const platformFee = Math.round(totalRental * PLATFORM_FEE_RATE);
  const totalPayment = totalRental;
  const rentalDates = getRentalDates(agreementStart, days);
  const today = rentalDates.start_date;
  const endDate = rentalDates.end_date;

  // ตรวจสอบและจัดการลิงก์รูปภาพให้ถูกต้อง
  const images: string[] = (Array.isArray(item.images) && item.images.length
    ? item.images : [item.image_url || item.image]).map((image: unknown) => {
      if (typeof image !== 'string' || !image || image.includes('example.com')) {
        return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500';
      }
      if (/^https?:\/\//i.test(image)) return image;
      return `${API_BASE_URL}${image.startsWith('/') ? '' : '/uploads/'}${image}`;
    });

  const ownerName =
    item.lender_name ||
    item.owner_name ||
    item.owner?.full_name ||
    item.user_name ||
    'ไม่พบชื่อเจ้าของ';

  const ownerId =
    item.lender_id ||
    item.owner_id ||
    item.owner?.id ||
    item.user_id ||
    item.userId;

  const handleBorrow = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }

    setAgreementStart(new Date());
    setShowAgreement(true);
  };

  const handleAcceptAgreement = async () => {
    if (!agreementAccepted) {
      toast({ title: 'กรุณายอมรับสัญญาก่อน', variant: 'destructive' });
      return;
    }

    setShowAgreement(false);
    setAgreementAccepted(false);
    await handleSubmitRequest();
  };

  const handleSubmitRequest = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบก่อนส่งคำขอเช่า');

      }

      const res = await fetch(buildApiUrl('/rentals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_id: item.item_id || item.id,
          ...rentalDates,
          agreement_accepted: true,
          item_title: item.title,
          item_image: images[0],
          borrower_id: user?.id || user?.user_id,
          borrower_name: user?.full_name || user?.name || 'ผู้ยืม',
          owner_id: ownerId,
          owner_name: ownerName,
          status: 'pending',
          total_days: days,
          rental_price_per_day: pricePerDay,
          total_rental_price: totalRental,
          platform_fee: platformFee,
          owner_earnings: totalRental - platformFee,
          payment_status: 'pending',
          late_fee_per_day: Number(lateFee) || 0,
        }),
      });

      if (res.ok) {
        toast({
          title: 'ส่งคำขอเช่าเรียบร้อยแล้ว',
          description: `คำขอเช่า ${item.title} ${days} วัน ถูกส่งไปยังเจ้าของแล้ว`,
        });
        navigate('/my-borrowings');
      } else {
        const errorData = await res.json();

        console.error('Rental API Error:', {
          status: res.status,
          data: errorData,
        });

        throw new Error(errorData.error || 'Server returned an error');
      }
    } catch (error) {
      toast({
        title: 'ส่งคำขอเช่าไม่สำเร็จ',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const avgRating =
    itemReviews.length > 0
      ? (
        itemReviews.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0
        ) / itemReviews.length
      ).toFixed(1)
      : null;
  return (
    <div className="min-h-screen bg-slate-50 pb-28 lg:pb-24">

      {/* Image */}
      <div className="relative mx-auto mt-6 max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <img
          src={images[selectedImage] || images[0]}
          alt={item.title}
          className="h-72 w-full object-contain bg-slate-100 sm:h-96 lg:h-[480px]"
        />
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3" aria-label="รูปสิ่งของทั้งหมด">
            {images.map((image, index) => (
              <button key={index} type="button" aria-label={`ดูรูปสิ่งของที่ ${index + 1}`}
                aria-pressed={selectedImage === index} onClick={() => setSelectedImage(index)}
                className={`shrink-0 rounded-lg border-2 p-1 ${selectedImage === index ? 'border-blue-600' : 'border-transparent'}`}>
                <img src={image} alt={`${item.title} รูปที่ ${index + 1}`} className="h-16 w-20 object-contain" />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow-sm transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5 text-slate-800" />
        </button>
      </div>

      {/* Content */}
      <div className="mx-auto mt-6 grid max-w-6xl grid-cols-1 items-start gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left: Item Information */}
        <div className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8 lg:px-8">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-foreground font-display">{item.title}</h1>
            <div className="shrink-0 text-right">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                ฿{pricePerDay}/วัน
              </span>
            </div>
          </div>
          {/* Rental Price Evaluation */}
          {evaluation && (
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />

                <h2 className="text-sm font-semibold text-foreground">
                  การประเมินราคาเช่า
                </h2>
              </div>

              <div className="mt-3">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${evaluation.className}`}
                >
                  {evaluation.text}
                </span>
              </div>

              {priceEvaluation !== 'INSUFFICIENT_DATA' &&
                recommendedMinPrice !== null &&
                recommendedMaxPrice !== null && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground">
                      ช่วงราคาอ้างอิง
                    </p>

                    <p className="mt-1 text-base font-bold text-foreground">
                      ฿{recommendedMinPrice.toLocaleString()}
                      {' - '}
                      ฿{recommendedMaxPrice.toLocaleString()}
                      {' / วัน'}
                    </p>
                  </div>
                )}

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                ข้อมูลนี้เป็นการประเมินจากช่วงราคาเช่าอ้างอิง
                เพื่อช่วยประกอบการตัดสินใจ
                โดยราคาจริงเป็นราคาที่ผู้ให้เช่ากำหนด
              </p>
            </div>
          )}

          {/* Owner */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {ownerName.charAt(0)}
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-card-foreground">
                {ownerName}
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-warning text-warning" />

                <span>
                  {avgRating ?? 'ยังไม่มีคะแนน'}
                </span>

                <span>•</span>

                <MapPin className="h-3 w-3" />

                <span>
                  {distanceKm !== null
                    ? `${distanceKm.toFixed(1)} กม.`
                    : 'ไม่พบระยะทาง'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => {
                if (!ownerId) {
                  toast({
                    title: 'ไม่พบข้อมูลเจ้าของสิ่งของ',
                    variant: 'destructive',
                  });
                  return;
                }

                navigate(`/chat/${ownerId}`);
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              แชท
            </Button>
          </div>

          {/* Description */}
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground">รายละเอียด</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
          {/* Clothing Size Details */}
          {(
            item.clothing_size ||
            item.chest != null ||
            item.waist != null ||
            item.hips != null ||
            item.clothing_length != null
          ) && (
              <div className="mt-5">
                <h2 className="mb-2 text-sm font-semibold text-foreground">
                  รายละเอียดขนาดเสื้อผ้า
                </h2>

                <div className="rounded-xl border border-border bg-card p-4">
                  {item.clothing_size && (
                    <div className="mb-3">
                      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                        ไซส์ {item.clothing_size}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'รอบอก', value: item.chest, unit: 'นิ้ว' },
                      { label: 'รอบเอว', value: item.waist, unit: 'นิ้ว' },
                      { label: 'รอบสะโพก', value: item.hips, unit: 'นิ้ว' },
                      { label: 'ความยาวเสื้อผ้า', value: item.clothing_length, unit: 'ซม.' },
                    ]
                      .filter((field) => field.value != null && field.value !== '')
                      .map((field) => (
                        <div
                          key={field.label}
                          className="rounded-lg bg-muted/50 p-3"
                        >
                          <p className="text-xs text-muted-foreground">
                            {field.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {field.value} {field.unit}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

          {/* Conditions */}
          {item.conditions && (
            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold text-foreground">เงื่อนไขการเช่า</h2>
              <div className="rounded-xl border border-border bg-muted/50 p-3">
                <div className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm text-muted-foreground">{item.conditions}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mt-5">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Star className="h-4 w-4 text-warning" />
              รีวิวจากผู้เช่า {avgRating && `(${avgRating})`}
            </h2>

            {reviewsError ? <p role="alert" className="text-sm text-red-600">{reviewsError} <button type="button" className="underline" onClick={() => setReviewsReload(n => n + 1)}>ลองใหม่</button></p> : itemReviews.length > 0 ? (
              <div className="space-y-2">
                {itemReviews.map((review: any) => {
                  const reviewerName =
                    review.reviewer_name ||
                    review.user_name ||
                    'ผู้ใช้งาน';

                  const reviewId = review.review_id || review.id;

                  // ดึง URL รูปภาพจากฐานข้อมูล
                  const photoUrls: string[] = Array.isArray(review.photo_urls)
                    ? review.photo_urls
                    : [];

                  // แปลง path รูปภาพเป็น URL ของ Backend
                  const getReviewImageUrl = (url: string) => {
                    if (/^https?:\/\//i.test(url)) {
                      return url;
                    }

                    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'
                      }${url}`;
                  };

                  return (
                    <div
                      key={reviewId}
                      className="rounded-xl border border-border bg-card p-3"
                    >
                      {/* ชื่อผู้รีวิวและคะแนนดาว */}
                      <div className="mb-1 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {reviewerName.charAt(0)}
                        </div>

                        <span className="text-sm font-medium text-card-foreground">
                          {reviewerName}
                        </span>

                        <div className="ml-auto flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${s <= Number(review.rating)
                                ? 'fill-warning text-warning'
                                : 'text-border'
                                }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* ความคิดเห็น */}
                      <p className="text-xs text-muted-foreground">
                        {review.comment}
                      </p>

                      {/* รูปภาพประกอบรีวิว */}
                      {photoUrls.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {photoUrls.map((url, index) => {
                            const imageUrl = getReviewImageUrl(url);

                            return (
                              <a
                                key={`${reviewId}-${index}`}
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-lg border border-border"
                                title="คลิกเพื่อดูรูปภาพขนาดใหญ่"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`รูปประกอบรีวิว ${index + 1}`}
                                  loading="lazy"
                                  className="h-24 w-full object-cover transition-transform hover:scale-105"
                                />
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* วันที่รีวิว */}
                      {review.created_at && (
                        <p className="mt-2 text-[10px] text-muted-foreground/60">
                          {new Date(review.created_at).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                ยังไม่มีรีวิว
              </p>
            )}
          </div>

        </div>

        {/* Right: Rental Calculator */}
        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Calculator className="h-4 w-4 text-primary" />
              คำนวณค่าเช่า
            </h2>
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">จำนวนวัน</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDays(Math.max(1, days - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold">-</button>
                  <span className="w-8 text-center text-lg font-bold text-foreground">{days}</span>
                  <button onClick={() => setDays(days + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">+</button>
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ค่าเช่า ({days} วัน × ฿{pricePerDay})</span>
                  <span className="font-medium text-foreground">฿{totalRental.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">ค่าธรรมเนียม (10%)<Info className="h-3 w-3" /></span>
                  <span className="font-medium text-muted-foreground">-฿{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">เจ้าของได้รับ</span>
                  <span className="font-medium text-success">{`฿${(totalRental - platformFee).toLocaleString()}`}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">ยอดชำระ ({days} วัน)</p>
            <p className="text-lg font-bold text-primary">฿{totalPayment.toLocaleString()}</p>
          </div>
          <Button
            onClick={handleBorrow}
            disabled={item.status === 'rented'}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {item.status === 'rented' ? 'ไม่ว่าง' : 'ขอเช่า'}
          </Button>
        </div>
      </div>

      {/* e-Agreement Dialog */}
      <Dialog open={showAgreement} onOpenChange={setShowAgreement}>

        <DialogContent
          style={{
            width: 'calc(100vw - 32px)',
            maxWidth: '760px',
            maxHeight: '85dvh',
          }}
          className="overflow-y-auto rounded-2xl p-5 sm:p-8"
        >

          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
              <FileText className="h-5 w-5 text-primary" />
              สัญญาเช่าสิ่งของ (e-Agreement)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-sm leading-7 text-muted-foreground sm:text-base">
            <p className="text-xs text-muted-foreground">
              เลขที่สัญญา: AGR-{Date.now()} | วันที่: {today}
            </p>

            <div>
              <h4 className="font-semibold text-foreground mb-1">1. คู่สัญญา</h4>
              <p><strong>ผู้ให้เช่า:</strong> {ownerName}</p>
              <p><strong>ผู้เช่า:</strong> {user?.full_name || user?.name || 'ผู้ยืม'}</p>
              <p className="mt-1">ทั้งสองฝ่ายตกลงทำสัญญาเช่าสิ่งของผ่านระบบ Easy to Locate</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-1">2. รายละเอียดสิ่งของ</h4>
              <p>ชื่อสิ่งของ: {item.title}</p>
              <p>หมวดหมู่: {item.category_name || item.category || 'ทั่วไป'}</p>
              <p>ค่าเช่า: ฿{pricePerDay}/วัน</p>
              <p>ระยะเวลา: {today} ถึง {endDate} ({days} วัน)</p>
              <p>รวมค่าเช่า: ฿{totalRental.toLocaleString()}</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-1">3. เงื่อนไขการชำระเงิน</h4>
              <p>ผู้เช่าต้องชำระค่าเช่าในระบบภายในแอป</p>
              <p>เงินค่าเช่าจะถูกโอนให้ผู้ให้เช่าหลังจากยืนยันการส่งมอบ</p>
              <p>หากมีความเสียหายหรือส่งคืนล่าช้า จะถูกพิจารณาตามเงื่อนไขที่ตกลงไว้</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-1">
                4. ข้อผูกพัน
              </h4>

              <p>
                ผู้เช่าจะต้องคืนสิ่งของตรงเวลา
                หากมีการคืนล่าช้าหรือเกิดความเสียหาย
                ผู้ให้เช่าจะเป็นผู้ประเมินค่าปรับตามเงื่อนไขของการเช่า
              </p>

              <p className="mt-2 font-medium text-foreground">
                ค่าปรับ: ผู้ให้เช่าจะเป็นผู้ประเมินเมื่อมีการคืนสิ่งของ
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <Checkbox checked={agreementAccepted} onCheckedChange={(checked) => setAgreementAccepted(Boolean(checked))} />
                <span className="text-muted-foreground">ฉันยอมรับเงื่อนไขสัญญา และเห็นด้วยกับการชำระเงินตามรายการที่ระบุ</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAgreement(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAcceptAgreement}>ยอมรับและดำเนินการต่อ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default ItemDetail;
