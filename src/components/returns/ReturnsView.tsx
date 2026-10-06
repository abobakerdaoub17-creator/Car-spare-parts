import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { ReturnRecord, Sale } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  RotateCcw,
  Plus,
  Search,
  FileText,
  AlertCircle,
  X,
  Eye,
  CheckCircle,
} from 'lucide-react';

export const ReturnsView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Return Form
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [returnProductId, setReturnProductId] = useState('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnUnitPrice, setReturnUnitPrice] = useState<number>(0);
  const [returnReason, setReturnReason] = useState('قطعة غير مطابقة لطلب الزبون');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'balance_credit'>('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setReturns(db.getReturns());
    const validSales = db.getSales().filter((s) => s.status === 'completed');
    setSales(validSales);
    if (validSales.length > 0) {
      setSelectedInvoiceId(validSales[0].id);
      if (validSales[0].items.length > 0) {
        setReturnProductId(validSales[0].items[0].productId);
        setReturnUnitPrice(validSales[0].items[0].unitPrice);
      }
    }
  }, []);

  const handleRefresh = () => {
    setReturns(db.getReturns());
    refreshAlerts();
  };

  const selectedSale = sales.find((s) => s.id === selectedInvoiceId);

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const sale = sales.find((s) => s.id === invId);
    if (sale && sale.items.length > 0) {
      setReturnProductId(sale.items[0].productId);
      setReturnUnitPrice(sale.items[0].unitPrice);
      setReturnQty(1);
    }
  };

  const handleProductChange = (prodId: string) => {
    setReturnProductId(prodId);
    if (selectedSale) {
      const item = selectedSale.items.find((i) => i.productId === prodId);
      if (item) {
        setReturnUnitPrice(item.unitPrice);
      }
    }
  };

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSale) return;
    if (returnQty <= 0) {
      showToast('الكمية المرتجعة يجب أن تكون 1 على الأقل', 'warning');
      return;
    }

    const item = selectedSale.items.find((i) => i.productId === returnProductId);
    if (!item) {
      showToast('يرجى اختيار الصنف المراد إرجاعه', 'warning');
      return;
    }

    if (returnQty > item.quantity) {
      showToast(`الكمية المرتجعة (${returnQty}) أكبر من الكمية المباعة بالفاتورة (${item.quantity})`, 'error');
      return;
    }

    try {
      const rec = db.createSaleReturn({
        originalInvoiceId: selectedSale.id,
        items: [
          {
            productId: item.productId,
            quantity: returnQty,
            unitPrice: returnUnitPrice,
            reason: returnReason,
          },
        ],
        refundMethod,
        notes,
        user,
      });

      showToast(`تم تسجيل مرتجع المبيعات #${rec.returnNumber} وإعادة القطع للمخزون`, 'success');
      setShowAddModal(false);
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل تسجيل المرتجع', 'error');
    }
  };

  const filteredReturns = returns.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.returnNumber.toLowerCase().includes(q) ||
      (r.originalInvoiceNumber && r.originalInvoiceNumber.toLowerCase().includes(q)) ||
      (r.customerName && r.customerName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-600" />
            إدارة المرتجعات (Returns Management)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            إرجاع القطع من العملاء مع إرجاع الكمية للمخزون آلياً وتسوية الحساب المالي نقداً أو بالرصيد
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>تسجيل مرتجع مبيعات جديد</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم المرتجع، رقم الفاتورة الأصلية، أو اسم العميل..."
            className="w-full rounded-lg border border-slate-300 bg-white pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="p-3">رقم المرتجع</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3 font-mono">الفاتورة الأصلية</th>
                <th className="p-3">العميل / الطرف</th>
                <th className="p-3">الأصناف المرتجعة</th>
                <th className="p-3">طريقة الرد المالي</th>
                <th className="p-3 text-left">إجمالي المبلغ المسترد</th>
                <th className="p-3">الموظف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد فواتير مرتجعات مسجلة حتى الآن
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{r.returnNumber}</td>
                    <td className="p-3 text-slate-600">{new Date(r.date).toLocaleDateString('ar-LY')}</td>
                    <td className="p-3 font-mono text-blue-700 font-semibold">{r.originalInvoiceNumber}</td>
                    <td className="p-3 text-slate-800">{r.customerName || 'زبون نقدي'}</td>
                    <td className="p-3 text-slate-600">
                      {r.items.map((i, idx) => (
                        <div key={idx} className="text-xs">
                          {i.productName} ({i.quantity} قطعة)
                        </div>
                      ))}
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                        {r.refundMethod === 'cash' ? 'استرداد نقدي كاش' : 'إيداع برصيد العميل'}
                      </span>
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-red-600 tabular-nums">
                      {(r.totalRefundAmount ?? r.totalAmount ?? 0).toFixed(2)} د.ل
                    </td>
                    <td className="p-3 text-slate-500">{r.userName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Return Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-blue-600" />
                تسجيل مرتجع مبيعات جديد
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-3.5 text-xs">
              {/* Select Invoice */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">1. اختر الفاتورة الأصلية:</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 font-mono focus:border-blue-600 focus:outline-none"
                >
                  {sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      فاتورة #{s.invoiceNumber} — {s.customerName} ({s.totalAmount} د.ل) — {s.date.slice(0, 10)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSale && (
                <>
                  {/* Select Item to return */}
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">2. اختر الصنف المراد إرجاعه:</label>
                    <select
                      value={returnProductId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      {selectedSale.items.map((it) => (
                        <option key={it.productId} value={it.productId}>
                          {it.productName} (الكمية المباعة: {it.quantity} | السعر: {it.unitPrice} د.ل)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity & Unit Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">الكمية المرتجعة:</label>
                      <input
                        type="number"
                        min="1"
                        value={returnQty}
                        onChange={(e) => setReturnQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 font-mono text-center font-bold focus:border-blue-600 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">سعر الاسترداد للقطعة (د.ل):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={returnUnitPrice}
                        onChange={(e) => setReturnUnitPrice(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 font-mono text-center font-bold focus:border-blue-600 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Reason & Refund Method */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">سبب الإرجاع:</label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                      >
                        <option value="قطعة غير مطابقة لطلب الزبون">قطعة غير مطابقة لطلب الزبون</option>
                        <option value="عيب مصنعي في القطعة">عيب مصنعي في القطعة</option>
                        <option value="خطأ في الموديل أو سنة الصنع">خطأ في الموديل أو سنة الصنع</option>
                        <option value="فائض عن الحاجة من الورشة">فائض عن الحاجة من الورشة</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">طريقة رد المبلغ:</label>
                      <select
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                      >
                        <option value="cash">نقداً كاش من الخزينة</option>
                        <option value="balance_credit">إضافة لحساب/رصيد العميل</option>
                      </select>
                    </div>
                  </div>

                  {/* Total Refund Banner */}
                  <div className="rounded-lg bg-blue-50 p-3 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
                    <span>إجمالي المبلغ المسترد:</span>
                    <strong className="text-base font-bold font-mono text-blue-700 tabular-nums">
                      {(returnQty * returnUnitPrice).toFixed(2)} د.ل
                    </strong>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white transition shadow-xs"
                >
                  تأكيد وقيد المرتجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
