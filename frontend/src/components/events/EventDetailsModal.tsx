import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XCircle, Edit, Calendar, Clock, MapPin, Users, Award, Info, Save, Trash2, X as CloseIcon, PlusCircle, Plus, ClipboardList, QrCode } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../../context/authStore';
import toast from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

interface EventDetailsModalProps {
  event: any;
  onClose: () => void;
  onEditSuccess: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, onEditSuccess }) => {
  const { token, user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // Calculate if within 2-hour window
  const createdAt = event.created_at ? new Date(event.created_at) : new Date();
  const diffHours = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  const canEdit = diffHours <= 2 && (user?.role === 'admin' || user?.role === 'super_admin' || (user?.role === 'sub_admin' && event.created_by === user.id));

  const [form, setForm] = useState({
    title: event.title || '',
    description: event.description || '',
    date: event.date || '',
    time: event.time || '',
    venue: event.venue || '',
    capacity: event.capacity || '',
    type: event.type || '',
    image: event.image || '',
    sub_events: event.sub_events || [],
    rules: event.rules || '',
    payment_qr: event.payment_qr || '',
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => axios.put(`${API}/events/${event.id}`, data, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    onSuccess: (res: any) => {
      if (res.approval_status === 'pending_approval') {
        toast.success('Edit submitted for approval! Admin will review it.');
      } else {
        toast.success('Event updated successfully!');
      }
      onEditSuccess();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Failed to update event'),
  });

  const deleteMut = useMutation({
    mutationFn: () => axios.delete(`${API}/events/${event.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    onSuccess: () => {
      toast.success('Event deleted successfully!');
      onEditSuccess();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Failed to delete event'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="relative h-48 sm:h-64 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          {event.image ? (
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Calendar size={64} className="text-indigo-400 opacity-50" />
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-md transition-colors"
          >
            <CloseIcon size={20} />
          </button>
          
          {!isEditing && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl inline-block shadow-lg">
                <span className={`text-xs font-black uppercase tracking-wider ${event.approval_status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {event.approval_status === 'approved' ? 'Published' : 'Pending Approval'}
                </span>
              </div>
              
              {canEdit && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all"
                >
                  <Edit size={16} /> Edit Event
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black text-slate-800 dark:text-white">Edit Event</h2>
                <div className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-lg text-xs font-bold">
                  {Math.floor(2 - diffHours)}h {Math.floor((2 - diffHours) * 60 % 60)}m left to edit
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Title *</label>
                  <input required type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 cursor-pointer"
                  />
                  {form.rules && typeof form.rules === 'string' && form.rules.startsWith('data:image/') && (
                    <div className="mt-2 h-20 w-auto inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={form.rules} alt="Rules Preview" className="h-full w-auto object-cover" />
                    </div>
                  )}
                  {form.rules && typeof form.rules === 'string' && form.rules.startsWith('data:application/pdf') && (
                    <div className="mt-2 text-sm text-indigo-500 font-bold">PDF selected ✓</div>
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
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 cursor-pointer"
                  />
                  {form.payment_qr && <div className="mt-2 h-32 w-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"><img src={form.payment_qr} alt="Payment Scanner Preview" className="w-full h-full object-cover" /></div>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Venue</label>
                  <input type="text" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Capacity</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
                  <textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
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
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 cursor-pointer"
                  />
                  {form.image && <div className="mt-2 h-32 w-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"><img src={form.image} alt="Preview" className="w-full h-full object-cover" /></div>}
                </div>

                <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-800 mt-4 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Sub-Events</label>
                    <button type="button" onClick={() => setForm(p => ({ ...p, sub_events: [...(p.sub_events || []), { name: '', start_time: '', end_time: '', venue: '', capacity: 50, image: '', team_size: 1 }] }))} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <PlusCircle size={14} /> Add Sub-Event
                    </button>
                  </div>
                  {(form.sub_events || []).map((sub: any, i: number) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-3 relative">
                      <button type="button" onClick={() => setForm(p => ({ ...p, sub_events: p.sub_events.filter((_: any, idx: number) => idx !== i) }))} className="absolute top-3 right-3 text-red-500 hover:text-red-700">
                        <XCircle size={16} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Sub-Event Name *</label>
                          <input type="text" value={sub.name} onChange={e => { const newSub = [...form.sub_events]; newSub[i].name = e.target.value; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white" placeholder="e.g. Code Relay"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Venue</label>
                          <input type="text" value={sub.venue} onChange={e => { const newSub = [...form.sub_events]; newSub[i].venue = e.target.value; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white" placeholder="Location"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Start Time</label>
                          <input type="time" value={sub.start_time} onChange={e => { const newSub = [...form.sub_events]; newSub[i].start_time = e.target.value; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">End Time</label>
                          <input type="time" value={sub.end_time} onChange={e => { const newSub = [...form.sub_events]; newSub[i].end_time = e.target.value; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Capacity</label>
                          <input type="number" value={sub.capacity} onChange={e => { const newSub = [...form.sub_events]; newSub[i].capacity = parseInt(e.target.value) || 0; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white" placeholder="50"/>
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
                              <input type="number" value={sub.amount} onChange={e => { const newSub = [...form.sub_events]; newSub[i].amount = parseInt(e.target.value) || 0; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white" placeholder="Amount" />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-500 mb-1 block">Fee Type</label>
                              <select value={sub.fee_type} onChange={e => { const newSub = [...form.sub_events]; newSub[i].fee_type = e.target.value; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white">
                                <option value="per_person">Per Person</option>
                                <option value="per_team">Per Team</option>
                              </select>
                            </div>
                          </>
                        )}
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Team Size</label>
                          <input type="number" value={sub.team_size} onChange={e => { const newSub = [...form.sub_events]; newSub[i].team_size = parseInt(e.target.value) || 1; setForm(p => ({ ...p, sub_events: newSub })); }} className="w-full p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white" placeholder="1"/>
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
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 cursor-pointer"
                          />
                          {sub.image && <div className="mt-2 h-24 w-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"><img src={sub.image} alt="Preview" className="w-full h-full object-cover" /></div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" disabled={updateMut.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  <Save size={18} /> {updateMut.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" disabled={deleteMut.isPending || (event?.created_at && (new Date().getTime() - new Date(event.created_at).getTime()) / 3600000 > 2)} onClick={() => { if(window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) deleteMut.mutate(); }} className="px-6 py-3 font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Trash2 size={18} /> {deleteMut.isPending ? 'Deleting...' : 'Delete Event (within 2h)'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{event.title}</h1>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8">{event.description || 'No description provided.'}</p>
              
              {event.rules && (
                <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <ClipboardList size={18} className="text-indigo-500" /> Rules & Instructions
                  </h3>
                  {typeof event.rules === 'string' && event.rules.startsWith('data:image/') ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={event.rules} alt="Rules and Instructions" className="w-full h-auto object-cover" />
                    </div>
                  ) : typeof event.rules === 'string' && event.rules.startsWith('data:application/pdf') ? (
                    <a href={event.rules} download="Rules_and_Instructions.pdf" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                      Download PDF Rules
                    </a>
                  ) : (
                    <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {event.rules}
                    </div>
                  )}
                </div>
              )}

              {event.payment_qr && (
                <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <QrCode size={18} className="text-indigo-500" /> Payment Scanner
                  </h3>
                  <div className="w-48 h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={event.payment_qr} alt="Payment Scanner" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Calendar size={20} className="text-indigo-500 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{event.date || 'TBD'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Clock size={20} className="text-blue-500 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Time</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{event.time || 'TBD'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <MapPin size={20} className="text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Venue</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{event.venue || 'TBD'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Users size={20} className="text-amber-500 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Capacity</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{event.capacity ? `${event.capacity} seats` : 'Unlimited'}</p>
                </div>
              </div>
              
              {event.sub_events && event.sub_events.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Award size={18} className="text-indigo-500" /> Activities / Sub-events
                  </h3>
                  <div className="space-y-3">
                    {event.sub_events.map((sub: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 gap-4">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">{sub.name}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-medium">
                            {sub.start_time && <span><Clock size={12} className="inline mr-1" />{sub.start_time} - {sub.end_time}</span>}
                            {sub.venue && <span><MapPin size={12} className="inline mr-1" />{sub.venue}</span>}
                            {sub.capacity && <span><Users size={12} className="inline mr-1" />{sub.capacity} max</span>}
                            {sub.team_size && <span>Team Size: {sub.team_size}</span>}
                            <span className={`px-2 py-0.5 rounded-full ${sub.is_paid ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {sub.is_paid ? `₹${sub.amount} (${sub.fee_type === 'per_team' ? 'Per Team' : 'Per Person'})` : 'Free'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
