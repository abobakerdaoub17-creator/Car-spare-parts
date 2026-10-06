import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Sale, Product, Customer, SalePaymentSplit } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { PrintInvoiceModal } from '../common/PrintInvoiceModal';
import {
  Search,
  Printer,
  Ban,
  FileText,
  Eye,
  X,
  Edit3,
  Plus,
  Minus,
  Trash2,
  Banknote,
  Building2,
  ArrowLeftRight,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface InvoicesViewProps {
  onEditInPos?: (sale: Sale) => void;
}

interface EditableSaleItem {
  productId: string;
  productName: string;
  sku: string;
  oemNumber: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  discount: number;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onEditInPos }) => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'voided' | 'unpaid'>('all');
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);
  const [selectedSaleForView, setSelectedSaleForView] = useState<Sale | null>(null);

  // Edit Invoice Modal State
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [editCustomerId, setEditCustomerId] = useState<string>('');
  const [editItems, setEditItems] = useState<EditableSaleItem[]>([]);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editPayMode, setEditPayMode] = useState<'cash' | 'bank_transfer' | 'split_half' | 'deferred'>('cash');
  const [editCashAmount, setEditCashAmount] = useState<string>('0');
  const [editBankAmount, setEditBankAmount] = useState<string>('0');
  const [editBankRef, setEditBankRef] = useState<string>('');
  const [editDeferredAmount, setEditDeferredAmount] = useState<string>('0');
  const [editNotes, setEditNotes] = useState<string>('');
  const [addProductId, setAddProductId] = useState<string>('');

  // Void modal
  const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    setSales(db.getSales());
    const prods = db.getProducts();
    setProducts(prods);
    if (prods.length > 0) setAddProductId(prods[0].id);
    setCustomers(db.getCustomers());
  }, []);

  const handleRefresh = () => {
    setSales(db.getSales());
    setProducts(db.getProducts());
    setCustomers(db.getCustomers());
    refreshAlerts();
  };

  const filteredSales = sales.filter((sale) => {
    if (statusFilter === 'completed' && sale.status !== 'completed') return false;
    if (statusFilter === 'voided' && sale.status !== 'voided') return false;
    if (statusFilter === 'unpaid' && sale.remainingAmount <= 0) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sale.invoiceNumber.toLowerCase().includes(q) ||
      sale.customerName.toLowerCase().includes(q) ||
      sale.employeeName.toLowerCase().includes(q)
    );
  });

  // Open Edit Modal for a Sale
  const handleOpenEditModal = (sale: Sale) => {
    if (sale.status === 'voided') {
      showToast('لا يمكن تعديل فاتورة ملغاة', 'error');
      return;
    }

    setSaleToEdit(sale);
    setEditCustomerId(sale.customerId);
    setEditItems(
      sale.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        oemNumber: i.oemNumber,
        brand: i.brand,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        purchasePrice: i.purchasePrice,
        discount: i.discount || 0,
      }))
    );
    setEditDiscount(sale.discount || 0);
    setEditNotes(sale.notes || '');

    const cPaid = sale.payments
      .filter((p) => p.method === 'cash')
      .reduce((s, p) => s + p.amount, 0);
    const bPaid = sale.payments
      .filter((p) => p.method === 'bank_transfer')
      .reduce((s, p) => s + p.amount, 0);
    const dPaid = sale.payments
      .filter((p) => p.method === 'deferred')
      .reduce((s, p) => s + p.amount, 0);
    const bRef = sale.payments.find((p) => p.method === 'bank_transfer')?.referenceNumber || '';

    if (cPaid > 0 && bPaid > 0) {
      setEditPayMode('split_half');
    } else if (bPaid > 0 && cPaid === 0 && dPaid === 0) {
      setEditPayMode('bank_transfer');
    } else if (dPaid > 0 && cPaid === 0 && bPaid === 0) {
      setEditPayMode('deferred');
    } else {
      setEditPayMode('cash');
    }

    setEditCashAmount(cPaid.toFixed(2));
    setEditBankAmount(bPaid.toFixed(2));
    setEditDeferredAmount(dPaid.toFixed(2));
    setEditBankRef(bRef);
  };

  // Computed Edit Totals
  const editSubtotal = editItems.reduce(
    (sum, i) => sum + (i.unitPrice * i.quantity - i.discount),
    0
  );
  const editTotalAmount = Math.max(0, editSubtotal - editDiscount);

  const applyEditPayMode = (
    mode: 'cash' | 'bank_transfer' | 'split_half' | 'deferred',
    targetTotal = editTotalAmount
  ) => {
    setEditPayMode(mode);
    if (mode === 'cash') {
      setEditCashAmount(targetTotal.toFixed(2));
      setEditBankAmount('0');
      setEditDeferredAmount('0');
    } else if (mode === 'bank_transfer') {
      setEditCashAmount('0');
      setEditBankAmount(targetTotal.toFixed(2));
      setEditDeferredAmount('0');
    } else if (mode === 'split_half') {
      const half = +(targetTotal / 2).toFixed(2);
      const otherHalf = +(targetTotal - half).toFixed(2);
      setEditCashAmount(half.toFixed(2));
      setEditBankAmount(otherHalf.toFixed(2));
      setEditDeferredAmount('0');
    } else if (mode === 'deferred') {
      setEditCashAmount('0');
      setEditBankAmount('0');
      setEditDeferredAmount(targetTotal.toFixed(2));
    }
  };

  // Auto-sync payment amounts when editItems or editDiscount changes
  const recalculateEditPaymentsForNewTotal = (newTotal: number) => {
    if (editPayMode === 'cash') {
      setEditCashAmount(newTotal.toFixed(2));
      setEditBankAmount('0');
      setEditDeferredAmount('0');
    } else if (editPayMode === 'bank_transfer') {
      setEditCashAmount('0');
      setEditBankAmount(newTotal.toFixed(2));
      setEditDeferredAmount('0');
    } else if (editPayMode === 'split_half') {
      const half = +(newTotal / 2).toFixed(2);
      setEditCashAmount(half.toFixed(2));
      setEditBankAmount((newTotal - half).toFixed(2));
      setEditDeferredAmount('0');
    } else if (editPayMode === 'deferred') {
      setEditCashAmount('0');
      setEditBankAmount('0');
      setEditDeferredAmount(newTotal.toFixed(2));
    }
  };

  const handleEditItemQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveEditItem(productId);
      return;
    }
    const updated = editItems.map((item) =>
      item.productId === productId ? { ...item, quantity: newQty } : item
    );
    setEditItems(updated);
    const newSub = updated.reduce((s, i) => s + (i.unitPrice * i.quantity - i.discount), 0);
    recalculateEditPaymentsForNewTotal(Math.max(0, newSub - editDiscount));
  };

  const handleEditItemPrice = (productId: string, newPrice: number) => {
    const updated = editItems.map((item) =>
      item.productId === productId ? { ...item, unitPrice: newPrice } : item
    );
    setEditItems(updated);
    const newSub = updated.reduce((s, i) => s + (i.unitPrice * i.quantity - i.discount), 0);
    recalculateEditPaymentsForNewTotal(Math.max(0, newSub - editDiscount));
  };

  const handleRemoveEditItem = (productId: string) => {
    const updated = editItems.filter((item) => item.productId !== productId);
    setEditItems(updated);
    const newSub = updated.reduce((s, i) => s + (i.unitPrice * i.quantity - i.discount), 0);
    recalculateEditPaymentsForNewTotal(Math.max(0, newSub - editDiscount));
  };

  const handleAddProductToEditInvoice = () => {
    const prod = products.find((p) => p.id === addProductId);
    if (!prod) return;

    const existing = editItems.find((i) => i.productId === prod.id);
    let updated: EditableSaleItem[];
    if (existing) {
      updated = editItems.map((i) =>
        i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      updated = [
        ...editItems,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          oemNumber: prod.oemNumber,
          brand: prod.brand,
          quantity: 1,
          unitPrice: prod.retailPrice,
          purchasePrice: prod.purchasePrice,
          discount: 0,
        },
      ];
    }
    setEditItems(updated);
    const newSub = updated.reduce((s, i) => s + (i.unitPrice * i.quantity - i.discount), 0);
    recalculateEditPaymentsForNewTotal(Math.max(0, newSub - editDiscount));
  };

  const handleEditCashChange = (val: string) => {
    setEditCashAmount(val);
    const numCash = Math.max(0, parseFloat(val) || 0);
    const numDef = Math.max(0, parseFloat(editDeferredAmount) || 0);
    if (numCash <= editTotalAmount - numDef) {
      setEditBankAmount(Math.max(0, editTotalAmount - numDef - numCash).toFixed(2));
    }
  };

  const handleEditBankChange = (val: string) => {
    setEditBankAmount(val);
    const numBank = Math.max(0, parseFloat(val) || 0);
    const numDef = Math.max(0, parseFloat(editDeferredAmount) || 0);
    if (numBank <= editTotalAmount - numDef) {
      setEditCashAmount(Math.max(0, editTotalAmount - numDef - numBank).toFixed(2));
    }
  };

  const handleSaveEditedSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToEdit || !user) return;

    if (editItems.length === 0) {
      showToast('لا يمكن حفظ الفاتورة بدون أصناف', 'error');
      return;
    }

    const numCash = parseFloat(editCashAmount) || 0;
    const numBank = parseFloat(editBankAmount) || 0;
    const numDef = parseFloat(editDeferredAmount) || 0;
    const sumSplits = numCash + numBank + numDef;

    if (Math.abs(sumSplits - editTotalAmount) > 0.05) {
      showToast(
        `مجموع طرق الدفع (${sumSplits.toFixed(2)}) لا يطابق صافي الفاتورة (${editTotalAmount.toFixed(2)})`,
        'error'
      );
      return;
    }

    try {
      const paymentSplits: SalePaymentSplit[] = [];
      if (numCash > 0) {
        paymentSplits.push({ method: 'cash', amount: numCash, notes: 'نقدي مقبوض (كاش)' });
      }
      if (numBank > 0) {
        paymentSplits.push({
          method: 'bank_transfer',
          amount: numBank,
          referenceNumber: editBankRef,
          notes: 'تحويل مصرفي',
        });
      }
      if (numDef > 0) {
        paymentSplits.push({
          method: 'deferred',
          amount: numDef,
          notes: 'آجل على حساب العميل',
        });
      }

      const chosenCust = customers.find((c) => c.id === editCustomerId);

      const updated = db.updateSale(saleToEdit.id, {
        customerId: chosenCust ? chosenCust.id : saleToEdit.customerId,
        customerName: chosenCust ? chosenCust.name : saleToEdit.customerName,
        customerPhone: chosenCust?.phone || saleToEdit.customerPhone,
        items: editItems,
        discount: editDiscount,
        payments: paymentSplits,
        notes: editNotes,
        user,
      });

      showToast(
        `تم تعديل الفاتورة ${updated.invoiceNumber} وتسوية المخزون والحسابات بنجاح`,
        'success'
      );
      setSaleToEdit(null);
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل تعديل الفاتورة', 'error');
    }
  };

  const handleConfirmVoid = () => {
    if (!saleToVoid || !user) return;
    if (!voidReason.trim()) {
      showToast('يرجى ذكر سبب إلغاء الفاتورة', 'warning');
      return;
    }

    try {
      db.voidSale(saleToVoid.id, voidReason, user);
      showToast(`تم إلغاء الفاتورة ${saleToVoid.invoiceNumber} وإرجاع الأصناف للمخزون`, 'success');
      setSaleToVoid(null);
      setVoidReason('');
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل إلغاء الفاتورة', 'error');
    }
  };

  const getPaymentBadge = (sale: Sale) => {
    const hasCash = sale.payments.some((p) => p.method === 'cash' && p.amount > 0);
    const hasBank = sale.payments.some((p) => p.method === 'bank_transfer' && p.amount > 0);
    const hasDef = sale.payments.some((p) => p.method === 'deferred' && p.amount > 0);

    if (hasCash && hasBank) {
      return (
        <span className="inline-block rounded bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold">
          كاش + تحويل
        </span>
      );
    }
    if (hasBank && !hasCash && !hasDef) {
      return (
        <span className="inline-block rounded bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
          تحويل مصرفي
        </span>
      );
    }
    if (hasDef && !hasCash && !hasBank) {
      return (
        <span className="inline-block rounded bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
          آجل بالكامل
        </span>
      );
    }
    if (hasDef && (hasCash || hasBank)) {
      return (
        <span className="inline-block rounded bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
          دفع جزئي + آجل
        </span>
      );
    }
    return (
      <span className="inline-block rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
        نقدي (كاش)
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            سجل فواتير المبيعات وتعديل الفواتير
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            متابعة وتعديل وإعادة طباعة فواتير البيع وتوزيع السداد (كاش / تحويل / نص بنص / آجل)
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الفاتورة أو العميل..."
              className="rounded-lg border border-slate-300 bg-white pr-8 pl-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              الكل ({sales.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                statusFilter === 'completed' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              معتمدة
            </button>
            <button
              onClick={() => setStatusFilter('unpaid')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                statusFilter === 'unpaid' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              آجلة
            </button>
            <button
              onClick={() => setStatusFilter('voided')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                statusFilter === 'voided' ? 'bg-white text-red-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              ملغاة
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">العميل</th>
                <th className="p-3">طريقة السداد</th>
                <th className="p-3">الأصناف</th>
                <th className="p-3 text-left">الإجمالي</th>
                <th className="p-3 text-left">المدفوع</th>
                <th className="p-3 text-left">المتبقي (آجل)</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا توجد فواتير مطابقة
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-blue-700">
                      {sale.invoiceNumber}
                    </td>
                    <td className="p-3 text-slate-600 font-mono">
                      {new Date(sale.date).toLocaleDateString('ar-LY', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {sale.customerName}
                    </td>
                    <td className="p-3">{getPaymentBadge(sale)}</td>
                    <td className="p-3 text-slate-600">
                      {sale.items.length} قطع
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-slate-900 tabular-nums">
                      {sale.totalAmount.toFixed(2)} د.ل
                    </td>
                    <td className="p-3 text-left font-mono font-semibold text-emerald-700 tabular-nums">
                      {sale.paidAmount.toFixed(2)} د.ل
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-red-600 tabular-nums">
                      {sale.remainingAmount > 0 ? `${sale.remainingAmount.toFixed(2)} د.ل` : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold border ${
                          sale.status === 'voided'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : sale.remainingAmount > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {sale.status === 'voided' ? 'ملغاة' : sale.remainingAmount > 0 ? 'آجل جزئي' : 'مسددة'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedSaleForView(sale)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                          title="عرض تفاصيل الفاتورة"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {sale.status !== 'voided' && (
                          <button
                            onClick={() => handleOpenEditModal(sale)}
                            className="flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition"
                            title="تعديل أصناف الفاتورة أو طريقة الدفع"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-amber-600" />
                            <span>تعديل</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedSaleForPrint(sale)}
                          className="rounded p-1.5 text-blue-600 hover:bg-blue-50 transition"
                          title="طباعة (حراري أو A4)"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {sale.status === 'completed' && user?.role === 'admin' && (
                          <button
                            onClick={() => setSaleToVoid(sale)}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50 transition"
                            title="إلغاء الفاتورة وإرجاع الأصناف للمخزون"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT INVOICE MODAL */}
      {saleToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-xl p-6 text-slate-900 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-amber-600" />
                  <span>تعديل الفاتورة #{saleToEdit.invoiceNumber}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  تعديل الأصناف، الكميات، الأسعار، وطريقة السداد (كاش / تحويل / نص بنص / آجل) مع تسوية آلية للمخزون والحسابات
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onEditInPos && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = saleToEdit;
                      setSaleToEdit(null);
                      onEditInPos(target);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>فتح في شاشة الكاشير (POS)</span>
                  </button>
                )}
                <button
                  onClick={() => setSaleToEdit(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEditedSale} className="space-y-4 text-xs">
              {/* Customer & Discount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 mb-1 font-semibold">العميل:</label>
                  <select
                    value={editCustomerId}
                    onChange={(e) => setEditCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerType}) — الرصيد الحالي: {c.currentBalance} د.ل
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">الخصم على الفاتورة (د.ل):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editDiscount}
                    onChange={(e) => {
                      const d = parseFloat(e.target.value) || 0;
                      setEditDiscount(d);
                      recalculateEditPaymentsForNewTotal(Math.max(0, editSubtotal - d));
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono font-bold text-red-600 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Editor */}
              <div className="rounded-lg border border-slate-200 p-3 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900">أصناف الفاتورة:</h4>
                  <div className="flex items-center gap-2">
                    <select
                      value={addProductId}
                      onChange={(e) => setAddProductId(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (OEM: {p.oemNumber}) - السعر: {p.retailPrice} د.ل
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddProductToEditInvoice}
                      className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 font-bold text-white transition shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>إضافة صنف</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2">الصنف</th>
                        <th className="p-2">OEM</th>
                        <th className="p-2 text-center">الكمية</th>
                        <th className="p-2 text-left">سعر الوحدة (د.ل)</th>
                        <th className="p-2 text-left">الإجمالي</th>
                        <th className="p-2 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editItems.map((item) => (
                        <tr key={item.productId}>
                          <td className="p-2 font-semibold text-slate-900">{item.productName}</td>
                          <td className="p-2 font-mono text-slate-500">{item.oemNumber}</td>
                          <td className="p-2 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditItemQuantity(item.productId, item.quantity - 1)
                                }
                                className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleEditItemQuantity(
                                    item.productId,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-12 rounded border border-slate-300 text-center font-mono font-bold py-0.5"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditItemQuantity(item.productId, item.quantity + 1)
                                }
                                className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-2 text-left">
                            <input
                              type="number"
                              step="0.5"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleEditItemPrice(
                                  item.productId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 rounded border border-slate-300 px-2 py-1 text-left font-mono font-bold"
                            />
                          </td>
                          <td className="p-2 text-left font-mono font-bold text-slate-900">
                            {(item.unitPrice * item.quantity - item.discount).toFixed(2)} د.ل
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveEditItem(item.productId)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Method & Split Section */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900">
                    طريقة السداد وتوزيع المبلغ:
                  </span>
                  <div className="text-sm font-bold text-blue-700 font-mono">
                    صافي الفاتورة بعد التعديل: {editTotalAmount.toFixed(2)} د.ل
                  </div>
                </div>

                {/* 4 Mode Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyEditPayMode('cash')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 font-bold transition ${
                      editPayMode === 'cash'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    <span>نقدي (كاش بالكامل)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyEditPayMode('bank_transfer')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 font-bold transition ${
                      editPayMode === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>تحويل مصرفي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyEditPayMode('split_half')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 font-bold transition ${
                      editPayMode === 'split_half'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>كاش + تحويل (نص بنص)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyEditPayMode('deferred')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 font-bold transition ${
                      editPayMode === 'deferred'
                        ? 'border-red-600 bg-red-600 text-white shadow-xs'
                        : 'border-red-200 bg-white text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>آجل (على الحساب)</span>
                  </button>
                </div>

                {/* Amounts Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      المبلغ النقدي (كاش):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={editCashAmount}
                      onChange={(e) => handleEditCashChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      مبلغ التحويل المصرفي:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={editBankAmount}
                      onChange={(e) => handleEditBankChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      المبلغ الآجل (ذمم العميل):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={editDeferredAmount}
                      onChange={(e) => setEditDeferredAmount(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono font-bold text-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      رقم مرجع التحويل المصرفي (إن وجد):
                    </label>
                    <input
                      type="text"
                      value={editBankRef}
                      onChange={(e) => setEditBankRef(e.target.value)}
                      placeholder="TX-..."
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      ملاحظات الفاتورة:
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="ملاحظات إضافية..."
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSaleToEdit(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-5 py-2 font-bold text-white shadow-xs transition"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>حفظ تعديلات الفاتورة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedSaleForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl p-6 text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تفاصيل الفاتورة #{selectedSaleForView.invoiceNumber}
                </h3>
                <span className="text-xs text-slate-500">
                  {new Date(selectedSaleForView.date).toLocaleString('ar-LY')}
                </span>
              </div>
              <button onClick={() => setSelectedSaleForView(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">العميل:</span>
                <span className="font-bold text-slate-900 block">{selectedSaleForView.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500">البائع المسؤول:</span>
                <span className="font-bold text-slate-900 block">{selectedSaleForView.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-500">إجمالي الفاتورة:</span>
                <span className="font-mono font-bold text-blue-700 block tabular-nums">
                  {selectedSaleForView.totalAmount.toFixed(2)} د.ل
                </span>
              </div>
              <div>
                <span className="text-slate-500">المتبقي الآجل:</span>
                <span className="font-mono font-bold text-red-600 block tabular-nums">
                  {selectedSaleForView.remainingAmount.toFixed(2)} د.ل
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-bold text-xs text-slate-900 mb-2">الأصناف المبيعة:</h4>
              <table className="w-full text-right text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2">الصنف</th>
                    <th className="p-2">OEM</th>
                    <th className="p-2 text-center">الكمية</th>
                    <th className="p-2 text-left">السعر</th>
                    <th className="p-2 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSaleForView.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-semibold text-slate-900">{it.productName}</td>
                      <td className="p-2 font-mono text-slate-600">{it.oemNumber}</td>
                      <td className="p-2 text-center font-bold font-mono">{it.quantity}</td>
                      <td className="p-2 text-left font-mono">{it.unitPrice.toFixed(2)} د.ل</td>
                      <td className="p-2 text-left font-mono font-bold text-slate-900">{it.totalPrice.toFixed(2)} د.ل</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payments list */}
            <div>
              <h4 className="font-bold text-xs text-slate-900 mb-2">طرق الدفع:</h4>
              <div className="space-y-1 text-xs">
                {selectedSaleForView.payments.map((p, i) => (
                  <div key={i} className="flex justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">
                      {p.method === 'cash'
                        ? 'نقدي مقبوض (كاش)'
                        : p.method === 'bank_transfer'
                        ? `تحويل مصرفي ${p.referenceNumber ? `(${p.referenceNumber})` : ''}`
                        : 'آجل على حساب العميل'}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{p.amount.toFixed(2)} د.ل</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {selectedSaleForView.status !== 'voided' && (
                <button
                  onClick={() => {
                    const target = selectedSaleForView;
                    setSelectedSaleForView(null);
                    handleOpenEditModal(target);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>تعديل الفاتورة</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedSaleForPrint(selectedSaleForView);
                  setSelectedSaleForView(null);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOID CONFIRMATION MODAL */}
      {saleToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-md rounded-xl border border-red-200 bg-white shadow-xl p-6 text-slate-900 space-y-4">
            <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
              <Ban className="h-5 w-5" />
              إلغاء الفاتورة #{saleToVoid.invoiceNumber}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              وفقاً للقواعد المحاسبية، لا يتم حذف الفاتورة بل وسمها بـ &quot;ملغاة (Voided)&quot; وإعادة الكميات تلقائياً إلى رصيد المخزن وتسوية مديونية العميل.
            </p>

            <div>
              <label className="block text-slate-700 mb-1 text-xs font-semibold">سبب الإلغاء *:</label>
              <textarea
                rows={2}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="مثال: خطأ في إدخال الصنف / رغبة الزبون في التبديل..."
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSaleToVoid(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmVoid}
                className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs"
              >
                تأكيد إلغاء الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {selectedSaleForPrint && (
        <PrintInvoiceModal
          sale={selectedSaleForPrint}
          isOpen={!!selectedSaleForPrint}
          onClose={() => setSelectedSaleForPrint(null)}
        />
      )}
    </div>
  );
};
