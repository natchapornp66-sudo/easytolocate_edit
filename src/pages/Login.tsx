import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginWithCredentials } from '@/lib/auth';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('somchai@example.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const session = loginWithCredentials(email, password);

    if (!session) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      return;
    }

    navigate(session.role === 'admin' ? '/admin/dashboard' : '/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900/60 px-4 py-10 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          aria-label="Close login"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-primary/10 via-white to-white px-6 pb-6 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <MapPinIcon className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Easy to Locate</h1>
          <p className="mt-1 text-sm text-slate-600">ระบบเช่าสิ่งของ</p>
        </div>

        <div className="bg-white px-6 pb-6 pt-5">
          <h2 className="text-xl font-bold text-slate-900 font-display">เข้าสู่ระบบ</h2>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-10 text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="h-11 w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90">
              เข้าสู่ระบบ
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-600">
            <span>ยังไม่มีบัญชี? </span>
            <button onClick={() => navigate('/register')} className="font-semibold text-primary hover:underline">
              สมัครสมาชิก
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            ดูสิ่งของก่อน (Guest)
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            เข้าสู่ระบบสำหรับผู้ดูแลระบบ (Admin)
          </button>
        </div>
      </div>
    </div>
  );
};

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default Login;
