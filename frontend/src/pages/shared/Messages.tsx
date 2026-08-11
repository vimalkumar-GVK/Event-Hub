import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../../context/authStore';
import { useChatStore } from '../../context/chatStore';
import {
  Search, MessageSquare, Send, Paperclip, MoreVertical, 
  Smile, CornerUpLeft, Trash2, Check, CheckCheck, FileText, Image as ImageIcon, X, Video, CalendarPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

export default function Messages() {
  const { user, token } = useAuthStore();
  const chatStore = useChatStore();
  const qc = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [showEventSelector, setShowEventSelector] = useState(false);

  // Load events for sharing
  const { data: shareableEvents = [] } = useQuery({
    queryKey: ['share-events'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    enabled: showEventSelector
  });

  // Load conversations
  useEffect(() => {
    if (token && user?.id) {
      axios.get(`${API}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => chatStore.setConversations(res.data))
        .catch(console.error);
        
      chatStore.connect(token, user.id);
    }
    return () => chatStore.disconnect();
  }, [token, user]);

  // Search users
  const { data: searchResults = [] } = useQuery({
    queryKey: ['search-users', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data } = await axios.get(`${API}/chat/users?search=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    enabled: searchQuery.length > 1
  });

  // Start chat mutation
  const startChatMut = useMutation({
    mutationFn: (targetId: string) => axios.post(`${API}/chat/conversations`, { target_user_id: targetId }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data),
    onSuccess: (conv) => {
      // Add to conversations if not exists
      if (!chatStore.conversations.find(c => c.id === conv.id)) {
        chatStore.setConversations([conv, ...chatStore.conversations]);
      }
      chatStore.setActiveConversation(conv);
      setSearchQuery('');
    }
  });

  // Load active conversation messages
  const activeConvId = chatStore.activeConversation?.id;
  useEffect(() => {
    if (activeConvId && token) {
      axios.get(`${API}/chat/conversations/${activeConvId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        chatStore.setMessages(activeConvId, res.data);
      });
    }
  }, [activeConvId, token]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark unread messages as read
    if (activeConvId && user?.id) {
      const msgs = chatStore.messages[activeConvId] || [];
      const unreadIds = msgs.filter(m => m.sender_id !== user.id && !m.read_by.includes(user.id)).map(m => m.id);
      if (unreadIds.length > 0) {
        chatStore.sendReadReceipt(activeConvId, unreadIds);
      }
    }
  }, [chatStore.messages[activeConvId || '']]);

  // Typing debounce
  useEffect(() => {
    if (!activeConvId) return;

    if (msgInput.length > 0) {
      chatStore.sendTyping(activeConvId, true);
      const timeoutId = setTimeout(() => {
        chatStore.sendTyping(activeConvId, false);
      }, 2000);
      return () => clearTimeout(timeoutId);
    } else {
      chatStore.sendTyping(activeConvId, false);
    }
  }, [msgInput, activeConvId]);

  const handleSend = () => {
    if (!msgInput.trim() || !activeConvId) return;
    chatStore.sendMessage(activeConvId, msgInput.trim(), 'text');
    setMsgInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId || !token) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size limit is 50MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/chat/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      let type = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      
      // send message containing URL
      chatStore.sendMessage(activeConvId, res.data.url, type);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const activeMessages = activeConvId ? chatStore.messages[activeConvId] || [] : [];
  const isTyping = activeConvId ? chatStore.typingUsers[activeConvId] : false;

  const [selectedEventToShare, setSelectedEventToShare] = useState<any>(null);
  const [eventShareMessage, setEventShareMessage] = useState('');

  const handleShareEvent = () => {
    if (!activeConvId || !selectedEventToShare) return;
    const eventPayload = JSON.stringify({
        id: selectedEventToShare.id,
        title: selectedEventToShare.title,
        description: selectedEventToShare.description,
        date: selectedEventToShare.date,
        venue: selectedEventToShare.venue || selectedEventToShare.location || '',
        image: selectedEventToShare.image || '',
        message: eventShareMessage.trim(),
    });
    chatStore.sendMessage(activeConvId, eventPayload, 'event');
    setShowEventSelector(false);
    setSelectedEventToShare(null);
    setEventShareMessage('');
  };

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative">
      
      {/* ─── EVENT SELECTOR MODAL ─── */}
      <AnimatePresence>
        {showEventSelector && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><CalendarPlus size={20} className="text-purple-500" /> Share Event</h3>
                <button onClick={() => setShowEventSelector(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
                {selectedEventToShare ? (
                  <div className="space-y-4">
                    <button onClick={() => setSelectedEventToShare(null)} className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center gap-1 mb-2">
                       ← Back to events
                    </button>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                        {selectedEventToShare.image ? (
                            <img src={selectedEventToShare.image} alt={selectedEventToShare.title} className="w-14 h-14 rounded-xl object-cover" />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <CalendarPlus size={20} className="text-purple-500" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{selectedEventToShare.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">📅 {new Date(selectedEventToShare.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                             Add a message (optional)
                        </label>
                        <textarea
                            value={eventShareMessage}
                            onChange={e => setEventShareMessage(e.target.value)}
                            placeholder="Write a personal note..."
                            rows={3}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:text-white resize-none"
                        />
                    </div>
                    <button onClick={handleShareEvent} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2">
                        <Send size={18} /> Send Event
                    </button>
                  </div>
                ) : shareableEvents.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No events available to share.</p>
                ) : (
                  shareableEvents.map((ev: any) => (
                    <div key={ev.id} onClick={() => setSelectedEventToShare(ev)} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all flex flex-col gap-1 group">
                       <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">{ev.title}</h4>
                       <p className="text-xs text-slate-500 line-clamp-1">{ev.description}</p>
                       <div className="flex gap-3 text-xs text-slate-400 mt-1 font-medium">
                         <span>📅 {new Date(ev.date).toLocaleDateString()}</span>
                         <span>📍 {ev.venue}</span>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── LEFT PANE: INBOX (30%) ─── */}
      <div className="w-full md:w-[350px] flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim() ? (
            <div className="p-2 space-y-1">
              <p className="px-3 py-2 text-[10px] font-black tracking-widest uppercase text-slate-400">Search Results</p>
              {searchResults.length === 0 && <p className="px-3 text-sm text-slate-500">No users found.</p>}
              {searchResults.map((su: any) => (
                <button
                  key={su.id}
                  onClick={() => startChatMut.mutate(su.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold uppercase flex-shrink-0">
                    {su.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{su.name}</p>
                    <p className="text-xs text-slate-500 truncate">{su.email}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {chatStore.conversations.length === 0 ? (
                 <div className="text-center py-10 px-4">
                    <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No active chats.</p>
                    <p className="text-xs text-slate-400 mt-1">Search for a user to start messaging.</p>
                 </div>
              ) : (
                chatStore.conversations.map(conv => {
                  const isActive = activeConvId === conv.id;
                  const ou = conv.other_user;
                  const lm = conv.last_message;
                  const unread = lm && lm.sender_id !== user?.id && !lm.read_by.includes(user?.id || '');

                  return (
                    <button
                      key={conv.id}
                      onClick={() => chatStore.setActiveConversation(conv)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group
                        ${isActive ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold uppercase text-lg shadow-sm">
                          {ou?.name?.[0] || '?'}
                        </div>
                        {/* Online Indicator Mock */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-sm truncate ${unread ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-200'}`}>
                            {ou?.name || 'Unknown'}
                          </p>
                          {lm && <span className="text-[10px] text-slate-400 font-medium ml-2 flex-shrink-0">
                            {new Date(lm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>}
                        </div>
                        <p className={`text-xs truncate ${unread ? 'font-bold text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {lm ? (lm.type === 'text' ? lm.content : lm.type === 'event' ? '📅 Event shared' : `[${lm.type.toUpperCase()}]`) : 'Start a conversation'}
                        </p>
                      </div>
                      {unread && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full flex-shrink-0 shadow-sm" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT PANE: ACTIVE CHAT (70%) ─── */}
      {chatStore.activeConversation ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 relative">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-10 flex items-center justify-between sticky top-0">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold uppercase shadow-sm">
                 {chatStore.activeConversation.other_user?.name?.[0]}
               </div>
               <div>
                 <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                   {chatStore.activeConversation.other_user?.name}
                 </h3>
                 <p className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-wider">
                   Active Now
                 </p>
               </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                {chatStore.activeConversation.other_user?.role.replace('_', ' ')}
              </span>
              <button className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                 <MoreVertical size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeMessages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const isUnsent = msg.type === 'unsent';
              
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`} onMouseEnter={() => setHoveredMsg(msg.id)} onMouseLeave={() => setHoveredMsg(null)}>
                  
                  {!isMine && (
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold uppercase text-xs shadow-sm mr-3 flex-shrink-0 mt-auto">
                       {chatStore.activeConversation?.other_user?.name?.[0]}
                     </div>
                  )}

                  <div className={`relative max-w-[70%] group flex ${isMine ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
                    
                    <div className={`p-3.5 rounded-2xl ${isUnsent ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 italic border border-slate-200 dark:border-slate-700' : isMine ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 rounded-br-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'}`}>
                      
                      {msg.type === 'image' ? (
                        <a href={(import.meta.env.VITE_API_URL ?? '') + msg.content} target="_blank" rel="noreferrer">
                           <img src={(import.meta.env.VITE_API_URL ?? '') + msg.content} alt="Attachment" className="max-w-full h-auto rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                        </a>
                      ) : msg.type === 'video' ? (
                        <div className="rounded-xl overflow-hidden max-h-60 max-w-full bg-black">
                           <video src={(import.meta.env.VITE_API_URL ?? '') + msg.content} controls className="max-w-full h-full object-contain" />
                        </div>
                      ) : msg.type === 'event' ? (() => {
                        let evData: any = {};
                        try { evData = JSON.parse(msg.content); } catch { evData = { title: msg.content }; }
                        return (
                          <div className="flex flex-col gap-2 min-w-[200px] max-w-[260px]">
                            <div className="flex items-center gap-1.5 mb-1 opacity-75">
                              <CalendarPlus size={13} />
                              <span className="font-black text-[10px] uppercase tracking-wider">Event Shared</span>
                            </div>
                            {/* Event card */}
                            <div className={`rounded-xl overflow-hidden border ${isMine ? 'border-purple-400/40' : 'border-slate-200 dark:border-slate-600'}`}>
                              {evData.image ? (
                                <img src={evData.image} alt={evData.title} className="w-full h-24 object-cover" />
                              ) : (
                                <div className={`w-full h-16 flex items-center justify-center ${isMine ? 'bg-purple-500/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                  <CalendarPlus size={24} className="opacity-50" />
                                </div>
                              )}
                              <div className={`p-2.5 ${isMine ? 'bg-purple-500/20' : 'bg-white dark:bg-slate-800'}`}>
                                <p className="font-black text-sm leading-tight mb-1">{evData.title}</p>
                                {evData.date && <p className="text-[11px] opacity-70">📅 {new Date(evData.date).toLocaleDateString()}</p>}
                                {evData.venue && <p className="text-[11px] opacity-70 truncate">📍 {evData.venue}</p>}
                              </div>
                            </div>
                            {/* Personal note */}
                            {evData.message && (
                              <p className="text-sm italic opacity-90 mt-0.5">"{evData.message}"</p>
                            )}
                          </div>
                        );
                      })() : msg.type === 'file' ? (
                        <a href={(import.meta.env.VITE_API_URL ?? '') + msg.content} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline font-medium">
                           <FileText size={18} /> Download Attachment
                        </a>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}

                      {/* Msg Footer (Time & Read) */}
                      <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${isMine && !isUnsent ? 'text-purple-200' : 'text-slate-400'}`}>
                        <span className="text-[9px] font-bold tracking-wider">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && !isUnsent && (
                           msg.read_by.length > 1 ? <CheckCheck size={12} className="text-purple-200" /> : <Check size={12} className="opacity-70" />
                        )}
                      </div>
                      
                      {/* Reaction Bubble */}
                      {msg.reaction && (
                        <div className={`absolute -bottom-3 ${isMine ? 'left-2' : 'right-2'} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-1.5 py-0.5 text-xs shadow-sm`}>
                          {msg.reaction}
                        </div>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <AnimatePresence>
                      {hoveredMsg === msg.id && !isUnsent && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                          <button onClick={() => chatStore.sendAction('react', msg.id, '❤️')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"><Smile size={14} /></button>
                          {isMine && <button onClick={() => chatStore.sendAction('unsend', msg.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"><Trash2 size={14} /></button>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
               <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 mr-3 mt-auto flex-shrink-0" />
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 text-slate-500 flex items-center gap-1.5 w-16">
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                     <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
               </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Sticky Input Footer */}
          <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-10 sticky bottom-0">
            <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
              
              <label className={`p-2 rounded-xl text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all ${uploading ? 'opacity-50' : ''}`} title="Send Photo/Video">
                 <ImageIcon size={20} />
                 <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept="image/*,video/*" />
              </label>

              <label className={`p-2 rounded-xl text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all ${uploading ? 'opacity-50' : ''}`} title="Send Document">
                 <Paperclip size={20} />
                 <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept=".pdf,.doc,.docx,.txt,.csv,.xlsx" />
              </label>

              <button onClick={() => setShowEventSelector(true)} className="p-2 rounded-xl text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all" title="Share Event">
                 <CalendarPlus size={20} />
              </button>

              <textarea 
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message..."
                className="flex-1 max-h-32 bg-transparent border-none focus:outline-none focus:ring-0 text-sm dark:text-white resize-none py-2 px-1"
                rows={1}
              />
              
              <button 
                onClick={handleSend}
                disabled={!msgInput.trim()}
                className="p-2.5 rounded-xl bg-purple-600 text-white font-bold disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800 hover:bg-purple-700 transition-all flex-shrink-0 shadow-md shadow-purple-500/20"
              >
                <Send size={18} className="translate-x-px" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-950/30">
           <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/10 border border-purple-200 dark:border-purple-500/20">
             <MessageSquare size={40} className="text-purple-600 dark:text-purple-400" />
           </div>
           <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Your Messages</h2>
           <p className="text-slate-500 font-medium max-w-sm text-center">Send private photos, files, and messages to anyone across the platform instantly.</p>
        </div>
      )}
    </div>
  );
}
