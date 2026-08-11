import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Clock, Award, Users } from 'lucide-react';

interface Props {
  registration: any;
  certificate?: any;
  isOpen: boolean;
  onClose: () => void;
}

export const RegisteredEventDetailsModal = ({ registration, certificate, isOpen, onClose }: Props) => {
  if (!isOpen || !registration) return null;

  const event = registration.event || {};
  const subEvent = registration.sub_event;
  const isApproved = registration.status === 'approved';
  
  // For capacity, prefer sub_event capacity if registered for one, otherwise event capacity
  const capacity = subEvent?.capacity || event.capacity;
  const registeredCount = subEvent ? subEvent.registered_count : event.registered_count;
  
  const hasCapacityData = capacity !== undefined && capacity !== null;
  const seatsRemaining = hasCapacityData ? Math.max(0, capacity - (registeredCount || 0)) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Image */}
          {event.image ? (
            <div className="h-48 w-full relative shrink-0">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="h-20 bg-gradient-to-r from-purple-600 to-pink-600 relative shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8 overflow-y-auto">
            <div className={`-mt-12 mb-6 ${event.image ? 'relative z-10' : ''}`}>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide mb-3 ${
                isApproved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : registration.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-green-500' : registration.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                Registration {registration.status || 'Pending'}
              </div>
              <h2 className={`text-2xl md:text-3xl font-black ${event.image ? 'text-white drop-shadow-md' : 'text-slate-900 dark:text-white'}`}>
                {event.title || 'Event Details'}
              </h2>
              {subEvent && (
                <p className={`font-semibold mt-1 flex items-center gap-2 ${event.image ? 'text-purple-200' : 'text-purple-600'}`}>
                  <Award size={18} /> Sub-Event / Track: {subEvent.name || subEvent.title}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Left Col: Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Date</p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {event.date ? new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Time</p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {subEvent?.start_time || event.time || 'Time TBD'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Venue</p>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {subEvent?.venue || event.venue || 'Venue TBD'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Col: Stats */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users size={16} className="text-purple-500"/> Capacity Details
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Students Registered</span>
                      <span className="font-bold text-slate-900 dark:text-white">{registeredCount || 0}</span>
                    </div>
                    {hasCapacityData && (
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-500 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.min(100, ((registeredCount || 0) / capacity) * 100)}%` }} 
                        />
                      </div>
                    )}
                  </div>
                  
                  {hasCapacityData ? (
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Seats Remaining</span>
                      <span className={`font-black text-lg ${seatsRemaining! > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {seatsRemaining} <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">/ {capacity}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 dark:text-slate-500 italic text-center p-2">
                      No capacity limit set
                    </div>
                  )}
                </div>
              </div>
            </div>

            {event.description && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Description</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
            
            {/* Payment Info if paid */}
            {registration.payment_screenshot && (
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Payment Verified</h4>
                 <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg flex items-center justify-center">
                        <Award size={16} />
                    </div>
                    <span>You have uploaded the payment confirmation for this event.</span>
                 </div>
              </div>
            )}
            
            {certificate && (
              <div className="mt-6">
                 <a 
                     href={certificate.pdf_url} 
                     download={`Certificate_${event.title || 'Event'}.pdf`}
                     target="_blank"
                     rel="noreferrer"
                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/30"
                 >
                     <Award size={20} /> Download Certificate
                 </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
