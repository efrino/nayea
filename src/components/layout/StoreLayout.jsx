import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatWidget from '../chat/ChatWidget';

export default function StoreLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <ChatWidget />
      <Footer />
    </div>
  );
}
