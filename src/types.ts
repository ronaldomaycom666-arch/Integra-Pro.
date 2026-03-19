export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  photoFilter?: string;
  phone?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
  barcode?: string;
  updatedAt: string;
}

export interface Customer {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id?: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  createdAt: string;
  dueDate?: string;
  observations?: string;
  userId: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AppSettings {
  lowStockThreshold: number;
  currency: string;
  language?: string;
  companyName: string;
  companyLogo?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
}
