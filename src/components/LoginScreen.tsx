import { useState } from 'react';
import { motion } from 'motion/react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { Cpu, ShieldAlert } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: { uid: string; email: string; displayName: string; photoURL: string }) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        onLogin({
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'K.F.C. 멤버',
          photoURL: result.user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError('로그인 팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해 주세요.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google 로그인이 활성화되지 않았습니다. 관리자에게 문의해 주세요.');
      } else {
        setError(err.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-4 relative overflow-hidden" id="login-screen">
      {/* Visual background grid and accent blur */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F12_1px,transparent_1px),linear-gradient(to_bottom,#0F0F12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#121216] border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          {/* Executive Robot Logo Indicator */}
          <div className="mx-auto w-16 h-16 bg-blue-600/15 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/10">
            <Cpu className="w-8 h-8 text-blue-550" />
          </div>

          <p className="text-blue-500 font-mono tracking-widest text-xs uppercase mb-1 font-bold">YONGIN YOUTH CENTER</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-3 font-display">
            K.F.C. Robot Club
          </h1>
          <p className="text-slate-400 text-sm mb-8 font-light">
            용인시청소년수련관 소속 로봇동아리 K.F.C.의 회원 공간입니다.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-400 mb-6 flex items-start gap-2 text-left">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Google Login Button */}
          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-xl transition duration-200 flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 select-none cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.23-.67-.35-1.37-.35-2.09s.12-1.42.35-2.09L5.84 14.09z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-semibold text-sm">Google 계정으로 로그인</span>
          </button>


        </div>

        {/* Footer info decoration */}
        <p className="text-center text-[11px] text-slate-600 font-mono mt-6">
          © 2026 K.F.C. ROBOT CLUB. YONGIN YOUTH CENTER.
        </p>
      </motion.div>
    </div>
  );
}
