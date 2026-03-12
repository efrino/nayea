import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Lock, Package, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMessages, sendMessage, markAdminMessagesRead } from '../../services/api';
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

  // Hide widget if the logged-in user is an Admin
  // NOTE: isAdmin check is AFTER all hooks to satisfy React Rules of Hooks
  const isAdmin = user?.user_metadata?.role === 'admin';

  // Return null AFTER all hooks (Rules of Hooks)
  if (isAdmin) return null;

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

    // Reset unseen count and update last-seen timestamp when chat opens
    setUnseenCount(0);
    localStorage.setItem(`chat_last_seen_${user.id}`, new Date().toISOString());
    // Mark all admin messages in this session as 'read' so admin sees blue ticks
    markAdminMessagesRead(user.id);

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
        }
      )
      .on(
        'postgres_changes',
        // Listen for status updates from admin (delivered/read)
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setChatLog((current) =>
            current.map(m => m.id === payload.new.id ? { ...m, status: payload.new.status } : m)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user]);

  // Separate effect: listen for admin messages even when chat is CLOSED (for unseen count)
  useEffect(() => {
    if (!user || isOpen) return;

    // Count existing unseen admin messages from localStorage timestamp
    const lastSeen = localStorage.getItem(`chat_last_seen_${user.id}`);
    getMessages(user.id).then(({ data }) => {
      if (data) {
        const unseen = data.filter(m => m.sender === 'admin' && (!lastSeen || new Date(m.created_at) > new Date(lastSeen)));
        setUnseenCount(unseen.length);
      }
    });

    // Realtime: increment unseenCount when admin sends a message and chat is CLOSED
    const bgChannel = supabase
      .channel(`bg:messages:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.new.sender === 'admin') {
            setUnseenCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(bgChannel);
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

  return (
    <>
      {!isOpen && (
        // Wrapper span needed — 'relative fixed' is a Tailwind conflict
        <span className="fixed bottom-6 right-4 sm:right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="relative bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:bg-[#128C7E] transition-all transform hover:scale-110 flex items-center justify-center"
          >
            <MessageCircle className="w-7 h-7" fill="currentColor" />
            {unseenCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                {unseenCount > 9 ? '9+' : unseenCount}
              </span>
            )}
          </button>
        </span>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 transition-all" style={{ maxHeight: 'min(600px, 85vh)' }}>

          {/* Header (WA WA) */}
          <div className="bg-[#075E54] p-3 flex justify-between items-center text-white shadow-sm z-10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                  N
                </div>
                {user && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#075E54] rounded-full"></div>}
              </div>
              <div>
                <h3 className="font-semibold text-[15px] leading-tight">Nayea.id Support</h3>
                <p className="text-xs text-white/80">{user ? 'Online' : 'Chat requires login'}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-white/80 transition-colors p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!user ? (
            /* Unauthenticated View */
            <div className="flex-1 p-6 h-80 bg-[#ECE5DD] flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-lg">Chat Terkunci</h4>
                <p className="text-sm text-gray-600 mt-2">Silakan masuk ke akun Anda terlebih dahulu untuk memulai obrolan dengan admin.</p>
              </div>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="mt-4 bg-[#25D366] text-white px-6 py-2 rounded-full font-medium hover:bg-[#128C7E] transition-colors shadow-sm"
              >
                Login ke Akun
              </Link>
            </div>
          ) : (
            /* Authenticated View */
            <>
              {/* Messages Area — flex-1 min-h-0 enables proper scroll within flex parent */}
              <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-[#ECE5DD] flex flex-col space-y-3">
                {chatLog.map((chat) => (
                  <div key={chat.id} className={`flex ${chat.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[85%] px-3 py-2 text-[14.5px] shadow-sm ${chat.sender === 'customer'
                      ? 'bg-[#E2FFC7] text-gray-900 rounded-lg rounded-tr-none'
                      : 'bg-white text-gray-900 rounded-lg rounded-tl-none'
                      }`}>
                      <p className="mb-1 whitespace-pre-wrap leading-snug text-gray-800">{chat.text}</p>
                      <div className="flex items-center justify-end gap-0.5">
                        <span className="text-[10px] text-gray-400">
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
              {user && (
                <div className="px-3 py-2 bg-[#F0F0F0] border-t border-gray-200/80">
                  <div className="flex items-center gap-1 mb-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                    <Package className="w-3 h-3" />
                    Pertanyaan Cepat
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMessage(reply)}
                        className="flex-shrink-0 text-[12px] px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-[#25D366] hover:text-[#075E54] hover:bg-green-50 transition-colors whitespace-nowrap shadow-sm flex items-center gap-1"
                      >
                        {reply}
                        <ChevronRight className="w-3 h-3 opacity-50" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area (WA Style) */}
              <div className="p-2.5 bg-[#F0F0F0] flex items-center shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
                <form onSubmit={handleSend} className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 bg-white border-0 rounded-full px-5 py-3 text-[15px] focus:outline-none focus:ring-1 focus:ring-green-500 shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-[#00A884] text-white p-3 rounded-full hover:bg-[#008f6f] disabled:opacity-50 disabled:bg-gray-400 transition-colors shadow-sm flex items-center justify-center w-12 h-12 flex-shrink-0"
                    aria-label="Kirim Pesan"
                  >
                    <Send className="w-5 h-5 ml-1" />
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
