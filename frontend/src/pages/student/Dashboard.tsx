import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import {
  LayoutDashboard, Calendar, ClipboardList, User, Settings,
  HelpCircle, LogOut, Menu, X, Bell, Star, ChevronRight,
  GraduationCap, Clock, Home, MapPin, Award, MessageSquare, Send, QrCode
} from 'lucide-react';
import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SocialFeed } from '../../components/ui/SocialFeed';
import MyCertificates from './MyCertificates';
import Messages from '../shared/Messages';

import SettingsPage from '../shared/Settings';
import ProfilePage from '../shared/Profile';
import { NotificationBell } from '../../components/ui/NotificationBell';
import { ShareEventModal } from '../../components/events/ShareEventModal';
import { EventRegistrationModal } from '../../components/events/EventRegistrationModal';
import QRScannerModal from '../../components/ui/QRScannerModal';
import { RegisteredEventDetailsModal } from '../../components/events/RegisteredEventDetailsModal';
import toast from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

const authedGet = (url: string, token: string) =>
  axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

// ─── Navigation Items ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Home Feed', icon: Home, path: '/student/feed' },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/student/overview' },
  { label: 'Events', icon: Calendar, path: '/student/events' },
  { label: 'Messages', icon: MessageSquare, path: '/student/messages' },
  { label: 'My Registrations', icon: ClipboardList, path: '/student/registrations' },
  { label: 'My Certificates', icon: Award, path: '/student/certificates' },
  { label: 'My Profile', icon: User, path: '/student/profile' },
  { label: 'Settings', icon: Settings, path: '/student/settings' },
  { label: 'Help & Support', icon: HelpCircle, path: '/student/help' },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-56 z-40 flex flex-col
        bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800
        shadow-2xl border-r border-white/5
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Portal</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                ${isActive
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
                }`
              }
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 border-t border-white/10 pt-3">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={17} className="shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

// ─── Top Header ───────────────────────────────────────────────────────────────
const TopBar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  return (
    <header className="h-14 bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 flex items-center justify-between px-6 shadow-lg shadow-purple-500/20">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-white/80 hover:text-white transition-colors"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <h1 className="text-white font-bold text-base tracking-tight hidden sm:block">
          College Event Management
        </h1>
        <div className="flex items-center gap-2 bg-white/10 p-1.5 px-3 rounded-full ml-2">
             <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400'}`} />
             <span className="text-[10px] font-bold uppercase text-white/90 tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <span className="text-white/90 text-sm font-medium">
          Welcome, {user?.name}
        </span>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </header>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  value, label, icon: Icon, iconColor, borderColor
}: {
  value: string | number;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  borderColor: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${borderColor} flex items-center gap-4`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 ${iconColor}`}>
      <Icon size={20} />
    </div>
    <div>
      <div className="text-2xl font-black text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 font-medium mt-0.5">{label}</div>
    </div>
  </motion.div>
);

// ─── Overview Page ────────────────────────────────────────────────────────────
const Overview = () => {
  const { user, token } = useAuthStore();

  const { data: events = [], isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ['student-events'],
    queryFn: () => authedGet(`${API}/events`, token!),
    enabled: !!token,
  });

  const { data: myRegs = [], isLoading: regsLoading } = useQuery<any[]>({
    queryKey: ['student-my-regs', user?.id],
    queryFn: () => authedGet(`${API}/registrations/user/${user?.id}`, token!),
    enabled: !!token && !!user?.id,
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((e: any) => e.date === today);
  const upcomingEvents = events.slice(0, 5);

  const { data: sysNotifications = [] } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => authedGet(`${API}/notifications`, token!),
    enabled: !!token,
  });

  const unreadAlerts = sysNotifications.filter(n => !n.is_read).length;

  // Calendar: current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          value={eventsLoading ? '...' : events.length}
          label="Upcoming Events"
          icon={Calendar}
          iconColor="text-blue-500"
          borderColor="border-blue-400"
        />
        <StatCard
          value={regsLoading ? '...' : myRegs.length}
          label="My Registrations"
          icon={ClipboardList}
          iconColor="text-purple-500"
          borderColor="border-purple-400"
        />
        <StatCard
          value={eventsLoading ? '...' : todayEvents.length}
          label="Today's Events"
          icon={Star}
          iconColor="text-amber-500"
          borderColor="border-amber-400"
        />
        <StatCard
          value={unreadAlerts}
          label="Unread Alerts"
          icon={Bell}
          iconColor="text-red-500"
          borderColor="border-red-400"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Calendar size={16} className="text-blue-500" />
              <h2 className="text-slate-800 font-bold text-base">Upcoming Events</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {eventsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 animate-pulse flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-200 rounded" />
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                    </div>
                    <div className="h-7 w-14 bg-slate-100 rounded-full" />
                  </div>
                ))
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((ev: any) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-purple-600 font-semibold text-sm">{ev.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{ev.date ?? 'Date TBD'}</p>
                    </div>
                    <NavLink to="/student/events">
                      <button className="text-xs font-semibold bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-full transition-colors">
                        View
                      </button>
                    </NavLink>
                  </motion.div>
                ))
              ) : (
                <div className="px-5 py-10 text-center text-slate-400 text-sm">
                  No upcoming events found.
                </div>
              )}
            </div>
          </div>

          {/* My Registrations */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <ClipboardList size={16} className="text-purple-500" />
              <h2 className="text-slate-800 font-bold text-base">My Registrations</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {regsLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 animate-pulse flex items-center justify-between">
                    <div className="h-4 w-36 bg-slate-200 rounded" />
                    <div className="h-6 w-20 bg-slate-100 rounded" />
                  </div>
                ))
              ) : myRegs.length > 0 ? (
                myRegs.slice(0, 5).map((reg: any) => (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-purple-600 font-semibold text-sm">
                        {reg.event?.title || reg.event_title || reg.event_id}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded border ${
                      reg.status === 'approved'
                        ? 'text-green-600 bg-green-50 border-green-200'
                        : reg.status === 'rejected'
                        ? 'text-red-600 bg-red-50 border-red-200'
                        : 'text-amber-600 bg-amber-50 border-amber-200'
                    }`}>
                      {(reg.status ?? 'PENDING').toUpperCase()}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="px-5 py-10 text-center text-slate-400 text-sm">
                  You haven't registered for any events yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Calendar size={16} className="text-blue-500" />
              <h2 className="text-slate-800 font-bold text-base">Calendar</h2>
            </div>
            <div className="p-4">
              <div className="text-center mb-3">
                <p className="text-slate-700 font-bold text-sm">{monthName} {year}</p>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="py-1 text-slate-400 font-semibold">{d}</div>
                ))}
                {calDays.map((d, i) => (
                  <div
                    key={i}
                    className={`py-1.5 rounded text-xs font-medium ${
                      d === now.getDate()
                        ? 'bg-purple-600 text-white rounded-full'
                        : d
                        ? 'text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors'
                        : ''
                    }`}
                  >
                    {d ?? ''}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Events Page ──────────────────────────────────────────────────────────────
const EventsPage = () => {
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: ['student-events'],
    queryFn: () => authedGet(`${API}/events`, token!),
    enabled: !!token,
  });

  const [shareEvent, setShareEvent] = useState<any>(null);
  const [registrationEvent, setRegistrationEvent] = useState<any>(null);

  const { data: myRegs = [] } = useQuery<any[]>({
    queryKey: ['student-my-regs', user?.id],
    queryFn: () => authedGet(`${API}/registrations/user/${user?.id}`, token!),
    enabled: !!token && !!user?.id,
  });

  const registeredEventIds = new Set(myRegs.map((r: any) => r.event_id));

  const today = new Date().toISOString().slice(0, 10);
  const publishedEvents = events.filter((e: any) => e.status === 'published' || !e.status);
  const upcomingEvents = publishedEvents.filter((e: any) => !e.date || e.date >= today);
  const pastEvents = publishedEvents.filter((e: any) => e.date && e.date < today);

  const EventCard = ({ ev }: { ev: any }) => {
    const isRegistered = registeredEventIds.has(ev.id);
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-md transition-shadow group relative flex flex-col"
      >
        <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative overflow-hidden">
          {ev.image ? (
            <img src={ev.image} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <Calendar size={32} className="text-purple-300" />
          )}
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-slate-800 text-base line-clamp-2">{ev.title}</h3>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 flex-1">{ev.description}</p>
          
          <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded text-[10px] font-bold">
              <Clock size={10}/> {ev.date ?? 'Date TBD'}
            </span>
            {ev.venue && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold">
                <MapPin size={10}/> {ev.venue}
              </span>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
            {isRegistered ? (
              <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg w-full text-center">
                ✓ Registered
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setRegistrationEvent(ev); }}
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors w-full"
              >
                Register Now
              </button>
            )}
            <button 
                onClick={(e) => { e.stopPropagation(); setShareEvent(ev); }}
                className="w-full text-xs font-bold bg-slate-100 hover:bg-purple-50 text-slate-500 hover:text-purple-600 px-4 py-2 rounded-lg transition-colors flex justify-center items-center gap-1.5 uppercase tracking-wider"
            >
                <Send size={14} /> Share via Chat
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 space-y-10">
      <div>
        <h2 className="text-slate-800 font-black text-2xl mb-1 flex items-center gap-2">
          Events Portal
        </h2>
        <p className="text-slate-500 font-medium text-sm">Discover and register for campus activities.</p>
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
      
      <ShareEventModal isOpen={!!shareEvent} onClose={() => setShareEvent(null)} event={shareEvent} />

      {registrationEvent && (
        <EventRegistrationModal
          event={registrationEvent}
          onClose={() => setRegistrationEvent(null)}
          onSuccess={() => {
            setRegistrationEvent(null);
            queryClient.invalidateQueries({ queryKey: ['student-my-regs', user?.id] });
          }}
        />
      )}
    </div>
  );
};

// ─── Registrations Page ───────────────────────────────────────────────────────
const RegistrationsPage = () => {
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (!showQRScanner) {
      isScanningRef.current = false;
    }
  }, [showQRScanner]);

  const { data: myRegs = [], isLoading } = useQuery<any[]>({
    queryKey: ['student-my-regs', user?.id],
    queryFn: () => authedGet(`${API}/registrations/user/${user?.id}`, token!),
    enabled: !!token && !!user?.id,
  });

  const { data: myCertificates = [] } = useQuery<any[]>({
    queryKey: ['student-my-certificates', user?.id],
    queryFn: () => authedGet(`${API}/certificates/me`, token!),
    enabled: !!token && !!user?.id,
  });

  const createNotificationMutation = useMutation({
    mutationFn: async ({ text, event_id, type }: { text: string, event_id?: string, type?: string }) => {
      await axios.post(
        `${API}/notifications/create`,
        { text, event_id, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      // Invalidate notifications so bell updates immediately
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await axios.post(
        `${API}/registrations/mark-attendance`,
        { event_id: eventId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { data: res.data, eventId };
    },
    onSuccess: ({ data, eventId }) => {
      createNotificationMutation.mutate({
        text: data.message || 'Attendance marked successfully!',
        event_id: eventId,
        type: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['student-my-regs', user?.id] });
      setShowQRScanner(false);
    },
    onError: (error: any, eventId) => {
      createNotificationMutation.mutate({
        text: error.response?.data?.detail || 'Failed to mark attendance.',
        event_id: eventId,
        type: 'error'
      });
      setShowQRScanner(false);
    }
  });

  const handleScanSuccess = (decodedText: string) => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    // The sub-admin QR might be something like: http://localhost:5173/student/checkin/64a...
    // Or just a raw ID. Let's try to parse out the event ID.
    let eventId = decodedText;
    if (decodedText.includes('/checkin/')) {
        eventId = decodedText.split('/checkin/')[1];
    }
    // Clean up any trailing slashes or queries
    eventId = eventId.split('?')[0].split('/')[0].trim();
    
    if (eventId) {
        markAttendanceMutation.mutate(eventId);
    } else {
        createNotificationMutation.mutate({
            text: "Invalid QR Code format.",
            type: "error"
        });
        setShowQRScanner(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
            <h2 className="text-slate-900 dark:text-white font-black text-2xl tracking-tight flex items-center gap-2">
                <ClipboardList className="text-purple-600" /> My Registrations
            </h2>
            <p className="text-slate-500 mt-1">Track your event approvals and scan to mark attendance.</p>
        </div>
        <button 
          onClick={() => setShowQRScanner(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <QrCode size={20} />
          Scan QR for Attendance
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : myRegs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-6">
                <Calendar size={32} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Registrations Yet</h3>
            <p className="text-slate-500 max-w-sm">You haven't registered for any events yet. Check out the Events page to find exciting opportunities!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {myRegs.map((reg: any) => {
             const event = reg.event || {};
             const subEvent = reg.sub_event;
             const isApproved = reg.status === 'approved';
             const isPresent = reg.attendance === 'present' || reg.attendance === true;
             const certificate = myCertificates.find(c => c.event_id === reg.event_id);
             
             return (
              <motion.div 
                key={reg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedRegistration(reg)}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow"
              >
                 {event.image && (
                     <div className="h-32 w-full relative">
                         <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     </div>
                 )}
                 <div className="p-6 flex-1 flex flex-col">
                     <div className="flex justify-between items-start mb-3 gap-2">
                         <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                                {event.title || reg.event_title || reg.event_id}
                            </h3>
                            {subEvent && (
                                <p className="text-sm font-semibold text-purple-600 mt-1 flex items-center gap-1.5">
                                    <Award size={14} /> {subEvent.title}
                                </p>
                            )}
                         </div>
                         <div className={`px-2.5 py-1 text-xs font-bold rounded-lg whitespace-nowrap uppercase tracking-wider ${
                             isApproved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                             : reg.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                             : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                         }`}>
                             {reg.status || 'Pending'}
                         </div>
                     </div>
                     
                     <div className="space-y-2 mb-6 text-sm text-slate-500 dark:text-slate-400">
                         {event.date && (
                             <div className="flex items-center gap-2">
                                 <Calendar size={15} /> <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                             </div>
                         )}
                         {event.venue && (
                             <div className="flex items-center gap-2">
                                 <MapPin size={15} /> <span className="truncate">{event.venue}</span>
                             </div>
                         )}
                     </div>

                     <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                        {isApproved ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Attendance</span>
                                    {isPresent ? (
                                        <div className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Present
                                        </div>
                                    ) : (
                                        <div className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                                            Absent
                                        </div>
                                    )}
                                </div>
                                {certificate && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <a 
                                            href={certificate.pdf_url} 
                                            download={`Certificate_${event.title || 'Event'}.pdf`}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Award size={18} /> Download Certificate
                                        </a>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-center text-slate-400 font-medium italic">
                                Waiting for approval
                            </div>
                        )}
                     </div>
                 </div>
              </motion.div>
             );
          })}
        </div>
      )}

      <QRScannerModal 
        isOpen={showQRScanner} 
        onClose={() => setShowQRScanner(false)} 
        onScanSuccess={handleScanSuccess} 
      />

      <RegisteredEventDetailsModal
        registration={selectedRegistration}
        certificate={selectedRegistration ? myCertificates.find(c => c.event_id === selectedRegistration.event_id) : undefined}
        isOpen={!!selectedRegistration}
        onClose={() => setSelectedRegistration(null)}
      />
    </div>
  );
};

// Old ProfilePage removed

// ─── Simple Placeholder ───────────────────────────────────────────────────────
const Placeholder = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
  <div className="p-6">
    <div className="bg-white rounded-xl shadow-sm p-16 text-center">
      <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon size={24} className="text-purple-400" />
      </div>
      <h2 className="text-slate-700 font-bold text-lg">{title}</h2>
      <p className="text-slate-400 text-sm mt-1">Coming soon.</p>
    </div>
  </div>
);

// ─── Shell Layout ─────────────────────────────────────────────────────────────
const StudentPortal = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:ml-56 min-w-0">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="feed" element={<SocialFeed />} />
            <Route path="overview" element={<Overview />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="messages" element={<Messages />} />
            <Route path="registrations" element={<RegistrationsPage />} />
            <Route path="certificates" element={<MyCertificates />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<Placeholder title="Help & Support" icon={HelpCircle} />} />
            <Route path="*" element={<Navigate to="/student/overview" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default StudentPortal;
