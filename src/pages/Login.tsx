import AnimatedPage from '../components/AnimatedPage';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { signInWithGoogle, loginWithEmail, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore_errors';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { useLanguage } from '../contexts/LanguageContext';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const bootstrapUser = async (user: any) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      try {
        const role = user.email === 'jhshamim5@gmail.com' ? 'admin' : 'user';
        await setDoc(userDocRef, {
          email: user.email,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          gamerTag: user.displayName?.replace(/\s+/g, '') || `User${user.uid.substring(0,5)}`,
          role: role,
          walletBalance: 0,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to bootstrap user", e);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const result = await signInWithGoogle();
      await bootstrapUser(result.user);
      navigate('/profile');
    } catch (e) {
      if (e instanceof FirebaseError) {
        setError(e.message);
      } else {
        setError(String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!email || !password) return setError("Please enter email and password");
    try {
      setError('');
      setLoading(true);
      const result = await loginWithEmail(email, password);
      await bootstrapUser(result.user);
      navigate('/profile');
    } catch (e) {
      if (e instanceof FirebaseError) {
        setError(e.message);
      } else {
        setError(String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage className="items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative min-h-[calc(100vh-80px)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 glass-panel p-8 sm:p-10 rounded-3xl relative z-10 neon-border"
      >
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-white font-display uppercase tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to access your dashboard, teams, and active tournaments.
          </p>
        </div>
        
        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 text-red-300 text-sm border border-red-500/50">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" required className="w-full bg-[#0A0A15] border border-[var(--color-gaming-border)] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[var(--color-primary-brand)] transition-colors text-sm" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" required className="w-full bg-[#0A0A15] border border-[var(--color-gaming-border)] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[var(--color-primary-brand)] transition-colors text-sm" />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-[var(--color-primary-brand)] hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all neon-border shadow-lg">
              {loading ? 'Signing in...' : 'Sign In with Email'}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="shrink-0 px-4 text-gray-500 text-sm">Or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-4 border border-[var(--color-gaming-border)] bg-[var(--color-gaming-card)] rounded-xl text-[16px] font-bold text-white hover:bg-white/5 transition-colors neon-border disabled:opacity-50"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
              Sign in with Google
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-400 mt-6 pt-6 border-t border-[var(--color-gaming-border)]">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-[var(--color-accent-brand)] hover:underline inline-flex items-center gap-1">
              Create an account <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </motion.div>
    </AnimatedPage>
  );
}
