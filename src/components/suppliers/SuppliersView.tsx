import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Supplier, SupplierPayment, Purchase } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Building2,
  Search,
  Plus,
  CreditCard,
  Phone,
  Globe,
  FileText,
  X,
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);

  // New Supplier Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [suppName, setSuppName] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppAddress, setSuppAddress] = useState('');
  const [suppCountry, setSuppCountry] = useState('ليبيا');
  const [suppCurrency, setSuppCurrency] = useState('د.ل');
  const [suppNotes, setSuppNotes] = useState('');

  // Payment Recording Modal
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'cheque' | 'other'>('cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  useEffect(() => {
    setSuppliers(db.getSuppliers());
  }, []);

  const handleRefresh = () => {
    setSuppliers(db.getSuppliers());
    refreshAlerts();
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      (s.phone && s.phone.toLowerCase().includes(q))
    );
  });

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!suppName.trim()) {
      showToast('يرجى إدخال اسم المورد أو الشركة', 'warning');
      return;
    }

    try {
      db.addSupplier(
        {
          name: suppName,
          phone: suppPhone,
          address: suppAddress,
          country: suppCountry,
          currency: suppCurrency,
          notes: suppNotes,
        },
        user
      );

      showToast(`تمت إضافة المورد (${suppName}) بنجاح`, 'success');
      setShowAddModal(false);
      setSuppName('');
      setSuppPhone('');
      setSuppAddress('');
      setSuppNotes('');
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء إضافة المورد', 'error');
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier || !user) return;
    if (payAmount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح أكبر من صفر', 'warning');
      return;
    }

    try {
      db.recordSupplierPayment({
        supplierId: payingSupplier.id,
        amount: payAmount,
        paymentMethod: payMethod,
        referenceNumber: payRef,
        notes: payNotes,
        user,
      });

      showToast(`تم تسجيل سداد بقيمة ${payAmount} د.ل للمورد (${payingSupplier.name}) بنجاح`, 'success');
      setPayingSupplier(null);
      setPayAmount(0);
      setPayRef('');
      setPayNotes('');
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل تسجيل الدفعة', 'error');
    }
  };

  const supplierPurchases: Purchase[] = activeSupplier
    ? db.getPurchases().filter((p) => p.supplierId === activeSupplier.id)
    : [];

  const supplierPayments: SupplierPayment[] = activeSupplier
    ? db.getSupplierPayments(activeSupplier.id)
    : [];

  const totalSupplierPurchases = supplierPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            دليل الموردين والشركات
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة الموردين المحليين والدوليين، المستحقات المالية، وسندات الصرف
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة مورد جديد</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <Search className="absolute right-4 top-4 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث باسم المورد، بلد المنشأ، أو الهاتف..."
          className="w-full rounded-lg border border-slate-300 bg-white pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredSuppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                    {s.country}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1.5">{s.name}</h3>
                </div>

                <div className="text-left font-mono">
                  <span className="text-[10px] text-slate-400 block">مستحقات المورد:</span>
                  <span className={`text-base font-bold tabular-nums ${s.balance > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                    {s.balance.toFixed(2)} د.ل
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono">{s.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  <span>{s.address}</span>
                </div>
                {s.notes && (
                  <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-1 border-t border-slate-100 pt-1">
                    {s.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setPayingSupplier(s);
                  setPayAmount(s.balance > 0 ? s.balance : 0);
                }}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 py-1.5 text-xs font-bold text-white transition shadow-2xs"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>سداد للمورد</span>
              </button>

              <button
                onClick={() => setActiveSupplier(s)}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-50 hover:bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 transition border border-slate-200"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>كشف الحساب</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SUPPLIER PAYMENT MODAL */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">سداد دفعة لمورد / شركة</h3>
                <p className="text-xs text-slate-500">المورد: {payingSupplier.name}</p>
              </div>
              <button onClick={() => setPayingSupplier(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-200 flex justify-between items-center">
              <span className="text-slate-600 font-medium">مستحقات المورد الحالية:</span>
              <span className="font-mono text-base font-bold text-amber-700 tabular-nums">
                {payingSupplier.balance.toFixed(2)} د.ل
              </span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">المبلغ المسدد (د.ل) *:</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0.5"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-base font-bold text-slate-900 focus:border-blue-600 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">طريقة الدفع:</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="cash">نقداً (يخصم من الصندوق)</option>
                  <option value="bank_transfer">تحويل مصرفي</option>
                  <option value="cheque">صك مصدق</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">رقم مرجع الحوالة / الصك:</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="رقم التحويل إن وجد..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="ملاحظات حول الفاتورة أو الدفعة..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingSupplier(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 shadow-xs transition"
                >
                  تأكيد سداد المبلغ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATEMENT OF ACCOUNT MODAL */}
      {activeSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl p-6 text-slate-900 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  كشف حساب المورد: {activeSupplier.name}
                </h3>
                <p className="text-xs text-slate-500">
                  بلد المنشأ: {activeSupplier.country} · الهاتف: {activeSupplier.phone}
                </p>
              </div>
              <button onClick={() => setActiveSupplier(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-slate-500">إجمالي المشتريات من المورد:</span>
                <div className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {totalSupplierPurchases.toFixed(2)} د.ل
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-slate-500">المستحقات الحالية للمورد:</span>
                <div className="text-base font-bold font-mono text-amber-700 mt-1 tabular-nums">
                  {activeSupplier.balance.toFixed(2)} د.ل
                </div>
              </div>
            </div>

            {/* Purchases History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">سجل فواتير التوريد:</h4>
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">رقم فاتورة الشراء</th>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5 text-left">الإجمالي</th>
                      <th className="p-2.5 text-left">المدفوع</th>
                      <th className="p-2.5 text-left">المتبقي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">لا توجد فواتير شراء مسجلة</td>
                      </tr>
                    ) : (
                      supplierPurchases.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-mono text-blue-700 font-bold">{p.purchaseNumber}</td>
                          <td className="p-2.5 text-slate-500">{new Date(p.date).toLocaleDateString('ar-LY')}</td>
                          <td className="p-2.5 text-left font-mono font-bold text-slate-900 tabular-nums">{p.totalAmount.toFixed(2)} د.ل</td>
                          <td className="p-2.5 text-left font-mono text-emerald-700 tabular-nums">{p.paidAmount.toFixed(2)} د.ل</td>
                          <td className="p-2.5 text-left font-mono text-amber-700 font-bold tabular-nums">{p.remainingAmount.toFixed(2)} د.ل</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments History */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-900">سجل الدفعات المسددة للمورد:</h4>
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">رقم السند</th>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">طريقة الدفع</th>
                      <th className="p-2.5 text-left">المبلغ المسدد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierPayments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">لا توجد دفعات مسجلة</td>
                      </tr>
                    ) : (
                      supplierPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-mono text-slate-500">{p.id}</td>
                          <td className="p-2.5 text-slate-500">{new Date(p.date).toLocaleDateString('ar-LY')}</td>
                          <td className="p-2.5 text-slate-700">
                            {p.paymentMethod === 'cash' ? 'نقدي' : 'تحويل مصرفي'}
                          </td>
                          <td className="p-2.5 text-left font-mono font-bold text-blue-700 tabular-nums">
                            {p.amount.toFixed(2)} د.ل
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD SUPPLIER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">إضافة مورد أو شركة جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">اسم المورد / الشركة *:</label>
                <input
                  type="text"
                  required
                  value={suppName}
                  onChange={(e) => setSuppName(e.target.value)}
                  placeholder="شركة المدار لقطع الغيار، دبي..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={suppPhone}
                    onChange={(e) => setSuppPhone(e.target.value)}
                    placeholder="091-XXXXXXX"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">بلد المنشأ / التوريد:</label>
                  <input
                    type="text"
                    value={suppCountry}
                    onChange={(e) => setSuppCountry(e.target.value)}
                    placeholder="ليبيا / الإمارات / تركيا / الصين..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">العنوان ومقر الشركة:</label>
                <input
                  type="text"
                  value={suppAddress}
                  onChange={(e) => setSuppAddress(e.target.value)}
                  placeholder="طرابلس - شارع الجمهورية..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ملاحظات إضافية:</label>
                <textarea
                  rows={2}
                  value={suppNotes}
                  onChange={(e) => setSuppNotes(e.target.value)}
                  placeholder="شروط الدفع والشحن..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-xs transition"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
