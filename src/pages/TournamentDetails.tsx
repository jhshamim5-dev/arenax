import AnimatedPage from '../components/AnimatedPage';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, Trophy, ChevronLeft } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';

export default function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { t } = useLanguage();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'tournaments', id), (docObj) => {
      if (docObj.exists()) {
        setTournament({ id: docObj.id, ...docObj.data() });
      } else {
        setTournament(null);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `tournaments/${id}`);
    });
    return () => unsub();
  }, [id]);

  const handleJoin = async () => {
    if (!currentUser || !userProfile) {
      alert('Please login first');
      return navigate('/login');
    }
    
    if (tournament.registeredPlayers >= tournament.maxPlayers) {
      return alert('Tournament is full!');
    }
    
    if (tournament.participants?.includes(currentUser.uid)) {
      return alert('You have already joined this tournament.');
    }

    if ((userProfile.walletBalance || 0) < tournament.entryFee) {
      return alert(`Insufficient balance! You need ${tournament.entryFee} TK but have ${(userProfile.walletBalance || 0).toFixed(2)} TK. Please deposit under Wallet.`);
    }

    if (!confirm(`Are you sure you want to join? This will deduct ${tournament.entryFee} TK from your wallet.`)) {
      return;
    }

    setIsJoining(true);
    try {
      // We must deduct balance AND join tournament. 
      // Firestore rules allow deducting own balance.
      // We do this concurrently (or sequentially).
      
      const newBalance = userProfile.walletBalance - tournament.entryFee;
      await updateDoc(doc(db, 'users', currentUser.uid), { walletBalance: newBalance });
      
      await updateDoc(doc(db, 'tournaments', tournament.id), {
        registeredPlayers: tournament.registeredPlayers + 1,
        participants: arrayUnion(currentUser.uid)
      });
      
      alert('Successfully joined the tournament!');
    } catch (e: any) {
      console.error(e);
      alert('Failed to join: ' + e.message);
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return <AnimatedPage className="py-20 text-center"><p className="text-gray-400">Loading...</p></AnimatedPage>;
  }

  if (!tournament) {
    return <AnimatedPage className="py-20 text-center"><p className="text-gray-400">Tournament not found</p></AnimatedPage>;
  }

  const isJoined = currentUser ? tournament.participants?.includes(currentUser.uid) : false;
  const isFull = tournament.registeredPlayers >= tournament.maxPlayers;

  return (
    <AnimatedPage className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <button onClick={() => navigate('/tournaments')} className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
        <ChevronLeft size={16} /> Back to Tournaments
      </button>

      <div className="glass-panel p-1 rounded-3xl overflow-hidden mb-8">
        <div className="relative h-64 md:h-80 w-full">
          <img src={tournament.image} alt={tournament.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <span className="px-3 py-1 bg-[var(--color-primary-brand)] text-xs font-bold uppercase tracking-widest rounded-md text-white">
              {tournament.game}
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mt-3 mb-2">{tournament.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm font-bold">
              <div className="flex items-center gap-2 text-yellow-400 bg-black/40 px-3 py-1.5 rounded-lg border border-yellow-400/20 backdrop-blur-md">
                <Trophy size={16} /> Prize Pool: ৳{tournament.prizePool}
              </div>
              <div className="flex items-center gap-2 text-[var(--color-accent-brand)] bg-black/40 px-3 py-1.5 rounded-lg border border-[var(--color-accent-brand)]/20 backdrop-blur-md">
                {t('entry_fee')}: ৳{tournament.entryFee}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold uppercase tracking-widest text-white mb-4 border-b border-gray-800 pb-3">About Tournament</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{tournament.description || "No description provided."}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Registration Status</h3>
            <div className="flex items-center justify-between mb-2 text-white font-bold">
              <div className="flex items-center gap-2"><Users size={16} className="text-gray-400" /> Players</div>
              <div>{tournament.registeredPlayers} / {tournament.maxPlayers}</div>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-primary-brand)] to-[var(--color-accent-brand)]"
                style={{ width: `${Math.min(100, (tournament.registeredPlayers / tournament.maxPlayers) * 100)}%` }}
              ></div>
            </div>

            {tournament.status !== 'upcoming' && tournament.status !== 'active' ? (
              <button disabled className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-gray-800 text-gray-500">
                Tournament Completed
              </button>
            ) : tournament.status === 'active' && isJoined && tournament.game === 'Typing' ? (
              <button 
                onClick={() => navigate(`/play/typing/${id}`)}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-black bg-[var(--color-accent-brand)] hover:brightness-110 shadow-[0_0_20px_rgba(205,255,100,0.4)] transition-all hover:scale-[1.02]"
              >
                Play Typing Game
              </button>
            ) : tournament.status === 'active' && isJoined ? (
               <button disabled className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-green-500/20 text-green-400 border border-green-500/30">
                 Tournament Active
               </button>
            ) : tournament.status === 'active' && !isJoined ? (
               <button disabled className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-red-500/20 text-red-500 border border-red-500/30">
                 Registration Closed
               </button>
            ) : isJoined ? (
              <div className="flex flex-col gap-2">
                <button disabled className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-green-500/20 text-green-400 border border-green-500/30">
                  Successfully Joined!
                </button>
                <div className="text-center font-bold text-gray-400 text-sm py-2">
                  Please wait for remaining people to join.<br/>
                  <span className="text-[var(--color-primary-brand)]">{tournament.maxPlayers - tournament.registeredPlayers} spots left!</span>
                </div>
              </div>
            ) : isFull ? (
              <button disabled className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-red-500/20 text-red-500 border border-red-500/30">
                Tournament Full
              </button>
            ) : (
              <button 
                onClick={handleJoin} 
                disabled={isJoining}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-white transition-all bg-[var(--color-primary-brand)] hover:brightness-110 shadow-[0_0_20px_rgba(123,63,228,0.4)] disabled:opacity-50 hover:scale-[1.02]"
              >
                {isJoining ? 'Joining...' : t('join')}
              </button>
            )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
