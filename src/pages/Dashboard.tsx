import AnimatedPage from '../components/AnimatedPage';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, LogOut, ArrowRightLeft, Upload, ArrowDownToLine, Clock, CalendarDays, KeySquare, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'winning';
  method: string;
  amount: number;
  accountInfo: string;
  trxId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export default function WalletPage() {
  const { userProfile, currentUser } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'binance'>('bkash');
  const [accountInfo, setAccountInfo] = useState('');
  const [amount, setAmount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: Transaction[] = [];
      snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(results);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });
    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountInfo || !amount || (tab === 'deposit' && !trxId)) return;
    
    const numAmount = Number(amount);
    if (numAmount <= 0) return toast.error('Amount must be positive');

    if (tab === 'withdraw') {
      if ((userProfile?.walletBalance || 0) < numAmount) {
        return toast.error('Insufficient balance');
      }
    }

    try {
      setIsSubmitting(true);
      const newTxRef = doc(collection(db, 'transactions'));
      await setDoc(newTxRef, {
        userId: currentUser.uid,
        type: tab,
        method,
        amount: numAmount,
        accountInfo,
        ...(tab === 'deposit' ? { trxId } : {}),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success('Request submitted successfully!');
      setAccountInfo('');
      setAmount('');
      setTrxId('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
      toast.error('Failed to submit. Check console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodPlaceholder = () => {
    if (method === 'bkash') return "Your bKash Number";
    if (method === 'nagad') return "Your Nagad Phone Number";
    return "Binance UID / Email / Pay ID";
  };

  const getDepositAddress = () => {
    if (method === 'bkash') return '01934432370';
    if (method === 'nagad') return '01934432370';
    if (method === 'binance') return '88392983';
    return '';
  };

  const getTxDetails = (tx: Transaction) => {
    let cls = 'bg-gray-500/10 text-gray-400';
    let icon = <Clock size={20} />;
    let isPositive = false;

    if (tx.type === 'deposit') {
      cls = 'bg-green-500/10 text-green-400';
      icon = <ArrowDownToLine size={20} />;
      isPositive = true;
    } else if (tx.type === 'withdrawal') {
      cls = 'bg-red-500/10 text-red-500';
      icon = <Upload size={20} />;
    } else if (tx.type === 'entry_fee') {
      cls = 'bg-orange-500/10 text-orange-500';
      icon = <KeySquare size={20} />;
    } else if (tx.type === 'winning') {
      cls = 'bg-yellow-500/10 text-yellow-400';
      icon = <Trophy size={20} />;
      isPositive = true;
    }

    return { cls, icon, isPositive };
  };

  return (
    <AnimatedPage className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white font-display uppercase tracking-tight flex items-center gap-4">
            <Wallet className="text-[var(--color-primary-brand)]" size={40} /> {t('wallet')}
          </h1>
          <p className="text-gray-400 mt-2">Manage your funds, deposit, and withdraw winnings.</p>
        </div>
        <div className="glass-panel px-6 py-4 rounded-xl border-t-2 border-t-[var(--color-accent-brand)] flex items-center gap-4">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Balance</p>
          <p className="text-3xl font-display text-white">{(userProfile?.walletBalance || 0).toFixed(2)} TK</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Action Form */}
        <div className="glass-panel p-6 rounded-2xl border-t border-[var(--color-gaming-border)]">
          <div className="flex bg-black/40 rounded-xl p-1 mb-6">
            <button 
              onClick={() => setTab('deposit')} 
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors flex justify-center items-center gap-2 ${tab === 'deposit' ? 'bg-[var(--color-primary-brand)] text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <ArrowDownToLine size={16} /> {t('deposit')}
            </button>
            <button 
              onClick={() => setTab('withdraw')} 
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors flex justify-center items-center gap-2 ${tab === 'withdraw' ? 'bg-[var(--color-accent-brand)] text-black' : 'text-gray-500 hover:text-white'}`}
            >
              <Upload size={16} /> {t('withdraw')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Horizontal Method Select */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Method</label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {['bkash', 'nagad', 'binance'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m as any)}
                    className={`flex-1 min-w-[100px] py-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${method === m ? 'border-[var(--color-primary-brand)] bg-[var(--color-primary-brand)]/10' : 'border-[#1A1A24] bg-black/40 text-gray-500 hover:border-gray-600'}`}
                  >
                    <span className="font-display font-bold uppercase tracking-wider">{m}</span>
                  </button>
                ))}
              </div>
            </div>

            {tab === 'deposit' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-300">
                <p className="mb-2 font-bold text-white">Deposit the amount here: <span className="text-[var(--color-accent-brand)] text-lg px-2 selection:bg-white selection:text-black">{getDepositAddress()}</span></p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Submit the Sender Number, Transaction hash, and Amount you sent below. 
                  Wait a few minutes. If you face any problem, contact <a href="/support" className="text-[var(--color-primary-brand)] underline">Customer Service</a>.
                </p>
              </div>
            )}

            {/* Inputs */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{getMethodPlaceholder()}</label>
              <input required value={accountInfo} onChange={e=>setAccountInfo(e.target.value)} type="text" placeholder={`Enter ${method === 'binance' ? 'ID' : 'number'}...`} className="w-full bg-[#0A0A15] border border-[var(--color-gaming-border)] rounded-lg px-4 py-3 text-white focus:border-[var(--color-primary-brand)] focus:outline-none" />
            </div>
            {tab === 'deposit' && (
               <div>
                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">TrxID / Hash</label>
                 <input required value={trxId} onChange={e=>setTrxId(e.target.value)} type="text" placeholder="Enter Transaction ID" className="w-full bg-[#0A0A15] border border-[var(--color-gaming-border)] rounded-lg px-4 py-3 text-white focus:border-[var(--color-primary-brand)] focus:outline-none" />
               </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Amount (TK)</label>
              <input required value={amount} onChange={e=>setAmount(e.target.value)} type="number" min="1" step="0.01" className="w-full bg-[#0A0A15] border border-[var(--color-gaming-border)] rounded-lg px-4 py-3 text-white focus:border-[var(--color-primary-brand)] focus:outline-none" />
            </div>

            <button disabled={isSubmitting} type="submit" className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-transform hover:scale-[1.02] ${tab === 'deposit' ? 'bg-[var(--color-primary-brand)] text-white shadow-[0_0_20px_rgba(123,63,228,0.4)]' : 'bg-[var(--color-accent-brand)] text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]'}`}>
              {isSubmitting ? 'Processing...' : `Submit ${tab === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="glass-panel p-6 rounded-2xl relative flex flex-col h-full max-h-[600px] overflow-hidden">
          <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6 border-b border-[var(--color-gaming-border)] pb-4 flex items-center gap-3">
            <Clock className="text-gray-400" /> {t('history')}
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500 italic text-sm">
                No transactions found.
              </div>
            ) : (
              transactions.map(tx => {
                const { cls, icon, isPositive } = getTxDetails(tx);
                return (
                <div key={tx.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${cls}`}>
                      {icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-wider text-sm">{tx.type.replace('_', ' ')}</h4>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><CalendarDays size={12} /> {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-display font-bold text-lg ${isPositive ? 'text-green-400' : 'text-white'}`}>
                      {isPositive ? '+' : '-'}{tx.amount.toFixed(2)} TK
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      tx.status === 'approved' ? 'bg-green-500/20 text-green-400' : 
                      tx.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>

      </div>
    </AnimatedPage>
  );
}
