import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, limit } from 'firebase/firestore';
import { UserProfile, ROLE_COLORS, ROLE_LABELS } from '../types';
import { Users, Search, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(userList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Пользователи</h2>
            <p className="text-sm text-slate-500">Список всех участников системы</p>
          </div>
        </div>

        <div className="relative group max-w-sm w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Поиск по никнейму..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
          ))
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">{user.username}</h3>
                    <div className={cn(
                      "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border",
                      ROLE_COLORS[user.role]
                    )}>
                      {ROLE_LABELS[user.role]}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    ID: {user.uid.slice(0, 8)}...
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-slate-400 transition-colors" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-500 italic">Пользователи не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
