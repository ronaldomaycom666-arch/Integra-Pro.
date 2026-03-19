import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Smartphone,
  FileText,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Bem-vindo ao Integra Pro",
      description: "O sistema de gestão completo para o seu negócio. Vamos te mostrar como tirar o máximo proveito das nossas ferramentas.",
      icon: Sparkles,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      title: "Gestão de Produtos",
      description: "Cadastre seus produtos, controle o estoque em tempo real e receba alertas automáticos quando os itens estiverem acabando.",
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      tips: ["Use o leitor de código de barras para agilizar", "Adicione fotos para facilitar a identificação"]
    },
    {
      title: "Cadastro de Clientes",
      description: "Mantenha uma base de dados organizada dos seus clientes para um atendimento personalizado e histórico de compras.",
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      tips: ["Registre e-mail e telefone para contato rápido"]
    },
    {
      title: "Realizando Vendas",
      description: "Crie vendas rápidas, adicione produtos ao carrinho e gere orçamentos ou recibos em PDF profissional instantaneamente.",
      icon: ShoppingCart,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      tips: ["Gere PDFs com o logo da sua empresa", "Compartilhe recibos via WhatsApp"]
    },
    {
      title: "Relatórios e Dashboard",
      description: "Acompanhe sua receita, ticket médio e desempenho de vendas através de gráficos intuitivos e relatórios detalhados.",
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      title: "Configurações",
      description: "Personalize o sistema com os dados da sua empresa, logo, moeda e preferências de notificação.",
      icon: Settings,
      color: "text-slate-500",
      bg: "bg-slate-500/10"
    }
  ];

  const features = [
    { icon: Zap, title: "Rápido & Fluido", desc: "Interface otimizada para máxima produtividade." },
    { icon: Shield, title: "Seguro", desc: "Seus dados protegidos com a infraestrutura Google." },
    { icon: Smartphone, title: "Mobile Ready", desc: "Acesse de qualquer lugar, celular ou tablet." },
    { icon: FileText, title: "Recibos PDF", desc: "Documentos profissionais com sua marca." }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/5 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-4 h-4" />
            O Futuro da sua Gestão Comercial
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center"
          >
            <Logo className="w-24 h-24" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-[var(--text-main)] tracking-tight"
          >
            Integra <span className="text-accent">Pro</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-[var(--text-muted)] leading-relaxed"
          >
            A plataforma definitiva para gerenciar produtos, clientes e vendas com simplicidade, elegância e resultados reais.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-5 brand-gradient text-white font-bold rounded-2xl shadow-2xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowTutorial(true)}
              className="w-full sm:w-auto px-10 py-5 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] font-bold rounded-2xl hover:bg-[var(--bg-active)] transition-all flex items-center justify-center gap-3"
            >
              Ver Tutorial
              <Play className="w-5 h-5 fill-current" />
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em] pt-12"
          >
            Desenvolvido por R.M Tecnologia LTDA
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-[var(--bg-card)] border-y border-[var(--border-main)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-[var(--bg-main)] rounded-3xl border border-[var(--border-main)] space-y-4"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-main)]">{f.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTutorial(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--bg-card)] rounded-[40px] shadow-2xl overflow-hidden border border-[var(--border-main)]"
            >
              <div className="p-8 flex items-center justify-between border-b border-[var(--border-main)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-xl">
                    <HelpCircle className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-main)]">Tutorial Completo</h3>
                </div>
                <button 
                  onClick={() => setShowTutorial(false)}
                  className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-active)] rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
                  {tutorialSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`w-3 h-3 rounded-full shrink-0 transition-all ${
                        activeStep === i ? 'bg-accent w-8' : 'bg-[var(--border-main)]'
                      }`}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className={`w-20 h-20 shrink-0 rounded-[32px] flex items-center justify-center ${tutorialSteps[activeStep].bg} ${tutorialSteps[activeStep].color}`}>
                        {React.createElement(tutorialSteps[activeStep].icon, { className: "w-10 h-10" })}
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-2xl font-bold text-[var(--text-main)]">{tutorialSteps[activeStep].title}</h4>
                        <p className="text-[var(--text-muted)] leading-relaxed">{tutorialSteps[activeStep].description}</p>
                        
                        {tutorialSteps[activeStep].tips && (
                          <div className="space-y-2 pt-4">
                            <p className="text-xs font-bold text-accent uppercase tracking-widest">Dicas Pro:</p>
                            {tutorialSteps[activeStep].tips?.map((tip, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {tip}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-8 bg-[var(--bg-input)]/50 border-t border-[var(--border-main)] flex items-center justify-between">
                <button 
                  onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                  disabled={activeStep === 0}
                  className="px-6 py-3 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-30 transition-colors"
                >
                  Anterior
                </button>
                
                {activeStep === tutorialSteps.length - 1 ? (
                  <button 
                    onClick={onStart}
                    className="px-8 py-4 brand-gradient text-white font-bold rounded-2xl shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    Começar a Usar
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setActiveStep(prev => Math.min(tutorialSteps.length - 1, prev + 1))}
                    className="px-8 py-4 bg-accent text-white font-bold rounded-2xl hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    Próximo
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Copyright */}
      <footer className="py-8 text-center border-t border-[var(--border-main)] bg-[var(--bg-card)]">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">
          Desenvolvido por R.M Tecnologia LTDA
        </p>
      </footer>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
