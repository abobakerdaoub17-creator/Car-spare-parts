import React from 'react';
import { useAuth, AppModule } from '../../context/AuthContext';
import { useHybridSync } from '../../hooks/useHybridSync';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Car,
  Truck,
  Users,
  Coins,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from 'lucide-react';

interface SidebarProps {
  currentTab: AppModule;
  onNavigate: (tab: AppModule) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: AppModule;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { canAccess, role } = useAuth();
  const { isOnline } = useHybridSync();

  const navItems: NavItem[] = [
    { id: 'pos', label: 'نقطة البيع (POS)', icon: ShoppingCart, highlight: true },
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'products', label: 'قطع الغيار والمخزون', icon: Package },
    { id: 'vehicles', label: 'توافق السيارات', icon: Car },
    { id: 'invoices', label: 'فواتير المبيعات', icon: Receipt },
    { id: 'purchases', label: 'المشتريات والتوريد', icon: Truck },
    { id: 'customers', label: 'العملاء والديون', icon: Users },
    { id: 'cash', label: 'الخزينة والمصروفات', icon: Coins },
    { id: 'stockCount', label: 'الجرد الفعلي للمخزن', icon: ClipboardCheck },
    { id: 'reports', label: 'التقارير المالية', icon: BarChart3 },
    { id: 'users', label: 'المستخدمون والصلاحيات', icon: ShieldCheck },
    { id: 'settings', label: 'إعدادات المحل', icon: Settings },
  ];

  const handleItemClick = (id: AppModule) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 flex flex-col border-l border-slate-800 bg-slate-900 text-slate-300 transition-all duration-200 lg:static ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-16' : 'w-60'}`}
      >
        {/* Brand / Logo Top */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-3.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-xs">
              <Wrench className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="text-sm font-bold text-white block truncate leading-tight">
                  نظام قطع الغيار
                </span>
                <span className="text-[10px] text-slate-400 font-medium">إدارة ومبيعات</span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:block transition"
            title={collapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const allowed = canAccess(item.id);
            if (!allowed) return null;

            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? item.highlight
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-slate-800 text-white border border-slate-700 font-bold'
                    : item.highlight
                    ? 'text-blue-400 hover:bg-slate-800 hover:text-blue-300'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition ${
                    isActive
                      ? 'text-white'
                      : item.highlight
                      ? 'text-blue-400 group-hover:text-blue-300'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.highlight && (
                  <span className="mr-auto rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-bold text-blue-300 border border-blue-400/30">
                    كاشير
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
