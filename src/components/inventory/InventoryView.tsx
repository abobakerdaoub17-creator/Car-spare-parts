import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Product, InventoryTransaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Boxes,
  Search,
  AlertTriangle,
  X,
  Edit,
  Tag,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [activeTab, setActiveTab] = useState<'levels' | 'transactions'>('levels');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Record Damage / Spoilage Modal
  const [damagedProduct, setDamagedProduct] = useState<Product | null>(null);
  const [damageQty, setDamageQty] = useState<number>(1);
  const [damageReason, setDamageReason] = useState<string>('كسر أثناء النقل أو التخزين');

  // Direct Stock Quantity Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [newStockQty, setNewStockQty] = useState<number>(0);

  useEffect(() => {
    setProducts(db.getProducts());
    setTransactions(db.getInventoryTransactions());
  }, []);

  const handleRefresh = () => {
    setProducts(db.getProducts());
    setTransactions(db.getInventoryTransactions());
    refreshAlerts();
  };

  const handleRecordDamaged = (e: React.FormEvent) => {
    e.preventDefault();
    if (!damagedProduct || !user) return;
    if (damageQty <= 0) {
      showToast('الكمية التالفة يجب أن تكون 1 على الأقل', 'warning');
      return;
    }
    if (damageQty > damagedProduct.currentStock) {
      showToast('الكمية التالفة أكبر من المتوفر في المستودع', 'error');
      return;
    }

    try {
      db.recordInventoryTransaction({
        productId: damagedProduct.id,
        productName: damagedProduct.name,
        sku: damagedProduct.sku,
        type: 'damaged',
        quantityChange: -damageQty,
        referenceType: 'manual',
        referenceId: `DAMAGED-${Date.now()}`,
        notes: `تسجيل قطع تالفة - السبب: ${damageReason}`,
        userId: user.id,
        userName: user.name,
      });

      showToast(`تم إثبات تلف (${damageQty}) قطع وتحديث المخزون بنجاح`, 'success');
      setDamagedProduct(null);
      setDamageQty(1);
      setDamageReason('');
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل تسجيل التالف', 'error');
    }
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !user) return;
    try {
      db.updateProduct(
        adjustingProduct.id,
        { currentStock: Math.max(0, newStockQty) },
        user
      );
      showToast(`تم تحديث كمية (${adjustingProduct.name}) في المخزون إلى ${newStockQty} قطعة`, 'success');
      setAdjustingProduct(null);
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل تحديث الكمية', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.oemNumber.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  });

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.productName.toLowerCase().includes(q) ||
      tx.sku.toLowerCase().includes(q) ||
      tx.userName.toLowerCase().includes(q) ||
      (tx.notes && tx.notes.toLowerCase().includes(q))
    );
  });

  const getTxTypeBadge = (type: InventoryTransaction['type']) => {
    switch (type) {
      case 'purchase':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">شراء توريد (+)</span>;
      case 'sale':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">مبيعات (-)</span>;
      case 'sale_return':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-bold">مرتجع مبيعات (+)</span>;
      case 'purchase_return':
        return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-[11px] font-bold">مرتجع لمورد (-)</span>;
      case 'damaged':
        return <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[11px] font-bold">تالف كسر (-)</span>;
      case 'stock_adjustment':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold">تعديل كمية (±)</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">رصيد افتتاحي (+)</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="h-5 w-5 text-blue-600" />
            المخزون وحركات المستودع
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            مراقبة الكميات المتوفرة في المخزون وتعديلها وتتبع كافة حركات التوريد والبيع
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('levels')}
            className={`rounded-md px-3 py-1 font-semibold transition ${
              activeTab === 'levels' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
            }`}
          >
            مستويات المخزون ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`rounded-md px-3 py-1 font-semibold transition ${
              activeTab === 'transactions' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
            }`}
          >
            سجل حركات المخزون ({transactions.length})
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم القطعة، التصنيف، رمز SKU، أو رقم OEM..."
            className="w-full rounded-lg border border-slate-300 bg-white pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* TAB 1: Stock Levels */}
      {activeTab === 'levels' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">اسم القطعة</th>
                  <th className="p-3">التصنيف (حسب تسميتك)</th>
                  <th className="p-3 font-mono">SKU / OEM</th>
                  <th className="p-3">موقع الرف</th>
                  <th className="p-3 text-center">الكمية في المخزون</th>
                  <th className="p-3 text-center">الحد الأدنى للطلب</th>
                  <th className="p-3 text-center">حالة المخزون</th>
                  <th className="p-3 text-left">إجراءات المستودع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minimumStock;
                  const isOut = p.currentStock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200">
                          <Tag className="h-3 w-3 text-blue-600" />
                          {p.category || p.brand || 'عام'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        <div>{p.sku}</div>
                        <div className="text-[11px] text-blue-700 font-semibold">{p.oemNumber}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{p.shelfLocation || 'غير محدد'}</td>
                      <td className="p-3 text-center font-mono font-bold text-sm text-slate-900 tabular-nums">
                        {p.currentStock} قطعة
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500 tabular-nums">{p.minimumStock}</td>
                      <td className="p-3 text-center">
                        {isOut ? (
                          <span className="rounded bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[11px] font-bold">
                            نفد بالكامل
                          </span>
                        ) : isLow ? (
                          <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px] font-bold">
                            منخفض المخزون
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold">
                            متوفر بكمية كافية
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setNewStockQty(p.currentStock);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 transition"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>تعديل الكمية</span>
                          </button>
                          <button
                            onClick={() => {
                              setDamagedProduct(p);
                              setDamageQty(1);
                            }}
                            className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition"
                          >
                            إثبات تالف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Inventory Transactions */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">الصنف</th>
                  <th className="p-3 font-mono">SKU</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3 text-center">التغير في الكمية</th>
                  <th className="p-3">البيان والشرح</th>
                  <th className="p-3">الموظف المسؤول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      لا توجد حركات مسجلة
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 text-slate-600 font-mono">
                        {new Date(tx.date || tx.timestamp || Date.now()).toLocaleString('ar-LY')}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{tx.productName}</td>
                      <td className="p-3 font-mono text-slate-500">{tx.sku}</td>
                      <td className="p-3">{getTxTypeBadge(tx.type)}</td>
                      <td className="p-3 text-center font-mono font-bold text-sm tabular-nums">
                        <span className={tx.quantityChange > 0 ? 'text-emerald-700' : 'text-red-600'}>
                          {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{tx.notes || tx.referenceId || '-'}</td>
                      <td className="p-3 text-slate-500">{tx.userName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Direct Stock Quantity Edit Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                تعديل الكمية في المخزون
              </h3>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{adjustingProduct.name}</div>
              <div className="text-slate-500 font-mono mt-1">
                التصنيف: {adjustingProduct.category || 'عام'} | الكمية الحالية:{' '}
                <strong className="text-slate-900">{adjustingProduct.currentStock} قطعة</strong>
              </div>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-emerald-800 mb-1 font-bold">
                  الكمية الفعلية الجديدة في المخزون:
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border-2 border-emerald-500 bg-white p-2.5 text-emerald-700 font-mono text-base text-center font-bold focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white transition shadow-xs"
                >
                  حفظ الكمية الجديدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Damaged Modal */}
      {damagedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                إثبات صنف تالف / كسر بالمستودع
              </h3>
              <button
                onClick={() => setDamagedProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{damagedProduct.name}</div>
              <div className="text-slate-500 font-mono mt-1">
                SKU: {damagedProduct.sku} | الرصيد الحالي: <strong className="text-slate-900">{damagedProduct.currentStock}</strong>
              </div>
            </div>

            <form onSubmit={handleRecordDamaged} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">الكمية التالفة:</label>
                <input
                  type="number"
                  min="1"
                  max={damagedProduct.currentStock}
                  value={damageQty}
                  onChange={(e) => setDamageQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 font-mono text-center font-bold focus:border-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">سبب التلف:</label>
                <select
                  value={damageReason}
                  onChange={(e) => setDamageReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="كسر أثناء النقل أو التخزين">كسر أثناء النقل أو التخزين</option>
                  <option value="عيب مصنعي تم اكتشافه">عيب مصنعي تم اكتشافه</option>
                  <option value="تلف بسبب الرطوبة أو العوامل الجوية">تلف بسبب الرطوبة أو العوامل الجوية</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDamagedProduct(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2 text-xs font-bold text-white transition shadow-xs"
                >
                  تأكيد وخصم التالف من الرصيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
