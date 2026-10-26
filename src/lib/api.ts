const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_API_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/+$/, '').replace(/\/api$/, '');

export const buildApiUrl = (endpoint: string) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const apiEndpoint = normalizedEndpoint === '/api' || normalizedEndpoint.startsWith('/api/')
    ? normalizedEndpoint
    : `/api${normalizedEndpoint}`;

  return `${API_BASE_URL}${apiEndpoint}`;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers = new Headers(options.headers);

  if (
    options.body != null && !(options.body instanceof FormData) && !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiGet = <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' });
export const apiPost = <T>(endpoint: string, body: unknown) =>
  apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });

export const apiPatch = <T>(endpoint: string, body: unknown) =>
  apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
export { API_BASE_URL };
export const fetchAgreementByRentalId = async (rentalId: string) => {
  return apiGet<{
    success: boolean;
    data: {
      agreement_id: string;
      rental_id: string;
      contract_terms: string;
      borrower_accepted: boolean;
      lender_accepted: boolean;
      borrower_accepted_at: string | null;
      lender_accepted_at: string | null;
      accepted_at: string | null;
    } | null;
  }>(`/agreements/rental/${rentalId}`);
};

export const signAgreement = async (payload: {
  rental_id: string;
}) => {
  return apiPost<{
    success: boolean;
    data: {
      agreement_id: string;
      rental_id: string;
      contract_terms: string;
      borrower_accepted: boolean;
      lender_accepted: boolean;
      borrower_accepted_at: string | null;
      lender_accepted_at: string | null;
      accepted_at: string | null;
    };
    fully_accepted: boolean;
  }>('/agreements', payload);
};
export const uploadRentalPhotos = async (
  rentalId: string,
  photoType: 'lenderBefore' | 'beforeUse' | 'afterUse',
  files: File[]
) => {
  const formData = new FormData();

  formData.append('mode', photoType);

  files.forEach((file) => {
    formData.append('photos', file);
  });

  const token = localStorage.getItem('token');

  const response = await fetch(
    buildApiUrl(`/rentals/${rentalId}/photos`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
  }

  return result as {
    success: boolean;
    image_urls: string[];
  };
};
// ========================================
// Rental Payments
// ========================================
export type RentalPayment = {
  payment_id: string;
  rental_id: string;
  payment_type: string;
  amount: number;
  slip_url: string;
  status: 'submitted' | 'verified' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  verified_at: string | null;
};

export const fetchRentalPayments = (rentalId: string) =>
  apiGet<{
    success: boolean;
    data: RentalPayment[];
  }>(`/rental-payments/${rentalId}`);

export const verifyRentalPayment = (
  paymentId: string,
  action: 'verify' | 'reject',
  rejectionReason = ''
) =>
  apiPatch<{
    success: boolean;
    data: RentalPayment;
  }>(`/rental-payments/${paymentId}/verify`, {
    action,
    rejection_reason: rejectionReason,
  });
export const uploadRentalPaymentSlip = async (
  rentalId: string,
  slipFile: File
) => {
  const formData = new FormData();

  formData.append('slip', slipFile);

  const token = localStorage.getItem('token');

  const response = await fetch(
    buildApiUrl(`/rental-payments/${rentalId}/slip`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.error || 'อัปโหลดสลิปไม่สำเร็จ'
    );
  }

  return result;
};
