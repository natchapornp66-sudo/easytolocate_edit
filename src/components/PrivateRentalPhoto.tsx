import { useEffect, useState } from 'react';
import { buildApiUrl } from '@/lib/api';

export default function PrivateRentalPhoto({ rentalId, url, alt }: {
  rentalId: string; url: string; alt: string;
}) {
  const [imageUrl, setImageUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    setImageUrl('');
    setFailed(false);
    const load = async () => {
      try {
        const filename = new URL(url, window.location.origin).pathname.split('/').pop();
        const token = localStorage.getItem('token');
        if (!token || !filename) throw new Error('Missing photo access');
        const response = await fetch(buildApiUrl(
          `/rentals/${encodeURIComponent(rentalId)}/photo-file/${encodeURIComponent(filename)}`
        ), { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (!response.ok) throw new Error('Photo unavailable');
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    };
    void load();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [rentalId, url]);
  if (!imageUrl) return <p className="flex h-28 items-center justify-center text-xs text-muted-foreground">
    {failed ? 'ไม่สามารถโหลดรูปภาพได้' : 'กำลังโหลดรูปภาพ...'}
  </p>;
  return <a href={imageUrl} target="_blank" rel="noopener noreferrer">
    <img src={imageUrl} alt={alt} className="h-28 w-full rounded-lg object-cover" />
  </a>;
}
