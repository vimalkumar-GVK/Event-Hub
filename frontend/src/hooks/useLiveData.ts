import { useEffect, useState } from 'react';

// Using window.location fallbacks in case env vars are missing
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5173/api`;
const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

export function useStats() {
  const [stats, setStats] = useState({ students: 0, events: 0, registrations: 0, uptime: 0 });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/stats`);
        const data = await res.json();
        if (data) setStats(data);
      } catch (e) {
        console.warn("Failed to fetch stats", e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);
  
  return stats;
}

export function useLiveEvents() {
  const [events, setEvents] = useState<any[]>([]);
  
  useEffect(() => {
    // WebSocket real-time
    const ws = new WebSocket(`${WS_URL}/ws`);
    
    ws.onopen = () => console.log('Events WS Connected');
    
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'event_update') {
          // You might fetch again, or set events directly depending on the backend payload
          setEvents(data.events || []);
        }
      } catch (err) {}
    };
    
    // Initial fetch
    fetch(`${API_URL}/events?status=live&limit=3`)
      .then(r => r.json())
      .then(data => {
        setEvents(data.events || data || []);
      })
      .catch(e => console.warn("Failed to fetch live events"));
      
    return () => ws.close();
  }, []);
  
  return events;
}

export function useFeaturedEvents() {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/events?featured=true&limit=6`)
      .then(r => r.json())
      .then(data => {
        setEvents(data.events || data || []);
      })
      .catch(e => console.warn("Failed to fetch featured events"));
  }, []);
  return events;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/ws`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'registration:new' && data.payload) {
          const newNotif = {
            id: Date.now().toString() + Math.random().toString(),
            userName: data.payload.userName || 'Someone',
            eventTitle: data.payload.eventTitle || 'an event',
            time: Date.now()
          };
          setNotifications(prev => [newNotif, ...prev].slice(0, 5));

          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
          }, 5000);
        }
      } catch (err) {}
    };
    return () => ws.close();
  }, []);
  
  return notifications;
}
