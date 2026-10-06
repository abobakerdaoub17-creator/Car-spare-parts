import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/db';
import { Sale, Purchase, Product, Customer, Supplier, Expense } from '../../types';
import { triggerPrintReport } from '../../utils/printHelper';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

type ReportType =
  | 'sales'
  | 'purchases'
  | 'profits'
  | 'inventory'
  | 'customerDebts'
  | 'supplierDebts';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('profits');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    setSales(db.getSales());
    setPurchases(db.getPurchases());
    setProducts(db.getProducts());
    setCustomers(db.getCustomers());
    setSuppliers(db.getSuppliers());
    setExpenses(db.getExpenses());
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);

  const filterByDate = (dateStr: string) => {
    if (period === 'all') return true;
    if (period === 'today') return dateStr.startsWith(todayStr);
    if (period === 'month') return dateStr.startsWith(monthStr);
    if (period === 'week') {
      const d = new Date(dateStr);
      const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      return diff <= 7;
    }
    return true;
  };

  const periodSales = sales.filter((s) => s.status === 'completed' && filterByDate(s.date));
  const periodPurchases = purchases.filter((p) => filterByDate(p.date));
  const periodExpenses = expenses.filter((e) => filterByDate(e.date));

  // 1. إجمالي المبيعات & تكلفة البضاعة المباعة
  let totalRevenue = 0;
  let totalCostOfGoods = 0;
  let totalPaidInSales = 0;
  let totalCashCollected = 0;
  let totalBankCollected = 0;

  for (const s of periodSales) {
    totalRevenue += s.totalAmount;
    totalPaidInSales += s.paidAmount;
    for (const p of s.payments) {
      if (p.method === 'cash') totalCashCollected += p.amount;
      if (p.method === 'bank_transfer') totalBankCollected += p.amount;
    }
    for (const item of s.items) {
      totalCostOfGoods += item.purchasePrice * item.quantity;
    }
  }

  const customerDebtPayments = db
    .getCustomerPayments()
    .filter((cp) => filterByDate(cp.date))
    .reduce((acc, cp) => acc + cp.amount, 0);

  // 2. المبلغ المحصل
  const totalCollectedAmount = totalPaidInSales + customerDebtPayments;

  // 3. الأرباح وصافي الربح
  const grossProfit = totalRevenue - totalCostOfGoods;
  const totalExp = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExp;

  // 4. قيمة المخزون (سعر التكلفة) & 5. إجمالي سعر البيع للمخزون
  const inventoryCostValue = products.reduce(
    (sum, p) => sum + p.purchasePrice * p.currentStock,
    0
  );
  const inventoryRetailValue = products.reduce(
    (sum, p) => sum + p.retailPrice * p.currentStock,
    0
  );
  const inventoryWholesaleValue = products.reduce(
    (sum, p) => sum + p.wholesalePrice * p.currentStock,
    0
  );

  // 6. رأس المال
  const totalGoodsCapital = inventoryCostValue + totalCostOfGoods;
  const cashSummary = db.getCashSummary();
  const totalCustomerDebts = customers.reduce(
    (sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0),
    0
  );
  const totalWorkingCapital =
    inventoryCostValue + cashSummary.expectedCurrentCash + totalCustomerDebts;

  // Export to CSV with UTF-8 BOM so Excel opens Arabic correctly
  const handleExportCSV = () => {
    let csvContent = '\uFEFF';
    let filename = `report_${reportType}_${period}.csv`;

    if (reportType === 'sales') {
      csvContent += 'رقم الفاتورة,التاريخ,العميل,الموظف,المبلغ الإجمالي,المسدد,المتبقي الآجل\n';
      periodSales.forEach((s) => {
        csvContent += `"${s.invoiceNumber}","${s.date}","${s.customerName}","${s.employeeName}",${s.totalAmount},${s.paidAmount},${s.remainingAmount}\n`;
      });
    } else if (reportType === 'purchases') {
      csvContent += 'رقم أمر الشراء,فاتورة المورد,المورد,التاريخ,الإجمالي,المدفوع,المتبقي\n';
      periodPurchases.forEach((p) => {
        csvContent += `"${p.purchaseNumber}","${p.supplierInvoiceNumber || ''}","${p.supplierName}","${p.date}",${p.totalAmount},${p.paidAmount},${p.remainingAmount}\n`;
      });
    } else if (reportType === 'customerDebts') {
      csvContent += 'العميل,الهاتف,النوع,المدينة,الحد الائتماني,الرصيد المستحق (الدين)\n';
      customers.filter((c) => c.currentBalance > 0).forEach((c) => {
        csvContent += `"${c.name}","${c.phone}","${c.customerType}","${c.city}",${c.creditLimit},${c.currentBalance}\n`;
      });
    } else if (reportType === 'inventory') {
      csvContent += 'اسم القطعة,SKU,OEM,الماركة,الموقع بالرف,سعر الشراء,سعر البيع,المخزون الحالي,قيمة المخزون بالتكلفة,إجمالي سعر البيع\n';
      products.forEach((p) => {
        csvContent += `"${p.name}","${p.sku}","${p.oemNumber}","${p.brand}","${p.shelfLocation}",${p.purchasePrice},${p.retailPrice},${p.currentStock},${p.currentStock * p.purchasePrice},${p.currentStock * p.retailPrice}\n`;
      });
    } else {
      csvContent += 'البيان,القيمة (د.ل)\n';
      csvContent += `"إجمالي المبيعات",${totalRevenue}\n`;
      csvContent += `"المبلغ المحصل",${totalCollectedAmount}\n`;
      csvContent += `"رأس مال البضاعة",${totalGoodsCapital}\n`;
      csvContent += `"قيمة المخزون بالتكلفة",${inventoryCostValue}\n`;
      csvContent += `"إجمالي سعر البيع للمخزون",${inventoryRetailValue}\n`;
      csvContent += `"تكلفة البضاعة المباعة",${totalCostOfGoods}\n`;
      csvContent += `"مجمل الربح",${grossProfit}\n`;
      csvContent += `"المصروفات التشغيلية",${totalExp}\n`;
      csvContent += `"صافي الربح",${netProfit}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const html = reportContainerRef.current?.innerHTML || '';
    triggerPrintReport('تقرير النظام المالي والمخزني', html);
  };

  return (
    <div ref={reportContainerRef} className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs no-print">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            مركز التقارير والإحصائيات المالية الشاملة
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            إجمالي المبيعات، رأس المال، إجمالي سعر البيع، قيمة المخزون، صافي الربح، والمبلغ المحصل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* 6 Comprehensive Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">1. إجمالي المبيعات</span>
          <div className="text-base font-bold font-mono text-blue-700 mt-1 tabular-nums">
            {totalRevenue.toFixed(2)} د.ل
          </div>
          <span className="text-[10px] text-slate-400">
            {periodSales.length} فاتورة معتمدة
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">2. المبلغ المحصل</span>
          <div className="text-base font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {totalCollectedAmount.toFixed(2)} د.ل
          </div>
          <span className="text-[10px] text-slate-400">
            كاش: {totalCashCollected} | تحويل: {totalBankCollected}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">3. رأس المال</span>
          <div className="text-base font-bold font-mono text-indigo-700 mt-1 tabular-nums">
            {totalGoodsCapital.toFixed(2)} د.ل
          </div>
          <span className="text-[10px] text-slate-400">
            العامل الكلي: {totalWorkingCapital.toFixed(0)} د.ل
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">4. قيمة المخزون (تكلفة)</span>
          <div className="text-base font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {inventoryCostValue.toFixed(2)} د.ل
          </div>
          <span className="text-[10px] text-slate-400">
            {products.reduce((s, p) => s + p.currentStock, 0)} قطعة بالمستودع
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">5. إجمالي سعر البيع</span>
          <div className="text-base font-bold font-mono text-amber-700 mt-1 tabular-nums">
            {inventoryRetailValue.toFixed(2)} د.ل
          </div>
          <span className="text-[10px] text-slate-400">
            بسعر الجملة: {inventoryWholesaleValue.toFixed(0)} د.ل
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">6. صافي الربح</span>
          <div
            className={`text-base font-bold font-mono mt-1 tabular-nums ${
              netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {netProfit.toFixed(2)} د.ل
          </div>
          <span className="text-[10px] text-slate-400">
            مجمل الربح: {grossProfit.toFixed(0)} د.ل
          </span>
        </div>
      </div>

      {/* Report Types & Period Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs no-print">
        {/* Report Types */}
        <div className="flex flex-wrap gap-1 text-xs">
          {[
            { id: 'profits', label: 'الملخص المالي والأرباح' },
            { id: 'sales', label: 'المبيعات' },
            { id: 'inventory', label: 'تقييم المخزون وسعر البيع' },
            { id: 'purchases', label: 'المشتريات' },
            { id: 'customerDebts', label: 'ديون العملاء' },
            { id: 'supplierDebts', label: 'مستحقات الموردين' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setReportType(item.id as any)}
              className={`rounded-md px-3 py-1.5 font-semibold transition ${
                reportType === item.id
                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Periods */}
        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'week', label: 'الأسبوع' },
            { id: 'month', label: 'الشهر الحالي' },
            { id: 'all', label: 'الكل (شامل)' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                period === p.id ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* REPORT CONTENT VIEW */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {reportType === 'sales'
                ? 'تقرير فواتير المبيعات والمبالغ المحصلة'
                : reportType === 'profits'
                ? 'تقرير الأرباح ورأس المال وصافي الدخل'
                : reportType === 'purchases'
                ? 'تقرير المشتريات والتوريد'
                : reportType === 'customerDebts'
                ? 'تقرير الديون المستحقة على العملاء'
                : reportType === 'supplierDebts'
                ? 'تقرير التزامات ومستحقات الموردين'
                : 'تقرير قيمة المخزون وإجمالي سعر البيع'}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              الفترة: {period === 'today' ? 'اليوم' : period === 'week' ? 'آخر 7 أيام' : period === 'month' ? 'الشهر الحالي' : 'الكل (شامل)'} · تاريخ الطباعة: {new Date().toLocaleDateString('ar-LY')}
            </p>
          </div>
        </div>

        {/* PROFIT REPORT VIEW */}
        {reportType === 'profits' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold block">إجمالي المبيعات (الإيرادات):</span>
                <div className="text-xl font-bold font-mono text-blue-700 tabular-nums">
                  {totalRevenue.toFixed(2)} د.ل
                </div>
                <div className="text-[11px] text-slate-500">
                  المبلغ المحصل الفعلي: <strong className="text-emerald-700 font-mono">{totalCollectedAmount.toFixed(2)} د.ل</strong>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold block">قيمة المخزون وإجمالي سعر البيع:</span>
                <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                  تكلفة: {inventoryCostValue.toFixed(2)} د.ل
                </div>
                <div className="text-[11px] text-slate-500">
                  إجمالي سعر البيع (قطاعي): <strong className="text-amber-700 font-mono">{inventoryRetailValue.toFixed(2)} د.ل</strong>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold block">صافي الربح ورأس المال:</span>
                <div className={`text-xl font-bold font-mono tabular-nums ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  صافي الربح: {netProfit.toFixed(2)} د.ل
                </div>
                <div className="text-[11px] text-slate-500">
                  رأس مال البضاعة: <strong className="text-indigo-700 font-mono">{totalGoodsCapital.toFixed(2)} د.ل</strong>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs">
              <h3 className="font-bold text-slate-900 mb-2">تفصيل حساب الأرباح والمصروفات:</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-800">
                  <span className="font-semibold">إجمالي المبيعات</span>
                  <span className="font-mono font-bold text-blue-700">{totalRevenue.toFixed(2)} د.ل</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-800">
                  <span className="font-semibold">(-) تكلفة البضاعة المباعة (رأس مال المباع)</span>
                  <span className="font-mono font-bold text-slate-700">-{totalCostOfGoods.toFixed(2)} د.ل</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-900 bg-blue-50/50 px-2 rounded">
                  <span className="font-bold">(=) مجمل ربح المبيعات</span>
                  <span className="font-mono font-bold text-blue-700">{grossProfit.toFixed(2)} د.ل</span>
                </div>
                {periodExpenses.map((e) => (
                  <div key={e.id} className="flex justify-between py-1.5 border-b border-slate-200/60 text-slate-600">
                    <span>(-) مصروف: {e.category} ({e.notes || e.paidTo})</span>
                    <span className="font-mono font-bold text-red-600">-{e.amount.toFixed(2)} د.ل</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 text-sm text-slate-900 bg-emerald-50 px-2 rounded border border-emerald-200">
                  <span className="font-bold">(=) صافي الربح النهائي بعد المصاريف</span>
                  <span className="font-mono font-bold text-emerald-700">{netProfit.toFixed(2)} د.ل</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SALES REPORT VIEW */}
        {reportType === 'sales' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-2.5">رقم الفاتورة</th>
                  <th className="p-2.5">التاريخ</th>
                  <th className="p-2.5">العميل</th>
                  <th className="p-2.5">الموظف</th>
                  <th className="p-2.5 text-left">الإجمالي</th>
                  <th className="p-2.5 text-left">المبلغ المحصل</th>
                  <th className="p-2.5 text-left">المتبقي الآجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">{s.invoiceNumber}</td>
                    <td className="p-2.5 text-slate-500">{new Date(s.date).toLocaleDateString('ar-LY')}</td>
                    <td className="p-2.5 text-slate-900 font-medium">{s.customerName}</td>
                    <td className="p-2.5 text-slate-500">{s.employeeName}</td>
                    <td className="p-2.5 text-left font-mono font-bold text-slate-900 tabular-nums">{s.totalAmount.toFixed(2)} د.ل</td>
                    <td className="p-2.5 text-left font-mono text-emerald-700 tabular-nums">{s.paidAmount.toFixed(2)} د.ل</td>
                    <td className="p-2.5 text-left font-mono font-bold text-red-600 tabular-nums">
                      {s.remainingAmount > 0 ? `${s.remainingAmount.toFixed(2)} د.ل` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PURCHASES REPORT VIEW */}
        {reportType === 'purchases' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-2.5">رقم أمر الشراء</th>
                  <th className="p-2.5">فاتورة المورد</th>
                  <th className="p-2.5">المورد</th>
                  <th className="p-2.5">التاريخ</th>
                  <th className="p-2.5 text-left">الإجمالي</th>
                  <th className="p-2.5 text-left">المدفوع</th>
                  <th className="p-2.5 text-left">المتبقي للمورد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700">{p.purchaseNumber}</td>
                    <td className="p-2.5 font-mono text-slate-600">{p.supplierInvoiceNumber || '-'}</td>
                    <td className="p-2.5 font-bold text-slate-900">{p.supplierName}</td>
                    <td className="p-2.5 text-slate-500">{new Date(p.date).toLocaleDateString('ar-LY')}</td>
                    <td className="p-2.5 text-left font-mono font-bold text-slate-900">{p.totalAmount.toFixed(2)} د.ل</td>
                    <td className="p-2.5 text-left font-mono text-emerald-700">{p.paidAmount.toFixed(2)} د.ل</td>
                    <td className="p-2.5 text-left font-mono font-bold text-amber-700">
                      {p.remainingAmount > 0 ? `${p.remainingAmount.toFixed(2)} د.ل` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CUSTOMER DEBTS VIEW */}
        {reportType === 'customerDebts' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-2.5">العميل</th>
                  <th className="p-2.5">النوع</th>
                  <th className="p-2.5 font-mono">الهاتف</th>
                  <th className="p-2.5">المدينة والمنطقة</th>
                  <th className="p-2.5 text-left font-mono">الحد الائتماني</th>
                  <th className="p-2.5 text-left font-mono">الرصيد المستحق (الدين)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.filter((c) => c.currentBalance > 0).map((c) => (
                  <tr key={c.id}>
                    <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                    <td className="p-2.5 text-slate-600">{c.customerType}</td>
                    <td className="p-2.5 font-mono text-slate-500">{c.phone}</td>
                    <td className="p-2.5 text-slate-500">{c.city} - {c.area}</td>
                    <td className="p-2.5 text-left font-mono text-slate-700 tabular-nums">{c.creditLimit} د.ل</td>
                    <td className="p-2.5 text-left font-mono font-bold text-red-600 tabular-nums text-sm">
                      {c.currentBalance.toFixed(2)} د.ل
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUPPLIER DEBTS VIEW */}
        {reportType === 'supplierDebts' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-2.5">المورد</th>
                  <th className="p-2.5 font-mono">الهاتف</th>
                  <th className="p-2.5">بلد التوريد</th>
                  <th className="p-2.5 text-left font-mono">الرصيد المستحق للمورد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.filter((s) => s.balance > 0).map((s) => (
                  <tr key={s.id}>
                    <td className="p-2.5 font-bold text-slate-900">{s.name}</td>
                    <td className="p-2.5 font-mono text-slate-500">{s.phone}</td>
                    <td className="p-2.5 text-slate-600">{s.country}</td>
                    <td className="p-2.5 text-left font-mono font-bold text-amber-700 tabular-nums text-sm">
                      {s.balance.toFixed(2)} د.ل
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* INVENTORY REPORT VIEW */}
        {reportType === 'inventory' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-2.5">الصنف</th>
                  <th className="p-2.5 font-mono">OEM</th>
                  <th className="p-2.5">الماركة</th>
                  <th className="p-2.5 text-center font-mono">الرصيد بالمستودع</th>
                  <th className="p-2.5 text-left font-mono">سعر التكلفة</th>
                  <th className="p-2.5 text-left font-mono">سعر البيع</th>
                  <th className="p-2.5 text-left font-mono">قيمة المخزون (تكلفة)</th>
                  <th className="p-2.5 text-left font-mono">إجمالي سعر البيع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2.5 font-semibold text-slate-900">{p.name}</td>
                    <td className="p-2.5 font-mono text-blue-700">{p.oemNumber}</td>
                    <td className="p-2.5 text-slate-600">{p.brand}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-800">{p.currentStock}</td>
                    <td className="p-2.5 text-left font-mono text-slate-600 tabular-nums">{p.purchasePrice.toFixed(2)} د.ل</td>
                    <td className="p-2.5 text-left font-mono text-amber-700 tabular-nums">{p.retailPrice.toFixed(2)} د.ل</td>
                    <td className="p-2.5 text-left font-mono font-bold text-slate-900 tabular-nums">
                      {(p.currentStock * p.purchasePrice).toFixed(2)} د.ل
                    </td>
                    <td className="p-2.5 text-left font-mono font-bold text-emerald-700 tabular-nums">
                      {(p.currentStock * p.retailPrice).toFixed(2)} د.ل
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                <tr>
                  <td colSpan={3} className="p-2.5">الإجمالي العام للمخزون</td>
                  <td className="p-2.5 text-center font-mono">
                    {products.reduce((s, p) => s + p.currentStock, 0)} قطعة
                  </td>
                  <td colSpan={2} />
                  <td className="p-2.5 text-left font-mono text-slate-900">
                    {inventoryCostValue.toFixed(2)} د.ل
                  </td>
                  <td className="p-2.5 text-left font-mono text-emerald-700">
                    {inventoryRetailValue.toFixed(2)} د.ل
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
