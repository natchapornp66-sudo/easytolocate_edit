import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession } from '@/lib/auth';

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Easy to Locate</p>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          </div>

          <button
            onClick={() => {
              clearAuthSession();
              navigate('/admin/login');
            }}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
};

export default AdminLayout;
