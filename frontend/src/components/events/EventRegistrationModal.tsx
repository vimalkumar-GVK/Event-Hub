import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, CheckCircle, Image as ImageIcon, CreditCard, Upload, Clock, Building, AlertTriangle, Download, FileText, QrCode, Eye, User } from 'lucide-react';
import { useAuthStore } from '../../context/authStore';
import toast from 'react-hot-toast';
import client from '../../services/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

const authedGet = (url: string, token: string) =>
  axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

interface EventRegistrationModalProps {
  event: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({ event, onClose, onSuccess }) => {
  const { user, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  // Array of selected sub-event IDs
  const [selectedSubEvents, setSelectedSubEvents] = useState<string[]>([]);
  const [upiId, setUpiId] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMultiTrack = event.sub_events && event.sub_events.length > 0;

  const needsPayment = React.useMemo(() => {
    if (isMultiTrack) {
      if (selectedSubEvents.length === 0) return false;
      // Check if any selected sub-event requires payment (fee > 0)
      return selectedSubEvents.some(subId => {
        const sub = event.sub_events.find((s: any) => String(s.id) === subId);
        return sub && Number(sub.fee || 0) > 0;
      });
    }
    // Fallback to main event if no sub-events
    return Number(event.fee || 0) > 0 || event.type === 'paid';
  }, [event, isMultiTrack, selectedSubEvents]);

  const { data: myRegs = [] } = useQuery<any[]>({
    queryKey: ['student-my-regs', user?.id],
    queryFn: () => authedGet(`${API}/registrations/user/${user?.id}`, token!),
    enabled: !!token && !!user?.id,
  });

  // Extract all sub-events the user is already registered for
  const registeredSubEventIds = new Set(
    myRegs
      .filter((r: any) => r.event_id === event.id && r.sub_event_id)
      .map((r: any) => String(r.sub_event_id))
  );

  // Check if a sub-event conflicts with existing registrations
  const getConflictWarning = (subEvent: any) => {
    if (registeredSubEventIds.has(String(subEvent.id))) {
      return `You are already registered for this track.`;
    }

    // Check for time conflicts with other registered sub-events
    for (const reg of myRegs) {
      if (reg.status === 'rejected') continue;
      const regSubEvent = reg.sub_event;
      if (regSubEvent && regSubEvent.date === subEvent.date && regSubEvent.time === subEvent.time && String(regSubEvent.id) !== String(subEvent.id)) {
        return `Conflict with registered event: ${regSubEvent.title || reg.event?.title || 'Unknown Event'}`;
      }
    }
    return null;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setScreenshotPreview(base64String);
      setScreenshotBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const toggleSubEvent = (subId: string) => {
    setSelectedSubEvents((prev) => 
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleRegister = async () => {
    if (isMultiTrack && selectedSubEvents.length === 0) {
      toast.error('Please select at least one track/session to register.');
      return;
    }
    if (needsPayment && !upiId && !screenshotBase64) {
      toast.error('Please provide payment details (Screenshot or UPI ID)');
      return;
    }

    setLoading(true);
    try {
      if (isMultiTrack) {
        // Register for all selected sub-events using Promise.all
        await Promise.all(selectedSubEvents.map(subId => 
          client.post('/registrations', {
            user_id: user?.id,
            event_id: event.id,
            sub_event_id: subId,
            payment_screenshot: screenshotBase64 || null,
            payment_upi_id: upiId || null
          })
        ));
      } else {
        // Register for the main event
        await client.post('/registrations', {
          user_id: user?.id,
          event_id: event.id,
          sub_event_id: null,
          payment_screenshot: screenshotBase64 || null,
          payment_upi_id: upiId || null
        });
      }
      
      toast.success('Successfully registered!');
      queryClient.invalidateQueries({ queryKey: ['student-my-regs', user?.id] });
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to register. You may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          className="bg-slate-50 dark:bg-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div>
                <h2 className="text-2xl font-black text-indigo-900 dark:text-indigo-400 leading-tight flex items-center gap-2">
                    <Calendar size={24} className="text-indigo-500" />
                    {event.title} Registration
                </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
            <div className="lg:col-span-2 space-y-6">
            
            {/* Tracks & Sessions Box */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <CheckCircle className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Available Tracks & Sessions</h3>
                </div>
                
                <div className="p-6">
                    {/* Participant Details Header inside the card */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700 mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Participant</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{(user as any)?.username || user?.name || user?.email?.split('@')[0] || 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Identity</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your College</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{(user as any)?.institution_name || user?.institution?.name || 'Rathinam College of Arts and Science'} <span className="text-red-500">*</span></p>
                        </div>
                    </div>

                    {/* Sub-events list */}
                    {event.sub_events && event.sub_events.length > 0 ? (
                        <div className="space-y-4">
                            {event.sub_events.map((sub: any) => {
                                const conflictWarning = getConflictWarning(sub);
                                const isSelected = selectedSubEvents.includes(String(sub.id));
                                const isDisabled = !!conflictWarning;
                                
                                return (
                                    <div 
                                        key={sub.id} 
                                        onClick={() => { if (!isDisabled) toggleSubEvent(String(sub.id)); }}
                                        className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                                            isDisabled 
                                                ? 'border-slate-100 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/50 cursor-not-allowed'
                                                : isSelected 
                                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                                                    : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-500/50'
                                        }`}
                                    >
                                        <div className="mt-1">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                                isSelected 
                                                    ? 'bg-indigo-600 border-indigo-600' 
                                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                            }`}>
                                                {isSelected && <CheckCircle size={14} className="text-white" strokeWidth={3} />}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-base">{sub.title}</h4>
                                                <span className={`text-xs font-black px-3 py-1 rounded-full ${
                                                    sub.fee === 0 || !sub.fee 
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                                }`}>
                                                    {sub.fee === 0 || !sub.fee ? 'FREE' : `₹${sub.fee}`}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                                    <Clock size={16} />
                                                    <span>{sub.time || '10:00 AM - 11:00 AM'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
                                                    <MapPin size={16} />
                                                    <span>{sub.venue || event.venue || 'TBA'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                                    <Building size={16} />
                                                    <span>{event.title}</span>
                                                </div>
                                            </div>
                                            
                                            {conflictWarning && (
                                                <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-red-500">
                                                    <AlertTriangle size={14} />
                                                    <span dangerouslySetInnerHTML={{ __html: `<i class="fas fa-exclamation-triangle"></i> ${conflictWarning}` }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center p-8 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">General Registration</p>
                            <p className="text-sm mt-1">This event does not have specific tracks. You are registering for the main event.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Section */}
            {needsPayment && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-700/50">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold mb-6 text-lg">
                  <CreditCard size={20} />
                  Payment Details
                </div>
                
                <div className="flex flex-col md:flex-row gap-8">
                    {event.payment_qr_url && (
                    <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 w-full md:w-auto shrink-0">
                        <span className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Scan to Pay</span>
                        <img src={event.payment_qr_url} alt="Payment QR" className="w-48 h-48 rounded-xl object-cover shadow-sm" />
                    </div>
                    )}

                    <div className="flex-1 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">UPI Transaction ID</label>
                        <input
                        type="text"
                        placeholder="e.g. 123456789012"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:border-indigo-600 focus:ring-0 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">Upload Screenshot</label>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                        
                        {!screenshotPreview ? (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all bg-white dark:bg-slate-800"
                            >
                                <Upload size={24} className="mb-1" />
                                <span className="font-semibold text-sm">Click to upload payment screenshot</span>
                                <span className="text-xs text-slate-400">Max size: 5MB</span>
                            </button>
                        ) : (
                            <div className="relative inline-block w-full">
                                <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-800 flex justify-center">
                                    <img src={screenshotPreview} alt="Preview" className="h-48 rounded-lg object-contain" />
                                </div>
                                <button 
                                    onClick={() => { setScreenshotPreview(''); setScreenshotBase64(''); }} 
                                    className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 transition-colors text-white rounded-full p-2 shadow-lg"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                    </div>
                </div>
              </div>
            )}
            </div>

            {/* Event Resources Sidebar */}
            <div className="space-y-4">
              
              {/* Organizer Details */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col mb-6">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20 flex items-center gap-2">
                  <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-sm text-indigo-900 dark:text-indigo-300">Organizer Details</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Posted By</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                      {event.created_by_name || 'Administrator'} <span className="text-xs text-slate-500 normal-case">({(event.created_by_role || '').replace('_', ' ')})</span>
                    </p>
                  </div>
                  {(event.created_by_institution || event.institution_id) && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Institution</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {event.created_by_institution || 'Rathinam Group of Institutions'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                <FileText size={20} className="text-indigo-500" /> Event Resources
              </h3>
              
              {/* Poster */}
              {event.image && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                    <ImageIcon size={16} className="text-purple-500" />
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Event Poster</span>
                  </div>
                  <div className="p-4">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 mb-3 bg-slate-100 dark:bg-slate-900">
                      <img src={event.image} alt="Poster" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex gap-2">
                      <a href={event.image} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 py-2 rounded-xl text-sm font-bold transition-colors">
                        <Eye size={16} /> View
                      </a>
                      <a href={event.image} download className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 py-2 rounded-xl text-sm font-bold transition-colors">
                        <Download size={16} /> Download
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Rules Document */}
              {(event.rules_pdf_url || event.rules_doc) && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                    <FileText size={16} className="text-amber-500" />
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Event Rules</span>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-2">
                      <a href={event.rules_pdf_url || event.rules_doc} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 py-2 rounded-xl text-sm font-bold transition-colors">
                        <Eye size={16} /> View Rules
                      </a>
                      <a href={event.rules_pdf_url || event.rules_doc} download className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 py-2 rounded-xl text-sm font-bold transition-colors">
                        <Download size={16} /> Download
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Scanner */}
              {event.payment_qr_url && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
                    <QrCode size={16} className="text-green-500" />
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Payment Scanner</span>
                  </div>
                  <div className="p-4 flex flex-col items-center">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-3 w-40 h-40">
                      <img src={event.payment_qr_url} alt="QR Scanner" className="w-full h-full object-cover" />
                    </div>
                    <a href={event.payment_qr_url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 py-2 rounded-xl text-sm font-bold transition-colors">
                      <Eye size={16} /> Enlarge Scanner
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex justify-end gap-4 shrink-0">
            <button 
                onClick={onClose} 
                className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleRegister}
              disabled={loading || (event.sub_events?.length > 0 && selectedSubEvents.length === 0)}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {loading ? 'Processing...' : 'Confirm Registration'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
