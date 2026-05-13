import AnimatedPage from '../components/AnimatedPage';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { motion } from 'motion/react';
import { Users, Calendar, Trophy, Gamepad2, Search } from 'lucide-react';

import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface Tournament {
  id: string;
  name: string;
  game: string;
  prizePool: number;
  entryFee: number;
  status: 'upcoming' | 'active' | 'completed';
  maxPlayers: number;
  registeredPlayers: number;
  image: string;
}

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: Tournament[] = [];
      snapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as Tournament);
      });
      setTournaments(results);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tournaments');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AnimatedPage className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-[80vh]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white font-display uppercase tracking-tight">
            Battle <span className="text-[var(--color-primary-brand)]">Arena</span>
          </h1>
          <p className="text-gray-400 mt-2 max-w-xl">
            Find and join the most competitive tournaments. Prove your skills and win massive prize pools.
          </p>
        </div>
        
        <div className="w-full md:w-72 relative">
          <input 
            type="text" 
            placeholder="Search tournaments..." 
            className="w-full bg-[var(--color-gaming-card)] border border-[var(--color-gaming-border)] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[var(--color-primary-brand)] transition-colors text-sm"
          />
          <Search size={18} className="absolute left-4 top-3.5 text-gray-500" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-t-[var(--color-primary-brand)] border-gray-700 rounded-full animate-spin"></div>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center justify-center border-dashed border-2 border-[var(--color-gaming-border)]">
          <Gamepad2 size={48} className="text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2 font-display uppercase">No Active Tournaments</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            There are currently no tournaments available. Please check back later or contact an administrator to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Link to={`/tournament/${tournament.id}`} key={tournament.id}>
              <motion.div 
                whileHover={{ y: -8 }}
                className="glass-panel p-1 rounded-2xl overflow-hidden group cursor-pointer"
              >
                <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                  <img 
                    src={tournament.image || 'https://6a040c8746fc04f7c2e16b25.imgix.net/3kQCtpnfHoUq5cBsLqKTFk-scaled-1-1024x576.jpg?q=80&w=800&auto=format&fit=crop'} 
                    alt={tournament.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded text-white ${
                      tournament.status === 'active' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                      tournament.status === 'upcoming' ? 'bg-[var(--color-primary-brand)]' : 'bg-gray-600'
                    }`}>
                      {tournament.status}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-xs font-bold text-[var(--color-accent-brand)]">
                    Fee: {tournament.entryFee} TK
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <span className="px-2.5 py-1 text-[10px] tracking-wider font-bold uppercase bg-white/10 backdrop-blur-md text-gray-200 border border-white/10 rounded">
                      {tournament.game}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold bg-black/40 px-2 py-0.5 rounded backdrop-blur-md border border-yellow-400/20">
                      <Trophy size={14} /> ৳{tournament.prizePool.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-5">
                  <h3 className="font-display text-xl font-bold mb-3 text-white group-hover:text-[var(--color-accent-brand)] transition-colors truncate">
                    {tournament.name}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <Users size={16} className="text-gray-500" />
                        <span>{tournament.registeredPlayers}/{tournament.maxPlayers} Players</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[var(--color-primary-brand)]">Click to View</span>
                    </div>
                    <div className="flex items-center gap-1.5 w-full mt-2">
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[var(--color-primary-brand)] to-[var(--color-accent-brand)]"
                          style={{ width: `${Math.min(100, (tournament.registeredPlayers / tournament.maxPlayers) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
