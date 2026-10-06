import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { CashTransaction, CashDrawerSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Wallet,
  X,
} from 'lucide-react';

export const CashView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [summary, setSummary] = useState<CashDrawerSummary>({
    openingBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    expectedCurrentCash: 0,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState<'in' | 'out'>('in');
  const [category, setCategory] = useState<CashTransaction['category']>('إيداع');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTransactions(db.getCashTransactions());
    setSummary(db.getCashSummary());
  };

  const handleRecordTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (amount <= 0) {
      showToast('يرجى تحديد مبلغ مالي صحيح أكبر من صفر', 'warning');
      return;
    }

    try {
      db.recordCashTransaction({
        type: txType,
        category,
        amount,
        description,
        referenceType: 'manual',
        userId: user.id,
        userName: user.name,
      });

      showToast(`تم قيد حركة نقدية في الصندوق بقيمة ${amount} د.ل بنجاح`, 'success');
      setShowAddModal(false);
      setAmount(0);
      setDescription('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'فشل تسجيل الحركة النقدية', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-600" />
            حركة الصندوق والخزينة النقدية (Cash Drawer)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            متابعة حركة النقدية اليومية: المبيعات، التحصيلات، سداد الموردين، المصاريف وعجز/زيادة الصندوق
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>قيد حركة نقدية (إيداع / سحب)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Opening Balance */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">الرصيد الافتتاحي (العهدة):</span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900 tabular-nums">
            {summary.openingBalance.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">د.ل</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">رصيد بداية الوردية</span>
        </div>

        {/* Total Cash In */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">المقبوضات النقدية (وارد):</span>
            <span className="rounded bg-emerald-50 p-1 text-emerald-600">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-700 tabular-nums">
            +{summary.totalCashIn.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">د.ل</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">مبيعات كاش + تحصيلات</span>
        </div>

        {/* Total Cash Out */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">المدفوعات النقدية (صادر):</span>
            <span className="rounded bg-red-50 p-1 text-red-600">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-red-600 tabular-nums">
            -{summary.totalCashOut.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">د.ل</span>
          </div>
          <span className="text-[11px] text-red-600 font-medium mt-1 block">مصروفات + سداد موردين</span>
        </div>

        {/* Expected Current Cash */}
        <div className="bg-white rounded-xl border-2 border-blue-600 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-blue-900 font-semibold">
            <span>النقدية المتوقعة بالدرج:</span>
            <Wallet className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-700 tabular-nums">
            {summary.expectedCurrentCash.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-sans">د.ل</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">الرصيد الختامي المفترض</span>
        </div>
      </div>

      {/* Transactions Log */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900">سجل القيود النقدية بالصندوق</h2>
          <span className="text-xs text-slate-500 font-mono">{transactions.length} حركات مسجلة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3 text-center">النوع</th>
                <th className="p-3">البند / التصنيف</th>
                <th className="p-3">البيان والشرح</th>
                <th className="p-3 text-left">المبلغ</th>
                <th className="p-3">الموظف المسجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono text-slate-500">
                    {new Date(tx.date).toLocaleString('ar-LY')}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold border ${
                      tx.type === 'in'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {tx.type === 'in' ? 'قبض وارد (+)' : 'صرف صادر (-)'}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-900">{tx.category}</td>
                  <td className="p-3 text-slate-600">{tx.description}</td>
                  <td className="p-3 text-left font-mono font-bold text-sm tabular-nums">
                    <span className={tx.type === 'in' ? 'text-emerald-700' : 'text-red-600'}>
                      {tx.type === 'in' ? `+${tx.amount.toFixed(2)}` : `-${tx.amount.toFixed(2)}`} د.ل
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{tx.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD CASH TRANSACTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">قيد حركة نقدية بالصندوق</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">نوع الحركة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('in');
                      setCategory('إيداع');
                    }}
                    className={`rounded-lg p-2 font-bold transition border ${
                      txType === 'in'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    قبض وارد إلى الصندوق (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('out');
                      setCategory('سحب أرباح');
                    }}
                    className={`rounded-lg p-2 font-bold transition border ${
                      txType === 'out'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    صرف صادر من الصندوق (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">بند الحركة / التصنيف:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {txType === 'in' ? (
                    <>
                      <option value="إيداع">إيداع نقدي بالخزينة</option>
                      <option value="رصيد افتتاحي">رصيد افتتاحي (عهدة الدرج)</option>
                      <option value="تحصيل عميل">تحصيل من عميل يدوي</option>
                    </>
                  ) : (
                    <>
                      <option value="سحب أرباح">سحب أرباح / عهدة للمدير</option>
                      <option value="مصروفات">مصروفات نثرية</option>
                      <option value="سداد مورد">سداد مورد يدوي</option>
                    </>
                  )}
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

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">البيان والشرح *:</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="سبب السحب أو الإيداع..."
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
                  تأكيد القيد في الصندوق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
