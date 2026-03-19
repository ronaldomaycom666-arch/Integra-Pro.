import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Calendar, 
  User, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Download,
  Filter,
  ChevronDown
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Sale, Product, Customer } from '../types';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-brand-blue)', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

export default function SalesReport() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');

  useEffect(() => {
    if (!user) return;

    const unsubscribeSales = onSnapshot(
      query(collection(db, 'sales'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'sales');
      }
    );

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

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, [user]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = parseISO(sale.createdAt);
      const start = startOfDay(parseISO(startDate));
      const end = endOfDay(parseISO(endDate));
      
      const matchesDate = isWithinInterval(saleDate, { start, end });
      const matchesCustomer = selectedCustomerId === 'all' || sale.customerId === selectedCustomerId;
      
      return matchesDate && matchesCustomer && sale.status === 'completed';
    });
  }, [sales, startDate, endDate, selectedCustomerId]);

  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalOrders = filteredSales.length;
    const totalItems = filteredSales.reduce((acc, sale) => 
      acc + sale.items.reduce((sum, item) => sum + item.quantity, 0), 0
    );
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalRevenue, totalOrders, totalItems, avgTicket };
  }, [filteredSales]);

  const salesByPeriodData = useMemo(() => {
    const dataMap: { [key: string]: number } = {};
    
    filteredSales.forEach(sale => {
      const dateKey = format(parseISO(sale.createdAt), 'dd/MM');
      dataMap[dateKey] = (dataMap[dateKey] || 0) + sale.total;
    });

    return Object.keys(dataMap)
      .sort((a, b) => {
        const [dayA, monthA] = a.split('/').map(Number);
        const [dayB, monthB] = b.split('/').map(Number);
        return monthA - monthB || dayA - dayB;
      })
      .map(key => ({
        name: key,
        total: dataMap[key]
      }));
  }, [filteredSales]);

  const salesByCategoryData = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const category = product?.category || 'Geral';
        categoryMap[category] = (categoryMap[category] || 0) + (item.price * item.quantity);
      });
    });

    return Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key]
    })).sort((a, b) => b.value - a.value);
  }, [filteredSales, products]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-main)] shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--bg-input)] rounded-xl">
              <Filter className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-[var(--text-main)]">Filtros do Relatório</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="flex items-center gap-2 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-main)]">
              <Calendar className="w-4 h-4 text-[var(--text-muted)] ml-2" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-[var(--text-main)]"
              />
              <span className="text-[var(--text-muted)]">até</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-[var(--text-main)]"
              />
            </div>

            <div className="flex items-center gap-2 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-main)] min-w-[200px]">
              <User className="w-4 h-4 text-[var(--text-muted)] ml-2" />
              <select 
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-[var(--text-main)] w-full cursor-pointer"
              >
                <option value="all">Todos os Clientes</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 brand-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-accent/20">
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Receita Total', value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-primary', bg: 'bg-accent/10' },
          { label: 'Total de Vendas', value: stats.totalOrders, icon: ShoppingCart, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
          { label: 'Itens Vendidos', value: stats.totalItems, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Ticket Médio', value: `R$ ${stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
        ].map((stat, i) => (
            <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-main)] shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-sm font-medium mb-1">{stat.label}</p>
            <h4 className="text-2xl font-bold text-[var(--text-main)]">{stat.value}</h4>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales by Period */}
        <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-main)] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-[var(--text-main)]">Vendas por Período</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              <div className="w-3 h-3 bg-accent rounded-full" />
              Receita (R$)
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByPeriodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-active)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-main)', 
                    borderRadius: '12px',
                    color: 'var(--text-main)',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                />
                  <Bar 
                    dataKey="total" 
                    fill="var(--color-accent)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={32}
                  />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-main)] shadow-sm">
          <h3 className="text-xl font-bold text-[var(--text-main)] mb-8">Vendas por Categoria</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesByCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-main)', 
                    borderRadius: '12px',
                    color: 'var(--text-main)'
                  }}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-[var(--text-muted)] font-medium text-sm ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales Table Section */}
      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[var(--border-main)]">
          <h3 className="text-xl font-bold text-[var(--text-main)]">Detalhamento de Vendas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-input)]/50 border-b border-[var(--border-main)]">
                <th className="px-8 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">ID / Data</th>
                <th className="px-8 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Cliente</th>
                <th className="px-8 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total</th>
                <th className="px-8 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Ações (QR Code)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[var(--bg-active)]/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-[var(--text-main)] text-sm">#{sale.id?.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-[var(--text-muted)]">{format(parseISO(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-semibold text-[var(--text-main)]/80">{sale.customerName || 'Venda Avulsa'}</span>
                  </td>
                  <td className="px-8 py-5 font-bold text-[var(--text-main)]">
                    R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end">
                      <div className="p-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl shadow-sm hover:shadow-md transition-all group/qr relative">
                        <QRCodeCanvas 
                          value={`Venda ID: ${sale.id}\nValor: R$ ${sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          size={40}
                          level={"H"}
                        />
                        {/* Hover Zoom Effect */}
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover/qr:block z-50 p-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl">
                           <QRCodeCanvas 
                            value={`Venda ID: ${sale.id}\nValor: R$ ${sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            size={120}
                            level={"H"}
                          />
                          <p className="text-[10px] text-center mt-2 font-bold text-[var(--text-muted)]">#{sale.id?.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[var(--text-muted)]">Nenhuma venda encontrada para os filtros selecionados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function for class merging (copied from AppContent for consistency)
// Removed local cn as it is now imported/defined at top
