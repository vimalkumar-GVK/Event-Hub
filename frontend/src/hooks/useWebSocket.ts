import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';

export const useWebSocket = () => {
  const { user, token } = useAuthStore();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || !token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = 'localhost:8000'; // Direct connection to backend
    const socket = new WebSocket(`ws://${host}/ws/${user.id}?token=${token}`);

    socket.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WS Message:', data);
      
      // Handle notifications
      if (data.type === 'announcement' || data.type === 'registration_approved') {
        toast(data.message, {
          icon: '🔔',
          duration: 5000,
        });
      }
      
      if (data.type === 'chat_message') {
        toast(`New message: ${data.text}`, {
          icon: '💬',
        });
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [user, token]);

  return { isConnected };
};
