import React, { useState } from 'react';
import { useAuthStore } from '../../context/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { User, Shield, Building, Phone, Briefcase, Hash, Heart, Trash2, Edit2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

const isVideo = (url?: string) => url ? /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url) : false;

const Profile = ({ userId }: { userId?: string }) => {
  const { user: authUser, token, setAuth } = useAuthStore();
  const isOwnProfile = !userId || userId === authUser?.id;
  const [activeTab, setActiveTab] = useState<'details' | 'posts'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const qc = useQueryClient();

  const { data: fetchedUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => axios.get(`${API}/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    enabled: !!token && !isOwnProfile && !!userId,
  });

  const user = isOwnProfile ? authUser : fetchedUser;

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['user-posts', user?.id],
    queryFn: () => axios.get(`${API}/posts?user_id=${user?.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    enabled: !!token && !!user?.id,
  });

  const deletePost = useMutation({
    mutationFn: (postId: string) => axios.delete(`${API}/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } }),
    onSuccess: () => {
      toast.success('Post deleted successfully');
      qc.invalidateQueries({ queryKey: ['user-posts'] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail ?? 'Failed to delete post');
    }
  });

  const updateProfileMut = useMutation({
    mutationFn: (data: any) => axios.put(`${API}/users/profile`, data, { headers: { Authorization: `Bearer ${token}` } }),
    onSuccess: (res) => {
      toast.success('Profile updated successfully');
      setAuth(res.data, token!);
      setIsEditing(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Update failed')
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);
    data.hide_phone = fd.get("hide_phone") === "on" ? "true" : "";
    updateProfileMut.mutate(data);
  };

  if (isUserLoading) return <div className="p-10 text-center text-slate-500">Loading profile...</div>;
  if (!user) return <div className="p-10 text-center text-slate-500">User not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-900 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-indigo-500 font-bold text-3xl uppercase">
              {user?.name?.[0]}
            </div>
          )}
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{user?.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-4">{user?.email}</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
              <Shield size={14} /> {user?.role.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
              <Building size={14} /> {user?.institution?.name || 'No Institution'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('details')}
          className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Details
        </button>
        <button 
          onClick={() => setActiveTab('posts')}
          className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'posts' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          My Posts
        </button>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Personal Information</h3>
            {isOwnProfile && (
              <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full transition-colors cursor-pointer">
                {isEditing ? <><X size={14}/> Cancel</> : <><Edit2 size={14}/> Edit Profile</>}
              </button>
            )}
          </div>
          
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Name</label>
                  <input name="name" defaultValue={user?.name} required className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">User ID</label>
                  <input name="student_id" defaultValue={user?.student_id || user?.id} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Phone Number</label>
                  <input name="phone_number" defaultValue={user?.phone_number} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm" />
                </div>
                {user?.role === 'sub_admin' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Department</label>
                    <input name="department" defaultValue={user?.department} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" name="hide_phone" defaultChecked={user?.hide_phone} id="hide_phone" className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                <label htmlFor="hide_phone" className="text-sm text-slate-600 dark:text-slate-400 font-medium cursor-pointer">Hide phone number from public profile</label>
              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={updateProfileMut.isPending} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70">
                  <Save size={16} /> {updateProfileMut.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><User size={12}/> Name</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{user?.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Hash size={12}/> User ID</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{user?.student_id || user?.id}</p>
              </div>
              
              {(user?.phone_number || !user?.hide_phone) && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Phone size={12}/> Phone Number</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {user?.phone_number || 'Not provided'} 
                    {user?.hide_phone && <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Hidden</span>}
                  </p>
                </div>
              )}

              {user?.role === 'sub_admin' && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Briefcase size={12}/> Department</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{user?.department || 'Not specified'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-slate-500 py-10">Loading posts...</p>
          ) : posts.length === 0 ? (
            <div className="text-center bg-white dark:bg-slate-900 rounded-xl p-10 border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-medium">You haven't posted anything yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post: any) => (
                <div key={post.id} className="group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                  {post.media ? (
                    <div className="h-48 w-full bg-slate-100 dark:bg-slate-800">
                      {isVideo(post.media) ? (
                        <video src={post.media} className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.media} alt="Post" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center p-4">
                      <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-4">
                        {post.caption}
                      </p>
                    </div>
                  )}
                  {isOwnProfile && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this post?')) {
                            deletePost.mutate(post.id);
                          }
                        }}
                        className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                        disabled={deletePost.isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    {post.media && post.caption && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-2">{post.caption}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between text-xs text-slate-500 font-medium pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
