import React, { useState } from 'react';
import { useAuthStore } from '../../context/authStore';
import { usersApi } from '../../services/users';
import toast from 'react-hot-toast';
import { Save, User, Lock, Phone, EyeOff, Briefcase, Camera, Moon, Sun, Monitor, Palette } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';

const Settings = () => {
  const { user, setAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    password: '',
    phone_number: user?.phone_number || '',
    hide_phone: user?.hide_phone || false,
    department: user?.department || '',
    profile_photo: user?.profile_photo || ''
  });

  const [preview, setPreview] = useState(user?.profile_photo || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setFormData(prev => ({ ...prev, profile_photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersApi.updateProfile(data),
    onSuccess: (data) => {
      toast.success('Profile updated successfully');
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        setAuth(data, currentToken);
      }
      setFormData(prev => ({ ...prev, password: '' }));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Settings</h2>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            {preview ? (
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl uppercase">
                {user?.name?.[0]}
              </div>
            )}
            <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <Camera className="text-white" size={24} />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
            </label>
          </div>
          <p className="text-sm text-slate-500 font-medium">Click image to change profile photo</p>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <User size={16} /> Full Name
            </label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Lock size={16} /> New Password
            </label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Phone size={16} /> Phone Number
            </label>
            <input 
              type="text" 
              name="phone_number" 
              value={formData.phone_number} 
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="hide_phone" 
              name="hide_phone" 
              checked={formData.hide_phone} 
              onChange={handleChange}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="hide_phone" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <EyeOff size={16} className="text-slate-500" /> Hide phone number from others
            </label>
          </div>

          {user?.role === 'sub_admin' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2 mt-4">
                <Briefcase size={16} /> Department Name
              </label>
              <input 
                type="text" 
                name="department" 
                value={formData.department} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Theme Preference */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Palette size={16} /> Appearance
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === 'light' 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun size={24} />
              <span className="text-sm font-bold">Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === 'dark' 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon size={24} />
              <span className="text-sm font-bold">Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                theme === 'system' 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Monitor size={24} />
              <span className="text-sm font-bold">System</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="submit" 
            disabled={updateMutation.isPending}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
          >
            <Save size={18} />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
