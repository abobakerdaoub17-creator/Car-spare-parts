import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { db } from '../services/db';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshAlerts: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const refreshAlerts = () => {
    const alerts: AppNotification[] = [];
    const products = db.getProducts();
    const customers = db.getCustomers();
    const sales = db.getSales();

    // 1. Low stock & Out of stock alerts
    for (const p of products) {
      if (p.currentStock <= 0) {
        alerts.push({
          id: `alert-out-${p.id}`,
          title: 'نفاد المخزون بالكامل',
          message: `القطعة (${p.name}) نفدت تماماً من المستودع (الكمية: 0).`,
          type: 'danger',
          timestamp: new Date().toISOString(),
          read: false,
          linkTab: 'inventory',
        });
      } else if (p.currentStock <= p.minimumStock) {
        alerts.push({
          id: `alert-low-${p.id}`,
          title: 'تنبيه انخفاض المخزون',
          message: `القطعة (${p.name}) وصلت لحد الطلب الأدنى. المتوفر حالياً: ${p.currentStock} فقط (الحد الأدنى: ${p.minimumStock}).`,
          type: 'warning',
          timestamp: new Date().toISOString(),
          read: false,
          linkTab: 'inventory',
        });
      }

      // Missing price check
      if (p.retailPrice <= 0 || p.purchasePrice <= 0) {
        alerts.push({
          id: `alert-price-${p.id}`,
          title: 'قطعة بدون تسعير',
          message: `القطعة (${p.name}) غير مسعرة بدقة (سعر البيع: ${p.retailPrice} د.ل).`,
          type: 'info',
          timestamp: new Date().toISOString(),
          read: false,
          linkTab: 'products',
        });
      }
    }

    // 2. Customer Credit Limit & High Debt alerts
    for (const c of customers) {
      if (c.creditLimit > 0 && c.currentBalance >= c.creditLimit) {
        alerts.push({
          id: `alert-credit-${c.id}`,
          title: 'تجاوز الحد الائتماني',
          message: `العميل (${c.name}) وصل إلى سقف المديونية المسموح به (${c.currentBalance} / ${c.creditLimit} د.ل).`,
          type: 'danger',
          timestamp: new Date().toISOString(),
          read: false,
          linkTab: 'customers',
        });
      }
    }

    // 3. Deferred invoices alert
    const unpaidSales = sales.filter((s) => s.remainingAmount > 0 && s.status === 'completed');
    if (unpaidSales.length > 0) {
      const totalUnpaid = unpaidSales.reduce((sum, s) => sum + s.remainingAmount, 0);
      alerts.push({
        id: 'alert-deferred-invoices',
        title: 'فواتير آجلة قيد التحصيل',
        message: `يوجد ${unpaidSales.length} فواتير بيع تحتوي على مبالغ آجلة بإجمالي ${totalUnpaid.toLocaleString()} د.ل.`,
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        linkTab: 'sales',
      });
    }

    setNotifications(alerts);
  };

  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshAlerts,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
