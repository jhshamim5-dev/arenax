import AnimatedPage from '../components/AnimatedPage';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Swords, Trophy, Users, Star, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

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

export default function Home() {
  const [featuredTournaments, setFeaturedTournaments] = useState<Tournament[]>([]);
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: Tournament[] = [];
      snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() } as Tournament));
      setFeaturedTournaments(results);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tournaments');
    });

    return () => unsubscribe();
  }, []);

  return (
    <AnimatedPage>
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] text-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border-[var(--color-primary-brand)]/30 text-[var(--color-accent-brand)] text-sm font-medium mb-8">
            <Star size={14} className="text-yellow-400" />
            <span className="uppercase tracking-wider text-xs">Season 4 Now Live</span>
          </div>
          
          <h1 className="font-display font-extrabold text-5xl sm:text-7xl lg:text-8xl tracking-tight text-white mb-6 uppercase leading-[0.9]">
            {t('hero_title')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-brand)] to-[var(--color-accent-brand)] text-glow">{t('hero_arena')}</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-light">
            {t('hero_sub')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!currentUser ? (
              <Link
                to="/signup"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-[var(--color-primary-brand)] rounded-full hover:bg-opacity-90 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(123,63,228,0.4)]"
              >
                {t('signup')}
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link
                to="/profile"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-[var(--color-primary-brand)] rounded-full hover:bg-opacity-90 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(123,63,228,0.4)]"
              >
                {t('profile')}
                <ArrowRight size={18} />
              </Link>
            )}
            <Link
              to="/tournaments"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white glass-panel rounded-full hover:bg-[var(--color-gaming-card)] hover:border-[var(--color-accent-brand)] transition-all duration-300"
            >
              <Swords size={18} />
              {t('tournaments')}
            </Link>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.07] mix-blend-screen mask-image:linear-gradient(to_bottom,black,transparent)" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' }}></div>
      </section>

      {/* Featured Tournaments */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight text-white mb-2">Active <span className="text-[var(--color-primary-brand)]">Tournaments</span></h2>
            <p className="text-gray-400">Jump right into the action and secure your spot.</p>
          </div>
          <Link to="/tournaments" className="hidden sm:flex text-sm font-medium text-[var(--color-accent-brand)] hover:text-white transition-colors items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {featuredTournaments.length === 0 ? (
          <div className="text-center py-10 bg-[var(--color-gaming-card)] rounded-2xl border border-[var(--color-gaming-border)]">
            <p className="text-gray-400">{t('no_tournaments')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTournaments.map((tournament) => (
              <Link to={`/tournament/${tournament.id}`} key={tournament.id}>
                <motion.div 
                  whileHover={{ y: -8 }}
                  className="glass-panel p-1 rounded-2xl overflow-hidden group cursor-pointer h-full"
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
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Users size={16} className="text-gray-500" />
                        <span>{tournament.registeredPlayers}/{tournament.maxPlayers} Players</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[var(--color-primary-brand)]">Click to View</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
        
        <Link to="/tournaments" className="mt-8 sm:hidden flex w-full justify-center text-sm font-medium text-[var(--color-accent-brand)] hover:text-white items-center gap-2 glass-panel py-3 rounded-lg">
          {t('view_all_tourneys')} <ArrowRight size={16} />
        </Link>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-[var(--color-gaming-border)] relative z-10 bg-[var(--color-gaming-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
             <h2 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-4">Why <span className="text-[var(--color-accent-brand)]">ArenaX?</span></h2>
             <p className="text-gray-400 max-w-2xl mx-auto">Built by gamers, for gamers. We provide everything you need to run or participate in competitive tournaments at any scale.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl glass-panel border-t border-t-[var(--color-primary-brand)]/50">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-brand)]/20 flex items-center justify-center text-[var(--color-primary-brand)] mb-6">
                <Trophy size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">Automated Brackets</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Instantly generate single, double elimination, or round robin brackets. Matches advance automatically as scores are reported.</p>
            </div>
            
            <div className="p-8 rounded-2xl glass-panel border-t border-t-[var(--color-accent-brand)]/50">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-brand)]/20 flex items-center justify-center text-[var(--color-accent-brand)] mb-6">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">Team Management</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Create teams, invite friends, assign roles, and manage rosters seamlessly. Build your ultimate squad.</p>
            </div>
            
            <div className="p-8 rounded-2xl glass-panel border-t border-t-[#FF0055]/50">
              <div className="w-12 h-12 rounded-xl bg-[#FF0055]/20 flex items-center justify-center text-[#FF0055] mb-6">
                <Star size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">Global Leaderboards</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Earn points by winning matches and tournaments to climb the global leaderboard and unlock exclusive rewards.</p>
            </div>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}
