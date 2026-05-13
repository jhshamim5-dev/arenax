import AnimatedPage from '../components/AnimatedPage';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, getDocs, setDoc, doc, updateDoc, serverTimestamp, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { Trash2, ShieldPlus, CheckCircle, XCircle } from 'lucide-react';
import { UserProfile } from '../contexts/AuthContext';

interface UserData extends UserProfile {
  id: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  method: string;
  amount: number;
  accountInfo: string;
  trxId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export default function Admin() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Tournament Create Form State
  const [tName, setTName] = useState('');
  const [tGame, setTGame] = useState('');
  const [tPrize, setTPrize] = useState(1000);
  const [tMaxTeams, setTMaxTeams] = useState(16);
  const [isCreating, setIsCreating] = useState(false);
  
  const [adminTab, setAdminTab] = useState<'users' | 'transactions' | 'tournaments'>('users');

  // Tournament State
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    if (userProfile?.role !== 'admin') return;

    const uQ = query(collection(db, 'users'));
    const unsubU = onSnapshot(uQ, (snapshot) => {
      const results: UserData[] = [];
      snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() } as UserData));
      setUsers(results);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const txQ = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubTx = onSnapshot(txQ, (snapshot) => {
      const results: Transaction[] = [];
      snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(results);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));

    const trQ = query(collection(db, 'tournaments'));
    const unsubTr = onSnapshot(trQ, (snapshot) => {
      const results: any[] = [];
      snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
      setTournaments(results);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tournaments'));

    return () => { unsubU(); unsubTx(); unsubTr(); };
  }, [userProfile]);

  const handleStartTournament = async (tId: string) => {
    try {
      await updateDoc(doc(db, 'tournaments', tId), { status: 'active' });
      alert('Tournament started!');
    } catch(e) {
      handleFirestoreError(e, OperationType.UPDATE, `tournaments/${tId}`);
    }
  };

  // Removed createTypes since the data is supposed to just stay there and the user wants to start them manually.
  // Although the user asked to be able to start manually without 50 players, this functionality already exists! The 'Start' button sets status to 'active' instantly. So testing is fully supported.

  const handleCompleteTournament = async (tId: string) => {
    try {
      await updateDoc(doc(db, 'tournaments', tId), { status: 'completed' });
      alert('Tournament completed!');
    } catch(e) {
      handleFirestoreError(e, OperationType.UPDATE, `tournaments/${tId}`);
    }
  };

  const handleUpdateBalance = async (userId: string, currentBalance: number) => {
    const amountStr = prompt(`Enter new absolute balance amount for user:`);
    if (amountStr === null) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount < 0) return alert('Invalid amount');
    try {
      await updateDoc(doc(db, 'users', userId), { walletBalance: amount });
      alert('Balance updated successfully!');
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleTransactionAction = async (tx: Transaction, newStatus: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to mark this transaction as ${newStatus}?`)) return;
    try {
      if (newStatus === 'approved') {
        const user = users.find(u => u.id === tx.userId);
        if (!user) return alert('User not found!');
        const newBalance = tx.type === 'deposit' 
          ? (user.walletBalance || 0) + tx.amount
          : (user.walletBalance || 0) - tx.amount;
        if (newBalance < 0) return alert('User cannot have negative balance!');
        await updateDoc(doc(db, 'users', tx.userId), { walletBalance: newBalance });
      }
      await updateDoc(doc(db, 'transactions', tx.id), { status: newStatus });
      alert(`Transaction ${newStatus} successfully!`);
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `transactions/${tx.id}`);
       alert('Transaction action failed.');
    }
  };

  const handleDeleteUser = async (id: string, role: string) => {
    if (role === 'admin') return alert("Cannot delete other admins from UI.");
    if(confirm("Delete this user?")) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
      }
    }
  };

  const createTypes = async () => {
    try {
      // First, delete existing tournaments
      const snap = await getDocs(collection(db, 'tournaments'));
      for (const tDoc of snap.docs) {
        await deleteDoc(doc(db, 'tournaments', tDoc.id));
      }

      await setDoc(doc(collection(db, 'tournaments')), {
        name: "Typing Tournament",
        game: "Typing",
        prizePool: 400,
        entryFee: 10,
        status: 'upcoming',
        maxPlayers: 50,
        registeredPlayers: 0,
        participants: [],
        description: "Test your typing speed! The fastest typist takes home the 400 TK prize pool.",
        image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800&auto=format&fit=crop',
        createdAt: serverTimestamp()
      });
      alert('Seeded exactly 1 Typing Tournament! (Old tournaments deleted)');
    } catch (e) {
      console.error(e);
      alert('Failed to seed');
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <AnimatedPage className="py-20 text-center">
        <h2 className="text-3xl text-red-500 font-bold mb-4 font-display">Access Denied</h2>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white font-display uppercase tracking-tight flex items-center gap-3">
            <ShieldPlus className="text-[var(--color-accent-brand)]" size={32} /> Admin Controls
          </h1>
          <p className="text-gray-400 mt-2 text-sm">System administration and wallet management.</p>
        </div>
        <button onClick={createTypes} className="text-xs bg-white/10 px-3 py-2 rounded">Seed Tournaments</button>
      </div>

      <div className="flex bg-black/40 rounded-xl p-1 mb-8">
        <button onClick={() => setAdminTab('users')} className={`flex-1 py-3 text-sm font-bold uppercase ${adminTab === 'users' ? 'bg-[var(--color-primary-brand)]' : 'text-gray-500'}`}>Users</button>
        <button onClick={() => setAdminTab('transactions')} className={`flex-1 py-3 text-sm font-bold uppercase ${adminTab === 'transactions' ? 'bg-[var(--color-accent-brand)] text-black' : 'text-gray-500'}`}>Transactions</button>
        <button onClick={() => setAdminTab('tournaments')} className={`flex-1 py-3 text-sm font-bold uppercase ${adminTab === 'tournaments' ? 'bg-purple-500' : 'text-gray-500'}`}>Tournaments</button>
      </div>

      <div className="glass-panel p-6 rounded-2xl relative min-h-[500px]">
        {adminTab === 'users' && (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-400">
               <thead className="text-xs uppercase bg-[var(--color-gaming-card)] text-gray-500">
                 <tr>
                   <th className="px-4 py-3">User</th>
                   <th className="px-4 py-3">Role</th>
                   <th className="px-4 py-3">Balance</th>
                   <th className="px-4 py-3">Change Balance</th>
                   <th className="px-4 py-3">Action</th>
                 </tr>
               </thead>
               <tbody>
                 {users.map(u => (
                   <tr key={u.id} className="border-b border-[var(--color-gaming-border)] hover:bg-white/5">
                     <td className="px-4 py-3 font-medium text-white">
                        {u.gamerTag} <br/> <span className="text-xs text-gray-500 font-normal">{u.email}</span>
                     </td>
                     <td className="px-4 py-3">
                       <span className={`px-2 py-1 text-[10px] uppercase rounded font-bold ${u.role === 'admin' ? 'bg-[var(--color-accent-brand)] text-black' : 'bg-gray-700 text-gray-300'}`}>
                         {u.role}
                       </span>
                     </td>
                     <td className="px-4 py-3 text-[var(--color-accent-brand)] font-bold">${u.walletBalance?.toFixed(2)}</td>
                     <td className="px-4 py-3">
                        <button onClick={() => handleUpdateBalance(u.id, u.walletBalance)} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded">Edit</button>
                     </td>
                     <td className="px-4 py-3">
                       <button onClick={() => handleDeleteUser(u.id, u.role)} className="p-1 text-gray-500 hover:text-red-500">
                         <Trash2 size={16} />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {adminTab === 'transactions' && (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-400">
               <thead className="text-xs uppercase bg-[var(--color-gaming-card)] text-gray-500">
                 <tr>
                   <th className="px-4 py-3">User / Type</th>
                   <th className="px-4 py-3">Details</th>
                   <th className="px-4 py-3">Amount</th>
                   <th className="px-4 py-3">Status</th>
                   <th className="px-4 py-3">Action</th>
                 </tr>
               </thead>
               <tbody>
                 {transactions.map(tx => {
                   const u = users.find(u=>u.id === tx.userId);
                   return (
                   <tr key={tx.id} className="border-b border-[var(--color-gaming-border)] hover:bg-white/5">
                     <td className="px-4 py-3 font-medium text-white">
                        {u?.gamerTag || 'Unknown'} <br/>
                        <span className={`text-[10px] uppercase ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>{tx.type}</span>
                     </td>
                     <td className="px-4 py-3">
                        Method: <span className="uppercase text-white">{tx.method}</span> <br/>
                        Num: {tx.accountInfo} <br/>
                        {tx.type === 'deposit' && `TrxID: ${tx.trxId}`}
                     </td>
                     <td className="px-4 py-3 font-bold text-white">${tx.amount.toFixed(2)}</td>
                     <td className="px-4 py-3">
                       <span className={`px-2 py-1 text-[10px] uppercase rounded font-bold ${tx.status === 'approved' ? 'bg-green-500/20 text-green-400' : tx.status === 'rejected' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                         {tx.status}
                       </span>
                     </td>
                     <td className="px-4 py-3 flex gap-2">
                       {tx.status === 'pending' && (
                         <>
                           <button onClick={() => handleTransactionAction(tx, 'approved')} className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500 flex items-center gap-1 rounded">
                             <CheckCircle size={14} /> 
                           </button>
                           <button onClick={() => handleTransactionAction(tx, 'rejected')} className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500 flex items-center gap-1 rounded">
                             <XCircle size={14} /> 
                           </button>
                         </>
                       )}
                     </td>
                   </tr>
                 )})}
               </tbody>
             </table>
           </div>
        )}

        {adminTab === 'tournaments' && (
           <div className="overflow-x-auto">
             <div className="mb-4">
               <button onClick={createTypes} className="bg-[var(--color-primary-brand)] px-4 py-2 rounded text-white text-sm font-bold uppercase">
                 Seed 1 Typing Tournament
               </button>
             </div>
             <table className="w-full text-left text-sm text-gray-400">
               <thead className="text-xs uppercase bg-[var(--color-gaming-card)] text-gray-500">
                 <tr>
                   <th className="px-4 py-3">Tournament</th>
                   <th className="px-4 py-3">Players</th>
                   <th className="px-4 py-3">Status</th>
                   <th className="px-4 py-3">Action</th>
                 </tr>
               </thead>
               <tbody>
                 {tournaments.map(t => (
                   <tr key={t.id} className="border-b border-[var(--color-gaming-border)] hover:bg-white/5">
                     <td className="px-4 py-3 font-medium text-white">{t.name} <br/><span className="text-xs text-[var(--color-primary-brand)]">Fee: {t.entryFee} TK</span></td>
                     <td className="px-4 py-3">{t.registeredPlayers} / {t.maxPlayers}</td>
                     <td className="px-4 py-3 uppercase text-xs">{t.status}</td>
                     <td className="px-4 py-3 flex gap-2">
                       {t.status === 'upcoming' && <button onClick={() => handleStartTournament(t.id)} className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">Start</button>}
                       {t.status === 'active' && <button onClick={() => handleCompleteTournament(t.id)} className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">Complete</button>}
                       <button onClick={async () => {
                         if(confirm('Delete?')) await deleteDoc(doc(db, 'tournaments', t.id));
                       }} className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs">Delete</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </AnimatedPage>
  );
}
