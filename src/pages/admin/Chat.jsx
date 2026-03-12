import { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMessages, sendMessage, markMessagesDelivered, markMessagesRead, markAllMessagesDelivered } from '../../services/api';

export default function Chat() {
  const [activeSession, setActiveSession] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const activeSessionRef = useRef(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    // 1. Initial Load: Fetch ALL admin messages from all sessions
    const fetchAllMessages = async () => {
      const { data } = await getMessages(); // Passing no ID fetches all

      if (data) {
        setAllMessages(data);
        // Admin is online — mark ALL pending 'sent' messages as 'delivered' across all sessions
        markAllMessagesDelivered();
        // Set most recently active session
        if (data.length > 0) {
          const sessions = [...new Set(data.map(m => m.user_id))];
          const sortedSessions = sessions.sort((a, b) => {
            const lastA = data.filter(m => m.user_id === a).pop()?.created_at;
            const lastB = data.filter(m => m.user_id === b).pop()?.created_at;
            return new Date(lastB) - new Date(lastA);
          });
          // Do NOT auto-set activeSession to sortedSessions[0] to mimic WhatsApp's empty startup state
        }
      }
    };

    fetchAllMessages();

    // 2. Global WebSockets listener for ALL new messages
    // Ensure "Replication" is enabled for "messages" table in Supabase Dashboard!
    const globalChannel = supabase
      .channel('admin_all_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        console.log("Realtime message received!", payload.new);
        
        // Admin status marking for incoming customer messages
        if (payload.new.sender === 'customer') {
            if (activeSessionRef.current === payload.new.user_id) {
                markMessagesRead(payload.new.user_id);
                supabase.channel(`chat_presense:${payload.new.user_id}`).send({ type: 'broadcast', event: 'admin_read', payload: {} });
            } else {
                markMessagesDelivered(payload.new.user_id);
                supabase.channel(`chat_presense:${payload.new.user_id}`).send({ type: 'broadcast', event: 'admin_online', payload: {} });
            }
        }

        setAllMessages(prev => {
          // Cegah duplikasi jika dipicu secara optimistic
          if (prev.some(m => m.id === payload.new.id)) return prev;

          // Jika pesan dikirim Admin lewat WS, pastikan 'sent' status ada
          let newMsg = { ...payload.new };
          if (newMsg.sender === 'admin' && !newMsg.status) {
              newMsg.status = 'sent';
          }

          // Cari info Customer Name/Email dari histori pesan sebelumnya
          const existingUser = prev.find(m => m.user_id === payload.new.user_id && m.customer_email);
          if (existingUser) {
            const enrichedMsg = {
              ...newMsg,
              customer_name: existingUser.customer_name,
              customer_email: existingUser.customer_email
            };
            return [...prev, enrichedMsg];
          } else {
            // Pengguna baru pertama kali chat, tarik tabel ulang dari RPC
            fetchAllMessages();
            return prev;
          }
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        // Update local message status when admin updates status (DB Fallback)
        setAllMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, status: payload.new.status } : m));
      })
      .subscribe((status, err) => {
        if (err) console.error("Realtime subscription error:", err);
      });

    // Listen to ALL customer broadcasts globally
    // We map over unique sessions to subscribe to their presence channels
    // Alternatively, listening dynamically as sessions appear.
    // For simplicity, we just use the DB listener as the source of truth for all sessions,
    // but we can manually subscribe to active ones. However, a catch-all broadcast isn't possible
    // without matching topic. We will subscribe to `chat_presense:*` using a trick:
    // Supabase allows wildcard listening if you just use a single global room for all users,
    // But since we split it, we dynamically manage it below.
    const presenceChannels = {};

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, []);

  // Dynamically manage presence channels for snappy updates
  useEffect(() => {
     const uniqueSessions = [...new Set(allMessages.map(m => m.user_id))];
     const channelsToKeep = new Set(uniqueSessions);
     
     // Note: We avoid creating 1000 channels, limit to active ones if needed, but for small shop it's fine
     uniqueSessions.forEach(userId => {
        if (!window[`__ch_${userId}`]) {
           window[`__ch_${userId}`] = supabase.channel(`chat_presense:${userId}`)
             .on('broadcast', { event: 'customer_read' }, () => {
                 setAllMessages(prev => prev.map(m => m.user_id === userId && m.sender === 'admin' ? { ...m, status: 'read' } : m));
             })
             .on('broadcast', { event: 'customer_online' }, () => {
                 setAllMessages(prev => prev.map(m => m.user_id === userId && m.sender === 'admin' && m.status === 'sent' ? { ...m, status: 'delivered' } : m));
             })
             .subscribe();
        }
     });

     return () => {
        // In a real app we'd clean up inactive ones, but for now we keep them open
     };
  }, [allMessages.length]);

  // Filter ONLY active session's messages
  const activeMessages = allMessages.filter(m => m.user_id === activeSession);

  // Auto-scroll when activeMessages changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeSession]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeSession) return;

    const newMsg = {
      user_id: activeSession,
      sender: 'admin',
      text: messageText.trim()
    };

    // Optimistic UI Update for Snappy feel
    const tempId = crypto.randomUUID();
    const optimisticMsg = { id: tempId, created_at: new Date().toISOString(), status: 'sent', ...newMsg };

    setAllMessages(prev => [...prev, optimisticMsg]);
    setMessageText('');

    const { data, error } = await sendMessage(newMsg);
    if (!error && data) {
      // Replace optimistic ID with Real DB ID
      setAllMessages(prev => prev.map(m => m.id === tempId ? data : m));
      // Mark all customer messages in this session as read since admin has replied
      markMessagesRead(activeSession);
      supabase.channel(`chat_presense:${activeSession}`).send({ type: 'broadcast', event: 'admin_read', payload: {} });
    }
  };

  // Build Whatsapp-like Sidebar Data
  const sessionMap = {};
  allMessages.forEach(msg => {
    if (!sessionMap[msg.user_id]) sessionMap[msg.user_id] = [];
    sessionMap[msg.user_id].push(msg);
  });

  const sidebarSessions = Object.keys(sessionMap).map(uid => {
    const msgs = sessionMap[uid];
    const lastMsg = msgs[msgs.length - 1];
    // We extract the actual name and email from the RPC response.
    // For messages created via optimistic UI, they might not have it until re-fetch,
    // so we scan backwards for the first valid metadata if needed.
    const msgWithMeta = msgs.slice().reverse().find(m => m.customer_name || m.customer_email) || {};
    // Count unread customer messages (status !== 'read' means admin hasn't opened yet)
    // ONLY count if sender is customer.
    const unreadCount = msgs.filter(m => m.sender === 'customer' && m.status !== 'read').length;

    return {
      id: uid,
      customerName: msgWithMeta.customer_name || 'Customer',
      customerEmail: msgWithMeta.customer_email || 'customer@example.com',
      lastMessage: lastMsg.text,
      lastMessageStatus: lastMsg.status || 'delivered', // Fallback
      sender: lastMsg.sender,
      createdAt: new Date(lastMsg.created_at),
      timestamp: new Date(lastMsg.created_at).getTime(),
      unreadCount,
    };
  }).sort((a, b) => b.timestamp - a.timestamp); // Sort By Latest (Bumps to top like WA)

  const filteredSessions = sidebarSessions.filter(s =>
    s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateObj) => {
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatSidebarTime = (dateObj) => {
    const now = new Date();
    const isToday = dateObj.getDate() === now.getDate() && dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = dateObj.getDate() === yesterday.getDate() && dateObj.getMonth() === yesterday.getMonth() && dateObj.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Kemarin';
    } else {
      return dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  // Shared SVG tick component (same paths as ChatWidget for consistency)
  const doublePath = "M5.03033 11.4697C4.73744 11.1768 4.26256 11.1768 3.96967 11.4697C3.67678 11.7626 3.67678 12.2374 3.96967 12.5303L5.03033 11.4697ZM8.5 16L7.96967 16.5303C8.26256 16.8232 8.73744 16.8232 9.03033 16.5303L8.5 16ZM17.0303 8.53033C17.3232 8.23744 17.3232 7.76256 17.0303 7.46967C16.7374 7.17678 16.2626 7.17678 15.9697 7.46967L17.0303 8.53033ZM9.03033 11.4697C8.73744 11.1768 8.26256 11.1768 7.96967 11.4697C7.67678 11.7626 7.67678 12.2374 7.96967 12.5303L9.03033 11.4697ZM12.5 16L11.9697 16.5303C12.2626 16.8232 12.7374 16.8232 13.0303 16.5303L12.5 16ZM21.0303 8.53033C21.3232 8.23744 21.3232 7.76256 21.0303 7.46967C20.7374 7.17678 20.2626 7.17678 19.9697 7.46967L21.0303 8.53033ZM3.96967 12.5303L7.96967 16.5303L9.03033 15.4697L5.03033 11.4697L3.96967 12.5303ZM9.03033 16.5303L17.0303 8.53033L15.9697 7.46967L7.96967 15.4697L9.03033 16.5303ZM7.96967 12.5303L11.9697 16.5303L13.0303 15.4697L9.03033 11.4697L7.96967 12.5303ZM13.0303 16.5303L21.0303 8.53033L19.9697 7.46967L11.9697 15.4697L13.0303 16.5303Z";
  const MsgTick = ({ status }) => {
    if (status === 'delivered')
      return <svg width="14" height="14" viewBox="0 0 25 25" fill="none" className="inline-block ml-0.5 flex-shrink-0"><path d={doublePath} fill="#9E9E9E" /></svg>;
    if (status === 'read')
      return <svg width="14" height="14" viewBox="0 0 25 25" fill="none" className="inline-block ml-0.5 flex-shrink-0"><path d={doublePath} fill="#53BDEB" /></svg>;
    return <svg width="12" height="14" viewBox="0 -0.5 25 25" fill="none" className="inline-block ml-0.5 flex-shrink-0"><path d="M5.5 12.5L10.167 17L19.5 8" stroke="#9E9E9E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">

      {/* Sidebar / Chat List */}
      <div className="w-1/3 md:w-80 border-r border-gray-200 flex flex-col bg-gray-50 flex-shrink-0">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Cari Customer..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarSessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">Belum ada obrolan.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredSessions.map((chat) => (
                <li
                  key={chat.id}
                  className={`p-4 hover:bg-gray-100 cursor-pointer transition-colors ${activeSession === chat.id ? 'bg-primary bg-opacity-10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                  onClick={() => {
                    setActiveSession(chat.id);
                    // Admin opened this session → mark all their messages as READ (blue ticks)
                    markMessagesRead(chat.id);
                    supabase.channel(`chat_presense:${chat.id}`).send({ type: 'broadcast', event: 'admin_read', payload: {} });
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-medium ${activeSession === chat.id ? 'text-primary' : 'text-gray-900'} truncate`}>
                      {chat.customerName}
                    </h3>
                    <span className="text-xs text-gray-500 w-[70px] text-right flex-shrink-0">{formatSidebarTime(chat.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate pr-2 flex items-center">
                      {chat.sender === 'admin' && (
                        <span className="mr-1 inline-flex items-center">
                           <MsgTick status={chat.lastMessageStatus} />
                        </span>
                      )}
                      <span className="truncate">{chat.lastMessage}</span>
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="flex-shrink-0 bg-[#25D366] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeSession ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {sidebarSessions.find(s => s.id === activeSession)?.customerName.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="ml-3">
                  <h2 className="text-sm font-bold text-gray-900">
                    {sidebarSessions.find(s => s.id === activeSession)?.customerName || 'Customer'}
                  </h2>
                  <p className="text-xs text-green-600 font-medium">
                    {sidebarSessions.find(s => s.id === activeSession)?.customerEmail || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-6 overflow-y-auto bg-[#e5ddd5] flex flex-col space-y-4 shadow-inner">
              {activeMessages.length === 0 ? (
                <div className="text-center text-sm text-gray-500 mt-10 bg-white/60 p-2 rounded-lg inline-block self-center">Mulai percakapan...</div>
              ) : (
                activeMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[75%] px-4 py-2 text-sm shadow-md ${msg.sender === 'admin'
                      ? 'bg-[#dcf8c6] text-gray-900 rounded-lg rounded-tr-none'
                      : 'bg-white border border-gray-100 text-gray-900 rounded-lg rounded-tl-none'
                      }`}>
                      <p className="mb-1 whitespace-pre-wrap">{msg.text}</p>
                      <div className={`flex items-center justify-end gap-0.5 ${msg.sender === 'admin' ? 'text-green-800' : 'text-gray-400'}`}>
                        <span className="text-[10px]">{formatTime(new Date(msg.created_at))}</span>
                        {/* Admin's outgoing messages show delivery/read status ticks */}
                        {msg.sender === 'admin' && <MsgTick status={msg.status || 'delivered'} />}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <form className="flex space-x-3 items-center" onSubmit={handleSend}>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Ketik balasan Anda..."
                  className="flex-1 block w-full rounded-2xl border-gray-300 px-4 py-3 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border transition-shadow"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-all transform active:scale-95"
                >
                  <Send className="h-5 w-5 ml-1" aria-hidden="true" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <MessageCircle className="w-12 h-12" />
            </div>
            <p className="text-lg font-medium text-gray-600">Nayea.id Web Chat</p>
            <p className="text-sm">Silakan pilih chat pada kolom di sebelah kiri.</p>
          </div>
        )}
      </div>
    </div>
  );
}
