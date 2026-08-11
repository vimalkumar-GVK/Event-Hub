import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle, Clock, XCircle, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../services/client';

interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  sub_event_id?: string;
  status: string;
  attendance: string;
  student_name?: string;
  student_id?: string;
  college_name?: string;
  event_title?: string;
  event_date?: string;
  payment_screenshot?: string;
  payment_upi_id?: string;
  can_approve_home?: boolean;
  can_approve_organizer?: boolean;
  is_paid?: boolean;
  amount?: number;
}

const STATUS_BADGE: Record<string, string> = {
  pending_home: 'bg-amber-100 text-amber-700',
  pending_organizer: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700', // legacy
};

const SharedRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    client.get('/registrations')
      .then((r) => setRegistrations(r.data))
      .catch(() => toast.error('Failed to load registrations'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, action: 'approved' | 'rejected') => {
    setApprovingId(id);
    try {
      await client.put(`/registrations/${id}/status`, { status: action });
      
      // We don't exactly know what the backend returned (could be approved or pending_organizer)
      // so it's best to refresh the list, or we can just fetch this specific one.
      // Easiest is to refetch all registrations:
      const res = await client.get('/registrations');
      setRegistrations(res.data);
      
      toast.success(`Registration ${action}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <ClipboardList className="text-indigo-600" size={32} /> Registrations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            View and approve student registrations.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading...</div>
          ) : registrations.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No registrations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4 text-left">ID</th>
                    <th className="px-6 py-4 text-left">User</th>
                    <th className="px-6 py-4 text-left">Event</th>
                    <th className="px-6 py-4 text-left">Payment Info</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        #{reg.student_id || reg.user_id.slice(-6)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{reg.student_name || `Unknown Student`}</div>
                        <div className="text-xs text-slate-500 font-medium">{reg.college_name || 'Unknown College'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {reg.event_title || `Event #${reg.event_id.slice(-6)}`}
                        </div>
                        {reg.sub_event_id && (
                          <div className="text-xs text-purple-600 font-semibold mb-0.5">Sub-Event: #{reg.sub_event_id.slice(-6)}</div>
                        )}
                        <div className="text-xs text-slate-500">
                          {reg.event_date ? new Date(reg.event_date).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Date not set'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {reg.payment_upi_id || reg.payment_screenshot ? (
                          <div className="flex flex-col gap-1">
                            {reg.payment_upi_id && (
                              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                                UPI: {reg.payment_upi_id}
                              </span>
                            )}
                            {reg.payment_screenshot && (
                              <a href={reg.payment_screenshot} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1">
                                <ImageIcon size={12} /> View Screenshot
                              </a>
                            )}
                          </div>
                        ) : !reg.is_paid ? (
                          <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">FREE</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No payment info</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[reg.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {reg.status === 'approved' ? <CheckCircle size={12} /> : reg.status.startsWith('pending') ? <Clock size={12} /> : <XCircle size={12} />}
                          {reg.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        {(
                          (reg.status === 'pending_home' && reg.can_approve_home) ||
                          (reg.status === 'pending_organizer' && reg.can_approve_organizer) ||
                          (reg.status === 'pending')
                        ) && (
                          <>
                            <button
                              onClick={() => handleStatusChange(reg.id, 'approved')}
                              disabled={approvingId === reg.id}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              {approvingId === reg.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(reg.id, 'rejected')}
                              disabled={approvingId === reg.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedRegistrations;
