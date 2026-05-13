import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Tournaments from './pages/Tournaments';
import TournamentDetails from './pages/TournamentDetails';
import TypingGame from './pages/TypingGame';
import QuizGame from './pages/QuizGame';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Support from './pages/Support';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#0A0A15',
            color: '#fff',
            border: '1px solid var(--color-gaming-border)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-accent-brand)',
              secondary: '#black',
            },
          },
        }}
      />
      {/* Global Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary-brand)] opacity-[0.15] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--color-accent-brand)] opacity-[0.1] blur-[120px] pointer-events-none" />
      
      <Navbar />
      
      <main className="flex-grow flex flex-col relative z-10 pt-20">
        <AnimatePresence mode="wait">
          {/* @ts-expect-error - React router Routes doesn't explicitly type key but it's required for AnimatePresence */}
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/wallet" element={<Dashboard />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournament/:id" element={<TournamentDetails />} />
            <Route path="/play/typing/:id" element={<TypingGame />} />
            <Route path="/play/quiz/:id" element={<QuizGame />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<Support />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
