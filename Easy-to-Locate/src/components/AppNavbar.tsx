import { useLocation, useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '@/lib/auth';

const AppNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAuthSession();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <button onClick={() => navigate('/')} className="text-sm font-bold text-foreground font-display">
          Easy to Locate
        </button>

        <div className="flex items-center gap-2">
          {session.role === 'guest' ? (
            <>
              <button
                onClick={() => navigate('/login')}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Register
              </button>
            </>
          ) : session.role === 'admin' ? (
            <>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Admin Panel
              </button>
              <button
                onClick={() => {
                  clearAuthSession();
                  navigate('/');
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  clearAuthSession();
                  navigate('/');
                }}
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
