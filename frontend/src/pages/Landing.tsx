import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStats, useLiveEvents, useNotifications } from '../hooks/useLiveData';

const Landing = () => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stats = useStats();
  const events = useLiveEvents();
  const notifications = useNotifications();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE') {
        navigate(event.data.path);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Send stats down to the iframe so it can display real-time numbers
      iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_STATS', stats, events, notifications }, '*');
    }
  }, [stats, events, notifications]);

  return (
    <iframe 
      ref={iframeRef}
      src="/landing.html" 
      title="Smart Campus Events Landing Page"
      className="w-full h-screen border-none"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
};

export default Landing;

