import { useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Home,
  ClipboardList,
  PlusCircle,
  MessageCircle,
  MessageSquareWarning,
  UserRound,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

import { clearAuthSession, getAuthSession } from '@/lib/auth';

const AppNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAuthSession();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const isGuest = session.role === 'guest';
  const isAdmin = session.role === 'admin';

  const handleLogout = () => {
    clearAuthSession();
    navigate('/');
  };


  const menuItems = [
    { label: 'หน้าแรก', path: '/', icon: Home },
    { label: 'รายการเช่า', path: '/transactions', icon: ClipboardList },
    { label: 'ข้อพิพาท', path: '/disputes', icon: MessageSquareWarning },
    { label: 'ลงประกาศ', path: '/post-item', icon: PlusCircle },
    { label: 'แชต', path: '/chat', icon: MessageCircle },
  ];


  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] w-full max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">

        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex shrink-0 items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200">
            <MapPin className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              Easy to <span className="text-blue-600">Locate</span>
            </h1>
            <p className="text-[11px] text-slate-500">
              เช่าของใกล้ตัว ง่ายกว่าที่เคย
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        {!isGuest && (
          <nav className="hidden items-center gap-1 lg:flex">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.path === '/'
                  ? location.pathname === '/' || location.pathname === '/items'
                  : location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {isGuest ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                เข้าสู่ระบบ
              </button>

              <button
                type="button"
                onClick={() => navigate('/register')}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                สมัครสมาชิก
              </button>
            </>
          ) : (
            <>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="hidden items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 sm:flex"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Panel
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <UserRound className="h-4 w-4" />
                <span className="hidden sm:inline">โปรไฟล์</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;