import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMessages, sendMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const messagesEndRef = useRef(null);

  const { user } = useAuth(); // Customer must be logged in

  useEffect(() => {
    if (!isOpen || !user) return;

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user]);

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

    // Optimistic UI Update
    const tempId = crypto.randomUUID();
    const optimisticMsg = { id: tempId, created_at: new Date().toISOString(), ...newMsg };

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

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:bg-[#128C7E] transition-all transform hover:scale-110 z-50 flex items-center justify-center overflow-hidden"
        >
          <MessageCircle className="w-7 h-7" fill="currentColor" />
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
                      <p className="mb-2.5 pr-8 whitespace-pre-wrap leading-snug text-gray-800">{chat.text}</p>
                      <span className="text-[10px] text-gray-400 absolute bottom-1 right-2">
                        {formatTime(chat.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

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
