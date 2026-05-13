import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Menu, X, Trophy, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { logOut } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  const { t, lang, setLang } = useLanguage();

  const navLinks = [
    { name: t('tournaments'), path: '/tournaments' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: t('refer'), path: '/refer' },
    { name: 'Customer Service', path: '/support' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 border-x-0 border-t-0 rounded-none shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-brand)] to-[var(--color-accent-brand)] flex items-center justify-center shadow-[0_0_15px_rgba(123,63,228,0.5)] group-hover:shadow-[0_0_25px_rgba(123,63,228,0.8)] transition-all duration-300">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-white group-hover:text-glow transition-all">
                ArenaX
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={(e) => {
                    if(link.path === '/refer') {
                      e.preventDefault();
                      toast(t('coming_soon'), { icon: '🔜' });
                    }
                  }}
                  className={`text-sm font-medium transition-colors hover:text-white inline-flex items-center ${
                    location.pathname === link.path ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center space-x-4 pl-6 border-l border-[var(--color-gaming-border)]">
              <button onClick={() => setLang(lang === 'en' ? 'bn' : 'en')} className="text-xs font-bold uppercase tracking-widest text-[var(--color-accent-brand)] hover:text-white mr-2 border border-[var(--color-accent-brand)]/30 px-2 py-1 rounded">
                {lang === 'en' ? 'BN' : 'EN'}
              </button>
              {currentUser ? (
                <>
                  {userProfile?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="text-sm font-bold text-[var(--color-accent-brand)] hover:text-white transition-colors"
                    >
                      {t('admin')}
                    </Link>
                  )}
                  <Link
                    to="/wallet"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    {t('wallet')}
                  </Link>
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-[var(--color-primary-brand)] hover:text-white transition-colors flex items-center gap-1"
                  >
                    <User size={16} /> {t('profile')}
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    {t('login')}
                  </Link>
                  <Link 
                    to="/signup" 
                    className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white overflow-hidden rounded-full group bg-[var(--color-gaming-card)] border border-[var(--color-gaming-border)] hover:border-[var(--color-primary-brand)] transition-colors"
                  >
                    <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-[var(--color-primary-brand)] rounded-full group-hover:w-56 group-hover:h-56"></span>
                    <span className="relative flex items-center gap-2">
                      <User size={16} />
                      {t('signup')}
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white focus:outline-none p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={{
          open: { opacity: 1, height: 'auto' },
          closed: { opacity: 0, height: 0 }
        }}
        className="md:hidden overflow-hidden glass-panel border-x-0 border-b-0"
      >
        <div className="px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={(e) => {
                if(link.path === '/refer') {
                  e.preventDefault();
                  toast(t('coming_soon'), { icon: '🔜' });
                } else {
                  setIsOpen(false);
                }
              }}
              className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-[var(--color-gaming-card)] rounded-md"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-[var(--color-gaming-border)] flex flex-col gap-3">
            <button onClick={() => { setLang(lang === 'en' ? 'bn' : 'en'); setIsOpen(false); }} className="w-full text-left px-3 py-3 text-base font-bold text-[var(--color-accent-brand)] hover:text-white bg-[var(--color-gaming-card)]/50 rounded-md">
              Switch Language ({lang === 'en' ? 'বাংলা' : 'English'})
            </button>
            {currentUser ? (
              <>
                {userProfile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-3 py-3 text-base font-bold text-[var(--color-accent-brand)] hover:text-white hover:bg-[var(--color-gaming-card)] rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    {t('admin')}
                  </Link>
                )}
                <Link
                  to="/wallet"
                  className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-[var(--color-gaming-card)] rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  {t('wallet')}
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-3 text-base font-medium text-[var(--color-primary-brand)] hover:text-white hover:bg-[var(--color-gaming-card)] rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  {t('profile')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-[var(--color-gaming-card)] rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-base font-medium text-white bg-[var(--color-primary-brand)] rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </nav>
  );
}
