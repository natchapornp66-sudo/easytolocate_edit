import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Profile from '@/pages/Profile';
import Notifications from '@/pages/Notifications';
import { apiGet } from '@/lib/api';
import { AUTH_STORAGE_KEY } from '@/lib/auth';
vi.mock('@/lib/api', () => ({ API_BASE_URL: 'http://localhost:5000', apiGet: vi.fn(), apiPatch: vi.fn(), apiRequest: vi.fn(), buildApiUrl: (p: string) => `http://localhost:5000/api${p}` }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement, root: Root;
beforeEach(() => {
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  localStorage.setItem('token', 'qa-token');
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId: 'qa-user', fullName: 'QA session', email: 'qa@example.invalid', role: 'user' }));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { act(() => root.unmount()); container.remove(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function renderPage(page: React.ReactNode) {
  await act(async () => { root.render(<MemoryRouter initialEntries={['/test']}><Routes><Route path="/test" element={page} /><Route path="/login" element={<p>QA login page</p>} /></Routes></MemoryRouter>); });
}
describe('profile and notifications', () => {
  it('shows actual profile values and clears authentication on logout', async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: true, data: { user_id: 'qa-user', full_name: 'QA actual name', email: 'qa@example.invalid', phone_number: '0000000001', trust_score: 0, completed_count: 0, reviews: [] } });
    await renderPage(<Profile />);
    expect(container.textContent).toContain('QA actual name');
    expect(container.textContent).toContain('0000000001');
    expect(container.textContent).toContain('0 รายการสำเร็จ');
    expect(container.textContent).not.toContain('081-234-5678');
    const logout = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'ออกจากระบบ')!;
    await act(async () => { logout.click(); });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(container.textContent).toContain('QA login page');
  });
  it('shows a profile loading failure instead of mock information', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('offline'));
    await renderPage(<Profile />);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).not.toContain('081-234-5678');
  });
  it('does not label a notification network failure as an empty inbox', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await renderPage(<Notifications />);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.textContent).not.toContain('ไม่มีการแจ้งเตือนใหม่');
  });
  it('keeps a notification unread when saving the read status fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [{ notification_id: 'n1', title: 'QA notification', message: 'QA only', type: 'system', is_read: false }] }) })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);
    await renderPage(<Notifications />);
    const notification = [...container.querySelectorAll('button')].find(b => b.textContent?.includes('QA notification'))!;
    await act(async () => { notification.click(); });
    expect(container.textContent).toContain('ทำเครื่องหมายอ่านแล้วไม่สำเร็จ');
    expect(notification.className).toContain('border-primary/20');
  });
});
