import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Send, Check, CalendarPlus, MessageSquare, ShieldAlert, Users, Building, GraduationCap } from 'lucide-react';
import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import { useChatStore } from '../../context/chatStore';
import toast from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

export function ShareEventModal({ isOpen, onClose, event }: { isOpen: boolean, onClose: () => void, event: any }) {
    const { token, user } = useAuthStore();
    const chatStore = useChatStore();
    
    // DM State
    const [searchQuery, setSearchQuery] = useState('');
    const [personalMessage, setPersonalMessage] = useState('');
    const [sentUsers, setSentUsers] = useState<Set<string>>(new Set());

    // Global Share State
    const [shareWithRoles, setShareWithRoles] = useState<string[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [institutionIds, setInstitutionIds] = useState<string[]>([]);
    const [requireApproval, setRequireApproval] = useState(false);
    const [activeTab, setActiveTab] = useState<'dm' | 'global'>('global');

    const canGlobalShare = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'sub_admin';

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

    const dmShareMut = useMutation({
        mutationFn: async (targetUserId: string) => {
            const { data: conv } = await axios.post(`${API}/chat/conversations`, { target_user_id: targetUserId }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const eventPayload = JSON.stringify({
                id: event.id,
                title: event.title,
                description: event.description,
                date: event.date,
                venue: event.venue || event.location || '',
                image: event.image || '',
                message: personalMessage.trim(),
            });

            const ws = chatStore.ws;
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'message',
                    conversation_id: conv.id,
                    content: eventPayload,
                    msg_type: 'event',
                }));
            } else {
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
            toast.success("Event shared via message!");
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to share event'),
    });

    const globalShareMut = useMutation({
        mutationFn: async () => {
            const payload = {
                shareWithRoles,
                departments,
                institutionIds,
                requireApproval
            };
            const { data } = await axios.post(`${API}/events/${event.id}/share`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Event shared successfully!");
            onClose();
        },
        onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to share event globally'),
    });

    if (!isOpen) return null;

    const toggleRole = (role: string) => setShareWithRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);

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

                    {canGlobalShare && (
                        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-2">
                            <button
                                onClick={() => setActiveTab('global')}
                                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'global' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Publish & Share
                            </button>
                            <button
                                onClick={() => setActiveTab('dm')}
                                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'dm' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Direct Message
                            </button>
                        </div>
                    )}

                    <div className="p-5 flex-1 overflow-y-auto space-y-4">
                        {(activeTab === 'global' && canGlobalShare) ? (
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Share With Roles</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => toggleRole('student')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors ${shareWithRoles.includes('student') ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'}`}>
                                            <GraduationCap size={14} /> All Students
                                        </button>
                                        <button onClick={() => toggleRole('faculty')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors ${shareWithRoles.includes('faculty') ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'}`}>
                                            <Users size={14} /> All Faculty
                                        </button>
                                        <button onClick={() => toggleRole('admin')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors ${shareWithRoles.includes('admin') ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'}`}>
                                            <ShieldAlert size={14} /> Admins
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Target Departments</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Computer Science, Engineering (comma separated)"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                                        onChange={e => setDepartments(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Target Institutions</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. inst_id_1 (comma separated)"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                                        onChange={e => setInstitutionIds(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    />
                                </div>

                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={requireApproval} onChange={() => setRequireApproval(!requireApproval)} />
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${requireApproval ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${requireApproval ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Require Super Admin Approval</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mt-1 pl-13">If enabled, the event will not be visible to targets until a Super Admin approves it.</p>
                                </div>

                                <button
                                    onClick={() => globalShareMut.mutate()}
                                    disabled={globalShareMut.isPending}
                                    className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all mt-4 flex items-center justify-center gap-2"
                                >
                                    {globalShareMut.isPending ? 'Publishing...' : 'Publish / Update Event'}
                                </button>
                            </div>
                        ) : (
                            <>
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Send to User</label>
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
                                                    onClick={() => !isSent && !dmShareMut.isPending && dmShareMut.mutate(su.id)}
                                                    disabled={isSent || dmShareMut.isPending}
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
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

