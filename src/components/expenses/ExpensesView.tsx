import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Expense, ExpenseCategory } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Wallet, Plus, Search, X } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('كهرباء وإنارة');
  const [amount, setAmount] = useState<number>(0);
  const [paidTo, setPaidTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState('');

  const categories: ExpenseCategory[] = [
    'كهرباء وإنارة',
    'إيجار المحل',
    'نقل ومحروقات',
    'صيانة ومعدات',
    'شحن وتخليص',
    'ضيافة ونظافة',
    'رواتب وحوافز',
    'مصروفات بنكية',
    'أخرى',
  ];

  useEffect(() => {
    setExpenses(db.getExpenses());
  }, []);

  const handleRefresh = () => {
    setExpenses(db.getExpenses());
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (amount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح للمصروف', 'warning');
      return;
    }

    try {
      db.addExpense(
        {
          category,
          amount,
          date: new Date().toISOString(),
          paidTo,
          paymentMethod,
          notes,
          userId: user.id,
          userName: user.name,
        },
        user
      );

      showToast(`تم تسجيل المصروف بقيمة ${amount} د.ل بنجاح`, 'success');
      setShowAddModal(false);
      setAmount(0);
      setPaidTo('');
      setNotes('');
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل تسجيل المصروف', 'error');
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.category.toLowerCase().includes(q) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(q)) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  });

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            المصروفات التشغيلية للمحل
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة وتسجيل مصاريف الإيجار، الكهرباء، المحروقات، الرواتب والصيانة
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>تسجيل سند صرف مصروف</span>
        </button>
      </div>

      {/* Filter and Summary Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالجهة المصروف لها، البيان..."
              className="w-full rounded-lg border border-slate-300 bg-white pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none w-full sm:w-56"
          >
            <option value="all">جميع بنود المصاريف</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-xs shrink-0 flex items-center gap-2">
          <span className="text-slate-500">إجمالي المصروفات:</span>
          <span className="font-mono text-base font-bold text-slate-900 tabular-nums">{totalFiltered.toFixed(2)} د.ل</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">بند المصروف</th>
                <th className="p-3">المدفوع له (المستلم)</th>
                <th className="p-3">طريقة الصرف</th>
                <th className="p-3">البيان والشرح</th>
                <th className="p-3 text-left">المبلغ</th>
                <th className="p-3">الموظف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا توجد مصروفات مسجلة
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(exp.date).toLocaleDateString('ar-LY')}
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{exp.paidTo || '-'}</td>
                    <td className="p-3 text-slate-600">
                      {exp.paymentMethod === 'cash' ? 'نقدي (من الصندوق)' : 'تحويل مصرفي'}
                    </td>
                    <td className="p-3 text-slate-600">{exp.notes || '-'}</td>
                    <td className="p-3 text-left font-mono font-bold text-slate-900 tabular-nums">
                      {exp.amount.toFixed(2)} د.ل
                    </td>
                    <td className="p-3 text-slate-500">{exp.userName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">تسجيل سند صرف مصروف</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">بند المصروف *:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">المبلغ (د.ل) *:</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-base font-bold text-slate-900 focus:border-blue-600 focus:outline-none tabular-nums"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">المدفوع له:</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="اسم الشخص أو الجهة"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">طريقة الصرف:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="cash">نقداً (يخصم من الصندوق)</option>
                    <option value="bank_transfer">تحويل مصرفي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ملاحظات وبيان المصروف:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="رقم الفاتورة، تفاصيل الصيانة أو الإيجار..."
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
                  تأكيد صرف المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
