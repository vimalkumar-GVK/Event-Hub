import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, CheckCircle, XCircle, Users, Camera, Keyboard } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../services/client';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery } from '@tanstack/react-query';

const SubAdminAttendance = () => {
  const [regId, setRegId] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ name?: string; success: boolean } | null>(null);
  const [mode, setMode] = useState<'manual' | 'generate'>('manual');
  const [selectedEventId, setSelectedEventId] = useState('');

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['subadmin-events'],
    queryFn: async () => {
      const res = await client.get('/events');
      return res.data;
    }
  });

  const markAttendance = async (id: string) => {
    if (!id.trim() || loading) return;
    setLoading(true);
    try {
      // Support MongoDB ObjectId (alphanumeric hex) or numerical IDs
      const cleanId = id.trim(); 
      if (!cleanId) throw new Error('Invalid Registration ID');

      await client.put(`/registrations/${cleanId}/attendance`, {
        attendance: 'Present',
      });
      
      setLastResult({ success: true, name: `Registration #${cleanId}` });
      toast.success(`✅ Attendance marked for Registration #${cleanId}`);
      setRegId('');
      
    } catch (err: any) {
      setLastResult({ success: false });
      toast.error(err.response?.data?.detail || err.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <ScanLine className="text-blue-600" size={32} /> Attendance
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Mark student attendance for your events.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setMode('generate')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all
                ${mode === 'generate' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
            >
              <ScanLine size={16} /> Event QR
            </button>
            <button 
              onClick={() => setMode('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all
                ${mode === 'manual' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
            >
              <Keyboard size={16} /> Manual
            </button>
          </div>
        </div>

        {lastResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-3 p-5 rounded-2xl font-bold shadow-sm border ${
              lastResult.success
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {lastResult.success
              ? <><CheckCircle size={22} /> {lastResult.name} — Attendance recorded!</>
              : <><XCircle size={22} /> Operation failed — check the ID</>
            }
          </motion.div>
        )}

        {mode === 'manual' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
            <h2 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Users size={18} /> Manual Entry
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={regId}
                onChange={(e) => setRegId(e.target.value)}
                placeholder="Ex: 42 or REG-42"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                onKeyDown={(e) => e.key === 'Enter' && markAttendance(regId)}
              />
              <button
                onClick={() => markAttendance(regId)}
                disabled={loading || !regId}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
              >
                {loading ? '...' : 'Mark Present'}
              </button>
            </div>
          </div>
        )}

        {mode === 'generate' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6 flex flex-col items-center">
            <div className="w-full">
              <h2 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Select Event for Student Self Check-in</h2>
              <select 
                value={selectedEventId} 
                onChange={e => setSelectedEventId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none focus:ring-2 focus:ring-purple-500 dark:text-white transition-all"
              >
                <option value="">-- Choose an Event --</option>
                {events.map((evt: any) => (
                  <option key={evt.id} value={evt.id}>{evt.title}</option>
                ))}
              </select>
            </div>

            {selectedEventId && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                <QRCodeSVG 
                  value={`${window.location.origin}/student/checkin/${selectedEventId}`} 
                  size={256}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-center text-slate-500 text-sm mt-4 font-bold">
                  Students: Scan this with your phone to mark attendance!
                </p>
              </motion.div>
            )}
          </div>
        )}

        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium text-center">
            💡 Attendance can only be marked for <strong>approved</strong> registrations. 
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubAdminAttendance;
