
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  MessageCircle,
  PlusCircle,
  ClipboardList,
  UserCircle,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'หน้าหลัก' },
  { path: '/transactions', icon: ClipboardList, label: 'รายการ' },
  { path: '/post-item', icon: PlusCircle, label: 'โพสต์' },
  { path: '/chat', icon: MessageCircle, label: 'แชท' },
  { path: '/profile', icon: UserCircle, label: 'โปรไฟล์' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg safe-bottom lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isPost = item.path === '/post-item';

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${isPost
                  ? ''
                  : isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {isPost ? (
                <div className="-mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <Icon className="h-5 w-5" />
                </div>
              ) : (
                <Icon
                  className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''
                    }`}
                />
              )}

              <span
                className={`text-[10px] ${isActive ? 'font-semibold' : ''
                  }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
