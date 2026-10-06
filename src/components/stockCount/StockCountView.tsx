import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { StockCount, StockCountItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  ClipboardCheck,
  Plus,
  CheckCircle,
  AlertCircle,
  Save,
  Lock,
  Search,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';

export const StockCountView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [sessions, setSessions] = useState<StockCount[]>([]);
  const [activeSession, setActiveSession] = useState<StockCount | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    const list = db.getStockCounts();
    setSessions(list);
    if (list.length > 0 && !activeSession) {
      setActiveSession(list[0]);
    }
  }, []);

  const handleRefresh = () => {
    const list = db.getStockCounts();
    setSessions(list);
    if (activeSession) {
      const refreshed = list.find((s) => s.id === activeSession.id);
      if (refreshed) setActiveSession(refreshed);
    }
    refreshAlerts();
  };

  const handleCreateSession = () => {
    if (!user) return;
    try {
      const newSession = db.createStockCount(user, 'جلسة جرد دوري لمستودع قطع الغيار');
      showToast(`تم إنشاء جلسة جرد جديدة #${newSession.sessionNumber}`, 'success');
      setActiveSession(newSession);
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل إنشاء جلسة الجرد', 'error');
    }
  };

  const handleActualStockChange = (productId: string, val: number) => {
    if (!activeSession || activeSession.status === 'approved') return;

    const updatedItems = activeSession.items.map((item) => {
      if (item.productId === productId) {
        return {
          ...item,
          actualStock: val,
        };
      }
      return item;
    });

    db.updateStockCountItems(activeSession.id, updatedItems, user!);
    handleRefresh();
  };

  const handleApproveSession = () => {
    if (!activeSession || !user) return;
    try {
      db.approveStockCount(activeSession.id, user);
      showToast(`تم اعتماد جلسة الجرد ${activeSession.sessionNumber} وتسوية أرصدة المستودع آلياً`, 'success');
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل اعتماد الجرد', 'error');
    }
  };

  const filteredItems = activeSession?.items.filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.oemNumber.toLowerCase().includes(q) ||
      item.shelfLocation.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-amber-400" />
            الجرد الفعلي للمستودع (Physical Stock Count)
          </h2>
          <p className="text-xs text-slate-400">
            مقارنة الكميات الفعلية على الرفوف بالكميات المسجلة بالنظام وإنشاء تسوية فروقات معتمدة
          </p>
        </div>

        {user?.role === 'admin' || user?.role === 'warehouse' ? (
          <button
            onClick={handleCreateSession}
            className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>بدء جلسة جرد جديدة</span>
          </button>
        ) : null}
      </div>

      {/* Sessions Selector Row */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold shrink-0">جلسات الجرد:</span>
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s)}
              className={`rounded-xl px-3 py-1.5 font-semibold transition shrink-0 border ${
                activeSession?.id === s.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{s.sessionNumber}</span>
              <span className={`mr-1.5 text-[10px] px-1.5 py-0.2 rounded ${
                s.status === 'approved' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
              }`}>
                {s.status === 'approved' ? 'معتمد' : 'مسودة'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Active Session Content */}
      {activeSession ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-4">
          {/* Session Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">جلسة جرد رقم: {activeSession.sessionNumber}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                  activeSession.status === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {activeSession.status === 'approved' ? 'معتمدة ومرحلة للمخزون' : 'مسودة قيد الحصر'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                القائم بالجرد: {activeSession.performedBy} • التاريخ: {new Date(activeSession.date).toLocaleString('ar-LY')}
                {activeSession.approvedBy && ` • الاعتماد بواسطة: ${activeSession.approvedBy}`}
              </p>
            </div>

            {/* Discrepancy stats */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="rounded-xl bg-slate-950 px-3 py-2 border border-slate-800 text-right">
                <span className="text-slate-400 block text-[10px]">فروقات القطع:</span>
                <span className="font-bold text-amber-400">{activeSession.totalDiscrepancyItems} قطعة</span>
              </div>

              <div className="rounded-xl bg-slate-950 px-3 py-2 border border-slate-800 text-right">
                <span className="text-slate-400 block text-[10px]">قيمة الفارق المالي:</span>
                <span className={`font-bold ${activeSession.totalDiscrepancyValue < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {activeSession.totalDiscrepancyValue.toFixed(2)} د.ل
                </span>
              </div>

              {activeSession.status === 'draft' && (user?.role === 'admin' || user?.role === 'warehouse') && (
                <button
                  onClick={handleApproveSession}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 font-bold text-white transition shadow-lg shadow-emerald-600/30"
                >
                  <Lock className="h-4 w-4" />
                  <span>اعتماد وتسوية الفروقات</span>
                </button>
              )}
            </div>
          </div>

          {/* Search inside session */}
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-amber-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="فلترة القطع في كشف الجرد بالاسم أو OEM أو الرف..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pr-9 pl-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Table of items */}
          <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="p-3">القطعة</th>
                    <th className="p-3 font-mono">OEM & SKU</th>
                    <th className="p-3 text-center">مكان الرف</th>
                    <th className="p-3 text-center">الكمية بالنظام</th>
                    <th className="p-3 text-center">الكمية الفعلية المحصورة</th>
                    <th className="p-3 text-center">الفارق (عجز / زيادة)</th>
                    <th className="p-3 text-left">تكلفة القطعة</th>
                    <th className="p-3 text-left">قيمة الفارق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredItems.map((item) => {
                    const diff = item.actualStock - item.systemStock;
                    const diffVal = diff * item.unitCost;

                    return (
                      <tr key={item.productId} className="hover:bg-slate-800/30 transition">
                        <td className="p-3 font-semibold text-slate-100">{item.productName}</td>
                        <td className="p-3 font-mono text-slate-400">
                          <span className="text-amber-400">{item.oemNumber}</span>
                          <span className="block text-[10px] text-slate-500">{item.sku}</span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-300">{item.shelfLocation}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-300">{item.systemStock}</td>
                        <td className="p-3 text-center">
                          {activeSession.status === 'draft' ? (
                            <input
                              type="number"
                              min="0"
                              value={item.actualStock}
                              onChange={(e) =>
                                handleActualStockChange(item.productId, parseInt(e.target.value) || 0)
                              }
                              className="w-16 rounded bg-slate-950 border border-slate-700 p-1 text-center font-mono font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
                            />
                          ) : (
                            <span className="font-mono font-bold text-slate-100">{item.actualStock}</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span
                            className={
                              diff === 0
                                ? 'text-slate-500'
                                : diff > 0
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                        <td className="p-3 text-left font-mono text-slate-400">
                          {item.unitCost.toFixed(2)} د.ل
                        </td>
                        <td className="p-3 text-left font-mono font-bold">
                          <span
                            className={
                              diffVal === 0
                                ? 'text-slate-500'
                                : diffVal > 0
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }
                          >
                            {diffVal > 0 ? `+${diffVal.toFixed(2)}` : diffVal.toFixed(2)} د.ل
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          لم يتم إنشاء جلسات جرد سابقة. انقر فوق &quot;بدء جلسة جرد جديدة&quot; لحصر كميات المستودع.
        </div>
      )}
    </div>
  );
};
