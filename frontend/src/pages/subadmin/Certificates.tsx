import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Award, Search, Users, FileText, CheckCircle, Clock } from 'lucide-react';
import CertificateTemplates from './CertificateTemplates';
import { Upload } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';
const authedGet = (url: string, token: string) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);
const authedPost = (url: string, body: unknown, token: string) => axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

const SubAdminCertificates = () => {
    const { token, user } = useAuthStore();
    const qc = useQueryClient();
    const [tab, setTab] = useState<'issue' | 'manual' | 'templates'>('issue');
    const [selectedEvent, setSelectedEvent] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    
    // Fetch events for this institution (so sub-admin can issue certs for all inst events)
    const { data: events = [] } = useQuery<any[]>({
        queryKey: ['institution-events', user?.institution_id],
        queryFn: () => authedGet(`${API}/events?institution_id=${user?.institution_id}`, token!),
    });

    // Fetch templates
    const { data: templates = [] } = useQuery<any[]>({
        queryKey: ['certificate-templates'],
        queryFn: () => authedGet(`${API}/certificates/templates`, token!),
    });

    // Fetch attendees for selected event
    const { data: attendees = [], isLoading: loadingAttendees } = useQuery<any[]>({
        queryKey: ['event-attendees', selectedEvent],
        queryFn: () => authedGet(`${API}/certificates/attendees/${selectedEvent}`, token!),
        enabled: !!selectedEvent,
    });

    const generateMut = useMutation({
        mutationFn: (data: any) => authedPost(`${API}/certificates/generate/bulk`, data, token!),
        onSuccess: (res) => {
            toast.success(`Job started! Task ID: ${res.task_id}`);
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to generate'),
    });

    const uploadMut = useMutation({
        mutationFn: (data: FormData) => axios.post(`${API}/certificates/upload`, data, { 
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } 
        }).then(r => r.data),
        onSuccess: () => {
            toast.success(`Certificate uploaded successfully!`);
            qc.invalidateQueries({ queryKey: ['event-attendees', selectedEvent] });
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to upload certificate'),
    });

    const handleUpload = (studentId: string, file: File) => {
        if (!selectedEvent) return toast.error("Please select an event");
        const formData = new FormData();
        formData.append('certificate', file);
        formData.append('event_id', selectedEvent);
        formData.append('student_id', studentId);
        uploadMut.mutate(formData);
    };

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const toggleAll = () => {
        if (selectedUsers.length === attendees.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(attendees.map(a => a.student_id));
        }
    };

    const handleGenerate = () => {
        if (!selectedEvent || !selectedTemplate || selectedUsers.length === 0) {
            return toast.error("Please select an event, a template, and at least one student.");
        }
        generateMut.mutate({
            event_id: selectedEvent,
            template_id: selectedTemplate,
            student_ids: selectedUsers
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Award className="text-green-600" size={32} /> Certificates
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Issue certificates or manage templates.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setTab('issue')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${tab === 'issue' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Auto-Generate
                    </button>
                    <button
                        onClick={() => setTab('manual')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${tab === 'manual' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Manual Upload
                    </button>
                    <button
                        onClick={() => setTab('templates')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${tab === 'templates' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Manage Templates
                    </button>
                </div>
            </div>

            {tab === 'issue' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Configuration Panel */}
                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-lg font-bold dark:text-white">Configuration</h2>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">1. Select Event</label>
                        <select 
                            value={selectedEvent} 
                            onChange={e => setSelectedEvent(e.target.value)}
                            className="w-full mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white border-none"
                        >
                            <option value="">-- Choose an event --</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">2. Select Template</label>
                        <select 
                            value={selectedTemplate} 
                            onChange={e => setSelectedTemplate(e.target.value)}
                            className="w-full mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white border-none"
                        >
                            <option value="">-- Choose a template --</option>
                            {templates.map(tpl => (
                                <option key={tpl.id} value={tpl.id}>{tpl.name} (v{tpl.version})</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={handleGenerate}
                            disabled={generateMut.isPending || selectedUsers.length === 0}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <FileText size={20} />
                            {generateMut.isPending ? 'Processing...' : `Generate for ${selectedUsers.length} Students`}
                        </button>
                    </div>
                </div>

                {/* Attendees Panel */}
                <div className="glass-card p-6 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold dark:text-white">Attendees ({attendees.length})</h2>
                        {attendees.length > 0 && (
                            <button onClick={toggleAll} className="text-xs font-bold text-primary-500 hover:underline">
                                {selectedUsers.length === attendees.length ? 'Deselect All' : 'Select All'}
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {!selectedEvent && (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                Please select an event to load attendees.
                            </div>
                        )}
                        {selectedEvent && loadingAttendees && (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                Loading attendees...
                            </div>
                        )}
                        {selectedEvent && !loadingAttendees && attendees.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                No verified attendees found for this event.
                            </div>
                        )}
                        {attendees.map(a => (
                            <div key={a.student_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedUsers.includes(a.student_id)}
                                        onChange={() => toggleUser(a.student_id)}
                                        className="w-5 h-5 rounded text-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                                    />
                                    <div>
                                        <p className="font-bold text-sm dark:text-white">{a.student_name}</p>
                                        <p className="text-[10px] text-slate-400">ID: {a.student_id}</p>
                                    </div>
                                </div>
                                <div>
                                    {a.status === 'Issued' ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                                            <CheckCircle size={12} /> Issued
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                                            <Clock size={12} /> Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </div>
            ) : tab === 'manual' ? (
                <div className="glass-card p-6 flex flex-col min-h-[500px]">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                            <Upload className="text-blue-500" size={24} /> Manual Certificate Upload
                        </h2>
                        <div className="w-full md:w-1/3">
                            <select 
                                value={selectedEvent} 
                                onChange={e => setSelectedEvent(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white border-none"
                            >
                                <option value="">-- Choose an event --</option>
                                {events.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                        {!selectedEvent && (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                Please select an event to see verified attendees.
                            </div>
                        )}
                        {selectedEvent && loadingAttendees && (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                Loading attendees...
                            </div>
                        )}
                        {selectedEvent && !loadingAttendees && attendees.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                No verified attendees found for this event.
                            </div>
                        )}
                        {attendees.map(a => (
                            <div key={a.student_id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 gap-4">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-lg">{a.student_name}</p>
                                    <p className="text-xs text-slate-500 font-medium">ID: {a.student_id}</p>
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    {a.status === 'Issued' ? (
                                        <span className="flex items-center gap-1 text-sm font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg">
                                            <CheckCircle size={16} /> Issued
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-sm font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                                            <Clock size={16} /> Pending
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center gap-2">
                                            <Upload size={16} /> Choose File
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*,application/pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if(file) handleUpload(a.student_id, file);
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <CertificateTemplates />
            )}
        </div>
    );
};

export default SubAdminCertificates;
