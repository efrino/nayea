import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Lock, Package, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMessages, sendMessage, markAdminMessagesRead, markAdminMessagesDelivered } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  // MUST be before any early return (Rules of Hooks)
  const [contextProductId, setContextProductId] = useState(null);
  const [contextProductName, setContextProductName] = useState(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const { user } = useAuth(); // Customer must be logged in

  // Admin check is used later to prevent rendering the UI
  const isAdmin = user?.user_metadata?.role === 'admin';

  // Detect product page
  useEffect(() => {
    const match = location.pathname.match(/\/product\/([^/]+)/);
    if (match) {
      setContextProductId(match[1]);
    } else {
      setContextProductId(null);
      setContextProductName(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!contextProductId) return;
    supabase
      .from('products')
      .select('name')
      .eq('id', contextProductId)
      .single()
      .then(({ data }) => {
        if (data) setContextProductName(data.name);
      });
  }, [contextProductId]);

  // Define contextual quick reply chips
  const quickReplies = [
    ...(contextProductName
      ? [
        `Apakah "${contextProductName}" sudah ready stock?`,
        `"${contextProductName}" bisa dikirim hari ini?`,
        `Info estimasi pengiriman "${contextProductName}" dong`,
      ]
      : []),
    'Pesanan saya kapan sampai?',
    'Pesanan saya sudah dikirim?',
    'Bisa custom ukuran tidak?',
    'Ada promo atau diskon sekarang?',
  ];

  useEffect(() => {
    if (!isOpen || !user) return;

    // Reset unseen count when chat opens
    setUnseenCount(0);
    // Mark all admin messages in this session as 'read' so admin sees blue ticks in DB
    markAdminMessagesRead(user.id);
    
    // Broadcast instant "Read" receipt directly to Admin without waiting for DB
    const bgChannel = supabase.channel(`chat_presense:${user.id}`);
    bgChannel.send({ type: 'broadcast', event: 'customer_read', payload: {} });

    // Load initial messages for this specific logged-in user
    getMessages(user.id).then(({ data }) => {
      if (data && data.length > 0) {
        setChatLog(data);
      } else {
        // Welcome message mock if empty
        setChatLog([{ id: 'welcome', sender: 'admin', text: `Halo ${user.user_metadata?.full_name || 'Kak'}! Ada yang bisa dibantu hari ini?` }]);
      }
    });

    // Subscribing to Supabase Realtime using user.id as session_id
    const channel = supabase
      .channel(`public:messages:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setChatLog((current) => {
            if (current.some(m => m.id === payload.new.id)) return current;
            return [...current.filter(m => m.id !== 'welcome'), payload.new];
          });
          if (payload.new.sender === 'admin') {
            // Widget is open, mark it read immediately in DB
            markAdminMessagesRead(user.id);
            // And instantly broadcast to Admin
            supabase.channel(`chat_presense:${user.id}`).send({ type: 'broadcast', event: 'customer_read', payload: {} });
          }
        }
      )
      .on(
        'postgres_changes',
        // Listen for status updates from admin (delivered/read) via DB (as fallback)
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setChatLog((current) =>
            current.map(m => m.id === payload.new.id ? { ...m, status: payload.new.status } : m)
          );
        }
      )
      .subscribe();

    // Fast Broadcast Channel for Instant Tick Updates
    const fastChannel = supabase
      .channel(`chat_presense:${user.id}`)
      .on('broadcast', { event: 'admin_read' }, () => {
         setChatLog(current =>
            current.map(m => m.sender === 'customer' ? { ...m, status: 'read' } : m)
         );
      })
      .on('broadcast', { event: 'admin_online' }, () => {
         setChatLog(current =>
            current.map(m => (m.sender === 'customer' && m.status === 'sent') ? { ...m, status: 'delivered' } : m)
         );
      })
      .subscribe((status) => {
         if (status === 'SUBSCRIBED') {
            // Tell admin we are online (widget open translates to customer_read)
            supabase.channel(`chat_presense:${user.id}`).send({ type: 'broadcast', event: 'customer_read', payload: {} });
         }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(fastChannel);
    };
  }, [isOpen, user]);

  // Separate effect: listen for admin messages even when chat is CLOSED (for unseen count)
  useEffect(() => {
    if (!user || isOpen) return;

    // Count existing unseen admin messages from DB
    getMessages(user.id).then(({ data }) => {
      if (data) {
        const unseen = data.filter(m => m.sender === 'admin' && m.status !== 'read');
        setUnseenCount(unseen.length);
        if (unseen.length > 0) {
           markAdminMessagesDelivered(user.id);
        }
      }
    });

    // Realtime: increment unseenCount when admin sends a message and chat is CLOSED
    const bgChannel = supabase
      .channel(`chat_presense:${user.id}`)
      .on('broadcast', { event: 'admin_read' }, () => {
         // Nothing to do structurally if unseenCount is for admin msgs
      })
      .subscribe((status) => {
         if (status === 'SUBSCRIBED') {
            // Tell admin we are actively on the website
            supabase.channel(`chat_presense:${user.id}`).send({ type: 'broadcast', event: 'customer_online', payload: {} });
         }
      });

    const dbChannel = supabase
      .channel(`bg:messages:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new.sender === 'admin') {
            setUnseenCount(prev => prev + 1);
            markAdminMessagesDelivered(user.id);
            // Instant broadcast delivery
            supabase.channel(`chat_presense:${user.id}`).send({ type: 'broadcast', event: 'customer_online', payload: {} });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
           if (payload.new.sender === 'admin' && payload.new.status === 'read') {
               setUnseenCount(prev => Math.max(0, prev - 1));
           }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bgChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [user, isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const newMsg = {
      user_id: user.id,
      sender: 'customer',
      text: message.trim()
    };

    // Optimistic UI Update — default status 'sent'
    const tempId = crypto.randomUUID();
    const optimisticMsg = { id: tempId, created_at: new Date().toISOString(), status: 'sent', ...newMsg };

    setChatLog(prev => [...prev.filter(m => m.id !== 'welcome'), optimisticMsg]);
    setMessage("");

    const { data, error } = await sendMessage(newMsg);
    if (!error && data) {
      setChatLog(prev => prev.map(m => m.id === tempId ? data : m));
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // WhatsApp-style checkmark component
  // Resilient to missing SQL migration: messages from DB (non-optimistic) with null status
  // default to 'delivered' (✓✓) since they are already persisted on the server.
  // Only optimistic messages explicitly set to 'sent' show single tick (✓).
  const resolveStatus = (msg) => {
    if (msg.status) return msg.status;
    // If status column doesn't exist yet (SQL migration pending):
    // optimistic messages have id starting with typical UUID v4 pattern but we tag them via status='sent',
    // so any message without status from DB = treat as delivered
    return 'delivered';
  };

  const MessageStatus = ({ status }) => {
    // Exact double-tick path (viewBox 0 0 25 25, fill-based)
    const doublePath = "M5.03033 11.4697C4.73744 11.1768 4.26256 11.1768 3.96967 11.4697C3.67678 11.7626 3.67678 12.2374 3.96967 12.5303L5.03033 11.4697ZM8.5 16L7.96967 16.5303C8.26256 16.8232 8.73744 16.8232 9.03033 16.5303L8.5 16ZM17.0303 8.53033C17.3232 8.23744 17.3232 7.76256 17.0303 7.46967C16.7374 7.17678 16.2626 7.17678 15.9697 7.46967L17.0303 8.53033ZM9.03033 11.4697C8.73744 11.1768 8.26256 11.1768 7.96967 11.4697C7.67678 11.7626 7.67678 12.2374 7.96967 12.5303L9.03033 11.4697ZM12.5 16L11.9697 16.5303C12.2626 16.8232 12.7374 16.8232 13.0303 16.5303L12.5 16ZM21.0303 8.53033C21.3232 8.23744 21.3232 7.76256 21.0303 7.46967C20.7374 7.17678 20.2626 7.17678 19.9697 7.46967L21.0303 8.53033ZM3.96967 12.5303L7.96967 16.5303L9.03033 15.4697L5.03033 11.4697L3.96967 12.5303ZM9.03033 16.5303L17.0303 8.53033L15.9697 7.46967L7.96967 15.4697L9.03033 16.5303ZM7.96967 12.5303L11.9697 16.5303L13.0303 15.4697L9.03033 11.4697L7.96967 12.5303ZM13.0303 16.5303L21.0303 8.53033L19.9697 7.46967L11.9697 15.4697L13.0303 16.5303Z";

    if (status === 'delivered') {
      return (
        <svg width="15" height="15" viewBox="0 0 25 25" fill="none" className="inline-block ml-1 flex-shrink-0">
          <path d={doublePath} fill="#9E9E9E" />
        </svg>
      );
    }
    if (status === 'read') {
      return (
        <svg width="15" height="15" viewBox="0 0 25 25" fill="none" className="inline-block ml-1 flex-shrink-0">
          <path d={doublePath} fill="#53BDEB" />
        </svg>
      );
    }
    // Single gray tick for 'sent'
    return (
      <svg width="14" height="14" viewBox="0 -0.5 25 25" fill="none" className="inline-block ml-1 flex-shrink-0">
        <path d="M5.5 12.5L10.167 17L19.5 8" stroke="#9E9E9E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // Return null AFTER all hooks (Rules of Hooks)
  if (isAdmin) return null;

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative bg-[#25D366] text-white p-4 sm:p-5 rounded-[1.5rem] shadow-2xl hover:bg-[#128C7E] transition-all transform hover:scale-110 flex items-center justify-center active:scale-90"
          >
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" />
            {unseenCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
                {unseenCount > 9 ? '9+' : unseenCount}
              </span>
            )}
            {/* Soft pulse effect */}
            <div className="absolute inset-0 rounded-[1.5rem] bg-[#25D366] animate-ping opacity-20 group-hover:opacity-0 transition-opacity" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-8 sm:right-8 w-full sm:w-[400px] h-[100dvh] sm:h-[650px] sm:max-h-[85vh] bg-white sm:rounded-[2.5rem] shadow-2xl flex flex-col z-[100] overflow-hidden animate-in slide-in-from-bottom-5 duration-300 border border-gray-100">

          {/* Header */}
          <div className="bg-[#075E54] px-6 py-5 flex justify-between items-center text-white relative shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black font-heading text-lg backdrop-blur-md">
                  N
                </div>
                {user && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-4 border-[#075E54] rounded-full shadow-sm"></div>}
              </div>
              <div>
                <h3 className="font-black font-heading text-lg leading-none tracking-tight italic">NAYEA SUPPORT</h3>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-1 italic flex items-center gap-1.5">
                  {user ? (
                    <><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online Ready</>
                  ) : 'Login Required'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-2xl transition-all active:scale-90">
              <X className="w-6 h-6" />
            </button>
          </div>

          {!user ? (
            /* Unauthenticated View */
            <div className="flex-1 p-10 bg-[#ECE5DD] flex flex-col items-center justify-center space-y-6 text-center">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl text-gray-300 border border-gray-50">
                <Lock className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="font-black font-heading text-2xl text-gray-900 tracking-tight italic uppercase">Chat Terkunci</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[240px] mx-auto">Silakan masuk ke akun Anda untuk memulai obrolan personal.</p>
              </div>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="gradient-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                Login Sekarang
              </Link>
            </div>
          ) : (
            /* Authenticated View */
            <>
              {/* Messages Area */}
              <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto bg-[#ECE5DD] flex flex-col space-y-4">
                {chatLog.map((chat) => (
                  <div key={chat.id} className={`flex ${chat.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[85%] px-4 py-3 shadow-md ${chat.sender === 'customer'
                      ? 'bg-[#E2FFC7] text-gray-900 rounded-[1.2rem] rounded-tr-none'
                      : 'bg-white text-gray-900 rounded-[1.2rem] rounded-tl-none'
                      }`}>
                      <p className="text-sm leading-relaxed font-medium text-gray-800 whitespace-pre-wrap">{chat.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                        <span className="text-[9px] font-bold text-gray-500 italic">
                          {formatTime(chat.created_at)}
                        </span>
                        {chat.sender === 'customer' && <MessageStatus status={resolveStatus(chat)} />}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div className="px-4 py-3 bg-white/80 backdrop-blur-md border-t border-gray-50">
                <div className="flex items-center gap-2 mb-3 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] italic">
                  <Package className="w-4 h-4 text-primary" />
                  Quick Reply
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessage(reply)}
                      className="flex-shrink-0 text-[11px] px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all whitespace-nowrap shadow-sm active:scale-95"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-50 flex items-center">
                <form onSubmit={handleSend} className="flex-1 flex gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tulis pesan..."
                    className="flex-1 bg-gray-50 border-transparent rounded-2xl px-5 py-3.5 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="gradient-primary text-white p-4 rounded-2xl hover:shadow-xl hover:shadow-primary/20 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center w-14 h-14 active:scale-90"
                  >
                    <Send className="w-6 h-6 ml-1" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
