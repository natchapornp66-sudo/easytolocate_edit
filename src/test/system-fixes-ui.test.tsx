import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Register from '@/pages/Register';
import ItemDetail from '@/pages/ItemDetail';
vi.mock('@/lib/api', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/api')>(),
  API_BASE_URL: 'https://api.example.invalid',
  apiGet: vi.fn(async (url: string) => url.endsWith('/reviews') ? [] : {
    item_id: 'qa-item', title: 'QA gallery', description: 'QA', conditions: 'QA', daily_price: 100,
    lender_id: 'qa-owner', lender_name: 'QA owner', images: ['/uploads/items/first.png', '/uploads/items/second.png'],
  }),
}));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root, container: HTMLDivElement;
const originalLocation = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  localStorage.clear();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) })));
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (success: (p: unknown) => void) => success({ coords: { latitude: 0, longitude: 100.1 } }) } });
});
afterEach(() => {
  vi.useRealTimers();
  act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  if (originalLocation) Object.defineProperty(navigator, 'geolocation', originalLocation);
  else Reflect.deleteProperty(navigator, 'geolocation');
});
async function fill(selector: string, value: string) {
  const input = container.querySelector(selector)! as HTMLInputElement | HTMLTextAreaElement;
  await act(async () => {
    Object.getOwnPropertyDescriptor(input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function submit() { await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }); }
describe('reported UI regressions', () => {
  it.each([
    { start: new Date(2026, 9, 27, 0, 30), days: 1, from: '2026-10-27', to: '2026-10-27' },
    { start: new Date(2026, 9, 27, 6), days: 2, from: '2026-10-27', to: '2026-10-28' },
    { start: new Date(2026, 11, 31, 23, 59), days: 2, from: '2026-12-31', to: '2027-01-01' },
  ])('submits the dates shown in the agreement: $from to $to', async ({ start, days, from, to }) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(start);
    localStorage.setItem('easy_to_locate_auth', JSON.stringify({ userId: 'qa-borrower', role: 'user', fullName: 'QA borrower' }));
    localStorage.setItem('token', 'qa-token');
    await act(async () => root.render(<MemoryRouter initialEntries={['/items/qa-item']}><Routes><Route path="/items/:id" element={<ItemDetail />} /></Routes></MemoryRouter>));
    for (let i = 1; i < days; i++) {
      await act(async () => { [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === '+')!.click(); });
    }
    await act(async () => { [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'ขอเช่า')!.click(); });
    expect(document.body.textContent).toContain(`ระยะเวลา: ${from} ถึง ${to} (${days} วัน)`);
    await act(async () => { (document.querySelector('[role="checkbox"]') as HTMLButtonElement).click(); });
    await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'ยอมรับและดำเนินการต่อ')!.click(); });
    const request = vi.mocked(fetch).mock.calls.find(([url, options]) => String(url).endsWith('/rentals') && options?.method === 'POST');
    expect(request).toBeDefined();
    expect(JSON.parse(String(request![1]!.body))).toMatchObject({ start_date: from, end_date: to, total_days: days });
  });
  it.each([
    { start: new Date(2026, 9, 27, 23, 59), next: new Date(2026, 9, 28, 0, 1), days: 1, from: '2026-10-28', to: '2026-10-28' },
    { start: new Date(2026, 9, 31, 23, 59), next: new Date(2026, 10, 1, 0, 1), days: 2, from: '2026-11-01', to: '2026-11-02' },
    { start: new Date(2026, 11, 31, 23, 59), next: new Date(2027, 0, 1, 0, 1), days: 2, from: '2027-01-01', to: '2027-01-02' },
  ])('requires reviewing refreshed dates after midnight: $from', async ({ start, next, days, from, to }) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(start);
    localStorage.setItem('easy_to_locate_auth', JSON.stringify({ userId: 'qa-borrower', role: 'user', fullName: 'QA borrower' }));
    localStorage.setItem('token', 'qa-token');
    await act(async () => root.render(<MemoryRouter initialEntries={['/items/qa-item']}><Routes><Route path="/items/:id" element={<ItemDetail />} /></Routes></MemoryRouter>));
    for (let i = 1; i < days; i++) {
      await act(async () => { [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === '+')!.click(); });
    }
    await act(async () => { [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'ขอเช่า')!.click(); });
    await act(async () => { (document.querySelector('[role="checkbox"]') as HTMLButtonElement).click(); });
    vi.setSystemTime(next);
    const accept = async () => act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'ยอมรับและดำเนินการต่อ')!.click(); });
    await accept();
    expect(fetch).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('วันเปลี่ยนแล้ว');
    expect(document.body.textContent).toContain(`ระยะเวลา: ${from} ถึง ${to} (${days} วัน)`);
    expect(document.querySelector('[role="checkbox"]')).toHaveAttribute('data-state', 'unchecked');
    await accept();
    expect(fetch).not.toHaveBeenCalled();
    await act(async () => { (document.querySelector('[role="checkbox"]') as HTMLButtonElement).click(); });
    await accept();
    const request = vi.mocked(fetch).mock.calls.find(([url, options]) => String(url).endsWith('/rentals') && options?.method === 'POST');
    expect(request).toBeDefined();
    expect(JSON.parse(String(request![1]!.body))).toMatchObject({ start_date: from, end_date: to, total_days: days });
  });
  it('shows both item images and allows selecting the second', async () => {
    await act(async () => root.render(<MemoryRouter initialEntries={['/items/qa-item']}><Routes><Route path="/items/:id" element={<ItemDetail />} /></Routes></MemoryRouter>));
    expect(container.querySelector('img[alt="QA gallery"]')).toHaveAttribute('src', 'https://api.example.invalid/uploads/items/first.png');
    await act(async () => { (container.querySelector('[aria-label="ดูรูปสิ่งของที่ 2"]') as HTMLButtonElement).click(); });
    expect(container.querySelector('img[alt="QA gallery"]')).toHaveAttribute('src', 'https://api.example.invalid/uploads/items/second.png');
  });
  it('sends the entered address and obtained GPS coordinates when registering', async () => {
    await act(async () => root.render(<MemoryRouter><Register /></MemoryRouter>));
    await fill('input[type="email"]', 'qa@example.invalid');
    await fill('input[type="password"]', 'QaPass123!');
    await fill('input[type="password"].pl-10:not(.pr-10)', 'QaPass123!');
    await submit();
    await fill('input[placeholder="ชื่อ นามสกุล"]', 'QA NAME');
    await fill('input[type="tel"]', '0000000000');
    await fill('textarea', 'QA SYNTHETIC ADDRESS');
    await submit();
    await act(async () => { [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'ยืนยันตำแหน่ง GPS')!.click(); });
    await submit();
    await act(async () => { (container.querySelector('[role="checkbox"]') as HTMLButtonElement).click(); });
    await submit();
    expect(fetch).toHaveBeenCalledTimes(1);
    const options = vi.mocked(fetch).mock.calls[0][1]!;
    expect(JSON.parse(String(options.body))).toMatchObject({ address: 'QA SYNTHETIC ADDRESS', latitude: 0, longitude: 100.1 });
  });
  it('keeps an overlong UTF-8 password on the first signup step', async () => {
    await act(async () => root.render(<MemoryRouter><Register /></MemoryRouter>));
    await fill('input[type="email"]', 'qa@example.invalid');
    await fill('input[type="password"]', 'ก'.repeat(25));
    await fill('input[type="password"].pl-10:not(.pr-10)', 'ก'.repeat(25));
    await submit();
    expect(container.textContent).toContain('ขั้นตอนที่ 1 จาก 4');
    expect(fetch).not.toHaveBeenCalled();
  });
});
