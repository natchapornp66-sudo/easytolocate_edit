import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Transactions from '@/pages/Transactions';

const state = vi.hoisted(() => ({ image: '/uploads/items/test.png' }));
vi.mock('@/lib/auth', () => ({ getAuthSession: () => ({ userId: 'qa-user' }) }));
vi.mock('@/lib/api', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/api')>(),
  API_BASE_URL: 'https://easytolocate-api.onrender.com',
  apiGet: vi.fn(async (url: string) => url.startsWith('/api/rentals?') ? [{
    id: 'qa-rental', item_title: 'QA สิ่งของ', item_image: state.image,
    owner_name: 'QA owner', borrower_name: 'QA borrower', status: 'pending',
    start_date: '2026-10-28', end_date: '2026-10-29', total_price: 100,
  }] : { success: true, data: [] }),
  fetchRentalPayments: vi.fn(async () => ({ success: true, data: [] })),
  fetchAgreementByRentalId: vi.fn(async () => ({ success: true, data: null })),
}));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; vi.clearAllMocks(); });
describe('rental item image addresses on separate hosting', () => {
  it.each([
    ['/uploads/items/test.png', 'https://easytolocate-api.onrender.com/uploads/items/test.png'],
    ['https://images.example.invalid/item.png', 'https://images.example.invalid/item.png'],
  ])('renders %s for both borrower and lender', async (image, expected) => {
    state.image = image;
    const container = document.createElement('div'); document.body.appendChild(container);
    const root = createRoot(container);
    dispose = () => { act(() => root.unmount()); container.remove(); };
    await act(async () => root.render(<MemoryRouter><Transactions /></MemoryRouter>));
    expect(container.querySelector('img[alt="QA สิ่งของ"]')).toHaveAttribute('src', expected);
    const lenderTab = [...container.querySelectorAll('button')].find(b => b.textContent === 'ของที่คนอื่นเช่า')!;
    await act(async () => lenderTab.click());
    expect(container.querySelector('img[alt="QA สิ่งของ"]')).toHaveAttribute('src', expected);
  });
});
