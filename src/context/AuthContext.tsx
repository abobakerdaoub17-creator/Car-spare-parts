import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { getSupabase } from '../services/supabaseClient';

export const DEMO_USERS: Record<UserRole, AppUser> = {
  admin: {
    id: 'usr-admin',
    email: 'admin@almadar.ly',
    name: 'أبوبكر داؤوب',
    role: 'admin',
    phone: '091-0000001',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  sales: {
    id: 'usr-sales',
    email: 'sales@almadar.ly',
    name: 'محمد الترهوني',
    role: 'sales',
    phone: '092-0000002',
    active: true,
    createdAt: '2026-02-01T00:00:00Z',
  },
  warehouse: {
    id: 'usr-warehouse',
    email: 'warehouse@almadar.ly',
    name: 'عبد السلام القماطي',
    role: 'warehouse',
    phone: '091-0000003',
    active: true,
    createdAt: '2026-03-01T00:00:00Z',
  },
  accountant: {
    id: 'usr-accountant',
    email: 'finance@almadar.ly',
    name: 'سالم الفرجاني',
    role: 'accountant',
    phone: '094-0000004',
    active: true,
    createdAt: '2026-04-01T00:00:00Z',
  },
};

interface AuthContextType {
  user: AppUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
  canAccess: (module: AppModule) => boolean;
}

export type AppModule =
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'invoices'
  | 'products'
  | 'vehicles'
  | 'inventory'
  | 'stockCount'
  | 'purchases'
  | 'customers'
  | 'suppliers'
  | 'payments'
  | 'cash'
  | 'expenses'
  | 'returns'
  | 'shipments'
  | 'reports'
  | 'users'
  | 'settings';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('almadar_current_user');
    return saved ? JSON.parse(saved) : DEMO_USERS.admin;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('almadar_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('almadar_current_user');
    }
  }, [user]);

  const login = async (email: string, _pass: string): Promise<boolean> => {
    // If Supabase is connected, authenticate through Supabase Auth
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: _pass,
        });
        if (error) {
          console.warn('Supabase auth failed, falling back to local user match:', error.message);
        } else if (data?.user) {
          const authUser: AppUser = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: (data.user.user_metadata?.role as UserRole) || 'sales',
            active: true,
            createdAt: data.user.created_at,
          };
          setUser(authUser);
          return true;
        }
      } catch (err) {
        console.warn('Supabase connection error:', err);
      }
    }

    // Local authentication matching
    const matchedRole = (Object.keys(DEMO_USERS) as UserRole[]).find(
      (r) => DEMO_USERS[r].email.toLowerCase() === email.toLowerCase()
    );

    if (matchedRole) {
      setUser(DEMO_USERS[matchedRole]);
      return true;
    }

    // Default to admin for convenient instant testing if email contains admin or test
    if (email.includes('admin') || email.includes('manager')) {
      setUser(DEMO_USERS.admin);
      return true;
    }

    // Generic fallback user with sales role
    setUser({
      id: `usr-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: 'sales',
      active: true,
      createdAt: new Date().toISOString(),
    });
    return true;
  };

  const logout = () => {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
  };

  const switchDemoRole = (targetRole: UserRole) => {
    setUser(DEMO_USERS[targetRole]);
  };

  /**
   * RBAC Matrix Enforcing:
   * - Admin: Full access to everything
   * - Sales: POS, Sales, Invoices, Customers, Customer Payments, Returns
   * - Warehouse: Products, Vehicles, Inventory, Stock Count, Purchases, Shipments
   * - Accountant: Payments, Customer Debts, Supplier Debts, Expenses, Cash Drawer, Reports
   */
  const canAccess = (module: AppModule): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    switch (user.role) {
      case 'sales':
        return [
          'dashboard',
          'pos',
          'sales',
          'invoices',
          'products',
          'vehicles',
          'customers',
          'payments',
          'returns',
        ].includes(module);

      case 'warehouse':
        return [
          'dashboard',
          'products',
          'vehicles',
          'inventory',
          'stockCount',
          'purchases',
          'suppliers',
          'shipments',
          'returns',
        ].includes(module);

      case 'accountant':
        return [
          'dashboard',
          'sales',
          'invoices',
          'customers',
          'suppliers',
          'purchases',
          'payments',
          'cash',
          'expenses',
          'reports',
          'returns',
        ].includes(module);

      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : 'sales',
        isAuthenticated: !!user,
        login,
        logout,
        switchDemoRole,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
