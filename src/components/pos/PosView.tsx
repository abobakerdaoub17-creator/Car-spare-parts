import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/db';
import { Product, Customer, SalePaymentSplit, Sale } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { PrintInvoiceModal } from '../common/PrintInvoiceModal';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Package,
  X,
  Edit3,
  Banknote,
  Building2,
  ArrowLeftRight,
  Clock,
  RotateCcw,
  FileText,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface PosViewProps {
  initialEditingSale?: Sale | null;
  onClearEditingSale?: () => void;
}

type QuickPayMode = 'cash' | 'bank_transfer' | 'split_half' | 'deferred';

export const PosView: React.FC<PosViewProps> = ({
  initialEditingSale = null,
  onClearEditingSale,
}) => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);

  // Invoice Editing State
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showSelectInvoiceModal, setShowSelectInvoiceModal] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  // Payment Breakdown & Mode
  const [payMode, setPayMode] = useState<QuickPayMode>('cash');
  const [cashAmount, setCashAmount] = useState<string>('0');
  const [bankAmount, setBankAmount] = useState<string>('0');
  const [bankRef, setBankRef] = useState<string>('');
  const [deferredAmount, setDeferredAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  // Payment Modal & Print Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mobilePosTab, setMobilePosTab] = useState<'products' | 'cart'>('products');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProducts(db.getProducts());
    setCustomers(db.getCustomers());
  }, []);

  // Load initialEditingSale if passed from InvoicesView
  useEffect(() => {
    if (initialEditingSale) {
      loadSaleForEditing(initialEditingSale);
    }
  }, [initialEditingSale]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Filtered products for POS quick shelf
  const filteredProducts = db.searchProducts(searchQuery).slice(0, 16);

  // Cart Totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity - item.discount,
    0
  );
  const totalAmount = Math.max(0, subtotal - invoiceDiscount);

  // Automatically keep payment amounts synced when totalAmount or payMode changes
  useEffect(() => {
    if (payMode === 'cash') {
      setCashAmount(totalAmount.toFixed(2));
      setBankAmount('0');
      setDeferredAmount('0');
    } else if (payMode === 'bank_transfer') {
      setCashAmount('0');
      setBankAmount(totalAmount.toFixed(2));
      setDeferredAmount('0');
    } else if (payMode === 'split_half') {
      const half = +(totalAmount / 2).toFixed(2);
      const otherHalf = +(totalAmount - half).toFixed(2);
      setCashAmount(half.toFixed(2));
      setBankAmount(otherHalf.toFixed(2));
      setDeferredAmount('0');
    } else if (payMode === 'deferred') {
      setCashAmount('0');
      setBankAmount('0');
      setDeferredAmount(totalAmount.toFixed(2));
    }
  }, [totalAmount, payMode]);

  // Helper to get max allowed stock for a product (including original quantity if editing an invoice)
  const getMaxAvailableStock = (product: Product): number => {
    if (!editingSale) return product.currentStock;
    const oldItem = editingSale.items.find((i) => i.productId === product.id);
    const oldQty = oldItem ? oldItem.quantity : 0;
    return product.currentStock + oldQty;
  };

  // Load an existing Sale into POS for editing
  const loadSaleForEditing = (sale: Sale) => {
    if (sale.status === 'voided') {
      showToast('لا يمكن تعديل فاتورة ملغاة', 'error');
      return;
    }

    const currentProds = db.getProducts();
    setProducts(currentProds);
    setCustomers(db.getCustomers());
    setEditingSale(sale);
    setSelectedCustomerId(sale.customerId);
    setInvoiceDiscount(sale.discount || 0);
    setNotes(sale.notes || '');

    const loadedCart: CartItem[] = sale.items.map((si) => {
      const foundProd = currentProds.find((p) => p.id === si.productId) || {
        id: si.productId,
        name: si.productName,
        sku: si.sku,
        oemNumber: si.oemNumber,
        alternateNumbers: [],
        brand: si.brand,
        category: 'عام',
        purchasePrice: si.purchasePrice,
        retailPrice: si.unitPrice,
        wholesalePrice: si.unitPrice,
        currentStock: 0,
        minimumStock: 0,
        shelfLocation: '-',
        barcode: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        product: foundProd,
        quantity: si.quantity,
        unitPrice: si.unitPrice,
        discount: si.discount || 0,
      };
    });

    setCart(loadedCart);

    // Restore payment breakdown
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
      setPayMode('split_half');
    } else if (bPaid > 0 && cPaid === 0 && dPaid === 0) {
      setPayMode('bank_transfer');
    } else if (dPaid > 0 && cPaid === 0 && bPaid === 0) {
      setPayMode('deferred');
    } else {
      setPayMode('cash');
    }

    setTimeout(() => {
      setCashAmount(cPaid.toFixed(2));
      setBankAmount(bPaid.toFixed(2));
      setDeferredAmount(dPaid.toFixed(2));
      setBankRef(bRef);
    }, 0);

    setShowSelectInvoiceModal(false);
    setMobilePosTab('cart');
    showToast(`تم تحميل الفاتورة ${sale.invoiceNumber} للتعديل`, 'info');
  };

  const cancelEditingSale = () => {
    setEditingSale(null);
    if (onClearEditingSale) onClearEditingSale();
    clearCart();
    showToast('تم إلغاء وضع التعديل والعودة لإنشاء فاتورة جديدة', 'info');
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    const maxStock = getMaxAvailableStock(product);
    if (maxStock <= 0) {
      showToast(`عذراً، القطعة (${product.name}) نافدة من المخزون!`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= maxStock) {
          showToast(`لا يمكن إضافة أكثر من المتوفر (${maxStock})`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const initialPrice =
          selectedCustomer &&
          (selectedCustomer.customerType === 'ورشة' || selectedCustomer.customerType === 'محل')
            ? product.wholesalePrice
            : product.retailPrice;

        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: initialPrice,
            discount: 0,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod) {
      const maxStock = getMaxAvailableStock(prod);
      if (qty > maxStock) {
        showToast(`الكمية المتوفرة هي ${maxStock} فقط`, 'warning');
        return;
      }
    }

    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const updateUnitPrice = (productId: string, price: number) => {
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, unitPrice: price } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setInvoiceDiscount(0);
    setPayMode('cash');
    setCashAmount('0');
    setBankAmount('0');
    setDeferredAmount('0');
    setBankRef('');
    setNotes('');
  };

  // Smart handlers for Cash & Bank inputs so Cash + Transfer split works seamlessly
  const handleCashInputChange = (val: string) => {
    setCashAmount(val);
    const numCash = Math.max(0, parseFloat(val) || 0);
    const numDef = Math.max(0, parseFloat(deferredAmount) || 0);
    if (numCash <= totalAmount - numDef) {
      const autoBank = Math.max(0, totalAmount - numDef - numCash);
      setBankAmount(autoBank.toFixed(2));
    }
  };

  const handleBankInputChange = (val: string) => {
    setBankAmount(val);
    const numBank = Math.max(0, parseFloat(val) || 0);
    const numDef = Math.max(0, parseFloat(deferredAmount) || 0);
    if (numBank <= totalAmount - numDef) {
      const autoCash = Math.max(0, totalAmount - numDef - numBank);
      setCashAmount(autoCash.toFixed(2));
    }
  };

  const handleDeferredInputChange = (val: string) => {
    setDeferredAmount(val);
    const numDef = Math.max(0, parseFloat(val) || 0);
    const remainingToPayNow = Math.max(0, totalAmount - numDef);
    if (payMode === 'split_half') {
      const half = +(remainingToPayNow / 2).toFixed(2);
      setCashAmount(half.toFixed(2));
      setBankAmount((remainingToPayNow - half).toFixed(2));
    } else if (payMode === 'bank_transfer') {
      setCashAmount('0');
      setBankAmount(remainingToPayNow.toFixed(2));
    } else {
      setCashAmount(remainingToPayNow.toFixed(2));
      setBankAmount('0');
    }
  };

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      showToast('سلة المبيعات فارغة، اختر بعض القطع أولاً', 'error');
      return;
    }
    const currentSum =
      (parseFloat(cashAmount) || 0) +
      (parseFloat(bankAmount) || 0) +
      (parseFloat(deferredAmount) || 0);

    if (Math.abs(currentSum - totalAmount) > 0.05) {
      if (payMode === 'split_half') {
        const half = +(totalAmount / 2).toFixed(2);
        setCashAmount(half.toFixed(2));
        setBankAmount((totalAmount - half).toFixed(2));
        setDeferredAmount('0');
      } else if (payMode === 'bank_transfer') {
        setCashAmount('0');
        setBankAmount(totalAmount.toFixed(2));
        setDeferredAmount('0');
      } else if (payMode === 'deferred') {
        setCashAmount('0');
        setBankAmount('0');
        setDeferredAmount(totalAmount.toFixed(2));
      } else {
        setCashAmount(totalAmount.toFixed(2));
        setBankAmount('0');
        setDeferredAmount('0');
      }
    }
    setShowPaymentModal(true);
  };

  const handleSetFullCash = () => {
    setPayMode('cash');
    setCashAmount(totalAmount.toFixed(2));
    setBankAmount('0');
    setDeferredAmount('0');
  };

  const handleSetFullBank = () => {
    setPayMode('bank_transfer');
    setCashAmount('0');
    setBankAmount(totalAmount.toFixed(2));
    setDeferredAmount('0');
  };

  const handleSetSplitHalf = () => {
    setPayMode('split_half');
    const half = +(totalAmount / 2).toFixed(2);
    const otherHalf = +(totalAmount - half).toFixed(2);
    setCashAmount(half.toFixed(2));
    setBankAmount(otherHalf.toFixed(2));
    setDeferredAmount('0');
  };

  const handleSetFullDeferred = () => {
    setPayMode('deferred');
    setCashAmount('0');
    setBankAmount('0');
    setDeferredAmount(totalAmount.toFixed(2));
  };

  // Execute Sale or Update Sale Transaction
  const handleConfirmSale = () => {
    if (!user) return;
    setIsProcessing(true);

    const numCash = parseFloat(cashAmount) || 0;
    const numBank = parseFloat(bankAmount) || 0;
    const numDef = parseFloat(deferredAmount) || 0;
    const totalPaidAndDeferred = numCash + numBank + numDef;

    if (Math.abs(totalPaidAndDeferred - totalAmount) > 0.05) {
      showToast(
        `مجموع طرق الدفع (${totalPaidAndDeferred.toFixed(2)}) لا يطابق إجمالي الفاتورة (${totalAmount.toFixed(2)})`,
        'error'
      );
      setIsProcessing(false);
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
          referenceNumber: bankRef,
          notes: 'تحويل مصرفي',
        });
      }
      if (numDef > 0) {
        paymentSplits.push({
          method: 'deferred',
          amount: numDef,
          notes: 'آجل مضاف لحساب العميل',
        });
      }
      if (paymentSplits.length === 0 && totalAmount === 0) {
        paymentSplits.push({ method: 'cash', amount: 0, notes: 'فاتورة بقيمة صفر' });
      }

      const payload = {
        customerId: selectedCustomer ? selectedCustomer.id : 'walk-in',
        customerName: selectedCustomer ? selectedCustomer.name : 'زبون نقدي عام',
        customerPhone: selectedCustomer?.phone,
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          sku: i.product.sku,
          oemNumber: i.product.oemNumber,
          brand: i.product.brand,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          purchasePrice: i.product.purchasePrice,
          discount: i.discount,
        })),
        discount: invoiceDiscount,
        payments: paymentSplits,
        notes,
        user,
      };

      if (editingSale) {
        const updated = db.updateSale(editingSale.id, payload);
        showToast(`تم حفظ تعديلات الفاتورة ${updated.invoiceNumber} بنجاح!`, 'success');
        setCreatedSale(updated);
        setEditingSale(null);
        if (onClearEditingSale) onClearEditingSale();
      } else {
        const sale = db.createSale(payload);
        showToast(`تم إصدار الفاتورة ${sale.invoiceNumber} بنجاح!`, 'success');
        setCreatedSale(sale);
      }

      setShowPaymentModal(false);
      clearCart();
      setProducts(db.getProducts());
      setCustomers(db.getCustomers());
      refreshAlerts();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء معالجة الفاتورة', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const recentSales = db
    .getSales()
    .filter((s) => s.status !== 'voided')
    .filter((s) => {
      if (!invoiceSearchQuery.trim()) return true;
      const q = invoiceSearchQuery.toLowerCase();
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q)
      );
    });

  const numCashVal = parseFloat(cashAmount) || 0;
  const numBankVal = parseFloat(bankAmount) || 0;
  const numDefVal = parseFloat(deferredAmount) || 0;
  const currentSplitSum = numCashVal + numBankVal + numDefVal;
  const splitDiff = +(totalAmount - currentSplitSum).toFixed(2);

  const totalCartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:h-[calc(100dvh-6.5rem)]">
      {/* MOBILE ONLY: Quick Switcher between Products & Cart */}
      <div className="flex lg:hidden rounded-xl bg-white p-1.5 border border-slate-200 shadow-2xs gap-1.5">
        <button
          type="button"
          onClick={() => setMobilePosTab('products')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
            mobilePosTab === 'products'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>اختيار القطع ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobilePosTab('cart')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
            mobilePosTab === 'cart'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>سلة الفاتورة والسداد ({totalCartUnits})</span>
          {totalAmount > 0 && (
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                mobilePosTab === 'cart'
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {totalAmount.toFixed(0)} د.ل
            </span>
          )}
        </button>
      </div>

      {/* PRODUCTS & SEARCH AREA */}
      <div
        className={`${
          mobilePosTab === 'products' ? 'flex' : 'hidden lg:flex'
        } flex-1 flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs min-h-[65dvh] lg:min-h-0`}
      >
        {/* Active Edit Mode Banner */}
        {editingSale && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <Edit3 className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="font-bold">
                وضع تعديل الفاتورة رقم: <span className="font-mono underline">{editingSale.invoiceNumber}</span>
              </span>
              <span className="text-amber-700 hidden sm:inline">
                (العميل السابق: {editingSale.customerName} — الإجمالي السابق: {editingSale.totalAmount.toFixed(2)} د.ل)
              </span>
            </div>
            <button
              onClick={cancelEditingSale}
              className="flex items-center gap-1 rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>إلغاء التعديل (فاتورة جديدة)</span>
            </button>
          </div>
        )}

        {/* Top Controls: Search Bar, Customer Selector & Edit Previous Invoice Trigger */}
        <div className="border-b border-slate-200 p-3 bg-slate-50 space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث فوري: اسم القطعة، OEM، رقم بديل، باركود..."
                className="w-full rounded-lg border border-slate-300 bg-white pr-9 pl-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-700"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Customer Picker */}
            <div className="flex items-center gap-2 sm:w-64">
              <User className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              >
                <option value="walk-in">زبون نقدي عام (مبيعات مباشرة)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerType}) - دين: {c.currentBalance} د.ل
                  </option>
                ))}
              </select>
            </div>

            {/* Edit Previous Invoice Button */}
            <button
              type="button"
              onClick={() => setShowSelectInvoiceModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800 transition shrink-0"
              title="اختيار فاتورة سابقة لتعديل أصنافها أو طريقة سدادها"
            >
              <Edit3 className="h-3.5 w-3.5 text-amber-600" />
              <span>تعديل فاتورة</span>
            </button>
          </div>

          {/* Customer Debt status banner if customer is selected */}
          {selectedCustomer && (
            <div className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-[11px] border border-slate-200 text-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-medium">
                  {selectedCustomer.customerType}
                </span>
                <span className="text-slate-500 hidden sm:inline">هاتف: {selectedCustomer.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>
                  الرصيد المستحق:{' '}
                  <strong className="text-red-600 font-mono tabular-nums">
                    {selectedCustomer.currentBalance} د.ل
                  </strong>
                </span>
                <span>
                  الحد الائتماني:{' '}
                  <strong className="text-slate-700 font-mono tabular-nums">
                    {selectedCustomer.creditLimit} د.ل
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              const maxStock = getMaxAvailableStock(product);
              const isOutOfStock = maxStock <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={`group relative flex flex-col justify-between rounded-lg border p-3 transition select-none ${
                    isOutOfStock
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : inCart
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs cursor-pointer'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">
                        {product.category || product.brand || 'عام'}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          maxStock <= 0
                            ? 'text-red-600'
                            : product.currentStock <= product.minimumStock
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {maxStock <= 0 ? 'نافد' : `${maxStock} متاح`}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition line-clamp-2">
                      {product.name}
                    </h4>

                    <div className="mt-1 text-[10px] text-slate-500 font-mono">
                      OEM: {product.oemNumber}
                    </div>

                    {product.alternateNumbers && product.alternateNumbers.length > 0 && (
                      <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                        بديل: {product.alternateNumbers[0]}
                      </div>
                    )}
                  </div>

                  {/* Bottom Price & Add Action */}
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                    <div>
                      <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                        {product.retailPrice.toFixed(0)}{' '}
                        <span className="text-[10px] font-sans text-slate-500">د.ل</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        جملة: {product.wholesalePrice.toFixed(0)} د.ل
                      </div>
                    </div>

                    <button
                      disabled={isOutOfStock}
                      className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                        inCart
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white'
                      }`}
                    >
                      {inCart ? inCart.quantity : <Plus className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MOBILE STICKY CART BAR (Visible on mobile when browsing products and cart has items) */}
        {cart.length > 0 && (
          <div className="flex lg:hidden items-center justify-between gap-2 border-t border-blue-200 bg-blue-50/90 px-3 py-2.5">
            <div className="text-xs">
              <span className="font-bold text-slate-900">{totalCartUnits} قطع في السلة</span>
              <span className="mx-1.5 text-slate-400">·</span>
              <span className="font-mono font-bold text-blue-700">
                {totalAmount.toFixed(2)} د.ل
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMobilePosTab('cart')}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95"
              >
                عرض السلة والدفع
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CART & CHECKOUT PANEL */}
      <div
        className={`${
          mobilePosTab === 'cart' ? 'flex' : 'hidden lg:flex'
        } w-full lg:w-[410px] xl:w-[430px] flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs`}
      >
        {/* Cart Header */}
        <div
          className={`flex items-center justify-between border-b p-3 ${
            editingSale
              ? 'bg-amber-50 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {editingSale ? (
              <Edit3 className="h-4 w-4 text-amber-600" />
            ) : (
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            )}
            <h3 className="font-bold text-xs text-slate-900">
              {editingSale ? `تعديل فاتورة ${editingSale.invoiceNumber}` : 'سلة البيع الحالية'}
            </h3>
            <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
              {cart.length} أصناف
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-medium transition"
            >
              <Trash2 className="h-3 w-3" />
              تفريغ
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center px-4">
              <Package className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-600">لا توجد قطع في الفاتورة</p>
              <p className="text-[11px] text-slate-400 mt-1">
                اختر القطع من القائمة أو اضغط على «تعديل فاتورة» لتعديل فاتورة سابقة
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs space-y-1.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 line-clamp-1">{item.product.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      OEM: {item.product.oemNumber} | {item.product.brand}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Price & Quantity Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={getMaxAvailableStock(item.product)}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.product.id, parseInt(e.target.value) || 1)
                      }
                      className="w-10 rounded bg-white text-center font-mono font-bold text-slate-900 py-0.5 text-xs focus:outline-none border border-slate-200"
                    />
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Unit price editable input */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">السعر:</span>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateUnitPrice(item.product.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-16 rounded bg-white text-left font-mono font-bold text-slate-900 py-0.5 px-1 text-xs focus:outline-none border border-slate-200"
                    />
                  </div>

                  {/* Line Total */}
                  <div className="font-mono font-bold text-slate-900 tabular-nums">
                    {(item.unitPrice * item.quantity - item.discount).toFixed(2)} د.ل
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Invoice Summary, Direct Payment Mode Selector & Checkout Trigger */}
        <div className="border-t border-slate-200 p-3 bg-slate-50 space-y-2.5">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>المجموع الفرعي:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {subtotal.toFixed(2)} د.ل
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>خصم إضافي:</span>
              <input
                type="number"
                min="0"
                value={invoiceDiscount}
                onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                className="w-20 rounded bg-white px-2 py-0.5 text-left font-mono text-red-600 text-xs border border-slate-300 focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>الصافي المطلوب:</span>
              <span className="font-mono text-lg font-bold text-blue-600 tabular-nums">
                {totalAmount.toFixed(2)} د.ل
              </span>
            </div>
          </div>

          {/* Direct Payment Method Selector (Cash / Transfer / Both 50-50 / Deferred) */}
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-700">طريقة السداد السريعة:</div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={handleSetFullCash}
                className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 px-2 font-bold transition ${
                  payMode === 'cash'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50'
                }`}
              >
                <Banknote className="h-3.5 w-3.5" />
                <span>كاش (نقدي)</span>
              </button>

              <button
                type="button"
                onClick={handleSetFullBank}
                className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 px-2 font-bold transition ${
                  payMode === 'bank_transfer'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-blue-50'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>تحويل مصرفي</span>
              </button>

              <button
                type="button"
                onClick={handleSetSplitHalf}
                className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 px-2 font-bold transition ${
                  payMode === 'split_half'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-indigo-50'
                }`}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>كاش + تحويل (نص بنص)</span>
              </button>

              <button
                type="button"
                onClick={handleSetFullDeferred}
                className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 px-2 font-bold transition ${
                  payMode === 'deferred'
                    ? 'border-red-600 bg-red-600 text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-red-50'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>آجل (على الحساب)</span>
              </button>
            </div>

            {/* Inline Split Preview & Editor when Split Cash + Transfer is active */}
            {payMode === 'split_half' && totalAmount > 0 && (
              <div className="rounded-lg bg-indigo-50/70 border border-indigo-200 p-2 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-indigo-900 font-bold">
                  <span>تقسيم الدفع (كاش + تحويل معاً):</span>
                  <button
                    type="button"
                    onClick={handleSetSplitHalf}
                    className="rounded bg-indigo-600 text-white px-1.5 py-0.5 text-[10px] hover:bg-indigo-700"
                  >
                    50% / 50% نص بنص
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-emerald-800 font-semibold mb-0.5">
                      مبلغ الكاش:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={cashAmount}
                      onChange={(e) => handleCashInputChange(e.target.value)}
                      className="w-full rounded border border-emerald-300 bg-white px-2 py-1 font-mono font-bold text-emerald-700 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-blue-800 font-semibold mb-0.5">
                      مبلغ التحويل:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={bankAmount}
                      onChange={(e) => handleBankInputChange(e.target.value)}
                      className="w-full rounded border border-blue-300 bg-white px-2 py-1 font-mono font-bold text-blue-700 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition active:scale-98 ${
              editingSale
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {editingSale ? <Edit3 className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
            <span>
              {editingSale
                ? `حفظ تعديلات الفاتورة (${editingSale.invoiceNumber})`
                : 'إتمام البيع والدفع (F10)'}
            </span>
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL (Split Payments: Cash, Bank, Both 50/50, Deferred) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl p-6 text-slate-900 space-y-4 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingSale
                    ? `تعديل سداد واعتماد الفاتورة #${editingSale.invoiceNumber}`
                    : 'طريقة الدفع وإصدار الفاتورة'}
                </h3>
                <p className="text-xs text-slate-500">العميل: {selectedCustomer?.name}</p>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-500">المبلغ المطلوب:</span>
                <div className="text-xl font-bold font-mono text-blue-600 tabular-nums">
                  {totalAmount.toFixed(2)} د.ل
                </div>
              </div>
            </div>

            {/* 4 Quick Mode Buttons: Cash, Bank, Both 50/50, Deferred */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleSetFullCash}
                className={`rounded-lg border p-2 text-xs font-bold transition ${
                  payMode === 'cash'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                نقدي بالكامل (كاش)
              </button>
              <button
                type="button"
                onClick={handleSetFullBank}
                className={`rounded-lg border p-2 text-xs font-bold transition ${
                  payMode === 'bank_transfer'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                تحويل مصرفي
              </button>
              <button
                type="button"
                onClick={handleSetSplitHalf}
                className={`rounded-lg border p-2 text-xs font-bold transition ${
                  payMode === 'split_half'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                كاش + تحويل (نص بنص)
              </button>
              <button
                type="button"
                onClick={handleSetFullDeferred}
                className={`rounded-lg border p-2 text-xs font-bold transition ${
                  payMode === 'deferred'
                    ? 'border-red-600 bg-red-600 text-white shadow-xs'
                    : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                آجل (على الحساب)
              </button>
            </div>

            {/* Quick Split Presets Banner */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-indigo-50/70 border border-indigo-200 px-3 py-2 text-[11px]">
              <span className="font-bold text-indigo-900">توزيع سريع (كاش + تحويل معاً):</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleSetSplitHalf}
                  className="rounded bg-indigo-600 text-white px-2 py-0.5 font-bold hover:bg-indigo-700 transition"
                >
                  نصف بنصف (50% / 50%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayMode('split_half');
                    const c = +(totalAmount * 0.25).toFixed(2);
                    setCashAmount(c.toFixed(2));
                    setBankAmount((totalAmount - c).toFixed(2));
                    setDeferredAmount('0');
                  }}
                  className="rounded bg-white border border-indigo-300 text-indigo-800 px-2 py-0.5 font-semibold hover:bg-indigo-100 transition"
                >
                  25% كاش / 75% تحويل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayMode('split_half');
                    const c = +(totalAmount * 0.75).toFixed(2);
                    setCashAmount(c.toFixed(2));
                    setBankAmount((totalAmount - c).toFixed(2));
                    setDeferredAmount('0');
                  }}
                  className="rounded bg-white border border-indigo-300 text-indigo-800 px-2 py-0.5 font-semibold hover:bg-indigo-100 transition"
                >
                  75% كاش / 25% تحويل
                </button>
              </div>
            </div>

            {/* Split Input Breakdown */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              {/* Cash amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">
                    المبلغ النقدي (كاش الصندوق):
                  </label>
                  <span className="text-[10px] text-slate-400">
                    عند تعديل الكاش يتم حساب باقي التحويل تلقائياً
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={cashAmount}
                    onChange={(e) => handleCashInputChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-emerald-700 font-bold focus:border-blue-600 focus:outline-none"
                  />
                  <span className="absolute left-3 top-2 text-slate-400">د.ل</span>
                </div>
              </div>

              {/* Bank Transfer amount */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">
                  تحويل مصرفي (سداد / تداول / ادفع لي / صك):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={bankAmount}
                      onChange={(e) => handleBankInputChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-blue-700 font-bold focus:border-blue-600 focus:outline-none"
                    />
                    <span className="absolute left-3 top-2 text-slate-400">د.ل</span>
                  </div>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    placeholder="رقم مرجع التحويل (اختياري)"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Deferred amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">
                    المبلغ الآجل (يضاف لمديونية العميل):
                  </label>
                  {splitDiff > 0.05 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDeferredAmount((numDefVal + splitDiff).toFixed(2))
                      }
                      className="text-[10px] font-bold text-red-600 hover:underline"
                    >
                      + وضع المتبقي ({splitDiff.toFixed(2)} د.ل) كآجل
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={deferredAmount}
                    onChange={(e) => handleDeferredInputChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-red-600 font-bold focus:border-blue-600 focus:outline-none"
                  />
                  <span className="absolute left-3 top-2 text-slate-400">د.ل</span>
                </div>
              </div>

              {/* Live Sum Verification Bar */}
              <div
                className={`flex items-center justify-between rounded-lg p-2.5 border font-mono text-xs ${
                  Math.abs(splitDiff) <= 0.05
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <span className="font-sans font-bold">
                  مجموع التوزيع (كاش + تحويل + آجل):
                </span>
                <span className="font-bold">
                  {currentSplitSum.toFixed(2)} / {totalAmount.toFixed(2)} د.ل{' '}
                  {Math.abs(splitDiff) <= 0.05
                    ? '✓ مطابق'
                    : `(الفرق: ${splitDiff.toFixed(2)} د.ل)`}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ملاحظات الفاتورة:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات التسليم، الورشة، رقم الهيكل..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmSale}
                disabled={isProcessing}
                className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition ${
                  editingSale
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isProcessing
                  ? 'جاري الحفظ...'
                  : editingSale
                  ? 'حفظ التعديلات واعتماد الفاتورة'
                  : 'اعتماد وحفظ الفاتورة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELECT PREVIOUS INVOICE TO EDIT MODAL */}
      {showSelectInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl p-6 text-slate-900 space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    اختيار فاتورة مبيعات للتعديل
                  </h3>
                  <p className="text-xs text-slate-500">
                    اختر أي فاتورة لتحميل أصنافها وطريقة دفعها وتعديلها مع تسوية المخزون والحسابات تلقائياً
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSelectInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                placeholder="ابحث برقم الفاتورة (INV-...) أو اسم العميل..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50 pr-9 pl-4 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {recentSales.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  لا توجد فواتير مطابقة للبحث
                </div>
              ) : (
                recentSales.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 transition text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700">
                          {s.invoiceNumber}
                        </span>
                        <span className="font-bold text-slate-900">{s.customerName}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {s.items.length} أصناف
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {new Date(s.date).toLocaleString('ar-LY')} — الإجمالي:{' '}
                        <strong className="text-slate-800">{s.totalAmount.toFixed(2)} د.ل</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => loadSaleForEditing(s)}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white transition shadow-2xs"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>تعديل هذه الفاتورة</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINT MODAL (Opens right after successful sale or edit) */}
      {createdSale && (
        <PrintInvoiceModal
          sale={createdSale}
          isOpen={!!createdSale}
          onClose={() => setCreatedSale(null)}
        />
      )}
    </div>
  );
};
