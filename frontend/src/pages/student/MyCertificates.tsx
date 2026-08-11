import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import axios from 'axios';
import { Award, Download, CheckCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';
const authedGet = (url: string, token: string) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

const MyCertificates = () => {
    const { token } = useAuthStore();
    
    const { data: certificates = [], isLoading } = useQuery<any[]>({
        queryKey: ['my-certificates'],
        queryFn: () => authedGet(`${API}/certificates/me`, token!),
    });

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-slate-800 font-black text-2xl mb-1 flex items-center gap-2">
                    <Award className="text-emerald-500" size={28} /> My Certificates
                </h2>
                <p className="text-slate-500 font-medium text-sm">View and download your digital certificates.</p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl h-64 animate-pulse shadow-sm" />
                    ))}
                </div>
            ) : certificates.length === 0 ? (
                <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
                    <Award className="mx-auto mb-4 opacity-50" size={48} />
                    <p className="font-bold">No certificates earned yet.</p>
                    <p className="text-sm mt-2">Attend events to earn participation certificates.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((cert) => (
                        <motion.div
                            key={cert.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col"
                        >
                            <div className="p-5 flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                                        <Award size={24} />
                                    </div>
                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                        <CheckCircle size={12} /> Verified
                                    </span>
                                </div>
                                
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg leading-tight mb-1">{cert.event_title || cert.event_name || 'Event Certificate'}</h3>
                                    <p className="text-sm font-bold text-slate-500">{cert.type || cert.category || 'Participation'} Certificate</p>
                                </div>

                                <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium space-y-1">
                                    <p>Issued: {new Date(cert.issued_at).toLocaleDateString()}</p>
                                    <p className="truncate text-slate-600 dark:text-slate-300 font-bold">Event: {cert.event_title || cert.event_name || 'Event Certificate'}</p>
                                </div>
                            </div>
                            
                            <div className="flex border-t border-slate-100">
                                <a 
                                    href={cert.pdf_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <Download size={16} /> PDF
                                </a>
                                <div className="w-px bg-slate-100"></div>
                                <a 
                                    href={`${window.location.origin}/verify/${cert.certificate_id}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <ExternalLink size={16} /> Verify
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyCertificates;
