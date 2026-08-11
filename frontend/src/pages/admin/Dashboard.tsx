import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import {
  Calendar, CalendarPlus, CheckCircle2, XCircle, Clock, Users,
  Wifi, WifiOff, Eye, ChevronRight, Bell, LayoutDashboard,
  ClipboardList, Award, LogOut, Menu, X as CloseIcon, 
  ShieldCheck, UserPlus, Info, MapPin, Building, Megaphone, Trash2, Plus, Home,
  Mail, Lock, Phone, IdCard, BookOpen, GraduationCap, Edit2, MessageSquare, Send
} from 'lucide-react';
import { useNavigate, NavLink, Routes, Route, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { institutionApi } from '../../services/institutions';
import { usersApi } from '../../services/users';
import { CreateSubAdminModal } from '../../components/admin/CreateSubAdminModal';
import { SocialFeed } from '../../components/ui/SocialFeed';
import SettingsPage from '../shared/Settings';
import ProfilePage from '../shared/Profile';
import { User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { EventDetailsModal } from '../../components/events/EventDetailsModal';
import { NotificationBell } from '../../components/ui/NotificationBell';
import Messages from '../shared/Messages';
import SharedRegistrations from '../shared/Registrations';
import { ShareEventModal } from '../../components/events/ShareEventModal';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

const authedGet = (url: string, token: string) =>
  axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

const authedPost = (url: string, body: unknown, token: string) =>
  axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);


// ─── Sidebar nav ─────────────────────────────────────────────────────────────
const NAV = [
  { label: 'Home Feed', icon: Home, path: '/admin/feed' },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Event Approvals', icon: Bell, path: '/admin/pending', badge: 'pendingEvents' },
  { label: 'Events', icon: Calendar, path: '/admin/events' },
  { label: 'Messages', icon: MessageSquare, path: '/admin/messages' },
  { label: 'Registrations', icon: ClipboardList, path: '/admin/registrations' },
  { label: 'User Directory', icon: Users, path: '/admin/users' },
  { label: 'My Profile', icon: UserIcon, path: '/admin/profile' },
  { label: 'Settings', icon: SettingsIcon, path: '/admin/settings' },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) => {
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  
  const { data: pendingEvents } = useQuery<any[]>({
    queryKey: ['pending-events'],
    queryFn: () => authedGet(`${API}/events/pending`, token!),
    refetchInterval: 15000,
  });

  const { data: pendingStudents } = useQuery<any[]>({
    queryKey: ['pending-students'],
    queryFn: () => institutionApi.getPendingStudents(),
    refetchInterval: 15000,
  });

  const badges: Record<string, number> = {
    pendingEvents: pendingEvents?.length ?? 0,
    pendingStudents: pendingStudents?.length ?? 0,
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-indigo-950 dark:bg-slate-950 z-40
        flex flex-col shadow-2xl transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Building size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-sm tracking-tight truncate leading-tight uppercase">
                {user?.institution?.name ?? 'Admin Portal'}
              </p>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{user?.institution?.code ?? 'SMART CAMPUS'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider
                ${isActive
                  ? 'bg-white/10 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] ring-1 ring-white/20'
                  : 'text-indigo-300/60 hover:bg-white/5 hover:text-white'}`
              }
              onClick={() => setOpen(false)}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge && badges[item.badge as string] > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/30">
                  {badges[item.badge as string]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
             <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate leading-tight">{user?.name}</p>
                    <p className="text-indigo-400 text-[10px] uppercase font-black tracking-tighter">College Administrator</p>
                </div>
             </div>
             <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-400
                  hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all border border-transparent hover:border-rose-500/10"
              >
                <LogOut size={16} /> Logout System
              </button>
        </div>
      </aside>
    </>
  );
};

// ─── Verification Portal ───────────────────────────────────────────────────────
const VerificationPortal = () => {
    const qc = useQueryClient();
    const { data: pending = [], isLoading } = useQuery<any[]>({
        queryKey: ['pending-students'],
        queryFn: () => institutionApi.getPendingStudents(),
    });

    const verifyMut = useMutation({
        mutationFn: (id: number) => institutionApi.verifyStudent(id),
        onSuccess: () => { toast.success('Student Verified'); qc.invalidateQueries({ queryKey: ['pending-students'] }); },
        onError: () => toast.error('Verification failed'),
    });

    const rejectMut = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) => institutionApi.rejectStudent(id, reason),
        onSuccess: () => { toast.success('Student Rejected'); qc.invalidateQueries({ queryKey: ['pending-students'] }); },
        onError: () => toast.error('Rejection failed'),
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Student Verification</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Approve or reject new registrations from your college.</p>
            </div>

            {isLoading && <p>Loading...</p>}
            
            <div className="grid grid-cols-1 gap-4">
                {pending.map(s => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        key={s.id} 
                        className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xl text-primary-600">
                                {s.name[0]}
                            </div>
                            <div>
                                <h3 className="text-lg font-black dark:text-white leading-none mb-1">{s.name}</h3>
                                <p className="text-sm text-slate-400 font-medium mb-2">{s.email}</p>
                                <div className="flex flex-wrap gap-2">
                                     <Badge label={s.student_id} icon={<Info size={10}/>} color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"/>
                                     <Badge label={s.department} icon={<Building size={10}/>} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"/>
                                     <Badge label={s.year_of_study} icon={<CalendarPlus size={10}/>} color="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"/>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                             <button 
                                onClick={() => verifyMut.mutate(s.id)}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                             >
                                Verify Student
                             </button>
                             <button 
                                onClick={() => {
                                    const reason = window.prompt("Reason for rejection?");
                                    if(reason) rejectMut.mutate({ id: s.id, reason });
                                }}
                                className="px-6 py-3 bg-white dark:bg-slate-800 border-none text-rose-500 hover:bg-rose-50 font-black rounded-xl text-xs uppercase tracking-widest transition-all"
                             >
                                Reject
                             </button>
                        </div>
                    </motion.div>
                ))}

                {pending.length === 0 && !isLoading && (
                    <div className="text-center py-20 glass-card">
                        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold dark:text-white">Queue Empty</h3>
                        <p className="text-slate-500">No students are currently awaiting verification.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const Badge = ({ label, icon, color }: any) => (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${color}`}>
        {icon} {label}
    </span>
);

// ─── Event Approvals Portal ──────────────────────────────────────────────────
const PendingEvents = () => {
    const { token } = useAuthStore();
    const qc = useQueryClient();
    const { data: pending = [], isLoading } = useQuery<any[]>({
        queryKey: ['pending-events'],
        queryFn: () => authedGet(`${API}/events/pending`, token!),
    });

    const approveMut = useMutation({
        mutationFn: (id: string) => axios.put(`${API}/events/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } }),
        onSuccess: () => { toast.success('Event Approved'); qc.invalidateQueries({ queryKey: ['pending-events'] }); },
        onError: () => toast.error('Approval failed'),
    });

    const approveDeletionMut = useMutation({
        mutationFn: (id: string) => axios.put(`${API}/events/${id}/approve-deletion`, {}, { headers: { Authorization: `Bearer ${token}` } }),
        onSuccess: () => { toast.success('Event Deletion Approved'); qc.invalidateQueries({ queryKey: ['pending-events'] }); },
        onError: () => toast.error('Deletion approval failed'),
    });

    const deletionRequests = pending.filter((ev: any) => ev.deletion_status === 'pending_approval');
    const implementationRequests = pending.filter((ev: any) => ev.approval_status === 'pending_approval' && ev.deletion_status !== 'pending_approval');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Event Approvals</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Review and publish events or approve deletions submitted by sub-admins.</p>
            </div>

            {isLoading && <p>Loading...</p>}
            
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-700">Implementation Approvals</h2>
                    {implementationRequests.length === 0 && !isLoading && (
                        <p className="text-sm text-slate-500">No implementation approvals pending.</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {implementationRequests.map((ev: any) => {
                            const isEditRequest = !!ev.pending_changes;
                            const displayTitle = isEditRequest && ev.pending_changes.title ? ev.pending_changes.title : ev.title;
                            const displayDesc = isEditRequest && ev.pending_changes.description ? ev.pending_changes.description : ev.description;
                            
                            return (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                key={ev.id} 
                                className="glass-card overflow-hidden flex flex-col relative"
                            >
                                {/* Header / Image */}
                                {ev.image ? (
                                    <div className="h-48 w-full bg-slate-100 dark:bg-slate-800">
                                        <img src={ev.image} alt={displayTitle} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className={`h-48 w-full ${isEditRequest ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-300' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-300'} flex items-center justify-center`}>
                                        {isEditRequest ? <Edit2 size={48} /> : <CalendarPlus size={48} />}
                                    </div>
                                )}
                                
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-black dark:text-white leading-tight mb-2 line-clamp-2">
                                        {displayTitle}
                                    </h3>
                                    {isEditRequest && (
                                        <span className="inline-block self-start mb-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded uppercase font-bold tracking-wider">
                                            Edit Request
                                        </span>
                                    )}
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{displayDesc}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <Badge label={ev.date} icon={<Clock size={10}/>} color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"/>
                                        <Badge label={ev.type} icon={<Award size={10}/>} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"/>
                                    </div>
                                    
                                    <div className="flex gap-3 mt-auto">
                                        <button 
                                            onClick={() => approveMut.mutate(ev.id)}
                                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                        >
                                            {isEditRequest ? 'Approve Edits' : 'Approve'}
                                        </button>
                                        <button 
                                            onClick={() => { window.prompt("Reason for rejection?"); }}
                                            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )})}
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 dark:border-slate-700">Deletion Approvals</h2>
                    {deletionRequests.length === 0 && !isLoading && (
                        <p className="text-sm text-slate-500">No deletion approvals pending.</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {deletionRequests.map((ev: any) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                key={ev.id} 
                                className="glass-card overflow-hidden flex flex-col relative"
                            >
                                {/* Header / Image */}
                                {ev.image ? (
                                    <div className="h-48 w-full bg-slate-100 dark:bg-slate-800">
                                        <img src={ev.image} alt={ev.title} className="w-full h-full object-cover grayscale opacity-70" />
                                    </div>
                                ) : (
                                    <div className="h-48 w-full bg-red-50 dark:bg-red-900/20 text-red-300 flex items-center justify-center">
                                        <Trash2 size={48} />
                                    </div>
                                )}
                                
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-black dark:text-white leading-tight mb-2 line-clamp-2">
                                        {ev.title}
                                    </h3>
                                    <span className="inline-block self-start mb-2 text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded uppercase font-bold tracking-wider">
                                        Deletion Request
                                    </span>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{ev.description}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <Badge label={ev.date} icon={<Clock size={10}/>} color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"/>
                                        <Badge label={ev.type} icon={<Award size={10}/>} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"/>
                                    </div>
                                    
                                    <div className="flex gap-3 mt-auto">
                                        <button 
                                            onClick={() => approveDeletionMut.mutate(ev.id)}
                                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                        >
                                            Confirm Delete
                                        </button>
                                        <button 
                                            onClick={() => { window.prompt("Reason for rejection?"); }}
                                            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Events Portal ───────────────────────────────────────────────────────────
const EventsPortal = () => {
    const { token, user } = useAuthStore();
    const qc = useQueryClient();
    const { data: events = [], isLoading } = useQuery<any[]>({
        queryKey: ['admin-events'],
        queryFn: () => authedGet(`${API}/events?institution_id=${user?.institution_id}`, token!),
    });

    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [shareEvent, setShareEvent] = useState<any>(null);

    const today = new Date().toISOString().slice(0, 10);
    const publishedEvents = events.filter((e: any) => e.status === 'published');
    const upcomingEvents = publishedEvents.filter((e: any) => e.date >= today);
    const pastEvents = publishedEvents.filter((e: any) => e.date < today);

    const EventCard = ({ ev }: { ev: any }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden flex flex-col hover:border-indigo-500/50 cursor-pointer transition-all group relative"
            onClick={() => setSelectedEvent(ev)}
        >
            {ev.image ? (
                <div className="h-48 w-full bg-slate-100 dark:bg-slate-800">
                    <img src={ev.image} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
            ) : (
                <div className="h-48 w-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-200">
                    <CalendarPlus size={48} />
                </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-black dark:text-white leading-tight mb-2 line-clamp-2">{ev.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{ev.description}</p>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Badge label={ev.date} icon={<Clock size={10}/>} color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"/>
                    <Badge label={ev.type} icon={<Award size={10}/>} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"/>
                    {ev.venue && <Badge label={ev.venue} icon={<MapPin size={10}/>} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"/>}
                </div>
                <div className="mt-3 flex justify-end">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShareEvent(ev); }}
                        className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                    >
                        <Send size={14} /> Share
                    </button>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Events Feed</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage all published events.</p>
                    </div>
                </div>
                
                {isLoading && <p>Loading...</p>}

                <div className="space-y-12">
                    {/* Upcoming Events */}
                    <div>
                        <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Upcoming Events
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {upcomingEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
                            {upcomingEvents.length === 0 && !isLoading && (
                                <div className="col-span-full text-center py-12 glass-card">
                                    <Calendar className="text-slate-300 mx-auto mb-4" size={32} />
                                    <p className="text-slate-500 font-medium">No upcoming events.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Past Events */}
                    <div>
                        <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Past Events
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                            {pastEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
                            {pastEvents.length === 0 && !isLoading && (
                                <div className="col-span-full text-center py-12 glass-card">
                                    <Clock className="text-slate-300 mx-auto mb-4" size={32} />
                                    <p className="text-slate-500 font-medium">No past events.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedEvent && (
                <EventDetailsModal 
                    onClose={() => setSelectedEvent(null)} 
                    event={selectedEvent} 
                    onEditSuccess={() => {
                        qc.invalidateQueries({ queryKey: ['admin-events'] });
                        setSelectedEvent(null);
                    }}
                />
            )}
            {shareEvent && (
                <ShareEventModal isOpen={!!shareEvent} onClose={() => setShareEvent(null)} event={shareEvent} />
            )}
        </div>
    );
};

// ─── Dashboard Home ──────────────────────────────────────────────────────────
const DashboardHome = () => {
  const { token, user } = useAuthStore();
  const isOnline = useOnlineStatus();

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ['admin-events'],
    queryFn: () => authedGet(`${API}/events?institution_id=${user?.institution_id}`, token!),
  });
  
  const { data: regs = [] } = useQuery<any[]>({
    queryKey: ['admin-regs'],
    queryFn: () => authedGet(`${API}/registrations`, token!),
  });

  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [blastNoticeOpen, setBlastNoticeOpen] = useState(false);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
             {user?.institution?.name} <span className="text-primary-600 font-light lowercase text-2xl tracking-normal">admin</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Grid control for campus activities and student life.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm">
             <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
             <span className="text-[10px] font-black uppercase text-slate-500">{isOnline ? 'System Online' : 'System Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatItem label="Total Events" value={events.length} color="bg-indigo-600" delay={0} />
        <StatItem label="Active Streams" value={events.filter((e:any)=>e.status==='published').length} color="bg-purple-600" delay={0.05} />
        <StatItem label="Registrations" value={regs.length} color="bg-blue-600" delay={0.1} />
        <StatItem label="Verified Base" value="840" color="bg-emerald-600" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 gap-8">
           <div className="glass-card p-8 bg-indigo-950 text-white border-none shadow-2xl shadow-indigo-500/20">
               <h2 className="text-xl font-black uppercase tracking-tighter mb-4">Command Center</h2>
               <p className="text-indigo-200 text-sm mb-8">Quickly execute college-wide administrative tasks and global configuration.</p>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <QuickAction onClick={() => setCreateEventOpen(true)} icon={<CalendarPlus size={18}/>} label="Create Event" color="bg-indigo-500" />
                   <QuickAction onClick={() => setAddStudentOpen(true)} icon={<UserPlus size={18}/>} label="Add Student" color="bg-blue-500" />
                   <QuickAction onClick={() => setBlastNoticeOpen(true)} icon={<Megaphone size={18}/>} label="Blast Notice" color="bg-purple-500" />
               </div>
           </div>
      </div>
      
      {createEventOpen && <AdminCreateEventModal isOpen={createEventOpen} onClose={() => setCreateEventOpen(false)} />}
      {addStudentOpen && <AdminAddStudentModal isOpen={addStudentOpen} onClose={() => setAddStudentOpen(false)} />}
      {blastNoticeOpen && <AdminBlastNoticeModal isOpen={blastNoticeOpen} onClose={() => setBlastNoticeOpen(false)} events={events} />}
    </div>
  );
};

const StatItem = ({ label, value, color, delay }: any) => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }} className="glass-card p-6 border-none dark:bg-slate-800">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{label}</p>
        <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black dark:text-white">{value}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
        </div>
    </motion.div>
);

const QuickAction = ({ icon, label, color, onClick }: any) => (
    <button onClick={onClick} className={`${color} p-4 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg`}>
        {icon}
        <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
);

// ─── Admin Modals ─────────────────────────────────────────────────────────────

const AdminCreateEventModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { token } = useAuthStore();
    const qc = useQueryClient();
    const [form, setForm] = useState({
      title: '', description: '', date: '', time: '', venue: '', capacity: '', type: '', image: '', rules: '', payment_qr: '', sub_events: [] as any[]
    });
  
    const createMut = useMutation({
      mutationFn: (data: any) => authedPost(`${API}/events`, data, token!),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['admin-events'] });
        toast.success('Event created and published! ✅');
        onClose();
      },
      onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Failed to create event'),
    });
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-black dark:text-white mb-4">Create Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'title', label: 'Title *', type: 'text', placeholder: 'Event title' },
            { key: 'venue', label: 'Venue', type: 'text', placeholder: 'Location' },
            { key: 'date', label: 'Date', type: 'date', placeholder: '' },
            { key: 'time', label: 'Time', type: 'time', placeholder: '' },
            { key: 'capacity', label: 'Capacity', type: 'number', placeholder: '100' },
            { key: 'type', label: 'Type', type: 'text', placeholder: 'Academic / Cultural…' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm
                  bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Event Poster</label>
            <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setForm(p => ({ ...p, image: reader.result as string }));
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 cursor-pointer"
            />
            {form.image && <div className="mt-2 h-32 w-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600"><img src={form.image} alt="Preview" className="w-full h-full object-cover" /></div>}
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 resize-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Rules & Instructions (PDF/Image)</label>
            <input type="file" accept=".pdf, image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setForm(p => ({ ...p, rules: reader.result as string }));
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
            />
            {form.rules && typeof form.rules === 'string' && form.rules.startsWith('data:image/') && (
              <div className="mt-2 h-20 w-auto inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                <img src={form.rules} alt="Rules Preview" className="h-full w-auto object-cover" />
              </div>
            )}
            {form.rules && typeof form.rules === 'string' && form.rules.startsWith('data:application/pdf') && (
              <div className="mt-2 text-sm text-blue-500 font-bold">PDF selected ✓</div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Payment Scanner / QR Code</label>
            <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setForm(p => ({ ...p, payment_qr: reader.result as string }));
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
            />
            {form.payment_qr && (
              <div className="mt-2 h-32 w-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                <img src={form.payment_qr} alt="Payment Scanner Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-700 mt-4 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Sub-Events</label>
              <button type="button" onClick={() => setForm(p => ({ ...p, sub_events: [...p.sub_events, { name: '', start_time: '', end_time: '', venue: '', capacity: 50, is_paid: false, amount: 0, fee_type: 'per_person', team_size: 1 }] }))} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full flex items-center gap-1">
                <Plus size={14} /> Add Sub-Event
              </button>
            </div>
            {form.sub_events.map((sub, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 mb-3 relative">
                <button type="button" onClick={() => setForm(p => ({ ...p, sub_events: p.sub_events.filter((_, idx) => idx !== i) }))} className="absolute top-3 right-3 text-red-500 hover:text-red-700">
                  <XCircle size={16} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Sub-Event Name *</label>
                    <input type="text" value={sub.name} onChange={e => { const newSub = [...form.sub_events]; newSub[i].name = e.target.value; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" placeholder="e.g. Code Relay"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Venue</label>
                    <input type="text" value={sub.venue} onChange={e => { const newSub = [...form.sub_events]; newSub[i].venue = e.target.value; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" placeholder="Location"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Start Time</label>
                    <input type="time" value={sub.start_time} onChange={e => { const newSub = [...form.sub_events]; newSub[i].start_time = e.target.value; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">End Time</label>
                    <input type="time" value={sub.end_time} onChange={e => { const newSub = [...form.sub_events]; newSub[i].end_time = e.target.value; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Capacity</label>
                    <input type="number" value={sub.capacity} onChange={e => { const newSub = [...form.sub_events]; newSub[i].capacity = parseInt(e.target.value) || 0; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" placeholder="50"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Event Type</label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                        <input type="checkbox" checked={sub.is_paid} onChange={e => { const newSub = [...form.sub_events]; newSub[i].is_paid = e.target.checked; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500" />
                        Paid Event
                      </label>
                    </div>
                  </div>
                  {sub.is_paid && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Amount (₹)</label>
                        <input type="number" value={sub.amount} onChange={e => { const newSub = [...form.sub_events]; newSub[i].amount = parseInt(e.target.value) || 0; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" placeholder="Amount" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Fee Type</label>
                        <select value={sub.fee_type} onChange={e => { const newSub = [...form.sub_events]; newSub[i].fee_type = e.target.value; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white">
                          <option value="per_person">Per Person</option>
                          <option value="per_team">Per Team</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Team Size</label>
                    <input type="number" value={sub.team_size} onChange={e => { const newSub = [...form.sub_events]; newSub[i].team_size = parseInt(e.target.value) || 1; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" placeholder="1"/>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Sub-Event Poster</label>
                    <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => { const newSub = [...form.sub_events]; newSub[i].image = reader.result as string; setForm(p => ({ ...p, sub_events: newSub })); };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 cursor-pointer"
                    />
                    {sub.image && <div className="mt-2 h-24 w-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600"><img src={sub.image} alt="Preview" className="w-full h-full object-cover" /></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => createMut.mutate({ ...form, capacity: form.capacity ? parseInt(form.capacity) : null })}
            disabled={!form.title.trim() || createMut.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors">
            Publish Event
          </button>
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl">Cancel</button>
        </div>
        </motion.div>
      </div>
    );
};

const AdminAddStudentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
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
        qc.invalidateQueries({ queryKey: ['admin-users'] });
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

const AdminBlastNoticeModal = ({ isOpen, onClose, events }: { isOpen: boolean; onClose: () => void; events: any[] }) => {
    const { user } = useAuthStore();
    const [form, setForm] = useState({ target: '', message: '' });
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md">
          <h2 className="text-xl font-black dark:text-white mb-4">Blast Notice</h2>
          <p className="text-sm text-slate-500 mb-4">Send an alert to specific event attendees or all your campus students.</p>
          <div className="space-y-4">
            <select value={form.target} onChange={e => setForm(p => ({...p, target: e.target.value}))} className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              <option value="">Select Target...</option>
              <option value="CAMPUS_STUDENTS">All Campus Students ({user?.institution?.name || 'Your Institution'})</option>
              <optgroup label="Specific Events">
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </optgroup>
            </select>
            <textarea placeholder="Notice Message..." rows={4} value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))} className="w-full p-3 rounded-xl border dark:border-slate-600 dark:bg-slate-700 dark:text-white resize-none"/>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => { toast.success('Notice blasted successfully!'); onClose(); }}
              disabled={!form.target || !form.message}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl">
              Send Notice
            </button>
            <button onClick={onClose} className="px-5 py-2.5 border dark:border-slate-600 rounded-xl">Cancel</button>
          </div>
        </motion.div>
      </div>
    );
};

// ─── User Directory ────────────────────────────────────────────────────────────
const UserDirectory = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [studentModalOpen, setStudentModalOpen] = useState(false);
    const qc = useQueryClient();
    const { user } = useAuthStore();

    const { data: users = [], isLoading } = useQuery<any[]>({
        queryKey: ['admin-users'],
        queryFn: () => usersApi.getUsers(),
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => usersApi.deleteUser(id),
        onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
        onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete user'),
    });

    const subAdmins = users.filter(u => u.role === 'sub_admin');
    const students = users.filter(u => u.role === 'student');

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">User Directory</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manage students and sub-admins in your institution.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setStudentModalOpen(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
                    >
                        <UserPlus size={18} /> New Student
                    </button>
                    <button 
                        onClick={() => setModalOpen(true)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
                    >
                        <Plus size={18} /> New Sub-Admin
                    </button>
                </div>
            </div>

            {isLoading ? <p>Loading users...</p> : (
                <div className="space-y-12">
                    {/* Sub-Admins */}
                    <div>
                        <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Sub-Admins</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subAdmins.map(admin => (
                                <div key={admin.id} className="glass-card p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-lg">
                                            {admin.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold dark:text-white">{admin.name}</p>
                                            <p className="text-xs text-slate-500 font-medium">{admin.email}</p>
                                            <span className="inline-block mt-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 text-[10px] uppercase font-black px-2 py-0.5 rounded">
                                                {admin.role.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    {user?.id !== admin.id && (
                                        <button 
                                            onClick={() => { if(window.confirm('Delete this sub-admin?')) deleteMut.mutate(admin.id); }}
                                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {subAdmins.length === 0 && <p className="text-slate-500 text-sm">No sub-admins found.</p>}
                        </div>
                    </div>

                    {/* Students */}
                    <div>
                        <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">Students</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {students.slice(0, 12).map(student => (
                                <div key={student.id} className="glass-card p-5 flex items-center justify-between group relative">
                                    <div className="flex items-center gap-4 cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-black">
                                            {student.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold dark:text-white text-sm">{student.name}</p>
                                            <p className="text-xs text-slate-500 font-medium">{student.student_id || student.email}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Tooltip on hover */}
                                    <div className="absolute left-4 bottom-full mb-2 hidden group-hover:block w-48 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-10 transition-opacity opacity-0 group-hover:opacity-100 border border-slate-700">
                                        <div className="space-y-1.5">
                                            <p><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Name</span><br/>{student.name}</p>
                                            <p><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Role</span><br/><span className="capitalize">{student.role.replace('_', ' ')}</span></p>
                                            <p><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Register No</span><br/>{student.student_id || 'Not Assigned'}</p>
                                            <p><span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Department</span><br/>{student.department || 'Not Assigned'}</p>
                                        </div>
                                        <div className="absolute left-6 top-full w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-slate-900 border-r-[6px] border-r-transparent drop-shadow-md"></div>
                                    </div>

                                    {/* Delete Button */}
                                    {user?.id !== student.id && (
                                        <button 
                                            onClick={() => { if(window.confirm(`Are you sure you want to delete ${student.name}?`)) deleteMut.mutate(student.id); }}
                                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <CreateSubAdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
            <AdminAddStudentModal isOpen={studentModalOpen} onClose={() => setStudentModalOpen(false)} />
        </div>
    );
};

// ─── Admin Dashboard Shell ───────────────────────────────────────────────────
const AdminDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
  
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-inter">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
  
        <div className="md:ml-64">
          <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/60 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500">
                <Menu size={22} />
              </button>
              <ShieldCheck size={18} className="text-indigo-500" />
              <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">College Infrastructure Node</h2>
            </div>
            <NotificationBell />
          </header>
  
          <main className="p-6 md:p-10 max-w-7xl mx-auto">
            <Routes>
              <Route path="feed" element={<SocialFeed />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="pending" element={<PendingEvents />} />
              <Route path="events" element={<EventsPortal />} />
              <Route path="messages" element={<Messages />} />
              <Route path="registrations" element={<SharedRegistrations />} />
              <Route path="users" element={<UserDirectory />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    );
};
  
export default AdminDashboard;
