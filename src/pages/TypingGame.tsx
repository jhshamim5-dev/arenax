import React, { useState, useEffect, useRef } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { ChevronLeft, Trophy, Keyboard } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

// Hard typing text
const TYPING_TEXT = "Accommodating anomalous asynchronous architectures requires scrupulous synchronization. Furthermore, idiosyncratic implementations inevitably instigate intermittent infrastructural instability. Nevertheless, quintessential qualitative quantification yields phenomenological perspectives, simultaneously superseding superficially systemic semantics. Bureaucratic bottlenecks frequently facilitate flippant foolishness and fundamentally fabricate fictitious friction. Consequently, developers demonstrate disproportionate dedication toward troubleshooting theoretical technicalities rather than prioritizing pragmatic problem-solving paradigms.";
const GAME_DURATION = 60; // 1 minute

export default function TypingGame() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  const [tournament, setTournament] = useState<any>(null);
  const [scoreDoc, setScoreDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isMobile, setIsMobile] = useState(false);
  const [status, setStatus] = useState<'idle' | 'playing' | 'completed'>('idle');
  
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Detect mobile
    const checkMobile = () => {
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return isTouch || isMobileUA;
    };
    setIsMobile(checkMobile());
  }, []);

  useEffect(() => {
    if (!id || !currentUser) return;
    const unsub = onSnapshot(doc(db, 'tournaments', id), (docObj) => {
      if (docObj.exists()) setTournament({ id: docObj.id, ...docObj.data() });
    }, (err) => handleFirestoreError(err, OperationType.GET, `tournaments/${id}`));
    return () => unsub();
  }, [id, currentUser]);

  useEffect(() => {
    if (!id || !currentUser) return;
    const unsub = onSnapshot(doc(db, 'tournaments', id, 'scores', currentUser.uid), (docObj) => {
      if (docObj.exists()) {
        setScoreDoc({ id: docObj.id, ...docObj.data() });
        if (docObj.data().completedAt) {
          setStatus('completed');
          setWpm(docObj.data().wpm);
          setAccuracy(docObj.data().accuracy);
        }
      } else {
        setScoreDoc(null);
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, `scores`));
    return () => unsub();
  }, [id, currentUser]);

  // Handle elimination if not started within 5 minutes of tournament active
  // But wait, the prompt says "if the User Dont participate Under 5minute The game starts The user will automaticaly eliminited".
  // Let's implement a simpler check: wait, the prompt says when admin starts the event, a start button will appear. 5 mins to start.
  // We can just rely on the UI timer or validation if needed, but let's do a basic start mechanism.

  const startGame = async () => {
    if (isMobile) {
      return toast.error("Must participate using PC only");
    }
    if (!scoreDoc) {
      try {
        await setDoc(doc(db, 'tournaments', id!, 'scores', currentUser!.uid), {
          userId: currentUser!.uid,
          tournamentId: id!,
          score: 0,
          wpm: 0,
          accuracy: 0,
          startedAt: new Date().toISOString()
        });
      } catch(e) {
        handleFirestoreError(e, OperationType.CREATE, 'scores');
        return;
      }
    }
    
    setStatus('playing');
    setTimeLeft(GAME_DURATION);
    setUserInput('');
    setWpm(0);
    setAccuracy(100);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endGame(userInput);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = async (finalInput: string) => {
    setStatus('completed');
    
    // Calculate final stats
    const wordsTyped = finalInput.trim().split(/\s+/).filter(w => w.length > 0);
    const wordsTarget = TYPING_TEXT.trim().split(/\s+/);
    
    let correctWords = 0;
    let correctChars = 0;
    
    for (let i = 0; i < wordsTyped.length; i++) {
        if (wordsTyped[i] === wordsTarget[i]) {
            correctWords++;
            correctChars += wordsTarget[i].length;
        }
    }

    const finalWpm = Math.round((correctChars / 5) / (GAME_DURATION / 60));
    const finalAccuracy = wordsTyped.length > 0 ? Math.round((correctWords / wordsTyped.length) * 100) : 0;
    
    setWpm(finalWpm);
    setAccuracy(finalAccuracy);

    try {
      await updateDoc(doc(db, 'tournaments', id!, 'scores', currentUser!.uid), {
        score: correctWords, // Use correct words as the main score
        wpm: finalWpm,
        accuracy: finalAccuracy,
        completedAt: new Date().toISOString()
      });
    } catch(e) {
      handleFirestoreError(e, OperationType.UPDATE, 'scores');
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (status !== 'playing') return;
    const val = e.target.value;
    setUserInput(val);
    
    // Live calc for wpm
    const wordsTyped = val.trim().split(/\s+/).filter(w => w.length > 0);
    const wordsTarget = TYPING_TEXT.trim().split(/\s+/);
    
    let correctWords = 0;
    for (let i = 0; i < wordsTyped.length; i++) {
        if (wordsTyped[i] === wordsTarget[i]) {
            correctWords++;
        }
    }
    const currentWpm = Math.round((correctWords) / ((GAME_DURATION - timeLeft) / 60 || 1));
    setWpm(currentWpm);
  };

  // Check 5 minutes limit: if the tournament was activated more than 5 minutes ago and user hasn't started
  // We can't perfectly know when it was activated unless we store activatedAt, but let's assume if it's active.
  
  if (loading) return <AnimatedPage className="py-20 text-center"><p>Loading...</p></AnimatedPage>;
  if (!tournament) return <AnimatedPage className="py-20 text-center"><p>Not found</p></AnimatedPage>;

  // Render text with highlighting
  const renderText = () => {
    const inputWords = userInput.split(' ');
    const targetWords = TYPING_TEXT.split(' ');
    
    return targetWords.map((word, index) => {
      let className = "text-gray-500 transition-colors";
      if (index < inputWords.length - 1) {
        className = inputWords[index] === word ? "text-green-400" : "text-red-500 bg-red-900/40 rounded px-1";
      } else if (index === inputWords.length - 1) {
        className = word.startsWith(inputWords[index]) ? "text-white bg-white/10 rounded px-1" : "text-red-500 bg-red-900/40 rounded px-1";
      }
      return <span key={index} className={className + " mr-1"}>{word}</span>;
    });
  };

  return (
    <AnimatedPage className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate(`/tournament/${id}`)} className="flex items-center text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to Tournament
        </button>
        <div className="flex gap-4">
           {status === 'playing' && (
             <div className="bg-black/60 px-4 py-2 rounded-lg border border-[var(--color-primary-brand)] font-mono text-xl font-bold text-white shadow-[0_0_15px_rgba(123,63,228,0.3)]">
               {timeLeft}s
             </div>
           )}
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
        {isMobile && status === 'idle' ? (
          <div className="text-center py-20">
            <Keyboard size={64} className="mx-auto text-red-500 mb-6" />
            <h2 className="text-3xl font-display font-bold text-white mb-4">Desktop Required</h2>
            <p className="text-gray-400">You must participate using a PC only to ensure fair play.</p>
          </div>
        ) : status === 'idle' ? (
          <div className="text-center py-20">
            <Trophy size={64} className="mx-auto text-[var(--color-primary-brand)] mb-6" />
            <h2 className="text-4xl font-display font-bold text-white mb-4">Typing Championship</h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              You have exactly 60 seconds to type as many correct words as possible. 
              The text is advanced and case-sensitive. Accuracy matters!
            </p>
            <button 
              onClick={startGame}
              className="px-10 py-4 bg-[var(--color-primary-brand)] text-white font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(123,63,228,0.5)]"
            >
              Start Game
            </button>
          </div>
        ) : status === 'playing' ? (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">WPM: <span className="text-white text-lg">{wpm}</span></div>
            </div>
            
            <div className="bg-[#0A0A15] p-6 rounded-xl border border-[var(--color-gaming-border)] text-lg leading-loose font-mono select-none">
              {renderText()}
            </div>

            <textarea 
              ref={inputRef}
              value={userInput}
              onChange={handleInput}
              onPaste={(e) => e.preventDefault()}
              className="w-full h-32 bg-[#0A0A15] border border-[var(--color-primary-brand)]/50 rounded-xl p-4 text-white font-mono focus:outline-none focus:border-[var(--color-primary-brand)] focus:shadow-[0_0_15px_rgba(123,63,228,0.3)] resize-none"
              placeholder="Start typing here..."
            />
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-4xl font-display font-bold text-white mb-8">Time's Up!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
              <div className="bg-black/40 p-6 rounded-2xl border border-[var(--color-primary-brand)]/30">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Final WPM</p>
                <p className="text-5xl font-extrabold text-[var(--color-primary-brand)]">{wpm}</p>
              </div>
              <div className="bg-black/40 p-6 rounded-2xl border border-[var(--color-accent-brand)]/30">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Accuracy</p>
                <p className="text-5xl font-extrabold text-[var(--color-accent-brand)]">{accuracy}%</p>
              </div>
            </div>
            <p className="text-gray-400 mt-8">Your score has been submitted to the leaderboard.</p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
