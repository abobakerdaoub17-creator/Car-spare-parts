import React, { useState, useEffect } from 'react';
import { useAuth, AppModule } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { QuickSearchModal } from '../common/QuickSearchModal';
import { Dashboard } from '../dashboard/Dashboard';
import { PosView } from '../pos/PosView';
import { InvoicesView } from '../invoices/InvoicesView';
import { ProductsView } from '../products/ProductsView';
import { VehicleCompatibilityView } from '../vehicles/VehicleCompatibilityView';
import { InventoryView } from '../inventory/InventoryView';
import { StockCountView } from '../stockCount/StockCountView';
import { PurchasesView } from '../purchases/PurchasesView';
import { CustomersView } from '../customers/CustomersView';
import { SuppliersView } from '../suppliers/SuppliersView';
import { CashView } from '../cash/CashView';
import { ExpensesView } from '../expenses/ExpensesView';
import { ReturnsView } from '../returns/ReturnsView';
import { ShipmentsView } from '../shipments/ShipmentsView';
import { ReportsView } from '../reports/ReportsView';
import { UsersView } from '../users/UsersView';
import { SettingsView } from '../settings/SettingsView';
import { Product, Sale } from '../../types';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { HybridSyncModal } from '../common/HybridSyncModal';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, canAccess } = useAuth();
  const { toasts, removeToast } = useNotifications();

  const [currentTab, setCurrentTab] = useState<AppModule>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [editingSaleInPos, setEditingSaleInPos] = useState<Sale | null>(null);

  // If user role changes and they no longer have access to current tab, redirect to dashboard or POS
  useEffect(() => {
    if (!canAccess(currentTab)) {
      setCurrentTab('dashboard');
    }
  }, [user, currentTab, canAccess]);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectProductFromSearch = (_product: Product) => {
    // If user can access pos, navigate to POS or products
    if (canAccess('pos')) {
      setCurrentTab('pos');
    } else {
      setCurrentTab('products');
    }
  };

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenQuickSearch={() => setQuickSearchOpen(true)}
          />
        );
      case 'pos':
        return (
          <PosView
            initialEditingSale={editingSaleInPos}
            onClearEditingSale={() => setEditingSaleInPos(null)}
          />
        );
      case 'invoices':
        return (
          <InvoicesView
            onEditInPos={(sale) => {
              setEditingSaleInPos(sale);
              setCurrentTab('pos');
            }}
          />
        );
      case 'products':
        return <ProductsView />;
      case 'vehicles':
        return <VehicleCompatibilityView />;
      case 'inventory':
        return <InventoryView />;
      case 'stockCount':
        return <StockCountView />;
      case 'purchases':
        return <PurchasesView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'cash':
        return <CashView />;
      case 'expenses':
        return <ExpensesView />;
      case 'returns':
        return <ReturnsView />;
      case 'shipments':
        return <ShipmentsView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <Dashboard
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenQuickSearch={() => setQuickSearchOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-100 text-slate-900 font-sans">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenQuickSearch={() => setQuickSearchOpen(true)}
          onOpenSettings={() => setCurrentTab('settings')}
        />

        {/* Viewable Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 lg:p-6 pb-24 lg:pb-6">
          <div className="mx-auto w-full max-w-[1600px]">
            {renderCurrentView()}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          currentTab={currentTab}
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
      </div>

      {/* Universal Quick Search Modal */}
      <QuickSearchModal
        isOpen={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
        onSelectProduct={handleSelectProductFromSearch}
      />

      {/* Floating Offline Mode Indicator */}
      <OfflineIndicator onOpenSyncModal={() => setSyncModalOpen(true)} />

      {/* Hybrid Offline & Sync Center Modal */}
      <HybridSyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
      />

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-20 sm:bottom-6 left-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl p-3 shadow-lg border text-xs transition animate-in fade-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : t.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-white border-slate-200 text-slate-900 shadow-md'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
              {t.type === 'error' && <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
              {t.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />}
              {t.type === 'info' && <Info className="h-4 w-4 text-blue-600 shrink-0" />}
              <span className="font-semibold leading-relaxed">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
