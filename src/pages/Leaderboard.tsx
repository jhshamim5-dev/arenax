import AnimatedPage from '../components/AnimatedPage';
import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Medal, User } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';

export default function Leaderboard() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(false);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const results: any[] = [];
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
        setTournaments(results);
        if (results.length > 0) {
          setSelectedTournament(results[0].id);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'tournaments');
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;
    const fetchScores = async () => {
      setScoresLoading(true);
      try {
        const q = query(collection(db, 'tournaments', selectedTournament, 'scores'), orderBy('score', 'desc'));
        const snap = await getDocs(q);
        
        const scoreDocs = await Promise.all(snap.docs.map(async (scoreDoc) => {
          const userSnap = await getDoc(doc(db, 'users', scoreDoc.data().userId));
          return {
            id: scoreDoc.id,
            ...scoreDoc.data(),
            user: userSnap.exists() ? userSnap.data() : { gamerTag: 'Unknown Player' }
          };
        }));
        
        setScores(scoreDocs);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'scores');
      } finally {
        setScoresLoading(false);
      }
    };
    fetchScores();
  }, [selectedTournament]);

  if (loading) return <AnimatedPage className="py-20 text-center"><p className="text-gray-400">Loading Leaderboard...</p></AnimatedPage>;

  return (
    <AnimatedPage className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="text-center mb-12 relative">
        <Trophy size={48} className="mx-auto text-yellow-400 mb-4" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-white font-display uppercase tracking-tight">
          Champions Board
        </h1>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">See who dominates the arenas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Tournaments</h3>
          {tournaments.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTournament(t.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedTournament === t.id 
                ? 'bg-black/60 border-[var(--color-primary-brand)] text-white shadow-[0_0_15px_rgba(123,63,228,0.3)]' 
                : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/20'
              }`}
            >
              <p className="font-bold truncate">{t.name}</p>
              <p className="text-[10px] uppercase font-bold text-[var(--color-accent-brand)] mt-1">{t.game}</p>
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          <div className="glass-panel p-6 rounded-3xl min-h-[400px]">
             {scoresLoading ? (
               <p className="text-center text-gray-500 py-20">Loading rankings...</p>
             ) : scores.length === 0 ? (
               <div className="text-center py-20">
                 <User size={48} className="mx-auto text-gray-600 mb-4" />
                 <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No scores yet</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {scores.map((s, idx) => (
                   <div key={s.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-[var(--color-gaming-border)] hover:bg-black/60 transition-colors">
                     <div className="flex items-center gap-4">
                       <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                         idx === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                         idx === 1 ? 'bg-gray-300 text-black' :
                         idx === 2 ? 'bg-amber-700 text-white' :
                         'bg-gray-800 text-gray-400'
                       }`}>
                         {idx + 1}
                       </span>
                       <div>
                         <p className="font-bold text-white text-lg">{s.user.gamerTag}</p>
                         <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Player</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="font-display font-extrabold text-2xl text-[var(--color-primary-brand)]">Score: {s.score}</p>
                       <div className="flex gap-3 text-xs text-gray-400 mt-1 uppercase font-bold">
                         <span>WPM: {s.wpm}</span>
                         <span>Acc: {s.accuracy}%</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
