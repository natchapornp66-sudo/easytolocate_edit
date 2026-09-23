const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_API_URL as string | undefined) ||
  'http://localhost:5000'
).replace(/\/$/, '');

export const buildApiUrl = (endpoint: string) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const apiEndpoint = normalizedEndpoint.startsWith('/api/')
    ? normalizedEndpoint
    : `/api${normalizedEndpoint}`;

  return `${API_BASE_URL}${apiEndpoint}`;
};

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
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

export { API_BASE_URL };
