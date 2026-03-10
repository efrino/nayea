import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([
    { id: 1, sender: 'admin', text: 'Halo! Ada yang bisa kami bantu kak?' }
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setChatLog([...chatLog, { id: Date.now(), sender: 'customer', text: message }]);
    setMessage("");

    // Mock auto-reply
    setTimeout(() => {
      setChatLog(prev => [...prev, { id: Date.now(), sender: 'admin', text: 'Baik kak, pesan sudah kami terima. Admin kami akan segera membalas.' }]);
    }, 1500);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-all transform hover:scale-110 z-50 flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100 transition-all">
          {/* Header */}
          <div className="bg-primary p-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <h3 className="font-semibold">Chat with Admin</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 h-80 overflow-y-auto bg-gray-50 flex flex-col space-y-3">
            {chatLog.map((chat) => (
              <div key={chat.id} className={`flex ${chat.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  chat.sender === 'customer' 
                    ? 'bg-primary text-white rounded-tr-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button 
                type="submit" 
                disabled={!message.trim()}
                className="bg-primary text-white p-2 text-sm rounded-full hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send Message"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
