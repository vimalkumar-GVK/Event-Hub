import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Save, ArrowLeft, Plus, Trash2, Copy, Undo2, Redo2, Type, Image as ImageIcon, Grid, Layers, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';
const authedPut = (url: string, body: unknown, token: string) => axios.put(url, body, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);

const FIELD_TYPES = [
    'StudentName', 'Rank', 'Achievement', 'EventName', 'Date', 
    'EventDate', 'CertificateID', 'Department', 'College', 
    'OrganizerName', 'CustomText', 'QRCode', 'Signature', 'Logo'
];

interface Field {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    font_size: number;
    color: string;
    font_family: string;
    font_weight: string | number;
    align: 'left' | 'center' | 'right';
    text_transform: 'none' | 'uppercase' | 'lowercase';
    rotation: number;
    value: string;
}

const TemplateDesigner = ({ template, onBack }: { template: any, onBack: () => void }) => {
    const { token } = useAuthStore();
    const qc = useQueryClient();
    const containerRef = useRef<HTMLDivElement>(null);

    const [fields, setFields] = useState<Field[]>(template.fields || []);
    const [history, setHistory] = useState<Field[][]>([template.fields || []]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(true);
    const [previewMode, setPreviewMode] = useState(false);

    const updateMut = useMutation({
        mutationFn: (data: any) => authedPut(`${API}/certificates/templates/${template.id}/designer`, data, token!),
        onSuccess: () => {
            toast.success('Template saved successfully!');
            qc.invalidateQueries({ queryKey: ['certificate-templates'] });
        },
        onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to save'),
    });

    const pushHistory = (newFields: Field[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newFields);
        // limit to 20
        if (newHistory.length > 20) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setFields(history[historyIndex - 1]);
            setSelectedId(null);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setFields(history[historyIndex + 1]);
            setSelectedId(null);
        }
    };

    const addField = (type: string) => {
        const newField: Field = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x: 50,
            y: 50,
            width: type === 'QRCode' || type === 'Logo' || type === 'Signature' ? 100 : 200,
            height: type === 'QRCode' || type === 'Logo' || type === 'Signature' ? 100 : 40,
            font_size: 24,
            color: '#000000',
            font_family: 'Helvetica',
            font_weight: 'normal',
            align: 'center',
            text_transform: 'none',
            rotation: 0,
            value: type === 'CustomText' ? 'Custom Text' : ''
        };
        const newFields = [...fields, newField];
        setFields(newFields);
        pushHistory(newFields);
        setSelectedId(newField.id);
    };

    const updateField = (id: string, changes: Partial<Field>, skipHistory = false) => {
        const newFields = fields.map(f => f.id === id ? { ...f, ...changes } : f);
        setFields(newFields);
        if (!skipHistory) {
            pushHistory(newFields);
        }
    };

    const removeField = (id: string) => {
        const newFields = fields.filter(f => f.id !== id);
        setFields(newFields);
        pushHistory(newFields);
        setSelectedId(null);
    };

    const duplicateField = (id: string) => {
        const field = fields.find(f => f.id === id);
        if (field) {
            const newField = { ...field, id: Math.random().toString(36).substr(2, 9), x: field.x + 2, y: field.y + 2 };
            const newFields = [...fields, newField];
            setFields(newFields);
            pushHistory(newFields);
            setSelectedId(newField.id);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        
        if (showGrid) {
            x = Math.round(x / 2) * 2;
            y = Math.round(y / 2) * 2;
        }

        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setFields(fields.map(f => f.id === dragging ? { ...f, x, y } : f));
    };

    const handleMouseUp = () => {
        if (dragging) {
            pushHistory(fields);
            setDragging(null);
        }
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, [dragging, fields]);

    const renderPreviewText = (f: Field) => {
        if (!previewMode) {
            return f.type === 'CustomText' ? f.value : `[${f.type}]`;
        }
        // Mock data
        switch (f.type) {
            case 'StudentName': return 'John Doe';
            case 'EventName': return 'Tech Symposium 2026';
            case 'Date': case 'IssueDate': return '2026-08-08';
            case 'EventDate': return 'August 1-5, 2026';
            case 'CertificateID': return 'CERT-12345678';
            case 'Department': return 'Computer Science';
            case 'College': return 'Smart Campus University';
            case 'OrganizerName': return 'Jane Smith';
            case 'Rank': return 'Winner';
            case 'Achievement': return 'Outstanding Performance';
            case 'CustomText': return f.value;
            default: return `[${f.type}]`;
        }
    };

    const selectedField = fields.find(f => f.id === selectedId);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Design: {template.name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={undo} disabled={historyIndex === 0} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 disabled:opacity-50">
                        <Undo2 size={18} />
                    </button>
                    <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 disabled:opacity-50">
                        <Redo2 size={18} />
                    </button>
                    <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-lg ${showGrid ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <Grid size={18} />
                    </button>
                    <button onClick={() => setPreviewMode(!previewMode)} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-sm">
                        {previewMode ? 'Exit Preview' : 'Live Preview'}
                    </button>
                    <button
                        onClick={() => updateMut.mutate({ fields, status: 'Draft' })}
                        disabled={updateMut.isPending}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg text-sm"
                    >
                        <Save size={18} /> Save
                    </button>
                    <button
                        onClick={() => updateMut.mutate({ fields, status: 'Published' })}
                        disabled={updateMut.isPending}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg text-sm"
                    >
                        Publish
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Canvas Area */}
                <div className="flex-1 overflow-x-auto bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 min-h-[600px] flex items-center justify-center">
                    <div 
                        ref={containerRef}
                        className="relative bg-white shadow-2xl border border-slate-300"
                        style={{ width: '800px', aspectRatio: '1.414', overflow: 'hidden' }}
                        onMouseMove={handleMouseMove}
                        onClick={(e) => {
                            if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'IMG') {
                                setSelectedId(null);
                            }
                        }}
                    >
                        <img src={template.background_image_url} className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" />
                        
                        {showGrid && (
                            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #00000010 1px, transparent 1px), linear-gradient(to bottom, #00000010 1px, transparent 1px)', backgroundSize: '2% 2%' }} />
                        )}

                        {fields.map((f) => {
                            const isImage = f.type === 'QRCode' || f.type === 'Signature' || f.type === 'Logo';
                            const isSelected = selectedId === f.id;
                            
                            let transformedText = renderPreviewText(f);
                            if (f.text_transform === 'uppercase') transformedText = transformedText.toUpperCase();
                            if (f.text_transform === 'lowercase') transformedText = transformedText.toLowerCase();

                            return (
                                <div
                                    key={f.id}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setSelectedId(f.id);
                                        setDragging(f.id);
                                    }}
                                    style={{
                                        left: `${f.x}%`,
                                        top: `${f.y}%`,
                                        width: isImage ? `${f.width}px` : 'auto',
                                        height: isImage ? `${f.height}px` : 'auto',
                                        transform: `translate(-50%, -50%) rotate(${f.rotation}deg)`,
                                        color: f.color,
                                        fontSize: `${f.font_size / 2}px`, 
                                        fontFamily: f.font_family,
                                        fontWeight: f.font_weight,
                                        textAlign: f.align,
                                    }}
                                    className={`absolute cursor-move border-2 ${isSelected ? 'border-primary-500 bg-primary-500/10 z-50' : 'border-transparent hover:border-slate-400/50'} p-1 whitespace-nowrap select-none font-bold`}
                                >
                                    {isImage ? (
                                        f.type === 'QRCode' ? (
                                            <div className="w-full h-full bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-500">[QR CODE]</div>
                                        ) : (
                                            <div className="w-full h-full bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-500 overflow-hidden">
                                                {f.value ? <img src={f.value} className="w-full h-full object-contain pointer-events-none" /> : `[${f.type}]`}
                                            </div>
                                        )
                                    ) : (
                                        transformedText
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    <div className="glass-card p-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-slate-500 mb-4">Add Elements</h3>
                        <div className="grid grid-cols-2 gap-2 h-40 overflow-y-auto pr-2">
                            {FIELD_TYPES.map(type => (
                                <button key={type} onClick={() => addField(type)} className="text-[10px] font-bold py-2 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-lg hover:bg-slate-200 flex items-center justify-center gap-1">
                                    <Plus size={12} /> {type.replace('StudentName', 'Participant')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedField ? (
                        <div className="glass-card p-4 flex-1 overflow-y-auto space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm uppercase text-primary-500">Edit: {selectedField.type}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => duplicateField(selectedField.id)} className="p-1.5 bg-slate-100 rounded text-slate-600 hover:bg-slate-200"><Copy size={14} /></button>
                                    <button onClick={() => removeField(selectedField.id)} className="p-1.5 bg-red-100 rounded text-red-600 hover:bg-red-200"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            {(selectedField.type === 'CustomText' || selectedField.type === 'Logo' || selectedField.type === 'Signature') && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">{selectedField.type === 'CustomText' ? 'Text Value' : 'Image URL or Base64'}</label>
                                    <input value={selectedField.value} onChange={e => updateField(selectedField.id, { value: e.target.value })} className="w-full text-xs p-2 rounded mt-1 bg-slate-100 dark:bg-slate-800 border-none dark:text-white" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">X Position (%)</label>
                                    <input type="number" value={Math.round(selectedField.x)} onChange={e => updateField(selectedField.id, { x: Number(e.target.value) })} className="w-full text-xs p-2 rounded bg-slate-100 border-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Y Position (%)</label>
                                    <input type="number" value={Math.round(selectedField.y)} onChange={e => updateField(selectedField.id, { y: Number(e.target.value) })} className="w-full text-xs p-2 rounded bg-slate-100 border-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Font Size</label>
                                    <input type="number" value={selectedField.font_size} onChange={e => updateField(selectedField.id, { font_size: Number(e.target.value) })} className="w-full text-xs p-2 rounded bg-slate-100 border-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Color</label>
                                    <input type="color" value={selectedField.color} onChange={e => updateField(selectedField.id, { color: e.target.value })} className="w-full h-8 rounded bg-slate-100 border-none cursor-pointer" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Font Family</label>
                                    <select value={selectedField.font_family} onChange={e => updateField(selectedField.id, { font_family: e.target.value })} className="w-full text-xs p-2 rounded bg-slate-100 border-none">
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="Times-Roman">Times New Roman</option>
                                        <option value="Courier">Courier</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Weight</label>
                                    <select value={selectedField.font_weight} onChange={e => updateField(selectedField.id, { font_weight: e.target.value })} className="w-full text-xs p-2 rounded bg-slate-100 border-none">
                                        <option value="normal">Normal</option>
                                        <option value="bold">Bold</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Alignment</label>
                                    <div className="flex bg-slate-100 rounded-lg p-1 mt-1">
                                        <button onClick={() => updateField(selectedField.id, { align: 'left' })} className={`flex-1 flex justify-center p-1 rounded ${selectedField.align === 'left' ? 'bg-white shadow' : ''}`}><AlignLeft size={14} /></button>
                                        <button onClick={() => updateField(selectedField.id, { align: 'center' })} className={`flex-1 flex justify-center p-1 rounded ${selectedField.align === 'center' ? 'bg-white shadow' : ''}`}><AlignCenter size={14} /></button>
                                        <button onClick={() => updateField(selectedField.id, { align: 'right' })} className={`flex-1 flex justify-center p-1 rounded ${selectedField.align === 'right' ? 'bg-white shadow' : ''}`}><AlignRight size={14} /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Transform</label>
                                    <select value={selectedField.text_transform} onChange={e => updateField(selectedField.id, { text_transform: e.target.value as any })} className="w-full text-xs p-2 rounded bg-slate-100 border-none mt-1">
                                        <option value="none">None</option>
                                        <option value="uppercase">UPPERCASE</option>
                                        <option value="lowercase">lowercase</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Rotation (degrees)</label>
                                <input type="range" min="-180" max="180" value={selectedField.rotation} onChange={e => updateField(selectedField.id, { rotation: Number(e.target.value) })} className="w-full mt-2" />
                            </div>

                            {(selectedField.type === 'QRCode' || selectedField.type === 'Signature' || selectedField.type === 'Logo') && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Width</label>
                                        <input type="number" value={selectedField.width} onChange={e => updateField(selectedField.id, { width: Number(e.target.value) })} className="w-full text-xs p-2 rounded bg-slate-100 border-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Height</label>
                                        <input type="number" value={selectedField.height} onChange={e => updateField(selectedField.id, { height: Number(e.target.value) })} className="w-full text-xs p-2 rounded bg-slate-100 border-none" />
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="glass-card p-6 flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                            <Layers size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-bold">No Element Selected</p>
                            <p className="text-xs mt-1">Click an element on the canvas to edit its properties.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemplateDesigner;
