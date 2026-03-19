import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Package, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationCenter({ notifications, onMarkAsRead, onClearAll }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-muted)] rounded-2xl hover:bg-[var(--bg-active)] transition-all relative group"
      >
        <Bell className="w-5 h-5 group-hover:text-accent transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--bg-card)]">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-96 bg-[var(--bg-card)] rounded-3xl shadow-2xl border border-[var(--border-main)] z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-input)]/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[var(--text-main)]">Notificações</h3>
                  <span className="px-2 py-0.5 bg-accent/20 text-accent rounded-full text-[10px] font-bold">
                    {unreadCount} novas
                  </span>
                </div>
                <button 
                  onClick={onClearAll}
                  className="p-2 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Limpar tudo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-[var(--border-main)]">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        onClick={() => onMarkAsRead(notification.id)}
                        className={`p-5 hover:bg-[var(--bg-active)] transition-colors cursor-pointer relative group ${!notification.read ? 'bg-[var(--bg-active)]/50' : ''}`}
                      >
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            notification.type === 'warning' ? 'bg-[var(--bg-input)] text-amber-500' :
                            notification.type === 'error' ? 'bg-[var(--bg-input)] text-rose-500' :
                            notification.type === 'success' ? 'bg-[var(--bg-input)] text-emerald-500' :
                            'bg-[var(--bg-input)] text-accent'
                          }`}>
                            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                            {notification.type === 'error' && <X className="w-5 h-5" />}
                            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                            {notification.type === 'info' && <Info className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-bold text-[var(--text-main)] truncate pr-4">{notification.title}</p>
                              <p className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                                {format(new Date(notification.createdAt), 'HH:mm', { locale: ptBR })}
                              </p>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2 h-2 bg-accent rounded-full shadow-sm shadow-accent/20" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-[var(--bg-input)] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-[var(--text-muted)] opacity-20" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text-main)]">Tudo limpo por aqui!</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Você não tem novas notificações.</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 bg-[var(--bg-input)]/50 border-t border-[var(--border-main)]">
                  <button className="w-full py-2 text-xs font-bold text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1">
                    Ver todas as notificações
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
