import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import { FileText, Plus, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import TemplateDesigner from './TemplateDesigner';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';
const authedGet = (url: string, token: string) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);
const authedPost = (url: string, body: unknown, token: string) => axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

const CertificateTemplates = () => {
    const { token } = useAuthStore();
    const qc = useQueryClient();
    const [showAdd, setShowAdd] = useState(false);
    const [designingTemplate, setDesigningTemplate] = useState<any>(null);

    const { data: templates = [], isLoading } = useQuery<any[]>({
        queryKey: ['certificate-templates'],
        queryFn: () => authedGet(`${API}/certificates/templates`, token!),
    });

    const createMut = useMutation({
        mutationFn: (data: any) => authedPost(`${API}/certificates/templates`, data, token!),
        onSuccess: () => {
            toast.success('Template created!');
            setShowAdd(false);
            qc.invalidateQueries({ queryKey: ['certificate-templates'] });
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to create template'),
    });

    if (designingTemplate) {
        return <TemplateDesigner template={designingTemplate} onBack={() => setDesigningTemplate(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
                <button 
                    onClick={() => setShowAdd(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-black px-6 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 transition-all cursor-pointer"
                >
                    <Plus size={20} /> Upload Template
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(tpl => (
                    <div key={tpl.id} className="glass-card overflow-hidden">
                        <div className="h-48 bg-slate-100 relative">
                            <img src={tpl.background_image_url} className="w-full h-full object-cover" alt="Template" />
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase">
                                v{tpl.version}
                            </div>
                            <div className={`absolute top-2 left-2 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase ${tpl.status === 'Published' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                {tpl.status || 'Draft'}
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg dark:text-white">{tpl.name}</h3>
                            <div className="flex gap-2">
                                <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">{tpl.category}</span>
                                <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">{tpl.template_type || 'Common'}</span>
                            </div>
                            <button
                                onClick={() => setDesigningTemplate(tpl)}
                                className="mt-4 w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold py-2 rounded-xl transition-colors cursor-pointer"
                            >
                                Design Fields
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowAdd(false)} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl z-10">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Upload New Template</h2>
                        <form onSubmit={(e: any) => {
                            e.preventDefault();
                            const fd = new FormData(e.target);
                            
                            const file = fd.get('image') as File;
                            if (file && file.size > 0) {
                                createMut.mutate(fd);
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Template Name</label>
                                <input name="name" required className="w-full mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                                <select name="category" className="w-full mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white">
                                    <option>Participation</option>
                                    <option>Winner</option>
                                    <option>Runner-Up</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Template Type</label>
                                <select name="template_type" className="w-full mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white">
                                    <option value="Common">Common (Same for all participants)</option>
                                    <option value="Individual">Individual (Rank-Based)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Background Image (PNG/JPG)</label>
                                <input type="file" name="image" accept="image/*" required className="w-full mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 dark:text-white" />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold">Cancel</button>
                                <button type="submit" disabled={createMut.isPending} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold">Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateTemplates;
