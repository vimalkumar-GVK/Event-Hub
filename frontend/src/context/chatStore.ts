import { create } from 'zustand';

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  reply_to?: string;
  read_by: string[];
  created_at: string;
  reaction?: string;
};

type Conversation = {
  id: string;
  participants: string[];
  last_message?: Message;
  updated_at: string;
  other_user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
  };
};

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, boolean>; // conv_id -> isTyping
  ws: WebSocket | null;
  isConnected: boolean;

  setConversations: (convs: Conversation[]) => void;
  setActiveConversation: (conv: Conversation | null) => void;
  setMessages: (convId: string, msgs: Message[]) => void;
  
  connect: (token: string, userId: string) => void;
  disconnect: () => void;
  
  sendMessage: (convId: string, content: string, type?: string, replyTo?: string) => void;
  sendTyping: (convId: string, isTyping: boolean) => void;
  sendReadReceipt: (convId: string, messageIds: string[]) => void;
  sendAction: (action: 'react' | 'unsend' | 'forward', msgId: string, data?: any) => void;
}

const WS_URL = (import.meta.env.VITE_API_URL ?? '').replace('http', 'ws');

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  typingUsers: {},
  ws: null,
  isConnected: false,

  setConversations: (convs) => set({ conversations: convs }),
  setActiveConversation: (conv) => set({ activeConversation: conv }),
  setMessages: (convId, msgs) => set((state) => ({ messages: { ...state.messages, [convId]: msgs } })),

  connect: (token, userId) => {
    if (get().ws) return;

    const ws = new WebSocket(`${WS_URL}/ws/${userId}?token=${token}`);
    
    ws.onopen = () => set({ isConnected: true, ws });
    ws.onclose = () => set({ isConnected: false, ws: null });
    ws.onerror = (e) => console.error("WebSocket error:", e);
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.type === 'new_message') {
          const msg = payload.message;
          set((state) => {
            const currentMsgs = state.messages[msg.conversation_id] || [];
            
            // update conversation last_message
            const updatedConvs = state.conversations.map(c => 
              c.id === msg.conversation_id 
                ? { ...c, last_message: msg, updated_at: msg.created_at } 
                : c
            ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            
            return {
              messages: { ...state.messages, [msg.conversation_id]: [...currentMsgs, msg] },
              conversations: updatedConvs
            };
          });
        }
        
        else if (payload.type === 'typing') {
          set((state) => ({
            typingUsers: { ...state.typingUsers, [payload.conversation_id]: payload.isTyping }
          }));
        }
        
        else if (payload.type === 'messages_read') {
          set((state) => {
            const msgs = state.messages[payload.conversation_id] || [];
            const updated = msgs.map(m => 
              payload.message_ids.includes(m.id) 
                ? { ...m, read_by: [...new Set([...m.read_by, payload.read_by])] } 
                : m
            );
            return { messages: { ...state.messages, [payload.conversation_id]: updated } };
          });
        }
        
        else if (payload.type === 'message_updated') {
          const updatedMsg = payload.message;
          set((state) => {
            const msgs = state.messages[updatedMsg.conversation_id] || [];
            return {
              messages: { 
                ...state.messages, 
                [updatedMsg.conversation_id]: msgs.map(m => m.id === updatedMsg.id ? updatedMsg : m) 
              }
            };
          });
        }
      } catch (e) {
        console.error("Error parsing WS message", e);
      }
    };
  },

  disconnect: () => {
    const ws = get().ws;
    if (ws) ws.close();
    set({ ws: null, isConnected: false });
  },

  sendMessage: (convId, content, type = 'text', replyTo) => {
    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', conversation_id: convId, content, msg_type: type, reply_to: replyTo }));
    }
  },

  sendTyping: (convId, isTyping) => {
    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing', conversation_id: convId, isTyping }));
    }
  },

  sendReadReceipt: (convId, messageIds) => {
    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN && messageIds.length > 0) {
      ws.send(JSON.stringify({ type: 'read', conversation_id: convId, message_ids: messageIds }));
    }
  },

  sendAction: (action, msgId, data) => {
    const ws = get().ws;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'action', action, message_id: msgId, data }));
    }
  }
}));
