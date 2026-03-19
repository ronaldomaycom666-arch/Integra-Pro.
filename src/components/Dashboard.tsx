import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Sale, Product, Customer } from '../types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, Variants } from 'motion/react';

import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    const qSales = query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sales');
    });

    const qProducts = query(collection(db, 'products'), limit(100));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    const qCustomers = query(collection(db, 'customers'), limit(100));
    const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
    });

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, [user]);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalSales = sales.length;
  const totalProducts = products.length;
  const totalCustomers = customers.length;

  // Chart Data (Last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayName = format(date, 'EEE', { locale: ptBR });
    const dayTotal = sales
      .filter(s => {
        const saleDate = new Date(s.createdAt);
        return format(saleDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      })
      .reduce((acc, s) => acc + s.total, 0);
    
    return { name: dayName, total: dayTotal };
  });

  const stats = [
    { label: 'Receita Total', value: `R$ ${totalRevenue.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'bg-brand-blue', trend: '+12.5%', isUp: true },
    { label: 'Vendas Realizadas', value: totalSales, icon: ShoppingCart, color: 'bg-accent', trend: '+5.2%', isUp: true },
    { label: 'Produtos em Estoque', value: totalProducts, icon: Package, color: 'bg-accent/80', trend: '-2.1%', isUp: false },
    { label: 'Clientes Ativos', value: totalCustomers, icon: Users, color: 'bg-brand-blue/80', trend: '+8.4%', isUp: true },
  ];

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
      className="space-y-8"
    >
      {/* Stats Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-main)] transition-all duration-300 hover:border-accent/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${stat.isUp ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                {stat.trend}
                {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">{stat.value}</h3>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-main)]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight">Desempenho de Vendas</h3>
              <p className="text-[var(--text-muted)] text-xs">Visão geral dos últimos 7 dias</p>
            </div>
            <select className="bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl px-4 py-2 text-xs font-bold text-[var(--text-muted)] outline-none focus:border-accent transition-all">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "var(--color-brand-blue)" : "var(--color-accent)"} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={isDark ? "var(--color-brand-blue)" : "var(--color-accent)"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f8fafc"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#94a3b8' : '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#94a3b8' : '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#fff', 
                    borderRadius: '12px', 
                    border: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: isDark ? '#f8fafc' : '#0f172a' }}
                  formatter={(value) => [`R$ ${value}`, 'Total']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke={isDark ? "var(--color-brand-blue)" : "var(--color-accent)"} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Sales List */}
        <motion.div variants={itemVariants} className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-main)]">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-6 tracking-tight">Vendas Recentes</h3>
          <motion.div variants={containerVariants} className="space-y-6">
            {sales.slice(0, 5).map((sale, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--bg-input)] rounded-xl flex items-center justify-center group-hover:bg-[var(--bg-active)] transition-colors">
                    <ShoppingCart className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text-main)] text-sm">{sale.customerName || 'Venda Avulsa'}</p>
                    <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">{format(new Date(sale.createdAt), 'dd MMM, HH:mm', { locale: ptBR })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--text-main)] text-sm">R$ {sale.total.toLocaleString('pt-BR')}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    sale.status === 'completed' ? 'text-[var(--text-main)]' : 
                    sale.status === 'pending' ? 'text-[var(--text-muted)]' : 'text-slate-300'
                  }`}>
                    {sale.status === 'completed' ? 'Concluída' : 
                     sale.status === 'pending' ? 'Pendente' : 'Cancelada'}
                  </p>
                </div>
              </motion.div>
            ))}
            {sales.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[var(--text-muted)] text-sm">Nenhuma venda registrada.</p>
              </div>
            )}
          </motion.div>
          <button className="w-full mt-8 py-3 text-accent font-bold text-xs uppercase tracking-widest hover:bg-accent/10 rounded-2xl transition-colors flex items-center justify-center gap-2">
            Ver todas as vendas
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
