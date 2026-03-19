import React from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { ArrowRight, Sparkles, Shield, Zap, Smartphone } from 'lucide-react';

interface EntryScreenProps {
  onEnter: () => void;
}

export default function EntryScreen({ onEnter }: EntryScreenProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 blur-[120px] rounded-full -z-10" />
      
      <div className="max-w-md w-full text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20 
          }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
            <Logo className="w-32 h-32 relative z-10" />
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">
              INTEGRA <span className="text-accent">PRO</span>
            </h1>
            <p className="text-[var(--text-muted)] font-medium mt-2">
              Gestão Inteligente para o seu Negócio
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <button
            onClick={onEnter}
            className="w-full py-5 brand-gradient text-white font-black text-lg rounded-[24px] shadow-2xl shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            ENTRAR NO SISTEMA
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl flex flex-col items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Seguro</span>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl flex flex-col items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Rápido</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-12"
        >
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">
            Desenvolvido por R.M Tecnologia LTDA
          </p>
        </motion.div>
      </div>
    </div>
  );
}
