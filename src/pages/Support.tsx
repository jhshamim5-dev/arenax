import AnimatedPage from '../components/AnimatedPage';
import { Send, MessageCircle, HelpCircle } from 'lucide-react';

export default function Support() {
  return (
    <AnimatedPage className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <div className="text-center mb-12">
        <HelpCircle size={48} className="mx-auto text-[var(--color-primary-brand)] mb-4" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-white font-display uppercase tracking-tight">
          Customer Service
        </h1>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">Need help with deposits, withdrawals, or tournaments? Contact us via the channels below.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <a 
          href="https://t.me/Tamim1m" 
          target="_blank" 
          rel="noopener noreferrer"
          className="glass-panel p-6 rounded-2xl flex items-center justify-between group hover:border-[#0088cc] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0088cc]/20 flex items-center justify-center text-[#0088cc]">
              <Send size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#0088cc] transition-colors">Telegram Account</h3>
              <p className="text-sm text-gray-400">Direct message for quick support</p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-[#0088cc]">Connect</span>
        </a>

        <a 
          href="https://t.me/ZniWatch" 
          target="_blank" 
          rel="noopener noreferrer"
          className="glass-panel p-6 rounded-2xl flex items-center justify-between group hover:border-[#0088cc] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0088cc]/20 flex items-center justify-center text-[#0088cc]">
              <Send size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#0088cc] transition-colors">Telegram Group</h3>
              <p className="text-sm text-gray-400">Join our community for updates</p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-[#0088cc]">Join Group</span>
        </a>

        <a 
          href="https://wa.me/+8801934432370" 
          target="_blank" 
          rel="noopener noreferrer"
          className="glass-panel p-6 rounded-2xl flex items-center justify-between group hover:border-[#25D366] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#25D366] transition-colors">WhatsApp Support</h3>
              <p className="text-sm text-gray-400">Chat with us on WhatsApp</p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-[#25D366]">Chat</span>
        </a>
      </div>
    </AnimatedPage>
  );
}
