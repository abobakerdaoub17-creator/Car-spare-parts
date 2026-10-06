import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Purchase, Product, Supplier } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Truck,
  Plus,
  Search,
  Trash2,
  X,
  Eye,
  Edit3,
  Banknote,
  Building2,
  ArrowLeftRight,
  Clock,
} from 'lucide-react';

interface PurchaseLineItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
}

export const PurchasesView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<Purchase | null>(null);

  // Purchase Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [discount, setDiscount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [payMode, setPayMode] = useState<'cash' | 'bank_transfer' | 'split_half' | 'deferred'>('cash');
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [bankPaid, setBankPaid] = useState<number>(0);
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Items in purchase
  const [items, setItems] = useState<PurchaseLineItem[]>([]);
  const [chosenProductId, setChosenProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(10);
  const [itemPrice, setItemPrice] = useState<number>(0);

  useEffect(() => {
    setPurchases(db.getPurchases());
    const prods = db.getProducts();
    setProducts(prods);
    const supps = db.getSuppliers();
    setSuppliers(supps);
    if (supps.length > 0) setSelectedSupplierId(supps[0].id);
    if (prods.length > 0) {
      setChosenProductId(prods[0].id);
      setItemPrice(prods[0].purchasePrice);
    }
  }, []);

  const handleRefresh = () => {
    setPurchases(db.getPurchases());
    setProducts(db.getProducts());
    setSuppliers(db.getSuppliers());
    refreshAlerts();
  };

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.purchasePrice, 0);
  const totalAmount = Math.max(0, subtotal - discount + shippingCost);
  const paidAmount = cashPaid + bankPaid;

  // Sync payment amounts when totalAmount or payMode changes
  useEffect(() => {
    if (payMode === 'cash') {
      setCashPaid(totalAmount);
      setBankPaid(0);
    } else if (payMode === 'bank_transfer') {
      setCashPaid(0);
      setBankPaid(totalAmount);
    } else if (payMode === 'split_half') {
      const half = +(totalAmount / 2).toFixed(2);
      setCashPaid(half);
      setBankPaid(+(totalAmount - half).toFixed(2));
    } else if (payMode === 'deferred') {
      setCashPaid(0);
      setBankPaid(0);
    }
  }, [totalAmount, payMode]);

  const handleProductSelectChange = (pId: string) => {
    setChosenProductId(pId);
    const p = products.find((prod) => prod.id === pId);
    if (p) {
      setItemPrice(p.purchasePrice);
    }
  };

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === chosenProductId);
    if (!prod) return;
    if (itemQuantity <= 0 || itemPrice < 0) {
      showToast('يرجى تحديد كمية وسعر شراء صحيح', 'warning');
      return;
    }

    const existingIdx = items.findIndex((i) => i.productId === prod.id);
    if (existingIdx !== -1) {
      const updated = [...items];
      updated[existingIdx].quantity += itemQuantity;
      updated[existingIdx].purchasePrice = itemPrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: itemQuantity,
          purchasePrice: itemPrice,
        },
      ]);
    }
    showToast(`تمت إضافة ${prod.name} للفاتورة`, 'info');
  };

  const handleRemoveItem = (pId: string) => {
    setItems(items.filter((i) => i.productId !== pId));
  };

  const openCreateModal = () => {
    setEditingPurchase(null);
    setItems([]);
    setSupplierInvoiceNumber('');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setDiscount(0);
    setShippingCost(0);
    setPayMode('cash');
    setCashPaid(0);
    setBankPaid(0);
    setPurchaseNotes('');
    setShowAddModal(true);
  };

  const openEditPurchaseModal = (p: Purchase) => {
    setEditingPurchase(p);
    setSelectedSupplierId(p.supplierId);
    setSupplierInvoiceNumber(p.supplierInvoiceNumber || '');
    setPurchaseDate(p.date.slice(0, 10));
    setDiscount(p.discount || 0);
    setShippingCost(p.shippingCost || 0);
    setPurchaseNotes(p.notes || '');
    setItems(
      p.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        purchasePrice: it.purchasePrice,
      }))
    );

    const cPaid =
      p.cashPaid !== undefined
        ? p.cashPaid
        : p.paymentMethod === 'cash'
        ? p.paidAmount
        : 0;
    const bPaid =
      p.bankPaid !== undefined
        ? p.bankPaid
        : p.paymentMethod === 'bank_transfer'
        ? p.paidAmount
        : 0;

    if (cPaid > 0 && bPaid > 0) {
      setPayMode('split_half');
    } else if (bPaid > 0 && cPaid === 0) {
      setPayMode('bank_transfer');
    } else if (cPaid === 0 && bPaid === 0 && p.remainingAmount > 0) {
      setPayMode('deferred');
    } else {
      setPayMode('cash');
    }

    setTimeout(() => {
      setCashPaid(cPaid);
      setBankPaid(bPaid);
    }, 0);

    setShowAddModal(true);
  };

  const handleCashInput = (val: number) => {
    const clean = Math.max(0, val);
    setCashPaid(clean);
    if (payMode === 'split_half' && clean <= totalAmount) {
      setBankPaid(+(totalAmount - clean).toFixed(2));
    }
  };

  const handleBankInput = (val: number) => {
    const clean = Math.max(0, val);
    setBankPaid(clean);
    if (payMode === 'split_half' && clean <= totalAmount) {
      setCashPaid(+(totalAmount - clean).toFixed(2));
    }
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (items.length === 0) {
      showToast('يرجى إضافة قطعة واحدة على الأقل لفاتورة الشراء', 'warning');
      return;
    }

    const supp = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supp) {
      showToast('يرجى اختيار المورد', 'warning');
      return;
    }

    let finalMethod: Purchase['paymentMethod'] = 'cash';
    if (cashPaid > 0 && bankPaid > 0) {
      finalMethod = 'mixed';
    } else if (bankPaid > 0 && cashPaid === 0) {
      finalMethod = 'bank_transfer';
    } else if (cashPaid === 0 && bankPaid === 0) {
      finalMethod = 'deferred';
    }

    try {
      const payload = {
        supplierId: supp.id,
        supplierName: supp.name,
        supplierInvoiceNumber,
        date: new Date(purchaseDate).toISOString(),
        items,
        discount,
        shippingCost,
        paidAmount: cashPaid + bankPaid,
        cashPaid,
        bankPaid,
        paymentMethod: finalMethod,
        notes: purchaseNotes,
        user,
      };

      if (editingPurchase) {
        db.updatePurchase(editingPurchase.id, payload);
        showToast('تم حفظ تعديلات فاتورة الشراء وتسوية المخزون وحساب المورد بنجاح', 'success');
      } else {
        db.createPurchase(payload);
        showToast('تم حفظ فاتورة الشراء وزيادة كميات المخزون آلياً بنجاح', 'success');
      }

      setShowAddModal(false);
      setEditingPurchase(null);
      setItems([]);
      setSupplierInvoiceNumber('');
      setDiscount(0);
      setShippingCost(0);
      setCashPaid(0);
      setBankPaid(0);
      setPurchaseNotes('');
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ عملية الشراء', 'error');
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.purchaseNumber.toLowerCase().includes(q) ||
      p.supplierName.toLowerCase().includes(q) ||
      (p.supplierInvoiceNumber && p.supplierInvoiceNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            المشتريات وتوريد البضاعة
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            تسجيل وتعديل فواتير الموردين وزيادة المخزون آلياً مع دعم السداد (كاش / تحويل / نص بنص / آجل)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>فاتورة شراء وتوريد</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <Search className="absolute right-4 top-4 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث برقم أمر الشراء، المورد، أو رقم فاتورة المورد..."
          className="w-full rounded-lg border border-slate-300 bg-white pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
        />
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="p-3">رقم التوريد</th>
                <th className="p-3">فاتورة المورد</th>
                <th className="p-3">المورد</th>
                <th className="p-3">تاريخ الشراء</th>
                <th className="p-3">طريقة السداد</th>
                <th className="p-3">عدد القطع</th>
                <th className="p-3 text-left">الإجمالي</th>
                <th className="p-3 text-left">المدفوع</th>
                <th className="p-3 text-left">المتبقي للمورد</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا توجد فواتير مشتريات مسجلة
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-blue-700">
                      {p.purchaseNumber}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {p.supplierInvoiceNumber || '-'}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {p.supplierName}
                    </td>
                    <td className="p-3 text-slate-500 font-mono">
                      {new Date(p.date).toLocaleDateString('ar-LY')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold border ${
                          p.paymentMethod === 'mixed'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : p.paymentMethod === 'bank_transfer'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : p.paymentMethod === 'deferred'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {p.paymentMethod === 'mixed'
                          ? 'كاش + تحويل'
                          : p.paymentMethod === 'bank_transfer'
                          ? 'تحويل مصرفي'
                          : p.paymentMethod === 'deferred'
                          ? 'آجل'
                          : 'نقدي (كاش)'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {p.items.length} أصناف
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-slate-900 tabular-nums">
                      {p.totalAmount.toFixed(2)} د.ل
                    </td>
                    <td className="p-3 text-left font-mono font-semibold text-emerald-700 tabular-nums">
                      {p.paidAmount.toFixed(2)} د.ل
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-amber-700 tabular-nums">
                      {p.remainingAmount > 0 ? `${p.remainingAmount.toFixed(2)} د.ل` : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedPurchaseDetails(p)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                          title="عرض تفاصيل التوريد"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditPurchaseModal(p)}
                          className="flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition"
                          title="تعديل فاتورة الشراء"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-amber-600" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW / EDIT PURCHASE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-xl p-6 text-slate-900 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {editingPurchase ? (
                  <>
                    <Edit3 className="h-5 w-5 text-amber-600" />
                    <span>تعديل فاتورة الشراء #{editingPurchase.purchaseNumber}</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-5 w-5 text-blue-600" />
                    <span>تسجيل فاتورة شراء بضاعة وتوريد للمخزن</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPurchase(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
              {/* Supplier and Invoice header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">المورد / الشركة *:</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">رقم فاتورة المورد:</label>
                  <input
                    type="text"
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    placeholder="INV-SUPP-980..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">تاريخ الفاتورة:</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Section: Add product to purchase */}
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                <div className="font-bold text-slate-900">إضافة وتعديل قطع الغيار في الفاتورة:</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={chosenProductId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (OEM: {p.oemNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      placeholder="الكمية"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900"
                    />
                  </div>

                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.5"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                      placeholder="سعر التكلفة"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-blue-700 font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="rounded-lg bg-blue-600 px-4 font-bold text-white hover:bg-blue-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Items Added Table */}
                <div className="rounded-lg border border-slate-200 overflow-hidden mt-2">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-2">الصنف</th>
                        <th className="p-2 font-mono">SKU</th>
                        <th className="p-2 text-center">الكمية</th>
                        <th className="p-2 text-left">سعر الشراء</th>
                        <th className="p-2 text-left">الإجمالي</th>
                        <th className="p-2 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">
                            لم تقم بإضافة أي أصناف بعد
                          </td>
                        </tr>
                      ) : (
                        items.map((i, idx) => (
                          <tr key={i.productId}>
                            <td className="p-2 font-semibold text-slate-900">{i.productName}</td>
                            <td className="p-2 font-mono text-slate-500">{i.sku}</td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={i.quantity}
                                onChange={(e) => {
                                  const q = parseInt(e.target.value) || 1;
                                  const copy = [...items];
                                  copy[idx].quantity = q;
                                  setItems(copy);
                                }}
                                className="w-16 rounded border border-slate-300 px-2 py-0.5 text-center font-mono font-bold text-emerald-700"
                              />
                            </td>
                            <td className="p-2 text-left">
                              <input
                                type="number"
                                step="0.5"
                                value={i.purchasePrice}
                                onChange={(e) => {
                                  const pr = parseFloat(e.target.value) || 0;
                                  const copy = [...items];
                                  copy[idx].purchasePrice = pr;
                                  setItems(copy);
                                }}
                                className="w-20 rounded border border-slate-300 px-2 py-0.5 text-left font-mono font-bold"
                              />
                            </td>
                            <td className="p-2 text-left font-mono font-bold text-slate-900">
                              {(i.quantity * i.purchasePrice).toFixed(2)} د.ل
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(i.productId)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block mb-1">المجموع الفرعي:</span>
                  <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                    {subtotal.toFixed(2)} د.ل
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">خصم من المورد:</label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-1.5 font-mono text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">تكلفة شحن / نقل:</label>
                  <input
                    type="number"
                    min="0"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-1.5 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">الإجمالي المطلوب:</span>
                  <div className="font-mono text-base font-bold text-blue-700 tabular-nums">
                    {totalAmount.toFixed(2)} د.ل
                  </div>
                </div>
              </div>

              {/* Payment Method & Split Details */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">طريقة السداد للمورد:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMode('cash')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 font-bold transition ${
                      payMode === 'cash'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    <span>نقدي (كاش بالكامل)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMode('bank_transfer')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 font-bold transition ${
                      payMode === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>تحويل مصرفي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMode('split_half')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 font-bold transition ${
                      payMode === 'split_half'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
                    }`}
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>كاش + تحويل (نص بنص)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMode('deferred')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 font-bold transition ${
                      payMode === 'deferred'
                        ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                        : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>آجل بالكامل</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      المدفوع نقداً (كاش الصندوق):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={cashPaid}
                      onChange={(e) => handleCashInput(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      المدفوع بتحويل مصرفي:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={bankPaid}
                      onChange={(e) => handleBankInput(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <span className="text-slate-700 font-semibold block mb-1">
                      المتبقي الآجل (يضاف لحساب المورد):
                    </span>
                    <div className="font-mono text-base font-bold text-amber-700 mt-2 tabular-nums">
                      {Math.max(0, totalAmount - paidAmount).toFixed(2)} د.ل
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPurchase(null);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`rounded-lg px-5 py-2 font-bold text-white shadow-xs transition ${
                    editingPurchase
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {editingPurchase ? 'حفظ تعديلات فاتورة الشراء' : 'حفظ الفاتورة وزيادة المخزون'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PURCHASE DETAILS MODAL */}
      {selectedPurchaseDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl p-6 text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تفاصيل فاتورة التوريد #{selectedPurchaseDetails.purchaseNumber}
                </h3>
                <span className="text-xs text-slate-500">
                  المورد: {selectedPurchaseDetails.supplierName}
                </span>
              </div>
              <button onClick={() => setSelectedPurchaseDetails(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">فاتورة المورد:</span>
                <span className="font-mono font-bold block">{selectedPurchaseDetails.supplierInvoiceNumber || 'غير محدد'}</span>
              </div>
              <div>
                <span className="text-slate-500">تاريخ الشراء:</span>
                <span className="font-mono font-bold block">{new Date(selectedPurchaseDetails.date).toLocaleDateString('ar-LY')}</span>
              </div>
              <div>
                <span className="text-slate-500">إجمالي الفاتورة:</span>
                <span className="font-mono font-bold text-blue-700 block tabular-nums">
                  {selectedPurchaseDetails.totalAmount.toFixed(2)} د.ل
                </span>
              </div>
              <div>
                <span className="text-slate-500">المتبقي الآجل:</span>
                <span className="font-mono font-bold text-amber-700 block tabular-nums">
                  {selectedPurchaseDetails.remainingAmount.toFixed(2)} د.ل
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900">القطع الموردة للمخزن:</h4>
              <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2">الصنف</th>
                      <th className="p-2 font-mono">SKU</th>
                      <th className="p-2 text-center">الكمية</th>
                      <th className="p-2 text-left">سعر الشراء</th>
                      <th className="p-2 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPurchaseDetails.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-semibold text-slate-900">{it.productName}</td>
                        <td className="p-2 font-mono text-slate-500">{it.sku}</td>
                        <td className="p-2 text-center font-mono font-bold text-emerald-700">{it.quantity}</td>
                        <td className="p-2 text-left font-mono">{it.purchasePrice.toFixed(2)} د.ل</td>
                        <td className="p-2 text-left font-mono font-bold text-slate-900">
                          {(it.quantity * it.purchasePrice).toFixed(2)} د.ل
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const target = selectedPurchaseDetails;
                  setSelectedPurchaseDetails(null);
                  openEditPurchaseModal(target);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white transition"
              >
                <Edit3 className="h-4 w-4" />
                <span>تعديل فاتورة الشراء</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
