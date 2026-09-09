import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE') {
        navigate(event.data.path);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  return (
    <iframe 
      src="/landing.html" 
      title="Smart Campus Events Landing Page"
      className="w-full h-screen border-none"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
};

export default Landing;
