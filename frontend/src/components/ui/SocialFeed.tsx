import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, MoreHorizontal, Music, Heart, MessageCircle, Repeat, Send, Bookmark, VolumeX, Plus, Loader2, X, Image as ImageIcon, Video, Send as SendIcon, Trash2, Search, User as UserIcon, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL ?? '') + '/api';

import { useAuthStore } from '../../context/authStore';
import Profile from '../../pages/shared/Profile';
import { EventDetailsModal } from '../events/EventDetailsModal';

const isVideo = (url?: string) => url ? /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url) : false;

export const SocialFeed = () => {
  const { user, token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [activeStory, setActiveStory] = useState<any>(null);

  const [postCaption, setPostCaption] = useState('');
  const [postMediaFile, setPostMediaFile] = useState<File | null>(null);
  const [postMediaPreview, setPostMediaPreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['feed-notifications'],
    queryFn: () => axios.get(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    enabled: !!token,
    refetchInterval: 15000,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => axios.put(`${API}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed-notifications'] }),
  });
  
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['search-users', searchQuery],
    queryFn: () => axios.get(`${API}/users/search?q=${searchQuery}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    enabled: !!token && searchQuery.length > 1,
  });

  // Time formatting helper
  const getRelativeTime = (dateString: string) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = (new Date(dateString).getTime() - new Date().getTime()) / 1000;
    
    if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
    if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    return rtf.format(Math.round(diff / 86400), 'day');
  };

  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => axios.get(`${API}/posts`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    enabled: !!token,
    refetchInterval: 15000,
  });

  const createPost = useMutation({
    mutationFn: (formData: FormData) => axios.post(`${API}/posts`, formData, { headers: { Authorization: `Bearer ${token}` } }),
    onSuccess: () => {
      toast.success('Post created!');
      qc.invalidateQueries({ queryKey: ['posts'] });
      setPostCaption('');
      setPostMediaFile(null);
      setPostMediaPreview(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail ?? 'Failed to create post');
    },
    onSettled: () => setIsPosting(false)
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: () => axios.get(`${API}/stories`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),
    enabled: !!token,
    refetchInterval: 10000,
  });

  const uploadStory = useMutation({
    mutationFn: (formData: FormData) => axios.post(`${API}/stories`, formData, { headers: { Authorization: `Bearer ${token}` } }),
    onSuccess: () => {
      toast.success('Story uploaded!');
      qc.invalidateQueries({ queryKey: ['stories'] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail ?? 'Failed to upload story');
    },
    onSettled: () => setIsUploading(false)
  });

  const deleteStory = useMutation({
    mutationFn: (storyId: string) => axios.delete(`${API}/stories/${storyId}`, { headers: { Authorization: `Bearer ${token}` } }),
    onSuccess: () => {
      toast.success('Story deleted');
      qc.invalidateQueries({ queryKey: ['stories'] });
      setActiveStory(null);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail ?? 'Failed to delete story');
    }
  });

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit file size to 1GB in frontend
      if (file.size > 1024 * 1024 * 1024) {
        toast.error("File is too large (max 1GB).");
        return;
      }
      
      setIsUploading(true);
      const formData = new FormData();
      formData.append('media', file);
      uploadStory.mutate(formData);
    }
  };

  const handlePostFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limit file size to 1GB in frontend
      if (file.size > 1024 * 1024 * 1024) {
        toast.error("File is too large (max 1GB).");
        return;
      }
      
      setPostMediaFile(file);
      setPostMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = () => {
    if (!postCaption.trim() && !postMediaFile) {
      toast.error("Please add some text or media to your post");
      return;
    }
    setIsPosting(true);
    
    const formData = new FormData();
    if (postCaption.trim()) formData.append('caption', postCaption);
    if (postMediaFile) formData.append('media', postMediaFile);
    
    createPost.mutate(formData);
  };

  const myStory = stories.find((s: any) => s.username === user?.name);
  const otherStories = stories.filter((s: any) => s.username !== user?.name);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white pb-20">
      
      {/* Profile Modal Overlay */}
      {viewingUserId && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen py-10 px-4">
             <div className="max-w-4xl mx-auto relative bg-slate-50 dark:bg-neutral-950 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setViewingUserId(null)} 
                  className="absolute top-4 right-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full p-2 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors z-10"
                >
                  <X size={20}/>
                </button>
                <div className="pt-2">
                  <Profile userId={viewingUserId} />
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Full Screen Story Viewer */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
            {activeStory.username === user?.name && (
              <button 
                onClick={() => {
                  if (window.confirm("Delete this story?")) {
                    deleteStory.mutate(activeStory.id);
                  }
                }} 
                className="text-white bg-rose-500/80 hover:bg-rose-600 transition-colors rounded-full p-2 flex items-center gap-2 text-sm font-bold"
                disabled={deleteStory.isPending}
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={() => setActiveStory(null)} 
              className="text-white bg-black/50 hover:bg-black/70 transition-colors rounded-full p-2"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-slate-800">
               {activeStory.user_image ? (
                 <img src={activeStory.user_image} alt="User" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-white font-bold uppercase">
                   {activeStory.username[0]}
                 </div>
               )}
            </div>
            <span className="text-white font-bold shadow-sm">{activeStory.username}</span>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            {isVideo(activeStory.media) ? (
              <video src={activeStory.media} className="max-w-full max-h-full" autoPlay controls playsInline />
            ) : (
              <img src={activeStory.media} className="max-w-full max-h-full object-contain" />
            )}
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto w-full border-x border-slate-200 dark:border-slate-800 min-h-screen">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-950 relative z-20">
          <div className="relative flex items-center bg-slate-100 dark:bg-neutral-900 rounded-full px-4 py-2 border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <Search size={18} className="text-slate-400 mr-2 shrink-0" />
            <input 
              type="text"
              placeholder="Search for users..."
              className="w-full bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={16} />
              </button>
            )}
          </div>
          
          {searchQuery.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col">
                  {searchResults.map((su: any) => (
                    <div key={su.id} onClick={() => setViewingUserId(su.id)} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-neutral-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        {su.profile_photo || su.profile_pic ? (
                          <img src={su.profile_photo || su.profile_pic} alt={su.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={20} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{su.name}</span>
                        <span className="text-xs text-slate-500 capitalize">{su.role.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">No users found for "{searchQuery}"</div>
              )}
            </div>
          )}
        </div>
        
        {/* Stories Navigation (Top Section) */}
        <div className="relative pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar items-start">
            {/* Add Story Button */}
            <div className="flex flex-col items-center gap-1 min-w-[72px]">
              <div className="relative p-[2px] rounded-full">
                <div 
                  className={`bg-white dark:bg-neutral-950 p-[2px] rounded-full w-16 h-16 overflow-hidden flex items-center justify-center cursor-pointer ${myStory ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => myStory ? setActiveStory(myStory) : fileInputRef.current?.click()}
                >
                  {myStory ? (
                    isVideo(myStory.media) ? (
                      <video src={myStory.media} className="w-full h-full object-cover rounded-full" autoPlay muted loop playsInline />
                    ) : (
                      <img src={myStory.media} className="w-full h-full object-cover rounded-full" />
                    )
                  ) : (
                    user?.name ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 rounded-full">
                        <span className="font-bold text-xl uppercase text-slate-600 dark:text-slate-300">
                          {user.name[0]}
                        </span>
                      </div>
                    ) : (
                      <img src="https://i.pravatar.cc/150?u=1" alt="Your Story" className="w-full h-full object-cover rounded-full" />
                    )
                  )}
                </div>
                <div 
                  className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white dark:border-neutral-950 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  {isUploading ? <Loader2 size={14} className="text-white animate-spin" /> : <Plus size={14} className="text-white" />}
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 truncate w-16 text-center mt-1">
                {isUploading ? 'Uploading...' : 'Your Story'}
              </span>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*" 
                onChange={handleStoryUpload}
              />
            </div>

            {/* Other Users' Stories */}
            {otherStories.map((story: any) => (
              <div 
                key={story.id} 
                className="flex flex-col items-center gap-1 cursor-pointer min-w-[72px]"
                onClick={() => setActiveStory(story)}
              >
                <div className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px] rounded-full">
                  <div className="bg-white dark:bg-neutral-950 p-[2px] rounded-full w-16 h-16 overflow-hidden flex items-center justify-center">
                    {isVideo(story.media) ? (
                       <video src={story.media} className="w-full h-full object-cover rounded-full border border-slate-200 dark:border-slate-800" autoPlay muted loop playsInline />
                    ) : (
                       <img src={story.media} alt={story.username} className="w-full h-full object-cover rounded-full border border-slate-200 dark:border-slate-800" />
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-medium truncate w-16 text-center mt-1">
                  {story.username}
                </span>
              </div>
            ))}
          </div>
          <button className="absolute right-2 top-10 bg-white/80 dark:bg-black/50 p-1.5 rounded-full backdrop-blur-sm shadow-md border border-slate-200 dark:border-slate-700">
            <ChevronRight size={16} />
          </button>
        </div>



        {/* Create Post Section */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-950">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-100 dark:bg-neutral-900 flex items-center justify-center">
               {user?.name ? (
                  <span className="font-bold uppercase text-slate-600 dark:text-slate-300">{user.name[0]}</span>
               ) : (
                  <img src="https://i.pravatar.cc/150?u=1" alt="User" className="w-full h-full object-cover" />
               )}
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="What's on your mind?"
                className="w-full bg-transparent border-none outline-none text-[15px] placeholder:text-slate-400 pt-2"
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePost()}
              />
              
              {postMediaPreview && (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                  <button 
                    onClick={() => {
                      setPostMediaFile(null);
                      setPostMediaPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 p-1.5 rounded-full text-white z-10"
                  >
                    <X size={16} />
                  </button>
                  {postMediaFile?.type?.startsWith('video/') ? (
                    <video src={postMediaPreview} className="w-full max-h-64 object-cover" controls />
                  ) : (
                    <img src={postMediaPreview} className="w-full max-h-64 object-cover" alt="Attachment" />
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => postFileInputRef.current?.click()}
                    className="flex items-center gap-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-full transition-colors text-[14px] font-medium"
                  >
                    <ImageIcon size={18} />
                    <span>Photo/Video</span>
                  </button>
                  <input 
                    type="file" 
                    ref={postFileInputRef} 
                    className="hidden" 
                    accept="image/*,video/*" 
                    onChange={handlePostFileSelect}
                  />
                </div>
                <button 
                  onClick={handleCreatePost}
                  disabled={isPosting || (!postCaption.trim() && !postMediaFile)}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-full font-bold text-[14px] flex items-center gap-2 transition-colors"
                >
                  {isPosting ? <Loader2 size={16} className="animate-spin" /> : <SendIcon size={16} />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed Posts (Main Section) */}
        <div className="flex flex-col">
          {posts.map((post: any) => (
            <article key={post.id} className="py-4 border-b border-slate-200 dark:border-slate-800">
              
              {/* Post Header */}
              <div className="flex items-center justify-between px-4 mb-3">
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setViewingUserId(post.user_id)}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-neutral-900 flex items-center justify-center group-hover:ring-2 ring-indigo-500 transition-all">
                    {post.user_image ? (
                       <img src={post.user_image} alt={post.username} className="w-full h-full object-cover" />
                    ) : (
                       <span className="font-bold uppercase text-slate-600 dark:text-slate-300">{post.username[0]}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[14px] leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{post.username}</span>
                      <span className="text-slate-500 text-[14px] leading-tight">• {getRelativeTime(post.created_at).replace('in ', '').replace(' ago', '')}</span>
                    </div>
                  </div>
                </div>
                <button className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Post Caption */}
              {post.caption && (
                <div className="px-4 pb-3 text-[14px] leading-relaxed whitespace-pre-wrap">
                  {post.caption}
                </div>
              )}

              {/* Post Media */}
              {post.media && (
                <div className="px-4">
                  <div className="relative w-full overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-neutral-900">
                    {isVideo(post.media) ? (
                       <video src={post.media} className="w-full" controls playsInline />
                    ) : (
                       <img src={post.media} alt="Post content" className="w-full object-contain max-h-[80vh]" />
                    )}
                  </div>
                </div>
              )}

              {/* Post Action Bar */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="text-slate-900 dark:text-white hover:text-slate-500 transition-colors">
                      <Heart size={24} />
                    </button>
                    <button className="text-slate-900 dark:text-white hover:text-slate-500 transition-colors flex items-center gap-1.5">
                      <MessageCircle size={24} />
                      {post.comments > 0 && <span className="font-bold text-[14px]">{post.comments}</span>}
                    </button>
                    <button className="text-slate-900 dark:text-white hover:text-slate-500 transition-colors">
                      <Repeat size={24} />
                    </button>
                    <button className="text-slate-900 dark:text-white hover:text-slate-500 transition-colors">
                      <Send size={24} />
                    </button>
                  </div>
                  <button className="text-slate-900 dark:text-white hover:text-slate-500 transition-colors">
                    <Bookmark size={24} />
                  </button>
                </div>
                <div className="mt-2 text-[14px] font-bold">
                  {post.likes} likes
                </div>
              </div>

            </article>
          ))}
        </div>
        
      </div>
    </div>
  );
};

export default SocialFeed;
