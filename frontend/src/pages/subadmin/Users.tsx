import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import { usersApi } from '../../services/users';
import { 
  Users as UsersIcon, Plus, UserPlus, Trash2, ShieldCheck, Mail, Lock, 
  Phone, IdCard, BookOpen, GraduationCap, Building, User as UserIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

const AddStudentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user } = useAuthStore();
    const qc = useQueryClient();
    const [form, setForm] = useState({ 
        name: '', email: '', password: '', student_id: '', 
        phone_number: '', department: '', year_of_study: '' 
    });
  
    const registerMut = useMutation({
      mutationFn: (data: any) => axios.post(`${API}/register`, data),
      onSuccess: () => {
        toast.success('Student added successfully!');
        qc.invalidateQueries({ queryKey: ['subadmin-users'] });
        onClose();
      },
      onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Failed to add student'),
    });
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black dark:text-white">Add Student</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create a new student account for {user?.institution?.name || 'your institution'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="John Doe" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="email" placeholder="john@student.edu" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="9876543210" value={form.phone_number} onChange={e => setForm(p => ({...p, phone_number: e.target.value}))} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Student ID / Roll No</label>
                <div className="relative">
                  <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="RCAS2024-001" value={form.student_id} onChange={e => setForm(p => ({...p, student_id: e.target.value}))} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Department</label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Computer Science" value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Year of Study</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select value={form.year_of_study} onChange={e => setForm(p => ({...p, year_of_study: e.target.value}))} className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 border-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white text-sm appearance-none">
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-8 border-t border-slate-100 dark:border-slate-700 pt-6">
            <button onClick={() => registerMut.mutate({...form, role: 'student', institution_id: user?.institution?.id})}
              disabled={!form.name || !form.email || !form.password || registerMut.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50">
              {registerMut.isPending ? 'Adding Student...' : 'Add Student'}
            </button>
            <button onClick={onClose} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all">Cancel</button>
          </div>
        </motion.div>
      </div>
    );
};

const SubAdminUsers = () => {
    const [studentModalOpen, setStudentModalOpen] = useState(false);
    const qc = useQueryClient();

    const { data: users = [], isLoading } = useQuery<any[]>({
        queryKey: ['subadmin-users'],
        queryFn: () => usersApi.getUsers(),
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => usersApi.deleteUser(id),
        onSuccess: () => { toast.success('Student deleted'); qc.invalidateQueries({ queryKey: ['subadmin-users'] }); },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete student'),
    });

    const students = users.filter(u => u.role === 'student');

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Student Directory</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manage student accounts for your college.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setStudentModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                        <UserPlus size={18} /> New Student
                    </button>
                </div>
            </div>

            {isLoading && <p>Loading...</p>}

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase font-black tracking-widest text-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Name</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Academic Details</th>
                                <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {students.map((u, i) => (
                                <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            {u.profile_photo ? (
                                                <img src={u.profile_photo} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black">
                                                    {u.name[0]}
                                                </div>
                                            )}
                                            <div>
                                                {u.name}
                                                <p className="text-xs text-slate-400 font-medium truncate w-40">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.phone_number || <span className="text-slate-300 dark:text-slate-600 italic">Not provided</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {u.student_id ? <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 w-fit">{u.student_id}</span> : null}
                                            {u.department ? <span className="text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded w-fit truncate max-w-[150px]">{u.department}</span> : null}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => {
                                                if(window.confirm(`Delete student ${u.name}?`)) deleteMut.mutate(u.id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    {students.length === 0 && !isLoading && (
                        <div className="text-center py-12">
                            <UsersIcon size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No students found.</p>
                        </div>
                    )}
                </div>
            </div>

            {studentModalOpen && <AddStudentModal isOpen={studentModalOpen} onClose={() => setStudentModalOpen(false)} />}
        </div>
    );
};

export default SubAdminUsers;
