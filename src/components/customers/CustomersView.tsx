import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Customer, CustomerType, CustomerPayment, Sale } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Phone,
  MapPin,
  FileText,
  X,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Selected customer for Statement of Account (كشف حساب)
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // New Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCity, setCustCity] = useState('طرابلس');
  const [custArea, setCustArea] = useState('');
  const [custType, setCustType] = useState<CustomerType>('ورشة');
  const [custCreditLimit, setCustCreditLimit] = useState<number>(3000);
  const [custNotes, setCustNotes] = useState('');

  // Payment Recording Modal
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'cheque' | 'other'>('cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  useEffect(() => {
    setCustomers(db.getCustomers());
  }, []);

  const handleRefresh = () => {
    setCustomers(db.getCustomers());
    refreshAlerts();
  };

  const filteredCustomers = customers.filter((c) => {
    if (typeFilter !== 'all' && c.customerType !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.area.toLowerCase().includes(q)
    );
  });

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!custName.trim() || !custPhone.trim()) {
      showToast('يرجى إدخال اسم العميل ورقم الهاتف', 'warning');
      return;
    }

    try {
      db.addCustomer(
        {
          name: custName,
          phone: custPhone,
          address: custAddress,
          city: custCity,
          area: custArea,
          customerType: custType,
          creditLimit: custCreditLimit,
          notes: custNotes,
        },
        user
      );

      showToast(`تمت إضافة العميل (${custName}) بنجاح`, 'success');
      setShowAddModal(false);
      setCustName('');
      setCustPhone('');
      setCustAddress('');
      setCustArea('');
      setCustNotes('');
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء إضافة العميل', 'error');
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer || !user) return;
    if (payAmount <= 0) {
      showToast('يرجى إدخال مبلغ دفع صحيح أكبر من صفر', 'warning');
      return;
    }

    try {
      db.recordCustomerPayment({
        customerId: payingCustomer.id,
        amount: payAmount,
        paymentMethod: payMethod,
        referenceNumber: payRef,
        notes: payNotes,
        user,
      });

      showToast(`تم تسجيل الدفعة بقيمة ${payAmount} د.ل للعميل (${payingCustomer.name}) بنجاح`, 'success');
      setPayingCustomer(null);
      setPayAmount(0);
      setPayRef('');
      setPayNotes('');
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل تسجيل الدفعة', 'error');
    }
  };

  const customerSales: Sale[] = activeCustomer
    ? db.getSales().filter((s) => s.customerId === activeCustomer.id)
    : [];

  const customerPayments: CustomerPayment[] = activeCustomer
    ? db.getCustomerPayments(activeCustomer.id)
    : [];

  const totalCustomerPurchases = customerSales.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            دليل العملاء والورش والديون
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة حسابات الورش، المحلات، الشركات والأفراد مع سقف الائتمان وسداد الديون
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة عميل أو ورشة</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم العميل، الهاتف، المدينة، أو المنطقة..."
            className="w-full rounded-lg border border-slate-300 bg-white pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
          {['all', 'ورشة', 'محل', 'شركة', 'فرد'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-3 py-1 font-semibold transition ${
                typeFilter === t ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {t === 'all' ? 'الكل' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCustomers.map((c) => {
          const hasDebt = c.currentBalance > 0;
          const isOverLimit = c.creditLimit > 0 && c.currentBalance >= c.creditLimit;

          return (
            <div
              key={c.id}
              className={`bg-white rounded-xl border p-4 shadow-xs transition flex flex-col justify-between ${
                isOverLimit
                  ? 'border-red-300 bg-red-50/20'
                  : hasDebt
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                      {c.customerType}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1.5">{c.name}</h3>
                  </div>

                  <div className="text-left font-mono">
                    <span className="text-[10px] text-slate-400 block">الرصيد المستحق:</span>
                    <span className={`text-base font-bold tabular-nums ${hasDebt ? 'text-red-600' : 'text-emerald-700'}`}>
                      {c.currentBalance.toFixed(2)} د.ل
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{c.city} - {c.area || c.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <span className="text-slate-500">الحد الائتماني:</span>
                    <strong className="text-slate-700 font-mono tabular-nums">{c.creditLimit} د.ل</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setPayingCustomer(c);
                    setPayAmount(c.currentBalance > 0 ? c.currentBalance : 0);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-1.5 text-xs font-bold text-white transition shadow-2xs"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>تسديد دفعة</span>
                </button>

                <button
                  onClick={() => setActiveCustomer(c)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-50 hover:bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 transition border border-slate-200"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <span>كشف الحساب</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">تسجيل سند قبض / سداد دين</h3>
                <p className="text-xs text-slate-500">العميل: {payingCustomer.name}</p>
              </div>
              <button onClick={() => setPayingCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-200 flex justify-between items-center">
              <span className="text-slate-600 font-medium">الرصيد المستحق الحالي:</span>
              <span className="font-mono text-base font-bold text-red-600 tabular-nums">
                {payingCustomer.currentBalance.toFixed(2)} د.ل
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
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-base font-bold text-emerald-700 focus:border-blue-600 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">طريقة السداد:</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="cash">نقداً (يضاف للصندوق)</option>
                  <option value="bank_transfer">تحويل مصرفي (سداد / تداول / مباشر)</option>
                  <option value="cheque">صك مصدق</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">رقم مرجع التحويل أو الصك:</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="رقم العملية البنكية إن وجد..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="اسم الشخص المسدد، توضيح..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                >
                  تأكيد خصم الرصيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATEMENT OF ACCOUNT MODAL */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl p-6 text-slate-900 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  كشف حساب العميل: {activeCustomer.name}
                </h3>
                <p className="text-xs text-slate-500">
                  نوع العميل: {activeCustomer.customerType} · الهاتف: {activeCustomer.phone}
                </p>
              </div>
              <button onClick={() => setActiveCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-slate-500">إجمالي المشتريات:</span>
                <div className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {totalCustomerPurchases.toFixed(2)} د.ل
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-slate-500">الرصيد المستحق (الدين):</span>
                <div className="text-base font-bold font-mono text-red-600 mt-1 tabular-nums">
                  {activeCustomer.currentBalance.toFixed(2)} د.ل
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-slate-500">الحد الائتماني:</span>
                <div className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {activeCustomer.creditLimit.toFixed(2)} د.ل
                </div>
              </div>
            </div>

            {/* Invoices History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">سجل فواتير المبيعات:</h4>
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">رقم الفاتورة</th>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5 text-left">الإجمالي</th>
                      <th className="p-2.5 text-left">المدفوع</th>
                      <th className="p-2.5 text-left">المتبقي (آجل)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerSales.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">لا توجد فواتير سابقة</td>
                      </tr>
                    ) : (
                      customerSales.map((s) => (
                        <tr key={s.id}>
                          <td className="p-2.5 font-mono text-blue-700 font-bold">{s.invoiceNumber}</td>
                          <td className="p-2.5 text-slate-500">{new Date(s.date).toLocaleDateString('ar-LY')}</td>
                          <td className="p-2.5 text-left font-mono font-bold text-slate-900 tabular-nums">{s.totalAmount.toFixed(2)} د.ل</td>
                          <td className="p-2.5 text-left font-mono text-emerald-700 tabular-nums">{s.paidAmount.toFixed(2)} د.ل</td>
                          <td className="p-2.5 text-left font-mono text-red-600 font-bold tabular-nums">{s.remainingAmount.toFixed(2)} د.ل</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments History */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-900">سجل الدفعات والتحصيلات:</h4>
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">رقم الإيصال</th>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">طريقة الدفع</th>
                      <th className="p-2.5 text-left">المبلغ المسدد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerPayments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">لا توجد دفعات مسجلة</td>
                      </tr>
                    ) : (
                      customerPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-mono text-slate-500">{p.id}</td>
                          <td className="p-2.5 text-slate-500">{new Date(p.date).toLocaleDateString('ar-LY')}</td>
                          <td className="p-2.5 text-slate-700">
                            {p.paymentMethod === 'cash' ? 'نقدي' : 'تحويل مصرفي'}
                          </td>
                          <td className="p-2.5 text-left font-mono font-bold text-emerald-700 tabular-nums">
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

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">إضافة عميل أو ورشة جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">اسم العميل / الورشة *:</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="ورشة السلام، شركة النقل..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">رقم الهاتف *:</label>
                  <input
                    type="text"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="091-XXXXXXX"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">نوع العميل:</label>
                  <select
                    value={custType}
                    onChange={(e) => setCustType(e.target.value as CustomerType)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="ورشة">ورشة صيانة</option>
                    <option value="محل">محل قطع غيار آخر</option>
                    <option value="شركة">شركة / أسطول</option>
                    <option value="فرد">زبون فردي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">سقف الائتمان المسموح (دين):</label>
                  <input
                    type="number"
                    step="500"
                    value={custCreditLimit}
                    onChange={(e) => setCustCreditLimit(parseFloat(e.target.value) || 0)}
                    placeholder="3000"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">المدينة:</label>
                  <input
                    type="text"
                    value={custCity}
                    onChange={(e) => setCustCity(e.target.value)}
                    placeholder="طرابلس / بنغازي / مصراتة..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">المنطقة / الشارع:</label>
                  <input
                    type="text"
                    value={custArea}
                    onChange={(e) => setCustArea(e.target.value)}
                    placeholder="عين زارة، حي الأندلس..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">العنوان التفصيلي:</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="بجانب مسجد التقوى..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ملاحظات إضافية:</label>
                <textarea
                  rows={2}
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="ملاحظات حول طريقة السداد، شروط الخصم..."
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
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
