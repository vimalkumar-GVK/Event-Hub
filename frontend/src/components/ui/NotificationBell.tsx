import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Bell, X } from 'lucide-react';
import { useAuthStore } from '../../context/authStore';
import { EventDetailsModal } from '../events/EventDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';
const WS_URL = (import.meta.env.VITE_API_URL ?? '').replace('http', 'ws') + '/ws';

const authedGet = (url: string, token: string) =>
  axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

const authedPut = (url: string, token: string) =>
  axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

export const NotificationBell = () => {
  const { user, token } = useAuthStore();
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!user?.id || !token) return;
    const ws = new WebSocket(`${WS_URL}/${user.id}?token=${token}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.text) {
          // Invalidate to fetch new notifications
          qc.invalidateQueries({ queryKey: ['notifications'] });
        }
      } catch (e) {
        console.error(e);
      }
    };

    return () => {
      ws.close();
    };
  }, [user?.id, token, qc]);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => authedGet(`${API}/notifications`, token!),
    enabled: !!token,
    refetchInterval: 30000,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => authedPut(`${API}/notifications/${id}/read`, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      markReadMut.mutate(notif.id);
    }
    setIsOpen(false);
    
    if (notif.event_id) {
      try {
        const eventData = await authedGet(`${API}/events/${notif.event_id}`, token!);
        setSelectedEvent(eventData);
      } catch (e) {
        console.error("Failed to fetch event", e);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 border-b border-slate-50 dark:border-slate-700/50 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 flex gap-3 ${!notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="mt-1">
                      {!notif.is_read ? (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm ${!notif.is_read ? 'text-slate-800 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                        {notif.text}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)}
          onEditSuccess={() => {
            qc.invalidateQueries({ queryKey: ['notifications'] });
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};
