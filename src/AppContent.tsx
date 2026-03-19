import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  Plus,
  Search,
  ChevronRight,
  Filter,
  DollarSign,
  Briefcase,
  Settings as SettingsIcon,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { Logo } from './components/Logo';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Components
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Customers from './components/Customers';
import Sales from './components/Sales';
import SalesReport from './components/SalesReport';
import Settings from './components/Settings';
import NotificationCenter from './components/NotificationCenter';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AppNotification, AppSettings, Product } from './types';
import { PHOTO_FILTERS } from './constants';

type Tab = 'dashboard' | 'products' | 'customers' | 'sales' | 'reports' | 'settings';

export default function App() {
  const { user, profile, loading, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    lowStockThreshold: 5,
    currency: 'BRL',
    language: 'pt-BR',
    companyName: 'Integra Pro'
  });

  // Fetch Settings & Products for Low Stock Alerts
  React.useEffect(() => {
    if (!user) return;

    // Fetch Settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });

    // Fetch Products to check stock
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      // Check for low stock
      const lowStockProducts = products.filter(p => p.stock <= settings.lowStockThreshold);
      
      if (lowStockProducts.length > 0) {
        const newNotifications: AppNotification[] = lowStockProducts.map(p => ({
          id: `low-stock-${p.id}-${Date.now()}`,
          title: 'Estoque Baixo!',
          message: `O produto "${p.name}" está com apenas ${p.stock} unidades em estoque.`,
          type: 'warning',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/products'
        }));

        // Only add if not already notified (simple check by product ID)
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id.split('-')[2])); // product id part
          const filteredNew = newNotifications.filter(n => !existingIds.has(n.id.split('-')[2]));
          return [...filteredNew, ...prev].slice(0, 20); // Keep last 20
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    return () => {
      unsubscribeSettings();
      unsubscribeProducts();
    };
  }, [user, settings.lowStockThreshold]);

  React.useEffect(() => {
    const handleBounce = () => {
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 400);
    };
    window.addEventListener('cart-bounce', handleBounce);
    return () => window.removeEventListener('cart-bounce', handleBounce);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[var(--bg-card)] rounded-3xl p-10 text-center border border-[var(--border-main)] shadow-xl"
        >
          <Logo className="w-16 h-16 mx-auto mb-8" />
          <h1 className="text-2xl font-bold text-[var(--text-main)] mb-3 tracking-tight">Integra Pro</h1>
          <p className="text-[var(--text-muted)] mb-10 text-sm leading-relaxed">Gestão inteligente para o seu negócio crescer com controle e precisão.</p>
          
          <button
            onClick={login}
            className="w-full py-4 px-6 brand-gradient text-white font-medium rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-accent/20"
          >
            <Plus className="w-4 h-4" />
            Entrar no Sistema
          </button>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              Desenvolvido por R.M Tecnologia LTDA
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart },
    { id: 'reports', label: 'Relatórios', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex font-sans text-[var(--text-main)] overflow-x-hidden">
      {/* Sidebar - Desktop Only */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-[var(--bg-sidebar)] border-r border-[var(--border-main)] transition-all duration-300 ease-in-out hidden lg:block",
          isSidebarOpen ? "w-72" : "w-20"
        )}
      >
        <div className="h-full flex flex-col">
          <div className={cn("p-8 flex items-center gap-4", !isSidebarOpen && "px-5")}>
            <Logo />
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-xl tracking-tight text-[var(--text-main)]"
              >
                Integra Pro
              </motion.span>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group relative",
                  !isSidebarOpen && "justify-center px-0",
                  activeTab === item.id 
                    ? "bg-[var(--bg-active)] text-[var(--text-main)] font-semibold" 
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-main)]"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  activeTab === item.id ? "text-[var(--text-main)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"
                )} />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
                    {item.label}
                  </motion.span>
                )}
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-5 bg-accent rounded-r-full"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className={cn("p-4 border-t border-[var(--border-main)]", !isSidebarOpen && "px-2")}>
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-2xl",
              !isSidebarOpen && "justify-center px-0"
            )}>
              <img 
                src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
                className="w-10 h-10 rounded-xl border border-[var(--border-main)] object-cover"
                alt="Profile"
                style={{ filter: PHOTO_FILTERS.find(f => f.id === profile?.photoFilter)?.filter || 'none' }}
              />
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-main)] truncate">{profile?.displayName}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate uppercase tracking-widest font-bold">{profile?.role}</p>
                </div>
              )}
              {isSidebarOpen && (
                <button 
                  onClick={user ? logout : login}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] rounded-lg transition-colors"
                  title={user ? "Sair" : "Entrar"}
                >
                  {user ? <LogOut className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-w-0",
        "lg:ml-20", // Base margin for collapsed sidebar
        isSidebarOpen && "lg:ml-72", // Margin for expanded sidebar
        "pb-24 lg:pb-8" // Extra padding for mobile bottom nav
      )}>
        <header className="sticky top-0 z-40 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-main)] px-4 lg:px-8 py-4 lg:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-active)] rounded-xl transition-colors hidden lg:block"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <Logo className="w-8 h-8" />
            </div>
            <h2 className="text-base lg:text-lg font-bold text-[var(--text-main)] tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-[var(--bg-input)] rounded-2xl px-4 py-2 w-64 border border-[var(--border-main)] focus-within:border-accent transition-all">
              <Search className="w-4 h-4 text-[var(--text-muted)] mr-2" />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-main)] placeholder:text-[var(--text-muted)] font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="p-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] rounded-2xl transition-all"
                title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              
              <NotificationCenter 
                notifications={notifications} 
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearAll}
              />

              {activeTab === 'sales' && (
                <motion.div
                  animate={isCartBouncing ? { 
                    scale: [1, 1.3, 1],
                    rotate: [0, -15, 15, 0]
                  } : {}}
                  transition={{ duration: 0.4 }}
                  className="p-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isCartBouncing && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      className="absolute inset-0 bg-accent/10 rounded-full"
                    />
                  )}
                </motion.div>
              )}
            </div>

            <button className="p-2.5 brand-gradient text-white rounded-2xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-accent/20">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ 
                duration: 0.3,
                ease: [0.23, 1, 0.32, 1] // Custom cubic-bezier for a "fluid" feel
              }}
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'products' && <Products />}
              {activeTab === 'customers' && <Customers />}
              {activeTab === 'sales' && <Sales />}
              {activeTab === 'reports' && <SalesReport />}
              {activeTab === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation - Android/iOS Feel */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-header)] backdrop-blur-lg border-t border-[var(--border-main)] lg:hidden px-2 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16">
            {[
              { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
              { id: 'products', label: 'Prod', icon: Package },
              { id: 'sales', label: 'Vendas', icon: ShoppingCart },
              { id: 'customers', label: 'Cli', icon: Users },
              { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative",
                  activeTab === item.id 
                    ? "text-[var(--text-main)]" 
                    : "text-[var(--text-muted)]"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform",
                  activeTab === item.id && "scale-110"
                )} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  {item.label}
                </span>
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTabMobile"
                    className="absolute top-0 w-8 h-1 bg-accent rounded-b-full"
                  />
                )}
              </button>
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
}
