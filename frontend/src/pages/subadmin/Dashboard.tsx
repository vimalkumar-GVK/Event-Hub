import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import {
  ClipboardList, CheckSquare, Award, Wifi, WifiOff,
  CalendarPlus, Calendar, Clock, CheckCircle2, XCircle, LogOut, Menu, PlusCircle, Home, MapPin, MessageSquare, Send
} from 'lucide-react';
import { useNavigate, NavLink, Routes, Route, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import SubAdminAttendance from './Attendance';
import SharedRegistrations from '../shared/Registrations';
import SubAdminCertificates from './Certificates';
import SubAdminUsers from './Users';
import { SocialFeed } from '../../components/ui/SocialFeed';
import SettingsPage from '../shared/Settings';
import ProfilePage from '../shared/Profile';
import { User, Settings, Users } from 'lucide-react';
import { EventDetailsModal } from '../../components/events/EventDetailsModal';
import { NotificationBell } from '../../components/ui/NotificationBell';
import Messages from '../shared/Messages';
import { ShareEventModal } from '../../components/events/ShareEventModal';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

const authedGet = (url: string, token: string) =>
  axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

const authedPost = (url: string, body: unknown, token: string) =>
  axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

// ─── Nav ─────────────────────────────────────────────────────────────────────
const NAV = [
  { label: 'Home Feed', icon: Home, path: '/subadmin/feed' },
  { label: 'Events Feed', icon: Calendar, path: '/subadmin/events' },
  { label: 'Messages', icon: MessageSquare, path: '/subadmin/messages' },
  { label: 'My Events', icon: CalendarPlus, path: '/subadmin/dashboard' },
  { label: 'Attendance (QR)', icon: CheckSquare, path: '/subadmin/attendance' },
  { label: 'Registrations', icon: ClipboardList, path: '/subadmin/registrations' },
  { label: 'Certificates', icon: Award, path: '/subadmin/certificates' },
  { label: 'User Directory', icon: Users, path: '/subadmin/users' },
  { label: 'My Profile', icon: User, path: '/subadmin/profile' },
  { label: 'Settings', icon: Settings, path: '/subadmin/settings' },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-950 to-slate-900 z-40
        flex flex-col shadow-2xl transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white font-black text-sm">S</div>
            <div>
              <p className="text-white font-bold text-sm">Sub Admin</p>
              <p className="text-blue-300 text-xs">Smart Campus</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 mx-3 mt-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
          <div className={`flex items-center gap-1.5 mt-1 text-xs ${isOnline ? 'text-green-400' : 'text-slate-400'}`}>
            {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/subadmin/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'}`
              }
              onClick={() => setOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400
              hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all"
          >
            <LogOut size={18} />Logout
          </button>
        </div>
      </aside>
    </>
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const MAP: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    pending_approval: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
    draft: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full ${MAP[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

// ─── Create Event form ────────────────────────────────────────────────────────
const CreateEventForm = ({ onDone }: { onDone: () => void }) => {
  const { token } = useAuthStore();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '', venue: '', capacity: '', type: '', image: '', rules: '', payment_qr: '', sub_events: [] as any[]
  });

  const createMut = useMutation({
    mutationFn: (data: any) => authedPost(`${API}/events`, data, token!),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['my-events', user?.id] });
      if (res.approval_status === 'pending_approval') {
        toast.success('Event submitted for approval! 📋 Admin will review it.');
      } else {
        toast.success('Event published! ✅');
      }
      onDone();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Failed to create event'),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 shadow-sm"
    >
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <CalendarPlus size={20} className="text-blue-500" />
        Create New Event
      </h3>
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
                bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Event Poster</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setForm(p => ({ ...p, image: reader.result as string }));
                reader.readAsDataURL(file);
              }
            }}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm
              bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
          />
          {form.image && (
            <div className="mt-2 h-32 w-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
               <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
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
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm
              bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
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
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
          <textarea
            rows={3}
            placeholder="Event description…"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm
              bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
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
            className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm
              bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
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
            <button type="button" onClick={() => setForm(p => ({ ...p, sub_events: [...p.sub_events, { name: '', start_time: '', end_time: '', venue: '', capacity: 50, is_paid: false, amount: 0, fee_type: 'per_person', team_size: 1, image: '' }] }))} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full flex items-center gap-1">
              <PlusCircle size={14} /> Add Sub-Event
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
                      <input type="checkbox" checked={sub.is_paid} onChange={e => { const newSub = [...form.sub_events]; newSub[i].is_paid = e.target.checked; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500" />
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
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
                  />
                  {sub.image && <div className="mt-2 h-24 w-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600"><img src={sub.image} alt="Preview" className="w-full h-full object-cover" /></div>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Capacity</label>
                  <input type="number" value={sub.capacity} onChange={e => { const newSub = [...form.sub_events]; newSub[i].capacity = parseInt(e.target.value) || 0; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" placeholder="50"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Team Size</label>
                  <input type="number" value={sub.team_size} onChange={e => { const newSub = [...form.sub_events]; newSub[i].team_size = parseInt(e.target.value) || 1; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white" placeholder="1"/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
          ℹ️ As Sub Admin, your event will be submitted for <strong>Admin approval</strong> before going live.
        </p>
      </div>

      <div className="flex gap-3 mt-5">
        <button
          onClick={() => createMut.mutate({ ...form, capacity: form.capacity ? parseInt(form.capacity) : null })}
          disabled={!form.title.trim() || createMut.isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl
            transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <PlusCircle size={16} />
          {createMut.isPending ? 'Submitting…' : 'Submit for Approval'}
        </button>
        <button
          onClick={onDone}
          className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300
            rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

// ─── My Events page ───────────────────────────────────────────────────────────
const MyEvents = () => {
  const { token, user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [shareEvent, setShareEvent] = useState<any>(null);
  const qc = useQueryClient();

  const { data: myEvents = [], isLoading } = useQuery<any[]>({
    queryKey: ['my-events', user?.id],
    queryFn: () => authedGet(`${API}/events/me`, token!),
    refetchInterval: 30000,
  });

  // No frontend filtering needed anymore as the API returns only owned events

  const approved = myEvents.filter(e => e.approval_status === 'approved').length;
  const pending = myEvents.filter(e => e.approval_status === 'pending_approval').length;
  const rejected = myEvents.filter(e => e.approval_status === 'rejected').length;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = myEvents.filter((e: any) => !e.date || e.date >= today);
  const pastEvents = myEvents.filter((e: any) => e.date && e.date < today);

  const EventCard = ({ ev, idx }: { ev: any, idx: number }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-indigo-500/50 cursor-pointer transition-all group relative flex flex-col"
      onClick={() => setSelectedEvent(ev)}
    >
      <div className="absolute top-3 right-3 z-10">
        <StatusBadge status={ev.approval_status ?? 'approved'} />
      </div>
      <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center relative overflow-hidden">
        {ev.image ? (
          <img src={ev.image} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <Calendar size={32} className="text-blue-300 dark:text-slate-500" />
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-800 dark:text-white text-base line-clamp-2">{ev.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 flex-1">{ev.description}</p>
        
        {ev.approval_note && ev.approval_status === 'rejected' && (
          <p className="text-xs text-red-500 mt-2 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg inline-block">
            ❌ Rejection note: {ev.approval_note}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
          <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-[10px] font-bold">
            <Clock size={10}/> {ev.date ?? 'Date TBD'}
          </span>
          {ev.venue && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded text-[10px] font-bold">
              <MapPin size={10}/> {ev.venue}
            </span>
          )}
        </div>
        <div className="mt-3 flex justify-end">
            <button 
                onClick={(e) => { e.stopPropagation(); setShareEvent(ev); }}
                className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
            >
                <Send size={14} /> Share
            </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Events</h1>
          <p className="text-slate-500 text-sm mt-1">Events you created — track their approval status.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5
            rounded-xl transition-colors flex items-center gap-2"
        >
          <PlusCircle size={16} />
          New Event
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Approved', value: approved, icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
          { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-600 bg-amber-100' },
          { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-600 bg-red-100' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create form */}
      {showForm && <CreateEventForm onDone={() => setShowForm(false)} />}

      {/* Event list */}
      {isLoading && <p className="text-slate-400 text-sm">Loading events…</p>}

      <div className="space-y-8">
        {myEvents.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center border border-slate-100 dark:border-slate-700">
            <CalendarPlus size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No events yet</p>
            <p className="text-slate-400 text-sm mt-1">Click "New Event" to submit your first event.</p>
          </div>
        )}

        {myEvents.length > 0 && (
          <>
            {/* Upcoming Events */}
            <div>
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Upcoming Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {upcomingEvents.map((ev: any, i: number) => <EventCard key={ev.id} ev={ev} idx={i} />)}
                {upcomingEvents.length === 0 && (
                  <p className="col-span-full text-sm text-slate-400 p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">No upcoming events.</p>
                )}
              </div>
            </div>

            {/* Past Events */}
            <div>
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2 opacity-80">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Past Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                {pastEvents.map((ev: any, i: number) => <EventCard key={ev.id} ev={ev} idx={i} />)}
                {pastEvents.length === 0 && (
                  <p className="col-span-full text-sm text-slate-400 p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">No past events.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)}
          onEditSuccess={() => {
            qc.invalidateQueries({ queryKey: ['my-events', user?.id] });
            setSelectedEvent(null);
          }}
        />
      )}
      <ShareEventModal isOpen={!!shareEvent} onClose={() => setShareEvent(null)} event={shareEvent} />
    </div>

  );
};

// ─── All Events Portal ───────────────────────────────────────────────────────
const AllEventsPortal = () => {
  const { token, user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [shareEvent, setShareEvent] = useState<any>(null);
  
  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: ['subadmin-all-events'],
    queryFn: () => authedGet(`${API}/events?institution_id=${user?.institution_id}`, token!),
    enabled: !!token && !!user?.institution_id,
  });

  const today = new Date().toISOString().slice(0, 10);
  const publishedEvents = events.filter((e: any) => e.status === 'published' || !e.status);
  const upcomingEvents = publishedEvents.filter((e: any) => !e.date || e.date >= today);
  const pastEvents = publishedEvents.filter((e: any) => e.date && e.date < today);

  const EventCard = ({ ev }: { ev: any }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-md hover:border-indigo-500/50 cursor-pointer transition-all group relative flex flex-col"
      onClick={() => setSelectedEvent(ev)}
    >
      <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center relative overflow-hidden">
        {ev.image ? (
          <img src={ev.image} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <Calendar size={32} className="text-blue-300" />
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-800 text-base line-clamp-2">{ev.title}</h3>
        <p className="text-xs text-slate-500 mt-2 line-clamp-2 flex-1">{ev.description}</p>
        
        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold">
            <Clock size={10}/> {ev.date ?? 'Date TBD'}
          </span>
          {ev.venue && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-bold">
              <MapPin size={10}/> {ev.venue}
            </span>
          )}
        </div>
        <div className="mt-3 flex justify-end">
            <button 
                onClick={(e) => { e.stopPropagation(); setShareEvent(ev); }}
                className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
            >
                <Send size={14} /> Share
            </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-slate-800 font-black text-2xl mb-1 flex items-center gap-2">
          Events Feed
        </h2>
        <p className="text-slate-500 font-medium text-sm">Discover all published campus activities.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-64 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <Calendar className="mx-auto mb-4 opacity-50" size={32} />
          No events available right now.
        </div>
      ) : (
        <div className="space-y-10">
          {/* Upcoming Events */}
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Upcoming Events
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {upcomingEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
              {upcomingEvents.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                  No upcoming events.
                </div>
              )}
            </div>
          </div>

          {/* Past Events */}
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2 opacity-80">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Past Events
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
              {pastEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
              {pastEvents.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                  No past events.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Edit Event Modal */}
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)}
          onEditSuccess={() => {
            qc.invalidateQueries({ queryKey: ['subadmin-all-events'] });
            setSelectedEvent(null);
          }}
        />
      )}
      <ShareEventModal isOpen={!!shareEvent} onClose={() => setShareEvent(null)} event={shareEvent} />
    </div>
  );
};

// ─── Layout shell ─────────────────────────────────────────────────────────────
const SubAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="md:ml-64">
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 hover:text-slate-700">
              <Menu size={22} />
            </button>
            <h2 className="font-bold text-slate-700 dark:text-slate-200 text-sm hidden sm:block">Smart Campus · Sub Admin</h2>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 px-3 rounded-full ml-2 border border-slate-200 dark:border-slate-700/50">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <NotificationBell />
        </header>

        <main className="p-6 md:p-10 max-w-5xl">
          <Routes>
            <Route path="feed" element={<SocialFeed />} />
            <Route path="events" element={<AllEventsPortal />} />
            <Route path="messages" element={<Messages />} />
            <Route path="dashboard" element={<MyEvents />} />
            <Route path="attendance" element={<SubAdminAttendance />} />
            <Route path="registrations" element={<SharedRegistrations />} />
            <Route path="certificates" element={<SubAdminCertificates />} />
            <Route path="users" element={<SubAdminUsers />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default SubAdminDashboard;
