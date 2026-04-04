import React, { useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, runTransaction, Timestamp, collection, addDoc } from 'firebase/firestore';
import { X, CheckCircle2, AlertCircle, Loader2, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ChangeIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

const CHANGE_ID_COST = 15000;
const CHANGE_ID_COOLDOWN_DAYS = 30;

const ChangeIdModal: React.FC<ChangeIdModalProps> = ({ isOpen, onClose, profile }) => {
  const [newId, setNewId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangeId = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const sanitizedId = newId.trim().toLowerCase();

    if (sanitizedId.length < 3 || sanitizedId.length > 20) {
      setError('ID должен быть от 3 до 20 символов');
      setLoading(false);
      return;
    }

    if (sanitizedId === profile.username.toLowerCase()) {
      setError('Новый ID совпадает с текущим');
      setLoading(false);
      return;
    }

    // Check balance
    if (profile.balance < CHANGE_ID_COST) {
      setError(`Недостаточно средств. Стоимость: ${CHANGE_ID_COST.toLocaleString()} ₸`);
      setLoading(false);
      return;
    }

    // Check cooldown
    if (profile.lastIdChange) {
      const lastChange = profile.lastIdChange.toDate();
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < CHANGE_ID_COOLDOWN_DAYS) {
        setError(`Смена ID доступна раз в 30 дней. Осталось: ${CHANGE_ID_COOLDOWN_DAYS - diffDays} дн.`);
        setLoading(false);
        return;
      }
    }

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Check if username is taken
        const usernameRef = doc(db, 'usernames', sanitizedId);
        const usernameDoc = await transaction.get(usernameRef);
        
        if (usernameDoc.exists()) {
          throw new Error('Этот ID уже занят');
        }

        // 2. Deduct balance and update profile
        const userRef = doc(db, 'users', profile.uid);
        const oldUsername = profile.username;
        
        transaction.update(userRef, {
          username: newId.trim(),
          balance: profile.balance - CHANGE_ID_COST,
          lastIdChange: Timestamp.now()
        });

        // 3. Update usernames collection
        transaction.set(usernameRef, { uid: profile.uid });
        transaction.delete(doc(db, 'usernames', oldUsername.toLowerCase()));

        // 4. Log transaction
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          uid: profile.uid,
          type: 'Withdrawal',
          amount: CHANGE_ID_COST,
          timestamp: Timestamp.now(),
          description: `Смена ID: ${oldUsername} → ${newId.trim()}`
        });
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setNewId('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при смене ID');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setLoading(true);
    try {
      const amount = 50000;
      const userRef = doc(db, 'users', profile.uid);
      await setDoc(userRef, { balance: profile.balance + amount }, { merge: true });
      
      await addDoc(collection(db, 'transactions'), {
        uid: profile.uid,
        type: 'Deposit',
        amount: amount,
        timestamp: Timestamp.now(),
        description: 'Тестовое пополнение баланса'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl -mr-16 -mt-16 rounded-full" />
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Изменение ID</h3>
              <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-lg font-bold mb-2">ID успешно изменен!</h4>
                <p className="text-sm text-slate-400">Ваш профиль обновлен.</p>
              </div>
            ) : (
              <form onSubmit={handleChangeId} className="space-y-6">
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-3">
                  <Coins className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Стоимость услуги: <span className="text-blue-400 font-bold">{CHANGE_ID_COST.toLocaleString()} ₸</span>. 
                    ID должен быть уникальным и содержать от 3 до 20 символов.
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Новый ID</label>
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="Введите новый никнейм..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading || !newId.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Подтвердить изменения'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeposit}
                    disabled={loading}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-all border border-slate-700"
                  >
                    Тестовое пополнение (+50,000 ₸)
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChangeIdModal;
