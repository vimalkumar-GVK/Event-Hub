import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Send, Check, CalendarPlus, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import { useChatStore } from '../../context/chatStore';
import toast from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

export function ShareEventModal({ isOpen, onClose, event }: { isOpen: boolean, onClose: () => void, event: any }) {
    const { token } = useAuthStore();
    const chatStore = useChatStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [personalMessage, setPersonalMessage] = useState('');
    const [sentUsers, setSentUsers] = useState<Set<string>>(new Set());

    const { data: searchResults = [] } = useQuery({
        queryKey: ['share-search-users', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];
            const { data } = await axios.get(`${API}/chat/users?search=${encodeURIComponent(searchQuery)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data;
        },
        enabled: searchQuery.length > 1
    });

    const shareMut = useMutation({
        mutationFn: async (targetUserId: string) => {
            // 1. Get or create conversation
            const { data: conv } = await axios.post(`${API}/chat/conversations`, { target_user_id: targetUserId }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Build the event payload as a JSON string so the chat renders a rich card
            const eventPayload = JSON.stringify({
                id: event.id,
                title: event.title,
                description: event.description,
                date: event.date,
                venue: event.venue || event.location || '',
                image: event.image || '',
                message: personalMessage.trim(),
            });

            // 3. Try WebSocket first; fall back to HTTP REST if WS not connected
            const ws = chatStore.ws;
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'message',
                    conversation_id: conv.id,
                    content: eventPayload,
                    msg_type: 'event',
                }));
            } else {
                // Fallback: persist via REST endpoint
                await axios.post(
                    `${API}/chat/conversations/${conv.id}/messages`,
                    { content: eventPayload, type: 'event' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            return conv;
        },
        onSuccess: (conv, targetUserId) => {
            if (!chatStore.conversations.find(c => c.id === conv.id)) {
                chatStore.setConversations([conv, ...chatStore.conversations]);
            }
            setSentUsers(prev => new Set(prev).add(targetUserId));
            toast.success("Event shared successfully!");
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to share event'),
    });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
                                <CalendarPlus size={18} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none mb-0.5">Share Event</h2>
                                <p className="text-xs text-slate-500 font-medium truncate max-w-[220px]">{event?.title}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-white dark:bg-slate-800 rounded-full transition-colors shadow-sm">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Event Preview Card */}
                    <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3 flex-shrink-0">
                        {event?.image ? (
                            <img src={event.image} alt={event.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                <CalendarPlus size={20} className="text-purple-500" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{event?.title}</p>
                            {event?.date && (
                                <p className="text-xs text-slate-500 mt-0.5">📅 {new Date(event.date).toLocaleDateString()}</p>
                            )}
                            {(event?.venue || event?.location) && (
                                <p className="text-xs text-slate-500 truncate">📍 {event?.venue || event?.location}</p>
                            )}
                        </div>
                    </div>

                    <div className="p-5 flex-1 overflow-y-auto space-y-4">
                        {/* Personal message input */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <MessageSquare size={12} /> Add a message (optional)
                            </label>
                            <textarea
                                value={personalMessage}
                                onChange={e => setPersonalMessage(e.target.value)}
                                placeholder="Write a personal note to go with this event..."
                                rows={2}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:text-white resize-none"
                            />
                        </div>

                        {/* User search */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Send to</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Search results */}
                        <div className="space-y-2">
                            {searchQuery.length <= 1 && (
                                <p className="text-center text-slate-400 text-xs py-2">Type at least 2 characters to search for users</p>
                            )}
                            {searchResults.length === 0 && searchQuery.length > 1 && (
                                <p className="text-center text-slate-500 text-sm py-4">No users found.</p>
                            )}

                            {searchResults.map((su: any) => {
                                const isSent = sentUsers.has(su.id);
                                return (
                                    <div key={su.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold uppercase text-sm flex-shrink-0">
                                                {su.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{su.name}</p>
                                                <p className="text-xs text-slate-500">{su.email}</p>
                                                {su.role && (
                                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded mt-0.5">
                                                        {su.role.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => !isSent && !shareMut.isPending && shareMut.mutate(su.id)}
                                            disabled={isSent || shareMut.isPending}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                isSent
                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default'
                                                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-500/20 disabled:opacity-50'
                                            }`}
                                        >
                                            {isSent ? <><Check size={14} /> Sent</> : <><Send size={14} /> Send</>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

