import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../services/client';
import { useAuthStore } from '../../context/authStore';

const StudentCheckIn = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      toast.error('Please log in to mark attendance');
      navigate('/login', { state: { returnTo: location.pathname } });
      return;
    }

    if (user.role !== 'student') {
      setStatus('error');
      setMessage('Only students can check in to events.');
      setLoading(false);
      return;
    }

    const checkIn = async () => {
      try {
        const res = await client.post(`/events/${eventId}/attendance`);
        setStatus('success');
        setMessage(res.data.message || 'Attendance marked successfully!');
        toast.success('Check-in successful!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.detail || err.message || 'Failed to check in');
        toast.error('Check-in failed');
      } finally {
        setLoading(false);
      }
    };

    checkIn();
  }, [eventId, user, navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 text-center"
      >
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Calendar className="text-primary-600" size={40} />
        </div>
        
        <h2 className="text-3xl font-black dark:text-white mb-2">Event Check-In</h2>
        
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-primary-600" size={48} />
            <p className="text-slate-500 font-medium animate-pulse">Marking your attendance...</p>
          </div>
        ) : (
          <div className="py-8">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex justify-center mb-6"
            >
              {status === 'success' ? (
                <CheckCircle className="text-green-500" size={64} />
              ) : (
                <XCircle className="text-red-500" size={64} />
              )}
            </motion.div>
            
            <h3 className={`text-xl font-bold mb-2 ${status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {status === 'success' ? 'Success!' : 'Check-In Failed'}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {message}
            </p>
            
            <div className="mt-8">
              <button 
                onClick={() => navigate('/student')}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/30"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentCheckIn;
