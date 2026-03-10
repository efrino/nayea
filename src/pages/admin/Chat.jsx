import { useState } from 'react';
import { Send, Search } from 'lucide-react';

export default function Chat() {
  const [activeChat, setActiveChat] = useState(1);
  const [message, setMessage] = useState('');

  const chatSessions = [
    { id: 1, customer: 'Siti Aminah', lastMessage: 'Apakah Khimar Syar\'i warna abu ready?', time: '10:45 AM', unread: 2 },
    { id: 2, customer: 'Nisa Rahmawati', lastMessage: 'Baik kak, terima kasih informasinya.', time: 'Yesterday', unread: 0 },
    { id: 3, customer: 'Aulia Putri', lastMessage: 'Bisa minta resi pengiriman untuk order ORD-003?', time: 'Yesterday', unread: 0 },
  ];

  const currentChatMsgs = [
    { id: 1, sender: 'customer', text: 'Halo admin' },
    { id: 2, sender: 'customer', text: 'Apakah Khimar Syar\'i warna abu ready?' },
    { id: 3, sender: 'admin', text: 'Halo kak Siti! Untuk Khimar Syar\'i warna abu saat ini ready stock. Silakan langsung diorder ya kak.' },
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
      
      {/* Sidebar / Chat List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Search conversations..."
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-gray-100">
            {chatSessions.map((chat) => (
              <li 
                key={chat.id} 
                className={`p-4 hover:bg-gray-100 cursor-pointer transition-colors ${activeChat === chat.id ? 'bg-primary bg-opacity-5' : ''}`}
                onClick={() => setActiveChat(chat.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-sm font-medium ${chat.unread ? 'text-gray-900' : 'text-gray-700'}`}>{chat.customer}</h3>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 truncate pr-4">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary font-bold text-lg">
              {chatSessions.find(c => c.id === activeChat)?.customer.charAt(0)}
            </div>
            <div className="ml-3">
              <h2 className="text-sm font-medium text-gray-900">{chatSessions.find(c => c.id === activeChat)?.customer}</h2>
              <p className="text-xs text-green-500">Online</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
          {currentChatMsgs.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                msg.sender === 'admin' 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form className="flex space-x-4" onSubmit={(e) => { e.preventDefault(); setMessage(''); }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 block w-full rounded-full border-gray-300 px-4 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="inline-flex items-center justify-center rounded-full bg-primary p-2 text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              <Send className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
