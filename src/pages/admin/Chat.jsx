import { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageCircle, MoreHorizontal, Phone, Video, User, Check, CheckCheck, Smile, Paperclip } from 'lucide-react';
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
    const fetchAllMessages = async () => {
      const { data } = await getMessages();
      if (data) {
        setAllMessages(data);
        markAllMessagesDelivered();
      }
    };

    fetchAllMessages();

    const globalChannel = supabase
      .channel('admin_all_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
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
          if (prev.some(m => m.id === payload.new.id)) return prev;
          let newMsg = { ...payload.new };
          if (newMsg.sender === 'admin' && !newMsg.status) {
              newMsg.status = 'sent';
          }
          const existingUser = prev.find(m => m.user_id === payload.new.user_id && m.customer_email);
          if (existingUser) {
            return [...prev, { ...newMsg, customer_name: existingUser.customer_name, customer_email: existingUser.customer_email }];
          } else {
            fetchAllMessages();
            return prev;
          }
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        setAllMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, status: payload.new.status } : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, []);

  useEffect(() => {
     const uniqueSessions = [...new Set(allMessages.map(m => m.user_id))];
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
  }, [allMessages.length]);

  const activeMessages = allMessages.filter(m => m.user_id === activeSession);

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

    const tempId = crypto.randomUUID();
    const optimisticMsg = { id: tempId, created_at: new Date().toISOString(), status: 'sent', ...newMsg };

    setAllMessages(prev => [...prev, optimisticMsg]);
    setMessageText('');

    const { data, error } = await sendMessage(newMsg);
    if (!error && data) {
      setAllMessages(prev => prev.map(m => m.id === tempId ? data : m));
      markMessagesRead(activeSession);
      supabase.channel(`chat_presense:${activeSession}`).send({ type: 'broadcast', event: 'admin_read', payload: {} });
    }
  };

  const sessionMap = {};
  allMessages.forEach(msg => {
    if (!sessionMap[msg.user_id]) sessionMap[msg.user_id] = [];
    sessionMap[msg.user_id].push(msg);
  });

  const sidebarSessions = Object.keys(sessionMap).map(uid => {
    const msgs = sessionMap[uid];
    const lastMsg = msgs[msgs.length - 1];
    const msgWithMeta = msgs.slice().reverse().find(m => m.customer_name || m.customer_email) || {};
    const unreadCount = msgs.filter(m => m.sender === 'customer' && m.status !== 'read').length;

    return {
      id: uid,
      customerName: msgWithMeta.customer_name || 'Customer',
      customerEmail: msgWithMeta.customer_email || 'No email',
      lastMessage: lastMsg.text,
      lastMessageStatus: lastMsg.status || 'delivered',
      sender: lastMsg.sender,
      createdAt: new Date(lastMsg.created_at),
      timestamp: new Date(lastMsg.created_at).getTime(),
      unreadCount,
    };
  }).sort((a, b) => b.timestamp - a.timestamp);

  const filteredSessions = sidebarSessions.filter(s =>
    s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateObj) => {
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatSidebarTime = (dateObj) => {
    const now = new Date();
    const isToday = dateObj.toLocaleDateString() === now.toLocaleDateString();
    if (isToday) return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
  };

  const MsgTick = ({ status }) => {
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-400" strokeWidth={3} />;
    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-gray-300" strokeWidth={3} />;
    return <Check className="w-3.5 h-3.5 text-gray-300" strokeWidth={3} />;
  };

  const activeCustomer = sidebarSessions.find(s => s.id === activeSession);

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white rounded-[2.5rem] shadow-premium border border-gray-50 overflow-hidden">
      
      {/* Sidebar - Contacts */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-50 flex flex-col bg-gray-50/30">
        <div className="p-8">
           <h3 className="text-2xl font-black font-heading text-gray-900 mb-6 italic tracking-tight">INBOX</h3>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari percakapan..."
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-transparent shadow-sm focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 no-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="py-10 text-center">
               <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-100" />
               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">Belum ada Chat</p>
            </div>
          ) : (
            filteredSessions.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveSession(chat.id);
                  markMessagesRead(chat.id);
                  supabase.channel(`chat_presense:${chat.id}`).send({ type: 'broadcast', event: 'admin_read', payload: {} });
                }}
                className={`p-4 rounded-3xl cursor-pointer transition-all duration-300 flex items-center gap-4 group ${activeSession === chat.id 
                  ? 'bg-white shadow-premium border border-gray-50' 
                  : 'hover:bg-white hover:shadow-sm border border-transparent'}`}
              >
                <div className="relative">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform duration-500 ${activeSession === chat.id ? 'gradient-primary text-white rotate-6 scale-110 shadow-lg shadow-primary/20' : 'bg-white text-gray-300 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                      {chat.customerName.charAt(0).toUpperCase()}
                   </div>
                   {chat.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce-slow shadow-lg shadow-rose-200">
                        {chat.unreadCount}
                      </span>
                   )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className={`text-sm font-black truncate ${activeSession === chat.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>
                      {chat.customerName}
                    </p>
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">{formatSidebarTime(chat.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                       {chat.sender === 'admin' && <MsgTick status={chat.lastMessageStatus} />}
                       <p className="text-xs text-gray-400 truncate font-medium">{chat.lastMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {activeSession ? (
          <>
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                     {activeCustomer?.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                     <h3 className="text-lg font-black font-heading text-gray-900 tracking-tight leading-none">{activeCustomer?.customerName}</h3>
                     <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> ONLINE
                     </p>
                  </div>
               </div>
               
               <div className="flex items-center gap-2">
                  <button className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"><Phone className="w-5 h-5" /></button>
                  <button className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"><Video className="w-5 h-5" /></button>
                  <button className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all ml-2"><MoreHorizontal className="w-5 h-5" /></button>
               </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 p-8 overflow-y-auto no-scrollbar bg-[#FBFBFE] relative">
               {/* Aesthetic Background Shapes */}
               <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10" />
               <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -z-10" />

               <div className="flex flex-col space-y-6">
                  {activeMessages.map((msg, idx) => {
                     const isFirstInSeries = idx === 0 || activeMessages[idx - 1].sender !== msg.sender;
                     return (
                        <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`group relative max-w-[70%] ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                              <div className={`p-5 text-sm font-medium leading-relaxed transition-all ${msg.sender === 'admin'
                                 ? 'bg-gray-900 text-white rounded-[2rem] rounded-tr-none shadow-xl shadow-gray-200'
                                 : 'bg-white text-gray-800 rounded-[2rem] rounded-tl-none shadow-premium'
                              }`}>
                                 <p className="whitespace-pre-wrap">{msg.text}</p>
                              </div>
                              <div className={`mt-2 flex items-center gap-2 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                 <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                                    {formatTime(new Date(msg.created_at))}
                                 </span>
                                 {msg.sender === 'admin' && <MsgTick status={msg.status} />}
                              </div>
                           </div>
                        </div>
                     );
                  })}
                  <div ref={messagesEndRef} />
               </div>
            </div>

            {/* Input Bar */}
            <div className="px-8 py-6 bg-white border-t border-gray-50">
               <form onSubmit={handleSend} className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                     <button type="button" className="p-3 text-gray-400 hover:text-primary transition-colors"><Smile className="w-6 h-6" /></button>
                     <button type="button" className="p-3 text-gray-400 hover:text-primary transition-colors"><Paperclip className="w-6 h-6" /></button>
                  </div>
                  
                  <div className="flex-1 relative flex items-center">
                     <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Balas dengan cinta..."
                        className="w-full pl-6 pr-14 py-4 rounded-[2rem] bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm transition-all shadow-inner"
                     />
                     <button 
                        type="submit" 
                        disabled={!messageText.trim()}
                        className="absolute right-2 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:scale-110 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
                     >
                        <Send className="w-4 h-4 ml-0.5" />
                     </button>
                  </div>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
             <div className="relative mb-10">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-32 h-32 bg-white rounded-[2.5rem] shadow-premium flex items-center justify-center border border-gray-50">
                   <MessageCircle className="w-12 h-12 text-primary drop-shadow-sm" />
                </div>
             </div>
             <h3 className="text-3xl font-black font-heading text-gray-900 italic tracking-tight">SIAP MELAYANI?</h3>
             <p className="mt-4 text-gray-400 font-medium max-w-xs leading-relaxed">
                Pilih salah satu percakapan di sebelah kiri untuk memberikan pelayanan terbaik bagi customer Nayea.id. 🌿
             </p>
             <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-3">
                   {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm overflow-hidden"><img src={`https://ui-avatars.com/api/?name=C${i}&background=random`} alt="C" /></div>)}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Menunggu Respon Anda</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
