import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Bell, 
  DollarSign, 
  Building2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Instagram,
  Facebook,
  Phone,
  MapPin,
  FileText,
  MessageCircle,
  User,
  Mail,
  Languages,
  Camera,
  Sparkles
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { AppSettings, UserProfile } from '../types';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { PHOTO_FILTERS } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Settings() {
  const { profile, updateProfile } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    lowStockThreshold: 5,
    currency: 'BRL',
    language: 'pt-BR',
    companyName: 'Integra Pro',
    companyLogo: '',
    cnpj: '',
    phone: '',
    address: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      whatsapp: ''
    }
  });
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({
    displayName: '',
    email: '',
    phone: '',
    photoURL: '',
    photoFilter: 'none'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const companyLogoRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setUserProfile({
        displayName: profile.displayName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        photoURL: profile.photoURL || '',
        photoFilter: profile.photoFilter || 'none'
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AppSettings);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/global');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(userProfile);
      setShowProfileSuccess(true);
      setTimeout(() => setShowProfileSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      // For guests, we can still use the 'guest' path or just convert to base64 if storage fails
      // But let's try storage first as it's more robust
      const storageRef = ref(storage, `profiles/${profile.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setUserProfile(prev => ({ ...prev, photoURL: url }));
    } catch (error) {
      console.error("Error uploading photo, falling back to local preview:", error);
      // Fallback: use FileReader for local preview if storage fails (e.g. rules or not authenticated)
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleCompanyLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const storageRef = ref(storage, `company/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setSettings(prev => ({ ...prev, companyLogo: url }));
    } catch (error) {
      console.error("Error uploading company logo, falling back to local preview:", error);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, companyLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-[var(--text-main)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl">
            <SettingsIcon className="w-8 h-8 text-[var(--text-main)]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[var(--text-main)]">Configurações</h2>
            <p className="text-[var(--text-muted)]">Gerencie as preferências globais e seu perfil de vendedor.</p>
          </div>
        </div>
      </div>

      {profile?.role === 'guest' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-start gap-4"
        >
          <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Modo Visitante Ativo</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              O Login Anônimo está desativado no Firebase Console. Suas alterações serão salvas apenas localmente neste navegador.
              Para habilitar a sincronização em nuvem, ative o <strong>Login Anônimo</strong> em <em>Authentication &gt; Sign-in method</em>.
            </p>
          </div>
        </motion.div>
      )}

      {/* User Profile Settings */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-main)] shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-[var(--text-muted)]" />
            <h3 className="text-lg font-bold text-[var(--text-main)]">
              Meu Perfil {profile?.role === 'guest' ? '(Visitante)' : '(Vendedor)'}
            </h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Photo Upload */}
            <div className="relative group shrink-0 mx-auto md:mx-0">
              <div 
                className="w-32 h-32 rounded-full border-4 border-[var(--border-main)] overflow-hidden bg-[var(--bg-input)] shadow-xl relative"
                style={{ filter: PHOTO_FILTERS.find(f => f.id === userProfile.photoFilter)?.filter || 'none' }}
              >
                {userProfile.photoURL ? (
                  <img 
                    src={userProfile.photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-[var(--text-muted)]" />
                  </div>
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 brand-gradient text-white rounded-full shadow-lg hover:scale-110 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="text" 
                      value={userProfile.displayName}
                      onChange={(e) => setUserProfile({...userProfile, displayName: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="email" 
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                      disabled={profile?.role !== 'guest'}
                      className={cn(
                        "w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]",
                        profile?.role !== 'guest' && "cursor-not-allowed opacity-60 text-[var(--text-muted)]"
                      )}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Telefone de Contato</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="text" 
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Filters */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <label className="text-sm font-bold text-[var(--text-muted)]">Filtros de Foto</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PHOTO_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setUserProfile(prev => ({ ...prev, photoFilter: filter.id }))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        userProfile.photoFilter === filter.id
                          ? 'brand-gradient text-white border-transparent shadow-md'
                          : 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-accent'
                      }`}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            {showProfileSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[var(--text-muted)] font-bold text-sm"
              >
                <CheckCircle2 className="w-5 h-5" />
                Perfil atualizado!
              </motion.div>
            )}
            <button 
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-3 brand-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-accent/20 active:scale-95 disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Perfil
            </button>
          </div>
        </div>
      </form>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-main)] shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-[var(--text-muted)]" />
            <h3 className="text-lg font-bold text-[var(--text-main)]">Informações da Empresa</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Logo da Empresa</label>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-[var(--bg-input)] border-2 border-dashed border-[var(--border-main)] rounded-2xl flex items-center justify-center overflow-hidden shrink-0 relative">
                    {settings.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[var(--text-muted)]" />
                    )}
                    
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => companyLogoRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 brand-gradient text-white rounded-full shadow-lg hover:scale-110 transition-all active:scale-95 z-10"
                    title="Alterar Logo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-main)] mb-1">Logotipo da sua marca</p>
                  <p className="text-xs text-[var(--text-muted)] mb-3">Recomendado: 512x512px (PNG ou JPG)</p>
                  <button
                    type="button"
                    onClick={() => companyLogoRef.current?.click()}
                    className="text-xs font-bold text-accent hover:underline uppercase tracking-widest"
                  >
                    Clique para fazer upload
                  </button>
                </div>

                <input 
                  type="file"
                  ref={companyLogoRef}
                  onChange={handleCompanyLogoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Nome da Empresa</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  value={settings.companyName}
                  onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                  placeholder="Ex: Minha Loja"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">CNPJ</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  value={settings.cnpj}
                  onChange={(e) => setSettings({...settings, cnpj: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  value={settings.phone}
                  onChange={(e) => setSettings({...settings, phone: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">E-mail da Empresa</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="email" 
                  value={settings.email || ''}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                  placeholder="empresa@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Moeda</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <select 
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all appearance-none text-[var(--text-main)]"
                >
                  <option value="BRL">Real (R$)</option>
                  <option value="USD">Dólar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Idioma do Sistema</label>
              <div className="relative">
                <Languages className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <select 
                  value={settings.language || 'pt-BR'}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all appearance-none text-[var(--text-main)]"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español (España)</option>
                  <option value="fr-FR">Français (France)</option>
                  <option value="de-DE">Deutsch (Deutschland)</option>
                  <option value="it-IT">Italiano (Italia)</option>
                  <option value="ja-JP">日本語 (日本)</option>
                  <option value="zh-CN">简体中文 (中国)</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Endereço</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-4 h-4 text-[var(--text-muted)]" />
                <textarea 
                  value={settings.address}
                  onChange={(e) => setSettings({...settings, address: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all min-h-[100px] text-[var(--text-main)]"
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Settings */}
        <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-main)] shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-5 h-5 text-[var(--text-muted)]" />
            <h3 className="text-lg font-bold text-[var(--text-main)]">Redes Sociais</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Instagram</label>
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  value={settings.socialMedia?.instagram}
                  onChange={(e) => setSettings({
                    ...settings, 
                    socialMedia: { ...settings.socialMedia, instagram: e.target.value }
                  })}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                  placeholder="@usuario"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">Facebook</label>
              <div className="relative">
                <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  value={settings.socialMedia?.facebook}
                  onChange={(e) => setSettings({
                    ...settings, 
                    socialMedia: { ...settings.socialMedia, facebook: e.target.value }
                  })}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                  placeholder="facebook.com/pagina"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">WhatsApp</label>
              <div className="relative">
                <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="text" 
                  value={settings.socialMedia?.whatsapp}
                  onChange={(e) => setSettings({
                    ...settings, 
                    socialMedia: { ...settings.socialMedia, whatsapp: e.target.value }
                  })}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-2xl outline-none focus:border-accent focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)]"
                  placeholder="5511999999999"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-main)] shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-[var(--text-muted)]" />
            <h3 className="text-lg font-bold text-[var(--text-main)]">Notificações de Estoque</h3>
          </div>
          
          <div className="max-w-md">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-bold text-[var(--text-muted)]">Limite de Estoque Baixo</label>
              <span className="px-3 py-1 bg-[var(--bg-input)] text-[var(--text-main)] rounded-full text-xs font-bold">
                {settings.lowStockThreshold} unidades
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="50" 
              value={settings.lowStockThreshold}
              onChange={(e) => setSettings({...settings, lowStockThreshold: parseInt(e.target.value)})}
              className="w-full h-2 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex items-center gap-2 mt-4 p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-main)]">
              <AlertTriangle className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
              <p className="text-xs text-[var(--text-muted)]">
                Você receberá alertas quando o estoque de qualquer produto for igual ou inferior a este valor.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-[var(--text-muted)] font-bold text-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              Configurações salvas!
            </motion.div>
          )}
            <button 
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-4 brand-gradient text-white font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-accent/20 active:scale-95 disabled:opacity-50"
            >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
