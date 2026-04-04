import React, { useState, useEffect } from 'react';
import { UserProfile, ROLE_COLORS, ROLE_LABELS, Transaction } from '../types';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Calendar, Wallet, UserCircle, History, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ChangeIdModal from './ChangeIdModal';

interface ProfileProps {
  profile: UserProfile | null;
}

const Profile: React.FC<ProfileProps> = ({ profile }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isChangeIdOpen, setIsChangeIdOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', profile.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, [profile]);

  if (!profile) return null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate();
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl -mr-32 -mt-32 rounded-full" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-blue-500/20">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className={cn(
              "absolute -bottom-2 -right-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
              ROLE_COLORS[profile.role]
            )}>
              {ROLE_LABELS[profile.role]}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h2 className="text-3xl font-bold tracking-tight">{profile.username}</h2>
              <button
                onClick={() => setIsChangeIdOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
              >
                <Edit3 className="w-3.5 h-3.5" /> Изменить ID
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-slate-400">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Регистрация</span>
                  <span className="text-sm font-medium text-slate-200">{formatDate(profile.registrationDate)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-400">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Баланс</span>
                  <span className="text-sm font-medium text-emerald-400">{profile.balance.toLocaleString()} ₸</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold">История операций</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest font-bold text-slate-500 border-b border-slate-800/50">
                <th className="px-6 py-4">Дата</th>
                <th className="px-6 py-4">Тип</th>
                <th className="px-6 py-4">Сумма</th>
                <th className="px-6 py-4">Описание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {formatDate(tx.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                        tx.type === 'Deposit' 
                          ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" 
                          : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                      )}>
                        {tx.type === 'Deposit' ? 'Пополнение' : 'Списание'}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 text-sm font-bold",
                      tx.type === 'Deposit' ? "text-emerald-400" : "text-amber-400"
                    )}>
                      {tx.type === 'Deposit' ? '+' : '-'}{tx.amount.toLocaleString()} ₸
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic">
                      {tx.description || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                    Операций пока нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <ChangeIdModal 
        isOpen={isChangeIdOpen} 
        onClose={() => setIsChangeIdOpen(false)} 
        profile={profile} 
      />
    </div>
  );
};

export default Profile;
