import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, KeyRound, Lock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../services/auth';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal = ({ isOpen, onClose }: Props) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return toast.error('Please enter a valid phone number');
    
    setIsLoading(true);
    try {
      await authApi.requestOtp(phone);
      toast.success('OTP sent to your phone!');
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP. Make sure the number is registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return toast.error('Please enter the 6-digit OTP');
    
    setIsLoading(true);
    try {
      await authApi.verifyOtp(phone, otp);
      toast.success('OTP verified!');
      setStep(3);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) return toast.error('Password must be at least 4 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    
    setIsLoading(true);
    try {
      await authApi.resetPassword(phone, otp, password);
      toast.success('Password reset successfully!');
      setStep(4);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const closeAndReset = () => {
    setStep(1);
    setPhone('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAndReset} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 z-10"
      >
        <button 
          onClick={closeAndReset}
          className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-8">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Phone Number */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <Phone size={24} />
                </div>
                <h2 className="text-2xl font-black dark:text-white mb-2">Reset Password</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Enter your registered phone number to receive a one-time password (OTP).</p>
                
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all font-medium"
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Send OTP'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 2: Verify OTP */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-2xl font-black dark:text-white mb-2">Verify OTP</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">We've sent a 6-digit code to <span className="font-bold text-slate-800 dark:text-white">{phone}</span>.</p>
                
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all font-black text-center tracking-[0.5em] text-lg"
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Verify Code'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 3: Reset Password */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <Lock size={24} />
                </div>
                <h2 className="text-2xl font-black dark:text-white mb-2">New Password</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Create a strong, new password for your account.</p>
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New Password"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all font-medium"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all font-medium"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Save New Password'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 4: Success */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-black dark:text-white mb-2">Password Reset!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Your password has been successfully updated. You can now use it to log in.</p>
                <button
                  onClick={closeAndReset}
                  className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  Return to Login <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
