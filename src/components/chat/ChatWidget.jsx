import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Lock, Package, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMessages, sendMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const { user } = useAuth(); // Customer must be logged in

  // Hide widget if the logged-in user is an Admin
  const isAdmin = user?.user_metadata?.role === 'admin';
  if (isAdmin) return null;

  // Detect if user is on a product page and fetch its name
  const [contextProductId, setContextProductId] = useState(null);
  const [contextProductName, setContextProductName] = useState(null);

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

  // Proper WhatsApp-style double-tick SVG component
  const MessageStatus = ({ status }) => {
    const singlePath = 'M1.5 5.5L5.5 9.5L12.5 1.5';
    // Two overlapping V-shapes (shifted 4.5px right each)
    const doublePath1 = 'M1.5 5.5L5.5 9.5L12.5 1.5';
    const doublePath2 = 'M6 5.5L10 9.5L17 1.5';
    const strokeColor = status === 'read' ? '#53BDEB' : '#9E9E9E';
    const isDouble = status === 'delivered' || status === 'read';

    return (
      <svg
        viewBox={isDouble ? '0 0 20 12' : '0 0 15 12'}
        className={`inline-block ${isDouble ? 'w-5' : 'w-4'} h-3 ml-1 flex-shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isDouble ? (
          <>
            <path d={doublePath1} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={doublePath2} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          <path d={singlePath} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    );
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:bg-[#128C7E] transition-all transform hover:scale-110 z-50 flex items-center justify-center overflow-hidden"
        >
          <MessageCircle className="w-7 h-7" fill="currentColor" />
          {unseenCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
              {unseenCount > 9 ? '9+' : unseenCount}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200 transition-all">

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
              {/* Messages Area (WA Doodle bg color constraint) */}
              <div className="flex-1 p-4 h-80 overflow-y-auto bg-[#ECE5DD] flex flex-col space-y-3">
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
                        {chat.sender === 'customer' && <MessageStatus status={chat.status} />}
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
