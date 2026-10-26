import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChatRoom from '@/pages/ChatRoom';
import Chat from '@/pages/Chat';
import ItemDetail from '@/pages/ItemDetail';
import { apiGet, apiPost } from '@/lib/api';
import { AUTH_STORAGE_KEY } from '@/lib/auth';
vi.mock('@/lib/api', () => ({ apiGet: vi.fn(), apiPost: vi.fn(), API_BASE_URL: 'http://localhost:5000' }));
vi.mock('@/components/BottomNav', () => ({ default: () => null }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root, container: HTMLDivElement;
beforeEach(() => {
 vi.useFakeTimers(); container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
 localStorage.setItem(AUTH_STORAGE_KEY,JSON.stringify({userId:'qa-self',fullName:'QA',role:'user',email:'qa@example.invalid'}));
 localStorage.setItem('token','qa-token');
 Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});
 HTMLElement.prototype.scrollIntoView=vi.fn();
 vi.spyOn(console,'error').mockImplementation(()=>{});
 vi.mocked(apiGet).mockImplementation(async endpoint => endpoint.endsWith('/messages')?{data:[]}:{data:{other_user_name:'QA Other'}});
});
afterEach(()=>{act(()=>root.unmount());container.remove();localStorage.clear();vi.useRealTimers();vi.restoreAllMocks();});
async function render(page: React.ReactNode,path='/chat/qa-other') {
 await act(async()=>{root.render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/chat/:id" element={page}/><Route path="/chat" element={page}/><Route path="/items/:id" element={page}/></Routes></MemoryRouter>);});
}
describe('chat and review screens',()=>{
 it('refreshes incoming messages without reopening the room',async()=>{
  let messages: unknown[]=[];
  vi.mocked(apiGet).mockImplementation(async endpoint=>endpoint.endsWith('/messages')?{data:messages}:{data:{other_user_name:'QA Other'}});
  await render(<ChatRoom/>);
  messages=[{message_id:'qa1',sender_id:'qa-other',message:'QA incoming after open',created_at:new Date().toISOString()}];
  await act(async()=>{await vi.advanceTimersByTimeAsync(3000);});
  expect(container.textContent).toContain('QA incoming after open');
 });
 it('keeps the draft and shows a failure when sending fails',async()=>{
  vi.mocked(apiPost).mockRejectedValue(new Error('offline'));
  await render(<ChatRoom/>);
  const input=container.querySelector('input[placeholder="พิมพ์ข้อความ..."]') as HTMLInputElement;
  await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'QA keep this draft');input.dispatchEvent(new Event('input',{bubbles:true}));});
  await act(async()=>{(container.querySelector('button[aria-label="ส่งข้อความ"]') as HTMLButtonElement).click();});
  expect(input.value).toBe('QA keep this draft');
  expect(container.textContent).toContain('ส่งข้อความไม่สำเร็จ');
 });
 it('does not clear messages or read incoming messages while hidden',async()=>{
  await render(<ChatRoom/>);
  const count=vi.mocked(apiGet).mock.calls.length;
  Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});
  await act(async()=>{await vi.advanceTimersByTimeAsync(6000);});
  expect(vi.mocked(apiGet).mock.calls.length).toBe(count);
 });
 it('shows chat list failures instead of an empty chat list',async()=>{
  vi.mocked(apiGet).mockRejectedValue(new Error('offline'));
  await render(<Chat/>,'/chat');
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  expect(container.textContent).not.toContain('ยังไม่มีแชท');
 });
 it('distinguishes unavailable reviews from a product with no reviews',async()=>{
  vi.mocked(apiGet).mockImplementation(async endpoint=>{
   if(endpoint.endsWith('/reviews'))throw new Error('offline');
   return {item_id:'qa-item',title:'QA product',lender_id:'qa-other',daily_price:100,images:[],description:'QA only',status:'active'};
  });
  await render(<ItemDetail/>,'/items/qa-item');
  expect(container.textContent).toContain('ไม่สามารถโหลดรีวิวได้');
  expect(container.textContent).not.toContain('ยังไม่มีรีวิว');
 });
});
