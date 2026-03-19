import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical, 
  Edit2, 
  Trash2,
  X,
  User as UserIcon,
  Users,
  Calendar
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Customer } from '../types';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../AuthContext';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'customers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'customers');
    });
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'customers'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', address: '' });
    } catch (error) {
      console.error("Error adding customer: ", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir este cliente?')) {
      await deleteDoc(doc(db, 'customers', id));
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Buscar clientes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 brand-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-accent/20 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Novo Cliente
        </button>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <motion.div 
            layout
            key={customer.id}
            variants={itemVariants}
            className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-main)] shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center text-[var(--text-main)]">
                <UserIcon className="w-8 h-8" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] rounded-lg transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => customer.id && handleDelete(customer.id)}
                  className="p-2 text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[var(--text-main)] mb-6">{customer.name}</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm truncate">{customer.email || 'Sem e-mail'}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm">{customer.phone || 'Sem telefone'}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm truncate">{customer.address || 'Sem endereço'}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm">Cadastrado em {format(new Date(customer.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border-main)] flex items-center justify-between">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Última Venda</div>
              <div className="text-sm font-bold text-[var(--text-main)]">R$ 450,00</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredCustomers.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-[var(--bg-input)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)]">Nenhum cliente encontrado</h3>
          <p className="text-[var(--text-muted)]">Comece cadastrando seu primeiro cliente.</p>
        </div>
      )}

      {/* Add Customer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--border-main)]"
            >
              <div className="p-8 border-b border-[var(--border-main)] flex items-center justify-between">
                <h3 className="text-2xl font-bold text-[var(--text-main)]">Novo Cliente</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-active)] rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-main)] mb-2">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                      placeholder="Nome do cliente"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-main)] mb-2">E-mail</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-main)] mb-2">Telefone</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--text-main)] mb-2">Endereço</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 px-6 bg-[var(--bg-input)] text-[var(--text-muted)] font-bold rounded-2xl hover:bg-[var(--bg-active)] transition-all">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 py-4 px-6 brand-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-accent/20">
                    Cadastrar Cliente
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
