import React, { useState, useEffect, useRef } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { ChevronLeft, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const QUESTIONS = [
  { q: "What is the capital of Bangladesh?", opts: ["Dhaka", "Chittagong", "Sylhet", "Khulna"], a: 0 },
  { q: "Which language is primarily spoken in Bangladesh?", opts: ["English", "Hindi", "Bengali", "Urdu"], a: 2 },
  { q: "What is the currency of Bangladesh?", opts: ["Rupee", "Taka", "Dollar", "Yen"], a: 1 },
  { q: "What is the national flower of Bangladesh?", opts: ["Rose", "Water Lily", "Sunflower", "Lotus"], a: 1 },
  { q: "Which is the longest beach in Bangladesh?", opts: ["Kuakata", "Patenga", "Cox's Bazar", "Inani"], a: 2 },
  { q: "Who is the national poet of Bangladesh?", opts: ["Rabindranath Tagore", "Kazi Nazrul Islam", "Jasimuddin", "Jibanananda Das"], a: 1 },
  { q: "When did Bangladesh gain independence?", opts: ["1947", "1952", "1971", "1990"], a: 2 },
  { q: "What is the national animal of Bangladesh?", opts: ["Lion", "Royal Bengal Tiger", "Elephant", "Deer"], a: 1 },
  { q: "What is the main river in Bangladesh?", opts: ["Ganges", "Brahmaputra", "Padma", "Meghna"], a: 2 },
  { q: "Which part of Asia is Bangladesh located in?", opts: ["East Asia", "South Asia", "Southeast Asia", "Central Asia"], a: 1 },
  { q: "What is the international calling code for Bangladesh?", opts: ["+880", "+91", "+92", "+94"], a: 0 },
  { q: "Which of the following is a World Heritage Site in Bangladesh?", opts: ["Sundarbans", "Lalbagh Fort", "Ahsan Manzil", "Somapura Mahavihara"], a: 0 },
  { q: "What is the national game of Bangladesh?", opts: ["Cricket", "Football", "Kabaddi", "Hockey"], a: 2 },
  { q: "Which of these is the largest mangrove forest?", opts: ["Amazon", "Sundarbans", "Daintree", "Congo"], a: 1 },
  { q: "What is the national fruit of Bangladesh?", opts: ["Mango", "Jackfruit", "Banana", "Lychee"], a: 1 },
  { q: "How many divisions are there in Bangladesh?", opts: ["6", "7", "8", "9"], a: 2 },
  { q: "What is the national fish of Bangladesh?", opts: ["Rui", "Hilsa (Ilish)", "Katla", "Pangas"], a: 1 },
  { q: "Which day is celebrated as Victory Day?", opts: ["26 March", "21 February", "16 December", "14 April"], a: 2 },
  { q: "Who designed the national flag of Bangladesh?", opts: ["Quamrul Hassan", "Zainul Abedin", "S.M. Sultan", "Hamidur Rahman"], a: 0 },
  { q: "What is the highest peak in Bangladesh?", opts: ["Keokradong", "Saka Haphong", "Tajingdong", "Dimali"], a: 1 },
];

const TIME_PER_QUESTION = 5; 

export default function QuizGame() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [tournament, setTournament] = useState<any>(null);
  const [scoreDoc, setScoreDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [status, setStatus] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  
  const [score, setScore] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  
  const timerRef = useRef<any>(null);
  const startTimestampRef = useRef<number>(0); // For marking when a question started

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
          setScore(docObj.data().score);
          setTotalTime(docObj.data().timeTaken || 0);
        }
      } else {
        setScoreDoc(null);
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, `scores/${currentUser.uid}`));
    return () => unsub();
  }, [id, currentUser]);

  const startGame = async () => {
    if (!scoreDoc) {
      try {
        await setDoc(doc(db, 'tournaments', id!, 'scores', currentUser!.uid), {
          userId: currentUser!.uid,
          tournamentId: id!,
          score: 0,
          startedAt: new Date().toISOString()
        });
      } catch(e) {
        handleFirestoreError(e, OperationType.CREATE, 'scores');
        return;
      }
    }
    
    setStatus('playing');
    setCurrentQ(0);
    setScore(0);
    setTotalTime(0);
    setSelectedOpt(null);
    startQuestionTimer();
  };

  const startQuestionTimer = () => {
    setTimeLeft(TIME_PER_QUESTION);
    startTimestampRef.current = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const moveToNextQuestion = (timeTaken: number, addScore: number) => {
    setTotalTime(prev => prev + timeTaken);
    setScore(prev => prev + addScore);
    
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(prev => prev + 1);
        setSelectedOpt(null);
        startQuestionTimer();
      } else {
        endGame(score + addScore, totalTime + timeTaken);
      }
    }, 1000); // 1 sec delay to show wrong/right
  };

  const handleTimeOut = () => {
    moveToNextQuestion(TIME_PER_QUESTION, 0); // They took full time, 0 score
  };

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return; // Prevent multiple clicks
    setSelectedOpt(idx);
    clearInterval(timerRef.current);
    
    const timeTaken = (Date.now() - startTimestampRef.current) / 1000;
    const isCorrect = idx === QUESTIONS[currentQ].a;
    moveToNextQuestion(timeTaken, isCorrect ? 1 : 0);
  };

  const endGame = async (finalScore: number, finalTime: number) => {
    setStatus('completed');
    try {
      await updateDoc(doc(db, 'tournaments', id!, 'scores', currentUser!.uid), {
        score: finalScore,
        timeTaken: finalTime,
        completedAt: new Date().toISOString()
      });
    } catch(e) {
      handleFirestoreError(e, OperationType.UPDATE, 'scores');
    }
  };

  if (loading) return <AnimatedPage className="py-20 text-center"><p>Loading...</p></AnimatedPage>;
  if (!tournament) return <AnimatedPage className="py-20 text-center"><p>Not found</p></AnimatedPage>;

  return (
    <AnimatedPage className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => navigate(`/tournament/${id}`)} className="flex items-center text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to Tournament
        </button>
        <div className="flex gap-4">
           {status === 'playing' && (
             <div className="bg-black/60 px-4 py-2 rounded-lg border border-yellow-500 font-mono text-xl font-bold text-white shadow-[0_0_15px_rgba(234,179,8,0.3)]">
               {timeLeft}s
             </div>
           )}
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
        {status === 'idle' ? (
          <div className="text-center py-20">
            <BrainCircuit size={64} className="mx-auto text-yellow-500 mb-6" />
            <h2 className="text-4xl font-display font-bold text-white mb-4">Quiz Championship</h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              Answer {QUESTIONS.length} questions. You only have {TIME_PER_QUESTION} seconds per question. Points are awarded for correct answers, and ties are broken by total time taken!
            </p>
            <button 
              onClick={startGame}
              className="px-10 py-4 bg-yellow-500 text-black font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(234,179,8,0.5)]"
            >
              Start Game
            </button>
          </div>
        ) : status === 'playing' ? (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Score: <span className="text-white text-lg">{score}</span></div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Q: <span className="text-white text-lg">{currentQ + 1}/{QUESTIONS.length}</span></div>
            </div>
            
            <div className="bg-[#0A0A15] p-10 rounded-xl border border-[var(--color-gaming-border)] text-center min-h-[160px] flex items-center justify-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white">{QUESTIONS[currentQ].q}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {QUESTIONS[currentQ].opts.map((opt, idx) => {
                let btnCls = "bg-[#1A1A24] border-gray-700 hover:border-gray-500 text-white"; // default
                
                if (selectedOpt !== null) {
                   if (idx === QUESTIONS[currentQ].a) {
                      btnCls = "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]";
                   } else if (selectedOpt === idx) {
                      btnCls = "bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
                   } else {
                      btnCls = "bg-gray-900 border-gray-800 text-gray-600"; // dimmed
                   }
                }
                
                return (
                  <button 
                    key={idx}
                    disabled={selectedOpt !== null}
                    onClick={() => handleSelect(idx)}
                    className={`p-6 rounded-xl border-2 text-xl font-bold transition-all ${btnCls}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-4xl font-display font-bold text-white mb-8">Quiz Completed!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
              <div className="bg-black/40 p-6 rounded-2xl border border-yellow-500/30">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Final Score</p>
                <p className="text-5xl font-extrabold text-yellow-500">{score}/{QUESTIONS.length}</p>
              </div>
              <div className="bg-black/40 p-6 rounded-2xl border border-[var(--color-primary-brand)]/30">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Time</p>
                <p className="text-5xl font-extrabold text-[var(--color-primary-brand)]">{totalTime.toFixed(1)}s</p>
              </div>
            </div>
            <p className="text-gray-400 mt-8">Your score has been submitted to the leaderboard.</p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
