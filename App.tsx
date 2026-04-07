import React, { useEffect, useState } from 'react';
import { 
  User, 
  ShoppingBag, 
  Users as UsersIcon, 
  LogOut, 
  History, 
  CreditCard, 
  Shield, 
  Code, 
  Star, 
  Calendar,
  IdCard,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- CONFIG ---
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJNJu3ItvN4gbicHMmBPMEuX0iKSoi30tYKpkEMgpFlbwNXEZcgNag9JA_-mreOgiiGh4_h8Bd4QJD/pub?gid=1418400211&single=true&output=csv";
const API_URL = "https://script.google.com/macros/s/AKfycbx_v_placeholder_url/exec"; // User must replace this with their GAS Web App URL
const WHATSAPP_PHONE = "77066386792";

// --- TYPES ---
type Role = 'Новичок' | 'Администратор' | 'Разработчик' | 'Контентмейкер';

interface UserData {
  name: string;
  email: string;
  nickname: string;
  role: Role;
  balance: number;
  id: string;
  regDate?: string;
  phone?: string;
}

interface Game {
  name: string;
  price: string;
  img: string;
}

interface HistoryItem {
  date: string;
  type: string;
  amount: number;
  description: string;
}

// --- HELPERS ---
const getRoleColor = (role: Role) => {
  switch (role) {
    case 'Администратор': return '#ff4d4d';
    case 'Разработчик': return '#00ff88';
    case 'Контентмейкер': return '#ff69b4';
    default: return '#3b82f6';
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Неизвестно';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

function App() {
  const [view, setView] = useState<'shop' | 'cases' | 'users' | 'profile' | 'login' | 'register'>('shop');
  const [user, setUser] = useState<UserData | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Auth Forms
  const [authData, setAuthData] = useState({ name: '', email: '', password: '', phone: '', nickname: '' });

  useEffect(() => {
    // Load Games
    fetch(SHEET_CSV_URL)
      .then(res => res.text())
      .then(data => {
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1);
        const parsed = rows.map(row => {
          const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          return {
            name: cols[0]?.replace(/"/g, '').trim() || 'Без названия',
            price: cols[1]?.replace(/"/g, '').trim() || '0',
            img: cols[2]?.replace(/"/g, '').trim() || ''
          };
        });
        setGames(parsed);
        setLoading(false);
      })
      .catch(err => console.error("Ошибка загрузки игр:", err));

    // Check local storage for user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const callApi = async (action: string, body: any = {}) => {
    if (API_URL.includes('placeholder')) {
      console.warn("API URL не настроен. Используется симуляция.");
      return null;
    }
    
    setActionLoading(true);
    try {
      // We use a simple fetch. To avoid CORS issues with GAS, 
      // the script must be deployed with 'Anyone' access and return JSON.
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ...body })
      });
      
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      return result;
    } catch (err) {
      console.error("API Error:", err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await callApi('login', { email: authData.email, password: authData.password });
      
      if (result && result.status === 'success') {
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        setView('profile');
        showMessage("Вход выполнен!");
      } else if (!result) {
        // Simulation fallback if no API
        const mockUser: UserData = {
          name: 'Асан',
          email: authData.email,
          nickname: 'asan_dev',
          role: 'Разработчик',
          balance: 25000,
          id: 'DG-777888',
          regDate: new Date().toISOString(),
          phone: '77066386792'
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setView('profile');
        showMessage("Вход выполнен (Симуляция)!");
      }
    } catch (err: any) {
      showMessage(err.message || "Ошибка входа", 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await callApi('register', authData);
      
      if (result && result.status === 'success') {
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        setView('profile');
        showMessage("Регистрация успешна!");
      } else if (!result) {
        // Simulation fallback
        const newUser: UserData = {
          ...authData,
          role: 'Новичок',
          balance: 20000,
          id: "DG-" + Math.floor(100000 + Math.random() * 900000),
          regDate: new Date().toISOString()
        };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        setView('profile');
        showMessage("Регистрация успешна (Симуляция)!");
      }
    } catch (err: any) {
      showMessage(err.message || "Ошибка регистрации", 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setView('shop');
    showMessage("Вы вышли из аккаунта");
  };

  const changeId = () => {
    if (!user) return;
    const message = `Здравствуйте! Хочу сменить свой ID.\nМой текущий ID: ${user.id}\nМой Email: ${user.email}`;
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`, '_blank');
    showMessage("Запрос на смену ID отправлен менеджеру");
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const result = await callApi('getHistory', { email: user.email });
      if (result && result.status === 'success') {
        setHistory(result.history);
      } else if (!result) {
        setHistory([
          { date: new Date().toISOString(), type: 'Пополнение', amount: 20000, description: 'Бонус при регистрации' }
        ]);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const result = await callApi('getUsers');
      if (result && result.status === 'success') {
        setAllUsers(result.users);
      } else if (!result) {
        setAllUsers([
          { name: 'Асан', nickname: 'asan_dev', role: 'Разработчик', id: 'DG-777888', balance: 0, email: '' },
          { name: 'Иван', nickname: 'admin_vanya', role: 'Администратор', id: 'DG-111222', balance: 0, email: '' },
          { name: 'Мария', nickname: 'masha_content', role: 'Контентмейкер', id: 'DG-333444', balance: 0, email: '' },
          { name: 'Петр', nickname: 'petya_new', role: 'Новичок', id: 'DG-555666', balance: 0, email: '' },
        ]);
      }
    } catch (err) {
      console.error("Users fetch error:", err);
    }
  };

  const rechargeBalance = () => {
    const amount = prompt("Введите сумму для пополнения (₸):");
    if (!amount || isNaN(Number(amount))) return;
    
    const message = `Здравствуйте! Хочу пополнить баланс на сумму ${amount} ₸.\nМой Email: ${user?.email}\nМой ID: ${user?.id}`;
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`, '_blank');
    showMessage("Запрос на пополнение отправлен менеджеру");
  };

  useEffect(() => {
    if (view === 'profile' && user) fetchHistory();
    if (view === 'users') fetchUsers();
  }, [view, user]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#00ff88] selection:text-black">
      {/* Toast Message */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-[#00ff88] text-black' : 'bg-red-500 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#161616]/80 backdrop-blur-xl border-t border-white/5 z-40 px-4 py-2 sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
        <div className="max-w-6xl mx-auto flex justify-around sm:justify-between items-center">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00ff88] rounded-lg flex items-center justify-center text-black font-black">DG</div>
            <span className="font-black tracking-tighter text-xl">DALA GAME</span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-4">
            <NavButton active={view === 'shop'} onClick={() => setView('shop')} icon={<ShoppingBag size={20} />} label="Магазин" />
            <NavButton active={view === 'cases'} onClick={() => setView('cases')} icon={<Star size={20} />} label="Кейсы" />
            <NavButton active={view === 'users'} onClick={() => setView('users')} icon={<UsersIcon size={20} />} label="Игроки" />
            {user ? (
              <NavButton active={view === 'profile'} onClick={() => setView('profile')} icon={<User size={20} />} label="Профиль" />
            ) : (
              <NavButton active={view === 'login'} onClick={() => setView('login')} icon={<User size={20} />} label="Вход" />
            )}
          </div>
        </div>
      </nav>

      <main className="pt-8 pb-24 sm:pt-24 max-w-6xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {view === 'shop' && (
            <motion.div 
              key="shop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <header className="mb-12 text-center sm:text-left">
                <h1 className="text-4xl sm:text-6xl font-black mb-4 bg-gradient-to-r from-[#00ff88] to-emerald-400 bg-clip-text text-transparent">
                  ТОПОВЫЕ ИГРЫ
                </h1>
                <p className="text-gray-400 text-lg">Лучшие предложения специально для тебя</p>
              </header>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[#00ff88] font-bold">Загрузка товаров...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {games.map((game, i) => (
                    <GameCard key={i} game={game} onBuy={() => {
                      const message = `Здравствуйте! Хочу купить игру: ${game.name}`;
                      window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`, '_blank');
                    }} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'cases' && (
            <motion.div 
              key="cases"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <CaseOpening 
                user={user} 
                onSpinStart={(cost) => {
                  if (user) {
                    const updated = { ...user, balance: user.balance - cost };
                    setUser(updated);
                    localStorage.setItem('user', JSON.stringify(updated));
                  }
                }}
                onWin={(newBalance) => {
                  if (user) {
                    const updated = { ...user, balance: newBalance };
                    setUser(updated);
                    localStorage.setItem('user', JSON.stringify(updated));
                    fetchHistory();
                  }
                }}
              />
            </motion.div>
          )}

          {view === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
                <UsersIcon className="text-[#00ff88]" />
                СПИСОК ИГРОКОВ
              </h2>
              <div className="space-y-4">
                {allUsers.map((u, i) => (
                  <div key={i} className="bg-[#161616] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-[#00ff88]/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                        {u.role === 'Администратор' ? '🛡️' : u.role === 'Разработчик' ? '💻' : u.role === 'Контентмейкер' ? '⭐' : '👤'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{u.nickname}</span>
                          <RoleBadge role={u.role} />
                        </div>
                        <span className="text-gray-500 text-sm font-mono">{u.id}</span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-700 group-hover:text-[#00ff88] transition-colors" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'profile' && user && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="space-y-6">
                  <div className="bg-[#161616] p-8 rounded-3xl border border-white/5 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff88] to-transparent opacity-50"></div>
                    <div className="w-24 h-24 bg-white/5 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner">
                      {user.role === 'Администратор' ? '🛡️' : user.role === 'Разработчик' ? '💻' : user.role === 'Контентмейкер' ? '⭐' : '👤'}
                    </div>
                    <h3 className="text-2xl font-black mb-1">{user.nickname}</h3>
                    <div className="flex justify-center mb-4">
                      <RoleBadge role={user.role} />
                    </div>
                    <div className="text-gray-500 font-mono text-sm mb-6 bg-black/30 py-1 px-3 rounded-full inline-block">
                      {user.id}
                    </div>
                    
                    <div className="pt-6 border-t border-white/5 space-y-4 text-left">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Calendar size={18} className="text-[#00ff88]" />
                        <div className="text-xs">
                          <p className="text-gray-600 uppercase font-bold tracking-widest">Регистрация</p>
                          <p className="text-white font-medium">{formatDate(user.regDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <CreditCard size={18} className="text-[#00ff88]" />
                        <div className="text-xs">
                          <p className="text-gray-600 uppercase font-bold tracking-widest">Баланс</p>
                          <p className="text-[#00ff88] text-lg font-black">{user.balance.toLocaleString()} ₸</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <LogOut size={20} />
                    ВЫЙТИ
                  </button>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                  {/* Actions */}
                  <section className="bg-[#161616] p-6 rounded-3xl border border-white/5">
                    <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Star size={20} className="text-yellow-400" />
                      ПЛАТНЫЕ УСЛУГИ
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={rechargeBalance}
                        className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-green-500/50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-3 group-hover:scale-110 transition-transform">
                          <CreditCard size={20} />
                        </div>
                        <p className="font-bold">Пополнить баланс</p>
                        <p className="text-xs text-gray-500">Через менеджера</p>
                      </button>
                      <button 
                        onClick={changeId}
                        className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00ff88]/50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 bg-[#00ff88]/10 rounded-xl flex items-center justify-center text-[#00ff88] mb-3 group-hover:scale-110 transition-transform">
                          <IdCard size={20} />
                        </div>
                        <p className="font-bold">Смена ID</p>
                        <p className="text-xs text-gray-500">Через менеджера</p>
                      </button>
                    </div>
                  </section>

                  {/* History */}
                  <section className="bg-[#161616] p-6 rounded-3xl border border-white/5">
                    <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <History size={20} className="text-[#00ff88]" />
                      ИСТОРИЯ ОПЕРАЦИЙ
                    </h4>
                    <div className="space-y-3">
                      {history.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">История пуста</p>
                      ) : (
                        history.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                item.type === 'Пополнение' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {item.type === 'Пополнение' ? '+' : '-'}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{item.description}</p>
                                <p className="text-[10px] text-gray-600 uppercase font-bold">{formatDate(item.date)}</p>
                              </div>
                            </div>
                            <div className={`font-black ${
                              item.type === 'Пополнение' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {item.type === 'Пополнение' ? '+' : '-'}{item.amount.toLocaleString()} ₸
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {user.role === 'Администратор' && (
                    <section className="bg-red-500/5 p-6 rounded-3xl border border-red-500/10">
                      <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-500">
                        <Shield size={20} />
                        ПАНЕЛЬ АДМИНИСТРАТОРА
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                          onClick={() => {
                            const email = prompt("Email пользователя:");
                            const amount = prompt("Сумма пополнения:");
                            if (email && amount) {
                              callApi('saveWin', { email, winAmount: Number(amount), gameName: 'Админ-пополнение' })
                                .then(() => showMessage("Баланс пополнен!"))
                                .catch(err => showMessage(err.message, 'error'));
                            }
                          }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/50 transition-all text-left"
                        >
                          <p className="font-bold">Пополнить баланс (Email)</p>
                          <p className="text-xs text-gray-500">Прямое начисление</p>
                        </button>
                        <button 
                          onClick={() => {
                            const email = prompt("Email пользователя:");
                            const role = prompt("Новая роль (Новичок, Администратор, Разработчик, Контентмейкер):");
                            if (email && role) {
                              callApi('updateProfile', { email, role })
                                .then(() => showMessage("Роль обновлена!"))
                                .catch(err => showMessage(err.message, 'error'));
                            }
                          }}
                          className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/50 transition-all text-left"
                        >
                          <p className="font-bold">Изменить роль</p>
                          <p className="text-xs text-gray-500">Управление правами</p>
                        </button>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {(view === 'login' || view === 'register') && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto bg-[#161616] p-8 rounded-3xl border border-white/5 shadow-2xl"
            >
              <h2 className="text-3xl font-black mb-8 text-center">
                {view === 'login' ? 'С ВОЗВРАЩЕНИЕМ!' : 'СОЗДАТЬ АККАУНТ'}
              </h2>
              <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
                {view === 'register' && (
                  <>
                    <Input label="Имя" value={authData.name} onChange={v => setAuthData({...authData, name: v})} placeholder="Ваше имя" />
                    <Input label="Никнейм" value={authData.nickname} onChange={v => setAuthData({...authData, nickname: v})} placeholder="Придумайте ник" />
                    <Input label="Телефон" value={authData.phone} onChange={v => setAuthData({...authData, phone: v})} placeholder="77066386792" />
                  </>
                )}
                <Input label="Email" type="email" value={authData.email} onChange={v => setAuthData({...authData, email: v})} placeholder="example@mail.com" />
                <Input label="Пароль" type="password" value={authData.password} onChange={v => setAuthData({...authData, password: v})} placeholder="••••••••" />
                
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-4 rounded-2xl bg-[#00ff88] text-black font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                >
                  {actionLoading ? 'ЗАГРУЗКА...' : (view === 'login' ? 'ВОЙТИ' : 'ЗАРЕГИСТРИРОВАТЬСЯ')}
                </button>
              </form>
              
              <p className="mt-8 text-center text-gray-500">
                {view === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                <button 
                  onClick={() => setView(view === 'login' ? 'register' : 'login')}
                  className="ml-2 text-[#00ff88] font-bold hover:underline"
                >
                  {view === 'login' ? 'Создать' : 'Войти'}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- SUBCOMPONENTS ---

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-2 rounded-xl transition-all ${
        active ? 'bg-[#00ff88] text-black font-bold' : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-[10px] sm:text-sm uppercase tracking-wider font-bold">{label}</span>
    </button>
  );
}

interface GameCardProps {
  game: Game;
  onBuy: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onBuy }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-[#161616] rounded-[2.5rem] overflow-hidden border border-white/5 group"
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-[#222]">
        {game.img ? (
          <img 
            src={game.img} 
            alt={game.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-700">Нет фото</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60"></div>
      </div>
      <div className="p-8">
        <h3 className="text-xl font-black mb-2 min-h-[3.5rem] leading-tight">{game.name}</h3>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Цена</p>
            <p className="text-3xl font-black text-[#00ff88]">{game.price} ₸</p>
          </div>
          <button 
            onClick={onBuy}
            className="p-4 rounded-2xl bg-[#00ff88] text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,136,0.3)]"
          >
            <ShoppingBag size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const color = getRoleColor(role);
  const Icon = role === 'Администратор' ? Shield : role === 'Разработчик' ? Code : role === 'Контентмейкер' ? Star : User;
  
  return (
    <div 
      style={{ backgroundColor: `${color}20`, color: color, borderColor: `${color}40` }}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
    >
      <Icon size={12} />
      {role}
    </div>
  );
}

interface InputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
}

function Input({ label, value, onChange, type = 'text', placeholder }: InputProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-all placeholder:text-gray-700"
      />
    </div>
  );
}

// --- CASE OPENING COMPONENT ---

const RANGES = [
  { id: 'low', name: "Обычный приз", chance: 85, color: "bg-zinc-800", glow: "shadow-[0_0_15px_rgba(255,255,255,0.1)]", image: "https://img.icons8.com/ios-filled/100/ffffff/controller.png", value: 500 },
  { id: 'mid', name: "Редкий приз", chance: 10, color: "bg-blue-900/40", glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]", image: "https://img.icons8.com/ios-filled/100/ffffff/trophy.png", value: 12000 },
  { id: 'super', name: "Супер-приз", chance: 4, color: "bg-purple-900/40", glow: "shadow-[0_0_25px_rgba(168,85,247,0.4)]", image: "https://img.icons8.com/ios-filled/100/ffffff/crown.png", value: 25000 },
  { id: 'legendary', name: "Легендарный приз", chance: 1, color: "bg-yellow-600/40", glow: "shadow-[0_0_30px_rgba(234,179,8,0.5)]", image: "https://img.icons8.com/ios-filled/100/ffffff/diamond.png", value: 100000 }
];

function CaseOpening({ user, onSpinStart, onWin }: { user: UserData | null, onSpinStart: (cost: number) => void, onWin: (newBalance: number) => void }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const CASE_COST = 10000;

  const generateItems = (count = 100) => {
    const pool = [];
    for (let i = 0; i < count; i++) {
      const rand = Math.random() * 100;
      let range;
      if (rand < 85) range = RANGES[0];
      else if (rand < 95) range = RANGES[1];
      else if (rand < 99) range = RANGES[2];
      else range = RANGES[3];
      pool.push({ ...range, spinId: i });
    }
    return pool;
  };

  useEffect(() => {
    setItems(generateItems(30));
  }, []);

  const handleSpin = async () => {
    if (spinning || isAnimating) return;
    if (!user) return alert("Войдите в аккаунт");
    if (user.balance < CASE_COST) return alert("Недостаточно средств");

    setSpinning(true);
    setResult(null);
    setTranslateX(0);
    setIsAnimating(false);

    onSpinStart(CASE_COST);

    const newItems = generateItems(120);
    setItems(newItems);

    await new Promise(r => setTimeout(r, 50));
    setIsAnimating(true);
    await new Promise(r => setTimeout(r, 50));

    const itemWidth = 166; 
    const winIndex = 100; 
    const containerWidth = containerRef.current?.offsetWidth || 1000;
    const randomOffset = Math.floor(Math.random() * 60) - 30;
    const offset = -(winIndex * itemWidth) + (containerWidth / 2) - (itemWidth / 2) - 16 + randomOffset;
    
    setTranslateX(offset);

    setTimeout(async () => {
      const wonRange = newItems[winIndex];
      setResult(wonRange);
      setSpinning(false);
      setIsAnimating(false);

      // Save win to DB
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'saveWin',
            email: user.email,
            win: wonRange.name,
            gameName: wonRange.name,
            winAmount: wonRange.value,
            type: 'Case'
          })
        });
        const data = await response.json();
        if (data.status === 'success') {
          onWin(data.balance);
        }
      } catch (e) {
        // Simulation fallback
        onWin(user.balance - CASE_COST + wonRange.value);
      }
    }, 7200);
  };

  return (
    <div className="py-12 text-center">
      <div className="mb-12">
        <h2 className="text-5xl font-black mb-2">DALA<span className="text-[#00ff88]">CASE</span></h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest">Испытай свою удачу</p>
        <div className="mt-6 inline-block bg-[#00ff88]/10 border border-[#00ff88]/30 px-6 py-2 rounded-full text-[#00ff88] font-bold">
          Стоимость: 10,000 ₸
        </div>
      </div>

      <div ref={containerRef} className="relative h-48 bg-[#161616] border-y border-white/5 overflow-hidden mb-12 flex items-center">
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-[#00ff88] z-30 shadow-[0_0_20px_#00ff88]"></div>
        <div 
          className="flex gap-4 px-4"
          style={{ 
            transform: `translateX(${translateX}px)`,
            transition: isAnimating ? 'transform 7s cubic-bezier(0.1, 0, 0.1, 1)' : 'none'
          }}
        >
          {items.map((item, i) => (
            <div key={i} className={`min-w-[150px] h-32 ${item.color} ${item.glow} rounded-3xl border border-white/10 p-4 flex flex-col items-center justify-center gap-2`}>
              <img src={item.image} alt="" className="h-12 w-12 object-contain" />
              <span className="text-[10px] font-black text-center uppercase tracking-tighter">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {!result && (
        <button 
          onClick={handleSpin}
          disabled={spinning}
          className="bg-[#00ff88] text-black px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {spinning ? 'КРУТИМ...' : 'ОТКРЫТЬ КЕЙС'}
        </button>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#161616] border-2 border-[#00ff88] p-8 rounded-[3rem] max-w-sm mx-auto shadow-[0_0_50px_rgba(0,255,136,0.2)]"
        >
          <p className="text-[#00ff88] font-black uppercase tracking-widest mb-4">Твой выигрыш!</p>
          <div className={`w-32 h-32 mx-auto ${result.color} rounded-3xl mb-4 flex items-center justify-center`}>
            <img src={result.image} alt="" className="w-20 h-20" />
          </div>
          <h3 className="text-2xl font-black mb-6">{result.name}</h3>
          <button 
            onClick={() => setResult(null)}
            className="w-full bg-white text-black py-4 rounded-xl font-black uppercase"
          >
            ОТЛИЧНО
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default App;
