import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PrivateRentalPhoto from '@/components/PrivateRentalPhoto';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('private rental photos', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.setItem('token', 'test-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['image']) }));
    URL.createObjectURL = vi.fn(() => 'blob:test-photo');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
    vi.unstubAllGlobals();
  });
  async function renderPhoto() {
    await act(async () => {
      root.render(<PrivateRentalPhoto rentalId="rental-1" url="http://localhost:5000/uploads/rentals/photo.png" alt="inspection photo" />);
    });
  }
  it('uses authentication for old stored URLs and releases the blob', async () => {
    await renderPhoto();
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:test-photo');
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/rentals/rental-1/photo-file/photo.png', expect.objectContaining({
      headers: { Authorization: 'Bearer test-token' }, signal: expect.any(AbortSignal),
    }));
    act(() => root.render(null));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-photo');
  });
  it('does not expose a public image on denied access', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    await renderPhoto();
    expect(container.textContent).toContain('ไม่สามารถโหลดรูปภาพได้');
    expect(container.querySelector('img')).toBeNull();
  });
  it('does not send a request without a token', async () => {
    localStorage.removeItem('token');
    await renderPhoto();
    expect(container.textContent).toContain('ไม่สามารถโหลดรูปภาพได้');
    expect(fetch).not.toHaveBeenCalled();
  });
});
