import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2, Mail, Lock, User, Phone, School, IdCard, BookOpen, GraduationCap } from 'lucide-react';
import { authApi } from '../services/auth';
import { institutionApi } from '../services/institutions';
import type { Institution } from '../types/user';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  institution_id: z.string().min(1, 'Please select your institution'),
  phone_number: z.string().min(10, 'Valid phone number required'),
  student_id: z.string().min(3, 'Student ID is required'),
  department: z.string().min(2, 'Department is required'),
  year_of_study: z.string().min(1, 'Please select your year of study'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    institutionApi.getAll().then(setInstitutions).catch(console.error);
  }, []);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await authApi.register(data);
      toast.success('Registration successful!', { duration: 5000 });
      toast('⏳ Your account is pending verification by your college admin.', { icon: 'ℹ️', duration: 10000 });
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-2xl p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <UserPlus className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black dark:text-white">Join Smart Campus</h2>
          <p className="text-slate-600 dark:text-slate-400">Create your account to join campus events</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  {...register('name')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                  placeholder="John Doe"
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  {...register('email')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                  placeholder="john@student.edu"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  {...register('password')}
                  type="password"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  {...register('phone_number')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                  placeholder="9876543210"
                />
              </div>
              {errors.phone_number && <p className="text-xs text-red-500 ml-1">{errors.phone_number.message}</p>}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">College / Institution</label>
              <div className="relative">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  {...register('institution_id')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white appearance-none"
                >
                  <option value="">Select Institution</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
              {errors.institution_id && <p className="text-xs text-red-500 ml-1">{errors.institution_id.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Student ID / Roll No</label>
              <div className="relative">
                <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  {...register('student_id')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                  placeholder="RCAS2024-001"
                />
              </div>
              {errors.student_id && <p className="text-xs text-red-500 ml-1">{errors.student_id.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Department</label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  {...register('department')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                  placeholder="Computer Science"
                />
              </div>
              {errors.department && <p className="text-xs text-red-500 ml-1">{errors.department.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Year of Study</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  {...register('year_of_study')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary-500 transition-all dark:text-white appearance-none"
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
              {errors.year_of_study && <p className="text-xs text-red-500 ml-1">{errors.year_of_study.message}</p>}
            </div>
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
            </button>
            <p className="text-center mt-6 text-slate-600 dark:text-slate-400">
              Already have an account? {' '}
              <Link to="/login" className="text-primary-600 font-bold hover:underline">Sign In</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
