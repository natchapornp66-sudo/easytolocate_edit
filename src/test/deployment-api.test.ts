import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
describe('deployment API addresses', () => {
  it('uses the current origin in production when no API host is set', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_URL', '');
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    vi.resetModules();
    const { buildApiUrl, API_BASE_URL } = await import('@/lib/api');
    expect(API_BASE_URL).toBe('');
    expect(buildApiUrl('/items')).toBe('/api/items');
    expect(buildApiUrl('/api')).toBe('/api');
    expect(buildApiUrl('/api/rentals')).toBe('/api/rentals');
  });
  it('supports a separately hosted API without duplicate api paths', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.invalid/api/');
    vi.resetModules();
    const { buildApiUrl, API_BASE_URL } = await import('@/lib/api');
    expect(API_BASE_URL).toBe('https://api.example.invalid');
    expect(buildApiUrl('items')).toBe('https://api.example.invalid/api/items');
  });
});
