import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Package,
  ArrowUpDown,
  X,
  Image as ImageIcon,
  AlertCircle,
  Upload,
  Loader2,
  Info
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useAuth } from '../AuthContext';

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    barcode: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return () => unsubscribe();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || '',
      barcode: product.barcode || ''
    });
    setImagePreview(product.imageUrl || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', stock: '', category: '', barcode: '' });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    if (editingProduct?.id) setProcessingId(editingProduct.id);
    try {
      let imageUrl = editingProduct?.imageUrl || '';
      
      if (imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        imageUrl,
        updatedAt: new Date().toISOString()
      };

      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      
      closeModal();
    } catch (error) {
      console.error("Error saving product: ", error);
    } finally {
      setUploading(false);
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    try {
      await deleteDoc(doc(db, 'products', id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting product: ", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStock = async (product: Product, newStock: number) => {
    if (newStock < 0) return;
    setProcessingId(product.id || null);
    try {
      await updateDoc(doc(db, 'products', product.id!), {
        stock: newStock,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating stock: ", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStock = product.stock > 0 ? 0 : 10; // Toggle between 0 and 10 (default in stock)
    handleUpdateStock(product, newStock);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
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
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <button className="p-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-[var(--text-muted)] hover:bg-[var(--bg-active)] transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 brand-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-accent/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </motion.div>

      {/* Products Table */}
      <motion.div variants={itemVariants} className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-input)] border-b border-[var(--border-main)]">
                <th className="px-8 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Produto</th>
                <th className="px-8 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Categoria</th>
                <th className="px-8 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Preço</th>
                <th className="px-8 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Estoque</th>
                <th className="px-8 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} className="divide-y divide-[var(--border-main)]">
              {filteredProducts.map((product) => (
                <motion.tr 
                  key={product.id} 
                  variants={itemVariants}
                  className={`hover:bg-[var(--bg-active)] transition-colors group relative ${
                    processingId === product.id ? 'opacity-50 pointer-events-none bg-slate-50/50 dark:bg-slate-800/50' : ''
                  }`}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--bg-input)] rounded-xl flex items-center justify-center shrink-0 relative">
                        {processingId === product.id && (
                          <div className="absolute inset-0 bg-[var(--bg-input)]/60 rounded-xl flex items-center justify-center z-10 backdrop-blur-[1px]">
                            <Loader2 className="w-5 h-5 animate-spin text-accent" />
                          </div>
                        )}
                        {product.imageUrl ? (
                          <img src={product.imageUrl} className="w-full h-full object-cover rounded-xl" alt="" />
                        ) : (
                          <Package className="w-6 h-6 text-[var(--text-muted)]" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[var(--text-main)]">{product.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{product.description || 'Sem descrição'}</p>
                          {product.barcode && (
                            <span className="text-[10px] font-mono bg-[var(--bg-input)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">
                              {product.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-[var(--bg-input)] text-[var(--text-muted)] rounded-full text-xs font-bold">
                      {product.category || 'Geral'}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-bold text-[var(--text-main)]">
                    R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleUpdateStock(product, product.stock - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-rose-500 rounded-lg transition-colors"
                      >
                        -
                      </button>
                      <span className={product.stock <= 5 ? 'text-rose-600 font-bold min-w-[20px] text-center' : 'text-[var(--text-main)] font-bold min-w-[20px] text-center'}>
                        {product.stock}
                      </span>
                      <button 
                        onClick={() => handleUpdateStock(product, product.stock + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-accent rounded-lg transition-colors"
                      >
                        +
                      </button>
                      {product.stock <= 5 && <AlertCircle className="w-4 h-4 text-rose-500" />}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => handleToggleStatus(product)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                        product.stock > 0 
                          ? 'bg-accent/10 text-accent hover:bg-accent/20' 
                          : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                      }`}
                    >
                      {product.stock > 0 ? 'Em Estoque' : 'Sem Estoque'}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-active)] rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => product.id && setDeleteConfirmId(product.id)}
                        className="p-2 text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-[var(--bg-input)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">Nenhum produto encontrado</h3>
              <p className="text-[var(--text-muted)]">Tente ajustar sua busca ou adicione um novo produto.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--border-main)]"
            >
              <div className="p-8 border-b border-[var(--border-main)] flex items-center justify-between">
                <h3 className="text-2xl font-bold text-[var(--text-main)]">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button 
                  onClick={closeModal}
                  className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-active)] rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--border-main)] rounded-3xl bg-[var(--bg-input)] hover:bg-[var(--bg-active)] transition-all cursor-pointer relative group overflow-hidden">
                    {imagePreview ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                          <ImageIcon className="w-6 h-6 text-[var(--text-muted)]" />
                        </div>
                        <p className="text-sm font-bold text-[var(--text-main)]">Upload da Imagem</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">PNG, JPG até 5MB</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--text-main)] mb-2">Nome do Produto</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                      placeholder="Ex: Teclado Mecânico RGB"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--text-main)] mb-2">Código de Barras / SKU</label>
                    <input 
                      type="text" 
                      value={formData.barcode}
                      onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                      className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                      placeholder="Ex: 7891234567890"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-bold text-[var(--text-main)]">Preço (R$)</label>
                        <div className="group relative">
                          <Info className="w-4 h-4 text-[var(--text-muted)] cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Preço de venda final do produto para o consumidor.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--border-main)]" />
                          </div>
                        </div>
                      </div>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-bold text-[var(--text-main)]">Estoque</label>
                        <div className="group relative">
                          <Info className="w-4 h-4 text-[var(--text-muted)] cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Quantidade física disponível para venda imediata.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--border-main)]" />
                          </div>
                        </div>
                      </div>
                      <input 
                        required
                        type="number" 
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--text-main)] mb-2">Categoria</label>
                    <input 
                      type="text" 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                      placeholder="Ex: Eletrônicos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[var(--text-main)] mb-2">Descrição</label>
                    <textarea 
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all resize-none text-[var(--text-main)]"
                      placeholder="Detalhes sobre o produto..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    disabled={uploading}
                    onClick={closeModal}
                    className="flex-1 py-4 px-6 bg-[var(--bg-input)] text-[var(--text-muted)] font-bold rounded-2xl hover:bg-[var(--bg-active)] transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-4 px-6 brand-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      editingProduct ? 'Atualizar Produto' : 'Salvar Produto'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[var(--bg-card)] rounded-3xl shadow-2xl p-8 border border-[var(--border-main)] text-center"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Excluir Produto?</h3>
              <p className="text-[var(--text-muted)] mb-8">Esta ação não pode ser desfeita. O produto será removido permanentemente do estoque.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 px-4 bg-[var(--bg-input)] text-[var(--text-muted)] font-bold rounded-xl hover:bg-[var(--bg-active)] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-3 px-4 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
