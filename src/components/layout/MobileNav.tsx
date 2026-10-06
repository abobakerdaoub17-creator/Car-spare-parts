import React from 'react';
import { AppModule } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Menu,
} from 'lucide-react';

interface MobileNavProps {
  currentTab: AppModule;
  onNavigate: (tab: AppModule) => void;
  onOpenMobileMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onNavigate,
  onOpenMobileMenu,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 shadow-lg lg:hidden no-print">
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] transition ${
          currentTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span>الرئيسية</span>
      </button>

      <button
        onClick={() => onNavigate('products')}
        className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] transition ${
          currentTab === 'products' ? 'text-blue-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Package className="h-5 w-5" />
        <span>القطع</span>
      </button>

      {/* Center POS Action button */}
      <button
        onClick={() => onNavigate('pos')}
        className="flex -translate-y-3 flex-col items-center justify-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md border-2 border-white active:scale-95 transition">
          <ShoppingCart className="h-5 w-5 font-bold" />
        </div>
        <span className="text-[10px] font-bold text-blue-600 mt-0.5">نقطة البيع</span>
      </button>

      <button
        onClick={() => onNavigate('invoices')}
        className={`flex flex-col items-center justify-center gap-1 py-1 text-[11px] transition ${
          currentTab === 'invoices' ? 'text-blue-600 font-bold' : 'text-slate-500'
        }`}
      >
        <Receipt className="h-5 w-5" />
        <span>الفواتير</span>
      </button>

      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] text-slate-500 hover:text-slate-900 transition"
      >
        <Menu className="h-5 w-5" />
        <span>المزيد</span>
      </button>
    </nav>
  );
};
