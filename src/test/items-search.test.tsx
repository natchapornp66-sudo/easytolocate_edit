import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '@/pages/Home';
import PostItem from '@/pages/PostItem';
vi.mock('@/components/ItemCard', () => ({ default: ({ item }: { item: { title: string } }) => <button data-qa-item>{item.title}</button> }));
vi.mock('@/components/BottomNav', () => ({ default: () => null }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root, container: HTMLDivElement;
const data = [
 { item_id: 'camera', title: 'QA Camera English', description: 'QA only', category_id: 1, category_name: 'อื่นๆ', daily_price: 100 },
 { item_id: 'shirt', title: 'QA เดรส', description: 'QA only', category_id: 9, category_name: 'เสื้อผ้าและแฟชั่น', daily_price: 100 },
];
beforeEach(() => {
 container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
 localStorage.clear();
 vi.spyOn(console, 'error').mockImplementation(() => {});
 vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }));
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function render(page: React.ReactNode) { await act(async () => { root.render(<MemoryRouter>{page}</MemoryRouter>); }); }
async function search(value: string) {
 const input = container.querySelector('input[aria-label="ค้นหาสิ่งของให้เช่า"]') as HTMLInputElement;
 await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}
describe('listing search and forms', () => {
 it('searches the original English word as well as its alias', async () => {
  await render(<Home />); await search('camera');
  expect([...container.querySelectorAll('[data-qa-item]')].map(e => e.textContent)).toEqual(['QA Camera English']);
 });
 it('offers real categories from current inventory and filters by category ID', async () => {
  await render(<Home />);
  const category = [...container.querySelectorAll('button')].find(b => b.textContent === 'เสื้อผ้าและแฟชั่น')!;
  expect(category).toBeDefined(); await act(async () => category.click());
  expect([...container.querySelectorAll('[data-qa-item]')].map(e => e.textContent)).toEqual(['QA เดรส']);
 });
 it('shows loading errors instead of pretending there are no matches', async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response);
  await render(<Home />);
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  expect(container.textContent).not.toContain('ไม่พบสิ่งของที่ค้นหา');
 });
 it('permits satang prices in the post form', async () => {
  await render(<PostItem />);
  const price = container.querySelector('input[placeholder="0"]') as HTMLInputElement;
  expect(price.step).toBe('0.01');
  expect(price.min).toBe('0.01');
 });
});
