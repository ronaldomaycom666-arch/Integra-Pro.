import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  Trash2, 
  X, 
  ChevronRight,
  User,
  Package,
  CheckCircle2,
  Clock,
  Ban,
  Calendar,
  Filter,
  FileText,
  Download,
  CreditCard,
  Edit2,
  Share2
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Sale, Product, Customer, SaleItem, AppSettings } from '../types';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateSalePDF, generateSalesReportPDF } from '../utils/pdfGenerator';

export default function Sales() {
  const { user, profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom' | 'due'>('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // New Sale State
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'overdue'>('pending');
  const [observations, setObservations] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [pdfTheme, setPdfTheme] = useState<'light' | 'dark'>('light');
  const [includeSeller, setIncludeSeller] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const productSearchRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => productSearchRef.current?.focus(), 100);
    }
  }, [isModalOpen]);

  // Auto-add product if exact barcode or ID match (useful for scanners)
  useEffect(() => {
    if (!productSearch || !isModalOpen) return;

    // We only auto-add if the search term is long enough or looks like a barcode/ID
    // to avoid accidental additions while typing short names
    if (productSearch.length < 3) return;

    const exactMatch = products.find(p => 
      (p.barcode && p.barcode === productSearch) || 
      (p.id && p.id === productSearch)
    );

    if (exactMatch && exactMatch.stock > 0) {
      addToCart(exactMatch);
      setProductSearch('');
    }
  }, [productSearch, products, isModalOpen]);

  useEffect(() => {
    const qSales = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sales');
    });

    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    const unsubscribeCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
      unsubscribeCustomers();
      unsubscribeSettings();
    };
  }, [user]);

  const addToCart = (product: Product) => {
    setIsCartBouncing(true);
    setTimeout(() => setIsCartBouncing(false), 300);
    
    // Trigger bounce in application header
    window.dispatchEvent(new CustomEvent('cart-bounce'));

    const existing = cart.find(item => item.productId === product.id);
    
    // Add toast notification
    const toastId = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id: toastId, message: `${product.name} adicionado!` }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 2000);

    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id!,
        productName: product.name,
        quantity: 1,
        price: product.price
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleExportPDF = (sale: Sale, share: boolean = false) => {
    if (!settings) return;
    const customer = customers.find(c => c.id === sale.customerId);
    generateSalePDF(sale, settings, profile, customer, { share, theme: pdfTheme, includeSeller });
  };

  const handleGenerateQuote = (share: boolean = false) => {
    if (!settings || cart.length === 0 || !user) return;
    
    const customer = customers.find(c => c.id === selectedCustomer);
    const quoteData: Sale = {
      customerId: selectedCustomer || undefined,
      customerName: customer?.name || 'Venda Avulsa',
      items: cart,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined,
      observations: observations || undefined,
      userId: user.uid
    };

    generateSalePDF(quoteData, settings, profile, customer, { share, theme: pdfTheme, includeSeller });
  };

  const handleExportReport = (share: boolean = false) => {
    if (!settings || filteredSales.length === 0) return;
    const title = dateFilter === 'all' ? 'Relatório Geral de Vendas' : 
                  dateFilter === 'today' ? 'Relatório de Vendas - Hoje' :
                  dateFilter === 'week' ? 'Relatório de Vendas - Semana' :
                  dateFilter === 'month' ? 'Relatório de Vendas - Mês' :
                  dateFilter === 'due' ? 'Relatório de Vendas - A Vencer' : 'Relatório de Vendas - Personalizado';
    generateSalesReportPDF(filteredSales, settings, title, { share, theme: pdfTheme });
  };

  const handleUpdatePaymentStatus = async (saleId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    try {
      const saleRef = doc(db, 'sales', saleId);
      await updateDoc(saleRef, {
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating payment status: ", error);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setSelectedCustomer(sale.customerId || '');
    setCart(sale.items);
    setDueDate(sale.dueDate || '');
    setPaymentStatus(sale.paymentStatus);
    setObservations(sale.observations || '');
    setIsModalOpen(true);
  };

  const hasUnsavedChanges = () => {
    if (editingSale) {
      const hasCartChanged = JSON.stringify(cart) !== JSON.stringify(editingSale.items);
      const hasCustomerChanged = selectedCustomer !== (editingSale.customerId || '');
      const hasDueDateChanged = dueDate !== (editingSale.dueDate || '');
      const hasPaymentStatusChanged = paymentStatus !== editingSale.paymentStatus;
      const hasObservationsChanged = observations !== (editingSale.observations || '');
      
      return hasCartChanged || hasCustomerChanged || hasDueDateChanged || hasPaymentStatusChanged || hasObservationsChanged;
    } else {
      return cart.length > 0 || selectedCustomer !== '' || observations !== '' || dueDate !== '';
    }
  };

  const handleCloseModal = () => {
    if (hasUnsavedChanges()) {
      setShowExitConfirm(true);
    } else {
      forceCloseModal();
    }
  };

  const forceCloseModal = () => {
    setIsModalOpen(false);
    setShowExitConfirm(false);
    setEditingSale(null);
    setCart([]);
    setSelectedCustomer('');
    setDueDate('');
    setPaymentStatus('pending');
    setObservations('');
    setProductSearch('');
    setCustomerSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !user) return;

    const customer = customers.find(c => c.id === selectedCustomer);

    try {
      const saleData: any = {
        customerId: selectedCustomer || undefined,
        customerName: customer?.name || 'Venda Avulsa',
        items: cart,
        total,
        status: 'completed',
        paymentStatus: paymentStatus,
        dueDate: dueDate || undefined,
        observations: observations || undefined,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      };

      if (editingSale) {
        // Update existing sale
        const saleRef = doc(db, 'sales', editingSale.id!);
        await updateDoc(saleRef, saleData);

        // Reconcile stocks
        // 1. Return old quantities to stock
        for (const item of editingSale.items) {
          const productRef = doc(db, 'products', item.productId);
          await updateDoc(productRef, {
            stock: increment(item.quantity)
          });
        }
        // 2. Subtract new quantities from stock
        for (const item of cart) {
          const productRef = doc(db, 'products', item.productId);
          await updateDoc(productRef, {
            stock: increment(-item.quantity),
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        // Create new sale
        saleData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'sales'), saleData);

        // Update product stocks
        for (const item of cart) {
          const productRef = doc(db, 'products', item.productId);
          await updateDoc(productRef, {
            stock: increment(-item.quantity),
            updatedAt: new Date().toISOString()
          });
        }
      }

      forceCloseModal();
    } catch (error) {
      console.error("Error saving sale: ", error);
    }
  };

  const filteredSales = sales.filter(sale => {
    const saleDate = parseISO(sale.createdAt);
    const now = new Date();
    
    // Date Filtering
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = isWithinInterval(saleDate, { start: startOfDay(now), end: endOfDay(now) });
    } else if (dateFilter === 'week') {
      matchesDate = isWithinInterval(saleDate, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
    } else if (dateFilter === 'month') {
      matchesDate = isWithinInterval(saleDate, { start: startOfMonth(now), end: endOfMonth(now) });
    } else if (dateFilter === 'custom' && customRange.start && customRange.end) {
      matchesDate = isWithinInterval(saleDate, { 
        start: startOfDay(parseISO(customRange.start)), 
        end: endOfDay(parseISO(customRange.end)) 
      });
    } else if (dateFilter === 'due') {
      if (!sale.dueDate) return false;
      const dueDateObj = parseISO(sale.dueDate);
      matchesDate = dueDateObj >= startOfDay(now);
    }

    // Search Filtering
    const matchesSearch = sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.id?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDate && matchesSearch;
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header Actions */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Buscar vendas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-sm font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          
          <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 border border-[var(--border-main)] rounded-2xl overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'Tudo' },
              { id: 'today', label: 'Hoje' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mês' },
              { id: 'due', label: 'A Vencer' },
              { id: 'custom', label: 'Personalizado' }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setDateFilter(filter.id as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  dateFilter === filter.id 
                    ? 'bg-accent text-white' 
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-main)]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-1">
            <button 
              onClick={() => setPdfTheme('light')}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                pdfTheme === 'light' 
                  ? 'bg-accent text-white' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Claro
            </button>
            <button 
              onClick={() => setPdfTheme('dark')}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                pdfTheme === 'dark' 
                  ? 'bg-accent text-white' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Escuro
            </button>
          </div>

          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl overflow-hidden">
            <button 
              onClick={() => handleExportReport(false)}
              className="px-4 py-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] transition-all flex items-center gap-2 border-r border-[var(--border-main)]"
              title="Exportar Relatório PDF"
            >
              <Download className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Relatório</span>
            </button>
            {navigator.share && (
              <button 
                onClick={() => handleExportReport(true)}
                className="px-3 py-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] transition-all"
                title="Compartilhar Relatório"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => {
            setEditingSale(null);
            setCart([]);
            setSelectedCustomer('');
            setDueDate('');
            setPaymentStatus('pending');
            setObservations('');
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 brand-gradient text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-accent/20 active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          Nova Venda
        </button>
      </div>
    </motion.div>

      {/* Custom Date Range Picker */}
      <AnimatePresence>
        {dateFilter === 'custom' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-main)] flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Período:</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                  className="px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl outline-none focus:border-accent text-xs font-medium text-[var(--text-main)]"
                />
                <span className="text-[var(--text-muted)] text-xs">até</span>
                <input 
                  type="date" 
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                  className="px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl outline-none focus:border-accent text-xs font-medium text-[var(--text-main)]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-input)] border-b border-[var(--border-main)]">
                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">ID / Data</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Vencimento</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Itens</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Total</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Pagamento</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} className="divide-y divide-[var(--border-main)]">
              {filteredSales.map((sale) => (
                <motion.tr 
                  layout
                  variants={itemVariants}
                  key={sale.id} 
                  className="hover:bg-[var(--bg-active)] transition-colors group"
                >
                  <td className="px-8 py-5">
                    <p className="font-bold text-[var(--text-main)] text-sm tracking-tight">#{sale.id?.slice(-6).toUpperCase()}</p>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </td>
                  <td className="px-8 py-5">
                    {sale.dueDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span className="text-xs font-medium text-[var(--text-main)]">
                          {format(parseISO(sale.dueDate), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">N/A</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[var(--bg-input)] rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-main)]">{sale.customerName || 'Venda Avulsa'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-bold text-[var(--text-main)] text-sm tracking-tight">
                    R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-5">
                    <select 
                      value={sale.paymentStatus || 'pending'}
                      onChange={(e) => handleUpdatePaymentStatus(sale.id!, e.target.value as any)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer transition-all ${
                        sale.paymentStatus === 'paid' ? 'bg-accent text-white' : 
                        sale.paymentStatus === 'overdue' ? 'bg-rose-500/10 text-rose-500' : 'bg-[var(--bg-input)] text-[var(--text-muted)]'
                      }`}
                    >
                      <option value="paid">Pago</option>
                      <option value="pending">Pendente</option>
                      <option value="overdue">Atrasado</option>
                    </select>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
                      sale.status === 'completed' ? 'text-[var(--text-main)] bg-[var(--bg-input)]' : 
                      sale.status === 'pending' ? 'text-[var(--text-muted)] bg-[var(--bg-input)]' : 'text-slate-400 bg-[var(--bg-input)]'
                    }`}>
                      {sale.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                      {sale.status === 'pending' && <Clock className="w-3 h-3" />}
                      {sale.status === 'cancelled' && <Ban className="w-3 h-3" />}
                      {sale.status === 'completed' ? 'Concluída' : 
                       sale.status === 'pending' ? 'Pendente' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleExportPDF(sale)}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] rounded-lg transition-all"
                        title="Exportar PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {navigator.share && (
                        <button 
                          onClick={() => handleExportPDF(sale, true)}
                          className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] rounded-lg transition-all"
                          title="Compartilhar"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(sale)}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] rounded-lg transition-all"
                        title="Editar Venda"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] rounded-lg transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
          {filteredSales.length === 0 && !loading && (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-[var(--bg-input)] rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight">Nenhuma venda encontrada</h3>
              <p className="text-[var(--text-muted)] text-sm">Tente ajustar seus filtros ou realize uma nova venda.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* New Sale Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-4xl bg-[var(--bg-card)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[var(--border-main)]"
            >
              <div className="p-8 border-b border-[var(--border-main)] flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
                  {editingSale ? 'Editar Venda' : 'Nova Venda'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-active)] rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Product Selection */}
                <div className="flex-1 p-8 border-r border-[var(--border-main)] overflow-y-auto">
                  <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      ref={productSearchRef}
                      type="text" 
                      placeholder="Pesquisar por nome, ID ou código de barras..." 
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && productSearch) {
                          e.preventDefault();
                          // If there's only one result, add it
                          const filtered = products.filter(p => 
                            p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                            p.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
                            p.barcode?.toLowerCase().includes(productSearch.toLowerCase()) ||
                            p.id?.toLowerCase().includes(productSearch.toLowerCase())
                          );
                          if (filtered.length === 1 && filtered[0].stock > 0) {
                            addToCart(filtered[0]);
                            setProductSearch('');
                          }
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-sm font-medium text-[var(--text-main)]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products
                      .filter(p => 
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                        p.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.barcode?.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.id?.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .map((product) => (
                        <motion.button
                          key={product.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className="p-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-left hover:border-accent transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-[var(--bg-input)] rounded-lg flex items-center justify-center group-hover:bg-[var(--bg-active)]">
                            <Package className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[var(--text-main)] text-sm truncate tracking-tight">{product.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{product.category || 'Geral'}</p>
                              {product.barcode && (
                                <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-60">
                                  {product.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--text-main)] text-sm">R$ {product.price.toLocaleString('pt-BR')}</span>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{product.stock} em estoque</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Cart & Checkout */}
                <div className="w-full md:w-80 bg-[var(--bg-input)] p-8 flex flex-col shrink-0">
                  <div className="mb-8">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Cliente</label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input 
                        type="text" 
                        placeholder="Filtrar clientes..." 
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl outline-none focus:border-accent text-xs font-medium transition-all text-[var(--text-main)]"
                      />
                    </div>
                    <select 
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent transition-all text-sm font-medium text-[var(--text-main)]"
                    >
                      <option value="">Venda Avulsa</option>
                      {customers
                        .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>

                  <div className="mb-8">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Vencimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input 
                        type="date" 
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent transition-all text-sm font-medium text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Pagamento</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <select 
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent transition-all text-sm font-medium text-[var(--text-main)]"
                      >
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="overdue">Atrasado</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Tema do PDF</label>
                    <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-1">
                      <button 
                        onClick={() => setPdfTheme('light')}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                          pdfTheme === 'light' 
                            ? 'bg-primary text-white' 
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        Claro
                      </button>
                      <button 
                        onClick={() => setPdfTheme('dark')}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                          pdfTheme === 'dark' 
                            ? 'bg-accent text-white' 
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        Escuro
                      </button>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Informações do Vendedor</label>
                    <button 
                      onClick={() => setIncludeSeller(!includeSeller)}
                      className={`w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl transition-all ${
                        includeSeller ? 'border-accent' : ''
                      }`}
                    >
                      <span className="text-sm font-medium text-[var(--text-main)]">Incluir Vendedor no PDF</span>
                      <div className={`w-10 h-5 rounded-full p-1 transition-all ${includeSeller ? 'bg-accent' : 'bg-slate-700'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full transition-all ${includeSeller ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>

                  <div className="mb-8">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Observações</label>
                    <textarea 
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent transition-all text-sm font-medium min-h-[100px] resize-none text-[var(--text-main)]"
                      placeholder="Alguma observação sobre esta venda?"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto mb-8 space-y-4">
                    <motion.label 
                      animate={isCartBouncing ? { scale: [1, 1.1, 1], y: [0, -5, 0] } : {}}
                      transition={{ duration: 0.3 }}
                      className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"
                    >
                      <ShoppingCart className={`w-3 h-3 ${isCartBouncing ? 'text-accent' : ''}`} />
                      Carrinho
                    </motion.label>
                    <AnimatePresence mode="popLayout">
                      {cart.map((item) => (
                        <motion.div 
                          key={item.productId}
                          layout
                          initial={{ opacity: 0, x: 20, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                          className="flex items-center justify-between bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-main)]"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="text-sm font-bold text-[var(--text-main)] truncate tracking-tight">{item.productName}</p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{item.quantity}x R$ {item.price.toLocaleString('pt-BR')}</p>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {cart.length === 0 && (
                      <div className="text-center py-10 border border-dashed border-[var(--border-main)] rounded-2xl">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Vazio</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 border-t border-[var(--border-main)] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Total</span>
                      <span className="text-xl font-bold text-[var(--text-main)] tracking-tight">R$ {total.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleGenerateQuote(false)}
                          disabled={cart.length === 0}
                          className="w-full py-3 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-[var(--bg-active)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Gerar PDF
                        </button>
                        <button 
                          onClick={() => handleGenerateQuote(true)}
                          disabled={cart.length === 0 || !navigator.share}
                          className="w-full py-3 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-[var(--bg-active)] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Compartilhar
                        </button>
                      </div>
                      <button 
                        onClick={handleSubmit}
                        disabled={cart.length === 0}
                        className="w-full py-4 brand-gradient text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-accent/20"
                      >
                        {editingSale ? 'Salvar Alterações' : 'Finalizar Venda'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Confirmation Modal */}
            <AnimatePresence>
              {showExitConfirm && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowExitConfirm(false)}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-sm bg-[var(--bg-card)] rounded-3xl shadow-2xl p-8 border border-[var(--border-main)] text-center"
                  >
                    <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <X className="w-8 h-8 text-rose-500" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-main)] mb-2 tracking-tight">Descartar Alterações?</h3>
                    <p className="text-[var(--text-muted)] text-sm mb-8">Você tem certeza que deseja sair sem salvar as alterações?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setShowExitConfirm(false)}
                        className="py-3 bg-[var(--bg-input)] text-[var(--text-main)] text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-[var(--bg-active)] transition-all"
                      >
                        Continuar
                      </button>
                      <button 
                        onClick={forceCloseModal}
                        className="py-3 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-rose-600 transition-all"
                      >
                        Sair
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-24 right-8 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className="brand-gradient text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
