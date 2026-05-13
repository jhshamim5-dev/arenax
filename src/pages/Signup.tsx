import AnimatedPage from '../components/AnimatedPage';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Mail, Lock, User as UserIcon } from 'lucide-react';
import { signInWithGoogle, registerWithEmail, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gamerTag, setGamerTag] = useState('');

  const bootstrapUser = async (user: any, customTag?: string) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      try {
        const role = user.email === 'jhshamim5@gmail.com' ? 'admin' : 'user';
        await setDoc(userDocRef, {
          email: user.email,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          gamerTag: customTag || user.displayName?.replace(/\s+/g, '') || `User${user.uid.substring(0,5)}`,
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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!email || !password || !gamerTag) return setError("Please fill all fields");
    try {
      setError('');
      setLoading(true);
      const result = await registerWithEmail(email, password);
      await bootstrapUser(result.user, gamerTag);
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-4xl w-full flex flex-col md:flex-row overflow-hidden rounded-3xl glass-panel border border-[var(--color-gaming-border)] relative z-10 neon-border bg-[#0A0A15]/80"
      >
        {/* Left Side: Brand/Info */}
        <div className="w-full md:w-1/2 p-10 md:p-12 relative overflow-hidden hidden md:flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-brand)] to-[var(--color-accent-brand)] opacity-20 pointer-events-none"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[var(--color-primary-brand)] blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[var(--color-accent-brand)] blur-[100px] rounded-full"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold text-white font-display uppercase tracking-tight leading-tight">
              Join The <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Revolution.</span>
            </h2>
            <p className="mt-4 text-gray-300 text-sm leading-relaxed">
              Create your account to start managing tournaments, building teams, and climbing the global rankings. Are you ready?
            </p>
          </div>

          <div className="relative z-10 space-y-6 mt-12">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                <ShieldCheck size={20} className="text-[var(--color-accent-brand)]" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wide">Anti-Cheat Enabled</h4>
                <p className="text-gray-400 text-xs">Secure environments for fair and competitive play.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-10 md:p-12 bg-[#050510] flex flex-col justify-center">
          <div className="text-center md:text-left mb-8">
            <h3 className="text-2xl font-bold text-white font-display uppercase tracking-tight">Create Account</h3>
            <p className="mt-2 text-sm text-gray-400">Join using email or Google to get started immediately.</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm border border-red-500/50">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                <input value={gamerTag} onChange={e=>setGamerTag(e.target.value)} type="text" placeholder="Gamer Tag" required className="w-full bg-[#0A0A15] border border-[var(--color-gaming-border)] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[var(--color-primary-brand)] transition-colors text-sm" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" required className="w-full bg-[#0A0A15] border border-[var(--color-gaming-border)] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[var(--color-primary-brand)] transition-colors text-sm" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" required className="w-full bg-[#0A0A15] border border-[var(--color-gaming-border)] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[var(--color-primary-brand)] transition-colors text-sm" />
              </div>
              <button disabled={loading} type="submit" className="w-full bg-[var(--color-accent-brand)] hover:brightness-110 text-black font-bold py-3 rounded-xl transition-all neon-border shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                {loading ? 'Creating...' : 'Sign Up with Email'}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="shrink-0 px-4 text-gray-500 text-sm">Or</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-4 border border-[var(--color-gaming-border)] bg-[var(--color-gaming-card)] rounded-xl text-[16px] font-bold text-white hover:bg-white/5 transition-colors neon-border disabled:opacity-50"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
              Sign up with Google
            </button>
            
            <p className="text-center text-sm text-gray-400 pt-6 border-t border-[var(--color-gaming-border)]">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[var(--color-primary-brand)] hover:underline inline-flex items-center gap-1">
                Log in <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatedPage>
  );
}
