import AnimatedPage from '../components/AnimatedPage';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { logOut, db } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Mail, Settings, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Profile() {
  const { userProfile, currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'tournaments'),
          where('participants', 'array-contains', currentUser.uid)
        );
        const snap = await getDocs(q);
        const results: any[] = [];
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
        setHistory(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [currentUser]);

  if (!currentUser) return null;

  const handleLogout = async () => {
    await logOut();
    navigate('/');
  };

  return (
    <AnimatedPage className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="glass-panel p-8 rounded-3xl border-t border-t-[var(--color-primary-brand)]/50 text-center relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--color-primary-brand)]/20 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-[var(--color-gaming-card)] rounded-full border-4 border-[#06060A] shadow-[0_0_20px_rgba(123,63,228,0.5)] flex items-center justify-center mb-6 mt-4">
            <User size={40} className="text-gray-400" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-white font-display uppercase tracking-tight mb-1">
            {userProfile?.gamerTag || 'Player'}
          </h1>
          <p className="text-gray-400 mb-6 flex items-center gap-2">
            <Mail size={14} /> {userProfile?.email}
          </p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Role</p>
              <p className="text-white font-bold capitalize">{userProfile?.role}</p>
            </div>
            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Member Since</p>
              <p className="text-white font-bold">
                {userProfile?.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 w-full max-w-md">
            <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl transition-colors border border-white/5">
              <Settings size={18} /> Settings
            </button>
            <button 
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 px-4 rounded-xl transition-colors border border-red-500/20"
            >
              <LogOut size={18} /> {t('logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
          <Trophy className="text-yellow-400" size={20} /> {t('tournament_history')}
        </h2>
        {loadingHistory ? (
          <p className="text-gray-400">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No tournaments joined yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map(t => (
              <Link to={`/tournament/${t.id}`} key={t.id} className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-[var(--color-primary-brand)] transition-colors flex items-center gap-4 group">
                <img src={t.image} alt={t.name} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <p className="text-[10px] text-[var(--color-accent-brand)] font-bold uppercase tracking-wider mb-1">{t.game}</p>
                  <h4 className="text-white font-bold group-hover:text-[var(--color-primary-brand)] transition-colors">{t.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 uppercase font-bold">{t.status}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
