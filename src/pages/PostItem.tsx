import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BottomNav from '@/components/BottomNav';
import { toast } from '@/hooks/use-toast';
import { getAuthSession } from '@/lib/auth';
import { buildApiUrl } from '@/lib/api';

const ItemImagePreview = ({ file, index }: { file: File; index: number }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file); setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <img src={url} alt={`รูปสินค้า ${index + 1}`} className="h-full w-full object-cover" />;
};

const PostItem = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) || selectedImages.length + files.length > 5) {
      toast({ title: 'รูปภาพไม่ถูกต้อง', description: 'เลือกได้สูงสุด 5 รูป รองรับ JPG, PNG, WEBP และ GIF ขนาดไม่เกิน 5 MB ต่อรูป', variant: 'destructive' });
      e.target.value = ''; return;
    }

    setSelectedImages((prev) => [...prev, ...files].slice(0, 5));

    e.target.value = '';
  };
  const [categoryOptions, setCategoryOptions] = useState<
    { category_id: number; category_name: string }[]
  >([]);
  const [categoryError, setCategoryError] = useState('');
  const [categoryReload, setCategoryReload] = useState(0);

  useEffect(() => {
    const loadCategories = async () => {
      setCategoryError('');
      try {
        const response = await fetch(buildApiUrl('/categories'));

        if (!response.ok) {
          throw new Error('โหลดหมวดหมู่ไม่สำเร็จ');
        }

        const data = await response.json();

        setCategoryOptions(
          Array.isArray(data) ? data : data.data ?? []
        );
      } catch (error) {
        console.error('Load categories error:', error);
        setCategoryError('โหลดหมวดหมู่ไม่สำเร็จ กรุณาลองใหม่');
      }
    };

    loadCategories();
  }, [categoryReload]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    conditions: '',
    rental_price_per_day: '',
    clothing_size: '',
    chest: '',
    waist: '',
    hips: '',
    clothing_length: '',
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const selectedCategory = categoryOptions.find(
    (category) => String(category.category_id) === form.category
  );

  const isClothingCategory =
    selectedCategory?.category_name === 'เสื้อผ้าและแฟชั่น';

  const rentalPrice = Number(form.rental_price_per_day) || 0;
  const platformFee = Math.round(rentalPrice * 0.10);
  const ownerEarnings = rentalPrice - platformFee;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const session = getAuthSession();

    if (!session.userId || session.role === 'guest') {
      toast({
        title: 'กรุณาเข้าสู่ระบบ',
        description: 'ต้องเข้าสู่ระบบก่อนลงประกาศ',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    const token = localStorage.getItem('token');

    if (!token) {
      toast({
        title: 'กรุณาเข้าสู่ระบบใหม่',
        description: 'ไม่พบ Token สำหรับยืนยันตัวตน',
        variant: 'destructive',
      });
      return;
    }

    const price = Number(form.rental_price_per_day);

    if (!form.category || !Number.isFinite(price) || price <= 0) {
      toast({
        title: 'ข้อมูลไม่ครบถ้วน',
        description: 'กรุณาเลือกหมวดหมู่และกรอกราคาเช่าที่มากกว่า 0',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. อัปโหลดรูปภาพก่อนบันทึกสินค้า
      let uploadedImages: string[] = [];

      if (selectedImages.length > 0) {
        const formData = new FormData();

        selectedImages.forEach((file) => {
          formData.append('images', file);
        });

        const uploadResponse = await fetch(
          buildApiUrl('/upload/item-images'),
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
        }

        uploadedImages = uploadData.images;
      }
      const response = await fetch(buildApiUrl('/items'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({

          category_id: Number(form.category),
          title: form.title,
          description: form.description,
          conditions: form.conditions,
          daily_price: price,
          images: uploadedImages,

          // ขนาดเสื้อผ้า ส่งเฉพาะหมวดเสื้อผ้า
          clothing_size: isClothingCategory
            ? form.clothing_size || null
            : null,
          chest: isClothingCategory ? form.chest || null : null,
          waist: isClothingCategory ? form.waist || null : null,
          hips: isClothingCategory ? form.hips || null : null,
          clothing_length: isClothingCategory
            ? form.clothing_length || null
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถลงประกาศได้');
      }

      toast({
        title: 'โพสต์สำเร็จ!',
        description: 'สิ่งของของคุณถูกบันทึกลงระบบแล้ว',
      });

      navigate('/');
    } catch (error) {
      console.error('Post item error:', error);

      toast({
        title: 'ลงประกาศไม่สำเร็จ',
        description:
          error instanceof Error
            ? error.message
            : 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 px-4 pb-20 pt-10 text-white">
        <div className="mx-auto max-w-6xl">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>

          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            ลงประกาศสิ่งของให้เช่า
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            เพิ่มรูปภาพ รายละเอียด และกำหนดราคาเช่าสิ่งของของคุณ
          </p>

        </div>
      </header>

      {/* พื้นที่เนื้อหา */}
      <main className="relative mx-auto -mt-12 max-w-6xl px-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-8">

          <div className="mb-6 border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold text-blue-950">
              ข้อมูลสิ่งของที่ต้องการลงประกาศ
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              กรอกข้อมูลสิ่งของให้ครบถ้วนก่อนลงประกาศให้เช่า
            </p>
          </div>


          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-3xl space-y-6"
          >
            {/* Photo upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                รูปภาพ (สูงสุด 5 รูป)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />

              <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {selectedImages.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative h-28 w-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <ItemImagePreview file={file} index={index} />

                    <button
                      type="button"
                      aria-label={`ลบรูปสินค้า ${index + 1}`}
                      onClick={() =>
                        setSelectedImages((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {selectedImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-white text-slate-500 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 ${selectedImages.length === 0
                      ? 'min-h-40 w-full'
                      : 'h-28 w-28 shrink-0'
                      }`}
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-sm font-semibold">
                      {selectedImages.length === 0 ? 'คลิกเพื่อเลือกรูปภาพสิ่งของ' : 'เพิ่มรูป'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {selectedImages.length} / 5 รูป
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">ชื่อสิ่งของ</label>
              <Input
                placeholder="เช่น สว่านไฟฟ้า Bosch"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="min-h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus-visible:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">หมวดหมู่</label>
              {categoryError && <p role="alert" className="text-sm text-red-600">{categoryError} <button type="button" onClick={() => setCategoryReload(n => n + 1)} className="underline">ลองใหม่</button></p>}
              <Select
                value={form.category}
                onValueChange={(value) => update('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>

                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem
                      key={category.category_id}
                      value={String(category.category_id)}
                    >
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>{isClothingCategory && (
              <div className="space-y-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 sm:p-6">
                <h3 className="text-sm font-semibold">
                  รายละเอียดขนาดเสื้อผ้า
                </h3>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">ไซส์</label>
                  <Select
                    value={form.clothing_size}
                    onValueChange={(value) => update('clothing_size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกไซส์" />
                    </SelectTrigger>
                    <SelectContent>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { key: 'chest', label: 'รอบอก (นิ้ว)' },
                    { key: 'waist', label: 'รอบเอว (นิ้ว)' },
                    { key: 'hips', label: 'รอบสะโพก (นิ้ว)' },
                    { key: 'clothing_length', label: 'ความยาวชุด (ซม.)' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {field.label}
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="ระบุขนาด"
                        value={form[field.key as keyof typeof form]}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus-visible:ring-blue-500">
              <label className="text-sm font-medium text-foreground">รายละเอียด</label>
              <Textarea placeholder="อธิบายสิ่งของ สภาพ อุปกรณ์เสริม..." value={form.description} onChange={(e) => update('description', e.target.value)} className="min-h-[100px]" required />
            </div>

            <div className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus-visible:ring-blue-500">
              <label className="text-sm font-medium text-foreground">เงื่อนไขการเช่า</label>
              <Textarea placeholder="ระยะเวลาเช่า, การดูแลรักษา, ข้อจำกัด..." value={form.conditions} onChange={(e) => update('conditions', e.target.value)} className="min-h-[80px]" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">ค่าเช่าต่อวัน (บาท)</label>
              <Input
                type="number"
                placeholder="0"
                value={form.rental_price_per_day}
                min="0.01"
                max="99999999.99"
                step="0.01"
                onChange={(e) => update('rental_price_per_day', e.target.value)}
                className="min-h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus-visible:ring-blue-500"
                required
              />
              {rentalPrice > 0 && (
                <div className="rounded-lg bg-muted/50 p-2.5 text-xs space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>ค่าธรรมเนียมแพลตฟอร์ม (10%)</span>
                    <span>-฿{platformFee}</span>
                  </div>
                  <div className="flex justify-between font-medium text-foreground">
                    <span>คุณจะได้รับต่อวัน</span>
                    <span className="text-primary">฿{ownerEarnings}</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 w-full rounded-xl bg-blue-950 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-60"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isSubmitting ? 'กำลังลงประกาศ...' : 'ลงประกาศสิ่งของ'}
            </Button>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PostItem;
