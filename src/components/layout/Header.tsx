import React, { useState, useEffect } from 'react';
import { useAuth, AppModule } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useHybridSync } from '../../hooks/useHybridSync';
import { db } from '../../services/db';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { HybridSyncModal } from '../common/HybridSyncModal';
import {
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  Wallet,
  Wrench,
  Shield,
  User,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (tab: AppModule) => void;
  onOpenQuickSearch: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNavigate,
  onOpenQuickSearch,
  onOpenSettings,
}) => {
  const { user, role, switchDemoRole, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { isOnline, pendingCount, isSyncing } = useHybridSync();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [shopName, setShopName] = useState('محل السلام لقطع غيار السيارات');

  useEffect(() => {
    const s = db.getShopSettings();
    if (s && s.shopName) setShopName(s.shopName);
  }, []);

  const cashSummary = db.getCashSummary();

  const roleLabels: Record<string, { title: string; color: string }> = {
    admin: { title: 'المدير العام', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    sales: { title: 'مسؤول المبيعات', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    warehouse: { title: 'أمين المستودع', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    accountant: { title: 'المحاسب المالي', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5 shadow-xs shrink-0">
      {/* Right side (RTL start): Toggle button & Store Brand */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden transition shrink-0"
          aria-label="القائمة الرئيسية"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[260px]">
                {shopName}
              </span>
              <span className="hidden xs:inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200 shrink-0">
                ليبيا
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block truncate">
              نظام إدارة المبيعات والمخزون وتوافق السيارات
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Fast Search Bar Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenQuickSearch}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-700 transition shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <span>بحث سريع: اسم القطعة، OEM، رقم بديل، باركود...</span>
          </div>
          <kbd className="hidden lg:inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Left side (RTL end): Cash indicator, Notifications, User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Mobile search button */}
        <button
          onClick={onOpenQuickSearch}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          title="بحث سريع"
        >
          <Search className="h-5 w-5 text-slate-600" />
        </button>

        {/* Current Cash in Drawer Badge */}
        <button
          onClick={() => onNavigate('cash')}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition"
          title="نقدية الصندوق الحالية المتوقعة"
        >
          <Wallet className="h-4 w-4 text-emerald-600" />
          <span className="text-[11px] text-slate-500">نقدية الصندوق:</span>
          <span className="font-mono font-bold text-slate-900 tabular-nums">
            {cashSummary.expectedCurrentCash.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">د.ل</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="التنبيهات"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? '+9' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">تنبيهات النظام</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-100">
                      {unreadCount} جديد
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">لا توجد تنبيهات جديدة</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.linkTab) onNavigate(n.linkTab as AppModule);
                        setShowNotifications(false);
                      }}
                      className={`cursor-pointer rounded-lg p-2.5 text-xs transition border ${
                        n.read
                          ? 'bg-slate-50 border-slate-100 text-slate-500'
                          : n.type === 'danger'
                          ? 'bg-red-50/60 border-red-200 text-red-800'
                          : 'bg-amber-50/60 border-amber-200 text-amber-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span>{n.title}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white px-2 sm:px-2.5 py-1.5 hover:bg-slate-50 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs shrink-0">
              {user?.name.charAt(0) || 'م'}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900 leading-tight">المبرمج</div>
              <div className="text-[10px] text-slate-500 font-medium hidden sm:block">
                {roleLabels[role]?.title || role}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Role switcher menu */}
          {showRoleMenu && (
            <div className="absolute left-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] text-slate-400 font-medium">
                تبديل الدور لتجربة الصلاحيات:
              </div>
              <div className="space-y-1 p-1">
                {(['admin', 'sales', 'warehouse', 'accountant'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchDemoRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold transition ${
                      role === r
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{roleLabels[r].title}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{r}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 mt-1 pt-1 space-y-1">
                <button
                  onClick={() => {
                    onOpenSettings();
                    setShowRoleMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-500" />
                  <span>إعدادات المحل</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setShowRoleMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hybrid Offline & Sync Center Modal */}
      <HybridSyncModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
    </header>
  );
};
