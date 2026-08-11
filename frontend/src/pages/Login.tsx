import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Loader2, Mail, Lock, Shield, BookOpen, Users } from 'lucide-react';
import { useAuthStore } from '../context/authStore';
import { authApi } from '../services/auth';
import toast from 'react-hot-toast';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';

// ─── Zod schema ───────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLES = [
  {
    role:        'student',
    label:       'Student',
    icon:        BookOpen,
    accent:      'emerald',
    subtitle:    'Browse and register for campus events',
    placeholder: 'student@college.edu',
    redirect:    '/student/overview',
    ring:        'focus:ring-emerald-500',
    btn:         'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30',
    tab:         'text-emerald-600 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
    tabInactive: 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10',
  },
  {
    role:        'sub_admin',
    label:       'Sub Admin',
    icon:        Users,
    accent:      'blue',
    subtitle:    'Manage events and mark attendance',
    placeholder: 'subadmin@college.edu',
    redirect:    '/subadmin/dashboard',
    ring:        'focus:ring-blue-500',
    btn:         'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30',
    tab:         'text-blue-600 border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    tabInactive: 'text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10',
  },
  {
    role:        'admin',
    label:       'Admin',
    icon:        Shield,
    accent:      'indigo',
    subtitle:    'Manage your institution\'s events and users',
    placeholder: 'admin@college.edu',
    redirect:    '/admin/dashboard',
    ring:        'focus:ring-indigo-500',
    btn:         'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30',
    tab:         'text-indigo-600 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
    tabInactive: 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10',
  },
] as const;

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: '/superadmin/dashboard',
  admin:       '/admin/dashboard',
  sub_admin:   '/subadmin/dashboard',
  student:     '/student/dashboard',
};

// ─── Component ────────────────────────────────────────────────────────────────
const Login = () => {
  // Default to student (index 0)
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLoading, setIsLoading]     = useState(false);
  const [redirectingAs, setRedirectingAs] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  const navigate = useNavigate();
  const setAuth  = useAuthStore((state) => state.setAuth);
  const active   = ROLES[activeIdx];
  const Icon     = active.icon;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const switchTab = (idx: number) => {
    setActiveIdx(idx);
    reset();
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const authResponse = await authApi.login(data);
      const { access_token, user } = authResponse;
      setAuth(user, access_token);

      // Warn if role doesn't match selected tab
      if (user.role !== active.role) {
        const matched = ROLES.find(r => r.role === user.role);
        toast(`Your account is a ${matched?.label ?? user.role}. Redirecting to the correct portal.`, {
          icon: '↗️',
          duration: 3000,
        });
      } else {
        toast.success(`Welcome, ${user.name}! Entering ${active.label} Portal…`);
      }

      setRedirectingAs(user.role);
      setTimeout(() => navigate(ROLE_REDIRECTS[user.role] ?? '/'), 700);

    } catch (error: any) {
      const msg = error.response?.data?.detail;
      toast.error(msg === 'Invalid credentials'
        ? 'Incorrect email or password. Please try again.'
        : msg || 'Login failed. Please check your credentials.',
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md space-y-3"
      >

        {/* ── Role Tab Strip ── */}
        <div className="glass-card p-2 flex gap-1">
          {ROLES.map((r, idx) => {
            const TabIcon = r.icon;
            const isActive = idx === activeIdx;
            return (
              <button
                key={r.role}
                onClick={() => switchTab(idx)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer
                  ${isActive
                    ? `${r.tab} border-current shadow-sm`
                    : `${r.tabInactive} border-transparent`
                  }`}
              >
                <TabIcon size={15} />
                <span className="hidden sm:block leading-none">{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Login Card ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="glass-card p-8"
          >
            {/* Header */}
            <div className="text-center mb-7">
              <div className={`w-14 h-14 bg-${active.accent}-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-${active.accent}-500/30`}>
                <Icon className="text-white" size={26} />
              </div>
              <h2 className="text-2xl font-black dark:text-white">{active.label} Sign In</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{active.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    {...register('email')}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none ${active.ring} focus:ring-2 transition-all dark:text-white text-sm`}
                    placeholder={active.placeholder}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Password
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgot(true)}
                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    {...register('password')}
                    type="password"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none ${active.ring} focus:ring-2 transition-all dark:text-white text-sm`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 ${active.btn} text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
              >
                {isLoading
                  ? <><Loader2 className="animate-spin" size={18} /> Signing in…</>
                  : <><LogIn size={16} /> Sign In as {active.label}</>
                }
              </button>


            </form>
          </motion.div>
        </AnimatePresence>

        {/* ── Footer note ── */}
        <p className="text-center text-[10px] text-slate-400 font-medium">
          Admin accounts are created by the Super Admin. Contact your coordinator for access.
        </p>
      </motion.div>

      {/* ── Portal Redirect Overlay ── */}
      <AnimatePresence>
        {redirectingAs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              {(() => {
                const r = ROLES.find(x => x.role === redirectingAs);
                if (!r) return null;
                const RIcon = r.icon;
                return (
                  <>
                    <div className={`w-20 h-20 bg-${r.accent}-50 dark:bg-${r.accent}-900/30 border-2 border-${r.accent}-200 dark:border-${r.accent}-800 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-${r.accent}-500/20`}>
                      <RIcon size={38} className={`text-${r.accent}-500`} />
                    </div>
                    <div>
                      <p className={`text-xl font-black text-${r.accent}-600 dark:text-${r.accent}-400`}>
                        Entering {r.label} Portal
                      </p>
                      <p className="text-slate-400 text-sm mt-1">{r.subtitle}</p>
                    </div>
                    <Loader2 size={22} className={`animate-spin text-${r.accent}-500 mx-auto`} />
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ForgotPasswordModal isOpen={showForgot} onClose={() => setShowForgot(false)} />
    </div>
  );
};

export default Login;
