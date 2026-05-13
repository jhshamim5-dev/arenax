import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    tournaments: 'Tournaments',
    profile: 'Profile',
    wallet: 'Wallet',
    admin: 'Admin',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    history: 'Transaction History',
    hero_title: 'Step into the',
    hero_arena: 'Arena',
    hero_sub: 'The ultimate proving ground for gamers.',
    no_tournaments: 'No active tournaments to show right now.',
    view_all_tourneys: 'View All Tournaments',
    select_language: 'Select Language',
    refer: 'Refer',
    coming_soon: 'Coming Soon',
    tournament_history: 'Tournament History',
    entry_fee: 'Entry Fee',
    join: 'Join',
    insufficient_balance: 'Insufficient balance. Please deposit.'
  },
  bn: {
    home: 'হোম',
    tournaments: 'টুর্নামেন্ট',
    profile: 'প্রোফাইল',
    wallet: 'ওয়ালেট',
    admin: 'অ্যাডমিন',
    login: 'লগইন',
    signup: 'নিবন্ধন',
    logout: 'লগআউট',
    deposit: 'জমা দিন',
    withdraw: 'উত্তোলন',
    history: 'লেনদেনের ইতিহাস',
    hero_title: 'প্রবেশ করুন',
    hero_arena: 'অ্যারেনা',
    hero_sub: 'গেমারদের চূড়ান্ত প্রমাণের স্থান।',
    no_tournaments: 'এই মুহূর্তে দেখানোর জন্য কোনো সক্রিয় টুর্নামেন্ট নেই।',
    view_all_tourneys: 'সব টুর্নামেন্ট দেখুন',
    select_language: 'ভাষা নির্বাচন করুন',
    refer: 'রেফার করুন',
    coming_soon: 'শীঘ্রই আসছে',
    tournament_history: 'টুর্নামেন্টের ইতিহাস',
    entry_fee: 'এন্ট্রি ফি',
    join: 'যোগ দিন',
    insufficient_balance: 'অপর্যাপ্ত ব্যালেন্স। দয়া করে জমা দিন।'
  }
};

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

// Helper function to safely get nested values (simple flat strings for now)
const getTranslatedString = (lang: Language, key: string): string => {
  return translations[lang]?.[key] || key;
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('arenaLang') as Language;
    if (saved && (saved === 'en' || saved === 'bn')) {
      setLangState(saved);
      setIsReady(true);
    } else {
      // First load, not set yet! Show overlay
      setIsReady(false);
    }
  }, []);

  const setLang = (newLang: Language) => {
    localStorage.setItem('arenaLang', newLang);
    setLangState(newLang);
    setIsReady(true);
  };

  const t = (key: string) => getTranslatedString(lang, key);

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
        <div className="glass-panel p-8 rounded-3xl max-w-sm w-full text-center border border-[var(--color-gaming-border)] neon-border">
          <h2 className="text-2xl font-bold font-display uppercase tracking-wider text-white mb-8">Select Language</h2>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setLang('bn')} 
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 font-bold text-white shadow-lg transition-transform hover:-translate-y-1"
            >
              বাংলা (Bengali)
            </button>
            <button 
              onClick={() => setLang('en')} 
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[var(--color-primary-brand)] to-[var(--color-accent-brand)] hover:scale-105 font-bold text-white shadow-lg transition-transform hover:-translate-y-1"
            >
              English
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
