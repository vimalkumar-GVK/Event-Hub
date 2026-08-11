import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import {
  Users, Shield, BarChart3, Megaphone, Trash2, LogOut,
  UserCheck, UserX, Crown, ArrowUpCircle, Menu, School,
  Plus, Edit2, Globe, MapPin, Phone, Mail, Link as LinkIcon, FileText,
  Search, Filter, CheckCircle, XCircle, User, Settings, Calendar, Clock, MessageSquare, Send
} from 'lucide-react';
import { useNavigate, NavLink, Routes, Route, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { institutionApi } from '../../services/institutions';
import SettingsPage from '../shared/Settings';
import ProfilePage from '../shared/Profile';
import { NotificationBell } from '../../components/ui/NotificationBell';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import Messages from '../shared/Messages';
import { ShareEventModal } from '../../components/events/ShareEventModal';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

const authedGet = (url: string, token: string) =>
  axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

const authedPost = (url: string, body: unknown, token: string) =>
  axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

const authedDelete = (url: string, token: string) =>
  axios.delete(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

const authedPut = (url: string, body: unknown, token: string) =>
  axios.put(url, body, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

// ─── Nav ─────────────────────────────────────────────────────────────────────
const NAV = [
  { label: 'Overview', icon: BarChart3, path: '/superadmin/dashboard' },
  { label: 'Institutions', icon: School, path: '/superadmin/institutions' },
  { label: 'Users & Admins', icon: Users, path: '/superadmin/users' },
  { label: 'Events', icon: Calendar, path: '/superadmin/events' },
  { label: 'Messages', icon: MessageSquare, path: '/superadmin/messages' },
  { label: 'Announcements', icon: Megaphone, path: '/superadmin/announce' },
  { label: 'My Profile', icon: User, path: '/superadmin/profile' },
  { label: 'Settings', icon: Settings, path: '/superadmin/settings' },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-purple-950 to-slate-900 z-40
        flex flex-col shadow-2xl transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-black">
              SC
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-tight leading-none mb-1">SMART CAMPUS</p>
              <p className="text-purple-400 text-[10px] uppercase font-bold tracking-widest leading-none">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2">
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                ${isActive
                  ? 'bg-purple-600/20 text-white border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/50'
                  : 'text-purple-300/70 hover:bg-white/5 hover:text-white'}`
              }
              onClick={() => setOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-xl border border-white/10">
             <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.[0].toUpperCase()}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-white text-xs font-bold truncate leading-none">{user?.name}</p>
               <p className="text-purple-400 text-[10px] truncate">Root Access</p>
             </div>
          </div>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400
              hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut size={18} />Logout
          </button>
        </div>
      </aside>
    </>
  );
};

// ─── Stats card ───────────────────────────────────────────────────────────────
const Stat = ({ label, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="glass-card p-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
        <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{value ?? '—'}</p>
      </div>
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
        <Icon size={22} />
      </div>
    </div>
  </motion.div>
);

// ─── Overview page ────────────────────────────────────────────────────────────
const Overview = () => {
  const { token } = useAuthStore();
  const { data: stats } = useQuery<any>({
    queryKey: ['system-stats'],
    queryFn: () => authedGet(`${API}/system/stats`, token!),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
          System Overview
          <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full border border-purple-500/20">LIVE</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Real-time global metrics across all institutions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Stat label="Institutions" value={stats?.total_institutions ?? 0} icon={School} color="bg-blue-500 text-white shadow-blue-500/30" delay={0} />
        <Stat label="Total Users" value={stats?.total_users} icon={Users} color="bg-purple-500 text-white shadow-purple-500/30" delay={0.05} />
        <Stat label="Total Events" value={stats?.total_events} icon={BarChart3} color="bg-amber-500 text-white shadow-amber-500/30" delay={0.1} />
        <Stat label="Staff Roles" value={(stats?.total_admins ?? 0) + (stats?.total_sub_admins ?? 0)} icon={Shield} color="bg-indigo-500 text-white shadow-indigo-500/30" delay={0.15} />
        <Stat label="Students" value={stats?.total_students} icon={UserCheck} color="bg-emerald-500 text-white shadow-emerald-500/30" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="glass-card p-6">
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6">Recent System Activity</h2>
            <div className="space-y-4">
              {stats?.recent_activity?.length > 0 ? (
                stats.recent_activity.map((a: any, i: number) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                       {a.sender_name?.[0]}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{a.text}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">{a.type} · {new Date(a.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                    <p className="text-slate-400 text-sm italic">No recent activity detected.</p>
                </div>
              )}
            </div>
         </div>
         
         <div className="glass-card p-6">
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6">System Health</h2>
            <div className="space-y-6">
               <HealthBar label="API Response Time" value="45ms" percent={10} color="bg-emerald-500" />
               <HealthBar label="DB Connections" value="12 Active" percent={25} color="bg-blue-500" />
               <HealthBar label="Storage Usage" value="1.2 GB" percent={40} color="bg-amber-500" />
               <HealthBar label="Active WebSocket nodes" value="2 Nodes" percent={60} color="bg-purple-500" />
            </div>
         </div>
      </div>
    </div>
  );
};

const HealthBar = ({ label, value, percent, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 dark:text-white">{value}</span>
    </div>
    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={`h-full ${color}`} />
    </div>
  </div>
);

// ─── Institution Management ───────────────────────────────────────────────────
const InstitutionManagement = () => {
    const { token } = useAuthStore();
    const qc = useQueryClient();
    const [showAdd, setShowAdd] = useState(false);
    const [editingInst, setEditingInst] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: institutions = [], isLoading } = useQuery<any[]>({
        queryKey: ['institutions'],
        queryFn: () => authedGet(`${API}/institutions`, token!),
    });

    const closeModals = () => {
        setShowAdd(false);
        setEditingInst(null);
    };

    const deleteMut = useMutation({
        mutationFn: (id: number) => authedDelete(`${API}/institutions/${id}`, token!),
        onSuccess: () => { 
            toast.success('Institution deleted'); 
            qc.invalidateQueries({ queryKey: ['institutions'] }); 
        },
        onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Delete failed'),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => authedPut(`${API}/institutions/${id}`, data, token!),
        onSuccess: () => { 
            toast.success('Institution updated'); 
            setEditingInst(null);
            qc.invalidateQueries({ queryKey: ['institutions'] }); 
        },
        onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Update failed'),
    });

    const createMut = useMutation({
        mutationFn: (data: any) => authedPost(`${API}/institutions`, data, token!),
        onSuccess: (res: any) => {
            if (res?.admin_created) {
                toast.success(`Institution created! Admin account auto-created for ${res.admin_created.email}`);
            } else {
                toast.success('Institution created');
            }
            setShowAdd(false);
            qc.invalidateQueries({ queryKey: ['institutions'] });
            qc.invalidateQueries({ queryKey: ['all-users-super'] });
        },
        onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Failed'),
    });

    const filtered = institutions.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Institutions</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manage universities and colleges on the platform.</p>
                </div>
                <button 
                    onClick={() => setShowAdd(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-black px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 transition-all active:scale-95 cursor-pointer"
                >
                    <Plus size={20} /> Add Institution
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by name or code..." 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-none shadow-sm dark:shadow-none dark:text-white focus:ring-2 focus:ring-primary-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(inst => (
                    <motion.div 
                        key={inst.id}
                        layout
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="glass-card overflow-hidden group border-none dark:bg-slate-800"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-2xl font-black text-primary-600 shadow-inner">
                                    {inst.logo_url ? <img src={inst.logo_url} className="w-full h-full object-cover rounded-2xl" alt="" /> : inst.code.slice(0, 2)}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${inst.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-red-100 text-red-700'}`}>
                                    {inst.is_active ? 'Active' : 'Maintanance'}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 leading-tight">{inst.name}</h3>
                            <p className="text-primary-600 font-bold text-sm mb-4">{inst.code}</p>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    <MapPin size={14} /> {inst.city}, {inst.state}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    <Mail size={14} /> {inst.email ?? 'No contact email'}
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingInst(inst); }}
                                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Edit2 size={14} /> Details
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if (window.confirm(`Permanently delete ${inst.name}?`)) deleteMut.mutate(inst.id); }}
                                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center cursor-pointer"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal for Add/Edit */}
            {Boolean(showAdd || editingInst) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModals} />
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 overflow-hidden shadow-2xl border border-white/10 z-10">
                        <h2 className="text-2xl font-black mb-6 dark:text-white">{editingInst ? 'Edit Institution' : 'New Institution'}</h2>
                        <form onSubmit={(e: any) => {
                            e.preventDefault();
                            const fd = new FormData(e.target);
                            const data = Object.fromEntries(fd);
                            if (editingInst) {
                                updateMut.mutate({ id: editingInst.id, data });
                            } else {
                                createMut.mutate(data);
                            }
                        }} className="space-y-4">
                            <FormInput label="Institution Name" name="name" defaultValue={editingInst?.name} placeholder="E.g. PSG College of Tech" required />
                            <FormInput label="Unique Code" name="code" defaultValue={editingInst?.code} placeholder="E.g. PSGTECH" required />
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="City" name="city" defaultValue={editingInst?.city} placeholder="Coimbatore" />
                                <FormInput label="State" name="state" defaultValue={editingInst?.state} placeholder="Tamil Nadu" />
                            </div>
                            <FormInput label="Email" name="email" type="email" defaultValue={editingInst?.email} placeholder="admin@info.edu" />
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="Admin Name" name="admin_name" placeholder="E.g. Usha" />
                                <FormInput label="Admin User ID" name="admin_user_id" placeholder="E.g. RGU48" />
                            </div>
                            {!editingInst && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-1.5">
                                            Admin Mail Password
                                            <span className="normal-case font-medium text-slate-400">(for institution admin account)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                name="admin_password"
                                                type="text"
                                                placeholder="Set a secure password"
                                                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none dark:text-white focus:ring-2 focus:ring-primary-500 pr-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center gap-1.5">
                                            Admin Phone Number
                                            <span className="normal-case font-medium text-slate-400">(for OTP recovery)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                name="admin_phone_number"
                                                type="tel"
                                                placeholder="9876543210"
                                                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none dark:text-white focus:ring-2 focus:ring-primary-500 pr-10"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={closeModals} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-2xl font-bold cursor-pointer">Cancel</button>
                                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 py-3 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 cursor-pointer">
                                    {(createMut.isPending || updateMut.isPending) ? 'Saving...' : (editingInst ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const FormInput = ({ label, name, ...props }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-slate-500 ml-1">{label}</label>
        <input name={name} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none dark:text-white focus:ring-2 focus:ring-primary-500" {...props} />
    </div>
);

// ─── User Management ──────────────────────────────────────────────────────────
const UserManagement = () => {
  const { token, user: me } = useAuthStore();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ['all-users-super'],
    queryFn: () => authedGet(`${API}/users`, token!),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => authedDelete(`${API}/users/${id}`, token!),
    onSuccess: () => {
      toast.success('User removed from the system.');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['all-users-super'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Delete failed'),
  });

  const ROLE_COLOR: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    admin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    sub_admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  const canDelete = (u: any) => u.role !== 'super_admin' && u.id !== me?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Global User Base</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage users and admins across all institutions.</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-700/20 border-b border-slate-100 dark:border-slate-700">
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400">User Details</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400">Institution</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400">Current Role</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-400">Verification</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {users.map(u => (
                        <tr key={u.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500">
                                        {u.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white leading-none">{u.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">{u.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full bg-blue-500" />
                                     <span className="text-slate-600 dark:text-slate-300 font-bold text-xs">{u.institution?.name ?? 'System Level'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg ${ROLE_COLOR[u.role]}`}>
                                    {u.role.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {u.role === 'student' ? (
                                    <div className="flex items-center gap-2">
                                        {u.is_verified ? (
                                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 tracking-tighter uppercase"><CheckCircle size={12}/> Verified</span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 tracking-tighter uppercase"><XCircle size={12}/> Pending</span>
                                        )}
                                    </div>
                                ) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {canDelete(u) ? (
                                        <button
                                            onClick={() => setDeleteTarget(u)}
                                            title="Remove user"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 font-bold text-xs transition-all cursor-pointer border border-red-100 dark:border-red-800/30"
                                        >
                                            <Trash2 size={13} /> Remove
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-slate-300 dark:text-slate-600 font-medium px-3 py-1.5">
                                            {u.id === me?.id ? 'You' : 'Protected'}
                                        </span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {users.length === 0 && !isLoading && (
            <div className="text-center py-20">
                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold">No users detected on the system grid.</p>
            </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !deleteMut.isPending && setDeleteTarget(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/10 z-10"
            >
              {/* Icon */}
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Trash2 size={26} className="text-red-500" />
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white text-center mb-1">Remove User</h2>
              <p className="text-slate-500 text-sm text-center mb-6">This action is <span className="font-black text-red-500">permanent</span> and cannot be undone.</p>

              {/* User preview card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mb-3">
                <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center font-black text-red-500 text-lg flex-shrink-0">
                  {deleteTarget.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 dark:text-white truncate">{deleteTarget.name}</p>
                  <p className="text-xs text-slate-400 truncate">{deleteTarget.email}</p>
                </div>
                <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-lg flex-shrink-0 ${ROLE_COLOR[deleteTarget.role]}`}>
                  {deleteTarget.role.replace('_', ' ')}
                </span>
              </div>

              {/* Warning */}
              <div className="flex gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 mb-6">
                <XCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                  All registrations and messages linked to this account will also be permanently deleted.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={deleteMut.isPending}
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 dark:text-white font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteMut.isPending}
                  onClick={() => deleteMut.mutate(deleteTarget.id)}
                  className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 size={15} />
                  {deleteMut.isPending ? 'Removing...' : 'Yes, Remove User'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Event Management ─────────────────────────────────────────────────────────
const EventManagement = () => {
    const { token } = useAuthStore();
    const qc = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [shareEvent, setShareEvent] = useState<any>(null);

    const { data: events = [], isLoading } = useQuery<any[]>({
        queryKey: ['all-events-super'],
        queryFn: () => authedGet(`${API}/events`, token!),
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => authedDelete(`${API}/events/${id}`, token!),
        onSuccess: () => { 
            toast.success('Event deleted'); 
            qc.invalidateQueries({ queryKey: ['all-events-super'] }); 
        },
        onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Delete failed'),
    });

    const filtered = events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const ongoing = filtered.filter(e => new Date(e.date) >= new Date());
    const past = filtered.filter(e => new Date(e.date) < new Date());

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Global Events</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">View and manage ongoing and past events across all institutions.</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search events by title..." 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-none shadow-sm dark:shadow-none dark:text-white focus:ring-2 focus:ring-primary-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ongoing & Upcoming</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {ongoing.map(event => (
                    <EventCard 
                        key={event.id} 
                        event={event} 
                        onShare={() => setShareEvent(event)}
                        onDelete={() => { if (window.confirm('Delete this event? A notification will be sent to the institution admin.')) deleteMut.mutate(event.id); }} 
                    />
                ))}
                {ongoing.length === 0 && <p className="text-slate-500 text-sm">No ongoing events found.</p>}
            </div>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {past.map(event => (
                    <EventCard 
                        key={event.id} 
                        event={event} 
                        onShare={() => setShareEvent(event)}
                        onDelete={() => { if (window.confirm('Delete this event? A notification will be sent to the institution admin.')) deleteMut.mutate(event.id); }} 
                    />
                ))}
                {past.length === 0 && <p className="text-slate-500 text-sm">No past events found.</p>}
            </div>

            <ShareEventModal isOpen={!!shareEvent} onClose={() => setShareEvent(null)} event={shareEvent} />
        </div>
    );
};

const EventCard = ({ event, onDelete, onShare }: { event: any, onDelete: () => void, onShare: () => void }) => {
    const isDeletionPending = event.deletion_status === 'pending_approval';
    
    return (
    <div className="glass-card overflow-hidden group border-none dark:bg-slate-800 flex flex-col">
        <div className="h-32 relative bg-slate-200 dark:bg-slate-700">
             {event.image_url && <img src={event.image_url} alt="" className="w-full h-full object-cover" />}
             <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] text-white font-bold uppercase tracking-wider flex gap-2 items-center">
                 <span>{event.status}</span>
                 {isDeletionPending && <span className="bg-red-500 px-1.5 py-0.5 rounded">Pending Deletion</span>}
             </div>
        </div>
        <div className="p-5 flex flex-col flex-1">
            <h3 className="font-bold text-lg dark:text-white mb-1 line-clamp-1">{event.title}</h3>
            <p className="text-xs text-primary-500 font-bold mb-3 line-clamp-1">{event.created_by_institution || 'System Global'}</p>
            <div className="space-y-1 mb-4 flex-1">
                 <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                     <Calendar size={14} /> {new Date(event.date).toLocaleDateString()}
                 </div>
                 <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                     <MapPin size={14} /> <span className="line-clamp-1">{event.location}</span>
                 </div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <button 
                    onClick={onShare}
                    className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                >
                    <Send size={14} /> Share
                </button>
                {isDeletionPending ? (
                    <span className="text-xs font-bold text-red-500 py-1.5 flex items-center">
                        <Clock size={14} className="mr-1.5" /> Deletion Request Pending
                    </span>
                ) : (
                    <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs font-bold cursor-pointer border border-red-100 dark:border-red-900/50">
                        <Trash2 size={14} /> Delete
                    </button>
                )}
            </div>
        </div>
    </div>
)};

// ─── Announcements ────────────────────────────────────────────────────────────
const Announcements = () => {
    const { token } = useAuthStore();
    const [text, setText] = useState('');
  
    const announceMut = useMutation({
      mutationFn: (msg: string) => authedPost(`${API}/system/announce`, { text: msg }, token!),
      onSuccess: () => { toast.success('Announcement broadcast to all users!'); setText(''); },
      onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Failed to send'),
    });
  
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Announcements</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Broadcast a message to every user in real-time across all nodes.</p>
        </div>
  
        <div className="glass-card p-8 space-y-6 max-w-2xl">
          <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Global Message Content</label>
              <textarea
                rows={6}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Broadcast something important..."
                className="w-full border border-slate-200 dark:border-slate-700/50 rounded-2xl px-6 py-4 text-sm
                    bg-slate-50 dark:bg-slate-800 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all"
              />
          </div>
          <button
            onClick={() => text.trim() && announceMut.mutate(text.trim())}
            disabled={!text.trim() || announceMut.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl
              transition-all shadow-xl shadow-purple-500/30 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <Megaphone size={20} />
            {announceMut.isPending ? 'Transmitting...' : 'Initiate Broadcast'}
          </button>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50 flex gap-3">
              <Shield className="text-purple-500 flex-shrink-0" size={18} />
              <p className="text-[10px] text-purple-700 dark:text-purple-300 leading-normal font-bold">This message will be instantly pushed to all active user sessions and stored in their persistent notification inbox.</p>
          </div>
        </div>
      </div>
    );
};

// ─── Super Admin layout shell ─────────────────────────────────────────────────
const SuperAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="md:ml-64">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/50 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 hover:text-slate-700">
                <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm hidden sm:block">Cluster Management</h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 px-3 rounded-full ml-2 border border-slate-200 dark:border-slate-700/50">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <NotificationBell />
             <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700/50">
                 <Shield size={14} className="text-purple-500" />
                 <span className="text-[10px] font-black uppercase text-slate-500">Root Node</span>
             </div>
          </div>
        </header>

        <main className="p-6 md:p-10 max-w-7xl mx-auto">
          <Routes>
            <Route path="dashboard" element={<Overview />} />
            <Route path="institutions" element={<InstitutionManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="events" element={<EventManagement />} />
            <Route path="messages" element={<Messages />} />
            <Route path="announce" element={<Announcements />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
