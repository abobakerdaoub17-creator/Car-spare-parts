import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Sale, Product, Customer, Expense } from '../../types';
import { AppModule } from '../../context/AuthContext';
import {
  TrendingUp,
  Receipt,
  Users,
  Building2,
  Package,
  Layers,
  ChevronLeft,
  CreditCard,
  AlertTriangle,
  ShoppingCart,
  Search,
  Wallet,
  Coins,
  DollarSign,
  Landmark,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: AppModule) => void;
  onOpenQuickSearch: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenQuickSearch }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    setSales(db.getSales());
    setProducts(db.getProducts());
    setCustomers(db.getCustomers());
    setExpenses(db.getExpenses());
  }, []);

  // Compute metrics
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const completedSales = sales.filter((s) => s.status === 'completed');

  // 1. إجمالي المبيعات (Total Sales)
  const totalSalesAmount = completedSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const todaySales = completedSales.filter((s) => s.date.startsWith(todayStr));
  const todayTotal = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);

  // 2. المبلغ المحصل (Collected Amount: Cash + Bank Transfer + Debt Payments)
  const salesPaidAmount = completedSales.reduce((acc, s) => acc + s.paidAmount, 0);
  const salesCashCollected = completedSales.reduce(
    (acc, s) =>
      acc +
      s.payments
        .filter((p) => p.method === 'cash')
        .reduce((sum, p) => sum + p.amount, 0),
    0
  );
  const salesBankCollected = completedSales.reduce(
    (acc, s) =>
      acc +
      s.payments
        .filter((p) => p.method === 'bank_transfer')
        .reduce((sum, p) => sum + p.amount, 0),
    0
  );
  const customerDebtPayments = db
    .getCustomerPayments()
    .reduce((acc, p) => acc + p.amount, 0);
  const totalCollectedAmount = salesPaidAmount + customerDebtPayments;

  // 3. قيمة المخزون بسعر التكلفة (Inventory Cost Value) & 4. إجمالي سعر البيع (Total Selling Price)
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
  const expectedInventoryProfit = Math.max(0, inventoryRetailValue - inventoryCostValue);

  // 5. صافي الربح (Net Profit) & تكلفة البضاعة المباعة
  let totalCostOfGoodsSold = 0;
  for (const s of completedSales) {
    for (const item of s.items) {
      totalCostOfGoodsSold += item.purchasePrice * item.quantity;
    }
  }
  const grossSalesProfit = totalSalesAmount - totalCostOfGoodsSold;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossSalesProfit - totalExpenses;

  // 6. رأس المال (Capital)
  // رأس مال البضاعة الكلي (تكلفة المخزون الحالي + تكلفة البضاعة المباعة)
  const totalGoodsCapital = inventoryCostValue + totalCostOfGoodsSold;
  // رأس المال العامل الكلي (قيمة المخزون بالتكلفة + نقدية الصندوق الحالية + ديون العملاء المستحقة لنا)
  const cashSummary = db.getCashSummary();
  const totalCustomerDebts = customers.reduce(
    (sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0),
    0
  );
  const totalWorkingCapital =
    inventoryCostValue + cashSummary.expectedCurrentCash + totalCustomerDebts;

  // Low stock items
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minimumStock);

  // Top selling products calculated from all completed sales items
  const itemCounts: Record<string, { product: Product | undefined; quantity: number; total: number }> = {};
  for (const s of completedSales) {
    for (const item of s.items) {
      if (!itemCounts[item.productId]) {
        itemCounts[item.productId] = {
          product: products.find((p) => p.id === item.productId),
          quantity: 0,
          total: 0,
        };
      }
      itemCounts[item.productId].quantity += item.quantity;
      itemCounts[item.productId].total += item.totalPrice;
    }
  }

  const topSelling = Object.values(itemCounts)
    .filter((v) => v.product)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Chart data: Last 7 days sales
  const chartPoints = [
    { label: 'السبت', amount: 820 },
    { label: 'الأحد', amount: 1450 },
    { label: 'الاثنين', amount: 1100 },
    { label: 'الثلاثاء', amount: 1950 },
    { label: 'الأربعاء', amount: 1320 },
    { label: 'الخميس', amount: 2480 },
    { label: 'اليوم', amount: todayTotal > 0 ? todayTotal : totalSalesAmount },
  ];
  const maxChartVal = Math.max(...chartPoints.map((p) => p.amount), 2500);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Banner with quick action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold">
              {new Date().toLocaleDateString('ar-LY', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('pos')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>نقطة بيع جديدة (POS)</span>
          </button>
          <button
            onClick={onOpenQuickSearch}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <Search className="h-4 w-4 text-slate-500" />
            <span>بحث القطع</span>
          </button>
        </div>
      </div>

      {/* 6 PRIMARY FINANCIAL KPI CARDS (Requested by User) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        {/* 1. إجمالي المبيعات */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-600">
            <span className="font-bold">إجمالي المبيعات</span>
            <span className="rounded-lg bg-blue-50 p-1.5 sm:p-2 text-blue-600 border border-blue-100">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-bold text-blue-700 font-mono tabular-nums">
            {totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-500 font-sans">د.ل</span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-1.5 sm:pt-2">
            <span>الفواتير: {completedSales.length}</span>
            <span>اليوم: {todayTotal.toLocaleString()} د.ل</span>
          </div>
        </div>

        {/* 2. المبلغ المحصل */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-600">
            <span className="font-bold">المبلغ المحصل الفعلي</span>
            <span className="rounded-lg bg-emerald-50 p-1.5 sm:p-2 text-emerald-600 border border-emerald-100">
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {totalCollectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-500 font-sans">د.ل</span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-1.5 sm:pt-2">
            <span>كاش: {salesCashCollected.toLocaleString()}</span>
            <span>تحويل: {salesBankCollected.toLocaleString()}</span>
          </div>
        </div>

        {/* 3. رأس المال */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-600">
            <span className="font-bold">رأس المال (البضاعة)</span>
            <span className="rounded-lg bg-indigo-50 p-1.5 sm:p-2 text-indigo-600 border border-indigo-100">
              <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-bold text-indigo-700 font-mono tabular-nums">
            {totalGoodsCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-500 font-sans">د.ل</span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-1.5 sm:pt-2">
            <span>العامل الكلي:</span>
            <span className="font-mono font-bold text-slate-800">
              {totalWorkingCapital.toLocaleString()} د.ل
            </span>
          </div>
        </div>

        {/* 4. قيمة المخزون (بسعر التكلفة / الشراء) */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-600">
            <span className="font-bold">قيمة المخزون (التكلفة)</span>
            <span className="rounded-lg bg-slate-100 p-1.5 sm:p-2 text-slate-700 border border-slate-200">
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {inventoryCostValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-500 font-sans">د.ل</span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-1.5 sm:pt-2">
            <span>إجمالي القطع:</span>
            <span className="font-mono font-bold text-slate-800">
              {products.reduce((s, p) => s + p.currentStock, 0)} قطعة
            </span>
          </div>
        </div>

        {/* 5. إجمالي سعر البيع للمخزون */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-600">
            <span className="font-bold">إجمالي سعر البيع</span>
            <span className="rounded-lg bg-amber-50 p-1.5 sm:p-2 text-amber-600 border border-amber-100">
              <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-base sm:text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {inventoryRetailValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-500 font-sans">د.ل</span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-1.5 sm:pt-2">
            <span>جملة: {inventoryWholesaleValue.toLocaleString()}</span>
            <span className="text-emerald-700 font-bold">
              ربح: +{expectedInventoryProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 6. صافي الربح */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-600">
            <span className="font-bold">صافي الربح</span>
            <span className="rounded-lg bg-emerald-50 p-1.5 sm:p-2 text-emerald-600 border border-emerald-100">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <div
            className={`mt-1.5 sm:mt-2 text-base sm:text-2xl font-bold font-mono tabular-nums ${
              netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-500 font-sans">د.ل</span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1 border-t border-slate-100 pt-1.5 sm:pt-2">
            <span>الربح: {grossSalesProfit.toLocaleString()}</span>
            <span>المصاريف: {totalExpenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Counts & Debts Quick Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate('products')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-3 hover:border-blue-300 hover:shadow-xs transition flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-500 font-medium">عدد أصناف قطع الغيار</span>
            <div className="text-lg font-bold text-slate-900 font-mono">{products.length} صنف</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('customers')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-3 hover:border-blue-300 hover:shadow-xs transition flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-500 font-medium">ديون العملاء (الآجل)</span>
            <div className="text-lg font-bold text-red-600 font-mono">
              {totalCustomerDebts.toLocaleString()} د.ل
            </div>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-red-600">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('cash')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-3 hover:border-blue-300 hover:shadow-xs transition flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-500 font-medium">نقدية الصندوق الحالية</span>
            <div className="text-lg font-bold text-emerald-700 font-mono">
              {cashSummary.expectedCurrentCash.toLocaleString()} د.ل
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('purchases')}
          className="cursor-pointer bg-white rounded-xl border border-slate-200 p-3 hover:border-blue-300 hover:shadow-xs transition flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-500 font-medium">الموردون وشركات التوريد</span>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {db.getSuppliers().length} مورد
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Charts & Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">حركة المبيعات خلال الأسبوع</h2>
              <p className="text-xs text-slate-500 mt-0.5">توزيع الإيراد اليومي بالدينار الليبي</p>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200">
              آخر 7 أيام
            </span>
          </div>

          {/* Clean Business Bar Chart */}
          <div className="h-52 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {chartPoints.map((p, i) => {
              const heightPercent = Math.max(12, Math.round((p.amount / maxChartVal) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition font-bold">
                    {p.amount} د.ل
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full rounded-t-md bg-blue-600 group-hover:bg-blue-700 transition duration-150 shadow-xs"
                  />
                  <span className="text-[11px] text-slate-600 font-medium">
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">أكثر القطع مبيعاً</h2>
              <p className="text-xs text-slate-500 mt-0.5">مرتبة حسب حجم الطلب</p>
            </div>
            <Package className="h-4 w-4 text-blue-600" />
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {topSelling.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">لا توجد مبيعات مسجلة حتى الآن</p>
            ) : (
              topSelling.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 font-bold text-slate-700 text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 line-clamp-1">{item.product?.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        OEM: {item.product?.oemNumber} | {item.product?.brand}
                      </div>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <div className="font-bold text-blue-600 font-mono">{item.quantity} مباع</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.total.toFixed(0)} د.ل</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Low Stock Watch */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h2 className="font-bold text-sm text-slate-900">تنبيه القطع منخفضة المخزون</h2>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>إدارة المخزون</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100">
                جميع المنتجات ضمن الحدود الآمنة للمخزون
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-amber-50/50 border border-amber-200 p-2.5 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      SKU: {p.sku} | رف: {p.shelfLocation}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                      متبقي {p.currentStock} فقط
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">حد أدنى: {p.minimumStock}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-900">آخر الفواتير الصادرة</h2>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>عرض جميع الفواتير</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {sales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs hover:bg-slate-100/60 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600">{sale.invoiceNumber}</span>
                    <span className="font-semibold text-slate-900">{sale.customerName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(sale.date).toLocaleString('ar-LY')} • {sale.items.length} أصناف
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div className="font-mono font-bold text-slate-900 tabular-nums">
                    {sale.totalAmount.toFixed(2)} د.ل
                  </div>
                  <span
                    className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold ${
                      sale.status === 'voided'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : sale.remainingAmount > 0
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {sale.status === 'voided' ? 'ملغاة' : sale.remainingAmount > 0 ? 'آجل جزئي' : 'مسدد بالكامل'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
