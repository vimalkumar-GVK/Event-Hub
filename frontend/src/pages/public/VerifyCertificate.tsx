import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle, XCircle, Search, Award, Calendar, User, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

const VerifyCertificate = () => {
    const { certificateId } = useParams();
    const [searchId, setSearchId] = useState(certificateId || '');
    const [queryId, setQueryId] = useState(certificateId || '');

    const { data, isLoading, isError, error } = useQuery<any>({
        queryKey: ['verify-certificate', queryId],
        queryFn: async () => {
            if (!queryId) return null;
            const res = await axios.get(`${API}/certificates/verify?certificate_id=${queryId}`);
            return res.data;
        },
        enabled: !!queryId,
        retry: false
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setQueryId(searchId);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter flex flex-col items-center py-12 px-6">
            <Link to="/" className="mb-8 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Award size={16} className="text-white" />
                </div>
                <span className="text-slate-800 dark:text-white font-bold text-lg tracking-tight">Smart Campus</span>
            </Link>

            <div className="w-full max-w-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Certificate Verification</h1>
                    <p className="text-slate-500 mt-2">Enter a unique certificate ID to verify its authenticity.</p>
                </div>

                <form onSubmit={handleSearch} className="relative mb-10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="e.g. CERT-..."
                        className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-6 rounded-xl transition-colors"
                    >
                        Verify
                    </button>
                </form>

                {isLoading && (
                    <div className="text-center py-10">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-bold">Verifying record...</p>
                    </div>
                )}

                {!isLoading && isError && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Verification Failed</h2>
                        <p className="text-red-600 dark:text-red-400 font-medium">
                            {(error as any)?.response?.data?.message || 'Certificate not found or invalid.'}
                        </p>
                    </motion.div>
                )}

                {!isLoading && data && data.valid && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                        <div className="bg-emerald-500 p-8 text-center text-white">
                            <CheckCircle size={48} className="mx-auto mb-4" />
                            <h2 className="text-2xl font-black tracking-tight mb-1">Authentic Certificate</h2>
                            <p className="text-emerald-100 font-medium">This document is verified and officially issued.</p>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1"><User size={12}/> Recipient</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{data.details.student_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1"><FileText size={12}/> Event</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{data.details.event_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1"><Award size={12}/> Category</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{data.details.category || 'Participation'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1"><Calendar size={12}/> Issue Date</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">{new Date(data.details.issued_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">Certificate ID</p>
                                <p className="text-sm font-mono text-slate-600 dark:text-slate-300">{data.details.certificate_id}</p>
                            </div>
                            
                            <div className="pt-2">
                                <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">SHA-256 Hash</p>
                                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 break-all">{data.details.hash}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default VerifyCertificate;
