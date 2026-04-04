import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from './types';
import { LogIn, User as UserIcon, LogOut, LayoutDashboard, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Components
import Profile from './components/Profile';
import UserList from './components/UserList';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Listen to profile changes
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(profileRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create initial profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              username: firebaseUser.displayName || `user_${firebaseUser.uid.slice(0, 5)}`,
              role: 'Beginner',
              registrationDate: Timestamp.now(),
              balance: 0,
            };
            await setDoc(profileRef, newProfile);
            
            // Also register username
            await setDoc(doc(db, 'usernames', newProfile.username.toLowerCase()), { uid: firebaseUser.uid });
            
            setProfile(newProfile);
          }
          setLoading(false);
        });
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-8">
                <Link to="/" className="text-xl font-bold tracking-tighter text-blue-500">
                  SYSTEM<span className="text-slate-100">CORE</span>
                </Link>
                {user && (
                  <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
                    <Link to="/" className="hover:text-slate-100 transition-colors flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Профиль
                    </Link>
                    <Link to="/users" className="hover:text-slate-100 transition-colors flex items-center gap-2">
                      <Users className="w-4 h-4" /> Пользователи
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-sm font-semibold">{profile?.username}</span>
                      <span className="text-xs text-slate-500">{profile?.balance.toLocaleString()} ₸</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all active:scale-95"
                  >
                    <LogIn className="w-4 h-4" /> Войти
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route 
              path="/" 
              element={user ? <Profile profile={profile} /> : <Welcome onLogin={handleLogin} />} 
            />
            <Route 
              path="/users" 
              element={user ? <UserList /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const Welcome: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl"
    >
      <h1 className="text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
        Добро пожаловать в Систему
      </h1>
      <p className="text-xl text-slate-400 mb-10 leading-relaxed">
        Управляйте своим профилем, отслеживайте баланс и меняйте свой уникальный идентификатор в нашей современной экосистеме.
      </p>
      <button
        onClick={onLogin}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95"
      >
        Начать работу
      </button>
    </motion.div>
  </div>
);

export default App;
