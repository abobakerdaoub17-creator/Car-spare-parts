import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Product, ProductVehicleCompatibility } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Package,
  Search,
  Plus,
  Edit,
  Car,
  X,
  MapPin,
  Tag,
  Layers,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formStockQuantity, setFormStockQuantity] = useState<number>(1);
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(0);
  const [formRetailPrice, setFormRetailPrice] = useState<number>(0);
  const [formWholesalePrice, setFormWholesalePrice] = useState<number>(0);
  const [formMinStock, setFormMinStock] = useState<number>(3);
  const [formOem, setFormOem] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formShelfLocation, setFormShelfLocation] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [alternateInput, setAlternateInput] = useState('');
  const [alternateList, setAlternateList] = useState<string[]>([]);
  const [compatList, setCompatList] = useState<ProductVehicleCompatibility[]>([]);

  // Temp compatibility add fields
  const [compatMake, setCompatMake] = useState('');
  const [compatModel, setCompatModel] = useState('');
  const [compatYears, setCompatYears] = useState('');
  const [compatEngine, setCompatEngine] = useState('');

  useEffect(() => {
    setProducts(db.getProducts());
  }, []);

  const handleRefresh = () => {
    setProducts(db.getProducts());
    refreshAlerts();
  };

  // Dynamically derive the user's own custom categories from existing products
  const userCustomCategories = Array.from(
    new Set(
      products
        .map((p) => (p.category || '').trim())
        .filter((c) => c.length > 0)
    )
  );

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (stockFilter === 'low' && p.currentStock > p.minimumStock) return false;
    if (stockFilter === 'out' && p.currentStock > 0) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (p.name.toLowerCase().includes(q)) return true;
    if (p.category?.toLowerCase().includes(q)) return true;
    if (p.sku?.toLowerCase().includes(q)) return true;
    if (p.oemNumber?.toLowerCase().includes(q)) return true;
    if (p.barcode?.toLowerCase().includes(q)) return true;
    if (p.brand?.toLowerCase().includes(q)) return true;
    if (p.alternateNumbers && p.alternateNumbers.some((a) => a.toLowerCase().includes(q))) return true;
    return false;
  });

  const resetForm = () => {
    setFormName('');
    setFormCustomCategory('');
    setFormStockQuantity(1);
    setFormPurchasePrice(0);
    setFormRetailPrice(0);
    setFormWholesalePrice(0);
    setFormMinStock(3);
    setFormOem('');
    setFormSku('');
    setFormShelfLocation('');
    setFormBarcode('');
    setFormDescription('');
    setFormNotes('');
    setAlternateInput('');
    setAlternateList([]);
    setCompatList([]);
    setEditingProduct(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCustomCategory(p.category || '');
    setFormStockQuantity(p.currentStock);
    setFormPurchasePrice(p.purchasePrice);
    setFormRetailPrice(p.retailPrice);
    setFormWholesalePrice(p.wholesalePrice);
    setFormMinStock(p.minimumStock);
    setFormOem(p.oemNumber || '');
    setFormSku(p.sku || '');
    setFormShelfLocation(p.shelfLocation || '');
    setFormBarcode(p.barcode || '');
    setFormDescription(p.description || '');
    setFormNotes(p.notes || '');
    setAlternateList(p.alternateNumbers || []);
    setCompatList(p.compatibilities || []);
    setShowAddModal(true);
  };

  const handleAddAlternate = () => {
    if (!alternateInput.trim()) return;
    if (!alternateList.includes(alternateInput.trim())) {
      setAlternateList([...alternateList, alternateInput.trim()]);
    }
    setAlternateInput('');
  };

  const handleRemoveAlternate = (num: string) => {
    setAlternateList(alternateList.filter((a) => a !== num));
  };

  const handleAddCompatibility = () => {
    if (!compatMake.trim() || !compatModel.trim()) {
      showToast('يرجى إدخال اسم الشركة والموديل للسيارة', 'warning');
      return;
    }
    const newCompat: ProductVehicleCompatibility = {
      id: `compat-${Date.now()}`,
      productId: editingProduct?.id || 'temp',
      make: compatMake.trim(),
      model: compatModel.trim(),
      yearRange: compatYears.trim() || 'جميع السنوات',
      years: compatYears.trim() || 'جميع السنوات',
      engine: compatEngine.trim(),
    };
    setCompatList([...compatList, newCompat]);
    setCompatMake('');
    setCompatModel('');
    setCompatYears('');
    setCompatEngine('');
  };

  const handleRemoveCompatibility = (id: string) => {
    setCompatList(compatList.filter((c) => c.id !== id));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formName.trim()) {
      showToast('يرجى كتابة اسم القطعة', 'warning');
      return;
    }

    const finalCategory = formCustomCategory.trim() || 'عام';
    const finalOem = formOem.trim() || '-';
    const finalSku = formSku.trim() || `P-${Date.now().toString().slice(-5)}`;
    const finalWholesale = formWholesalePrice > 0 ? formWholesalePrice : formRetailPrice;

    try {
      if (editingProduct) {
        db.updateProduct(
          editingProduct.id,
          {
            name: formName.trim(),
            sku: finalSku,
            oemNumber: finalOem,
            brand: finalCategory,
            category: finalCategory,
            description: formDescription,
            purchasePrice: formPurchasePrice,
            retailPrice: formRetailPrice,
            wholesalePrice: finalWholesale,
            currentStock: formStockQuantity,
            minimumStock: formMinStock,
            shelfLocation: formShelfLocation || '-',
            barcode: formBarcode,
            notes: formNotes,
            alternateNumbers: alternateList,
            compatibilities: compatList,
          },
          user
        );
        showToast(`تم تعديل بيانات القطعة (${formName}) والكمية بالمخزون بنجاح`, 'success');
      } else {
        db.addProduct(
          {
            name: formName.trim(),
            sku: finalSku,
            oemNumber: finalOem,
            brand: finalCategory,
            category: finalCategory,
            description: formDescription,
            purchasePrice: formPurchasePrice,
            retailPrice: formRetailPrice,
            wholesalePrice: finalWholesale,
            minimumStock: formMinStock,
            shelfLocation: formShelfLocation || '-',
            barcode: formBarcode,
            notes: formNotes,
            alternateNumbers: alternateList,
            compatibilities: compatList,
          },
          formStockQuantity,
          user
        );
        showToast(`تمت إضافة القطعة (${formName}) بكمية (${formStockQuantity}) في المخزون بنجاح`, 'success');
      }

      setShowAddModal(false);
      resetForm();
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ بيانات القطعة', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            دليل قطع الغيار والمخزون
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            إضافة وتعديل القطع والكميات بالمخزون وتصنيفها حسب تسمياتك الخاصة بحرية كاملة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة قطعة غيار جديدة</span>
          </button>
        </div>
      </div>

      {/* Inventory Valuation & Selling Price Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">
            قيمة المخزون (رأس مال البضاعة / التكلفة)
          </span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {products
              .reduce((sum, p) => sum + p.purchasePrice * p.currentStock, 0)
              .toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">د.ل</span>
          </div>
          <span className="text-[10px] text-slate-400">
            إجمالي القطع: {products.reduce((sum, p) => sum + p.currentStock, 0)} قطعة ({products.length} صنف)
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">
            إجمالي سعر البيع للمخزون (قطاعي)
          </span>
          <div className="text-lg font-bold font-mono text-blue-700 mt-1 tabular-nums">
            {products
              .reduce((sum, p) => sum + p.retailPrice * p.currentStock, 0)
              .toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">د.ل</span>
          </div>
          <span className="text-[10px] text-slate-400">القيمة السوقية بسعر القطاعي</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">
            إجمالي سعر البيع للمخزون (جملة)
          </span>
          <div className="text-lg font-bold font-mono text-amber-700 mt-1 tabular-nums">
            {products
              .reduce((sum, p) => sum + p.wholesalePrice * p.currentStock, 0)
              .toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">د.ل</span>
          </div>
          <span className="text-[10px] text-slate-400">القيمة للورش والمحلات</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block">
            الربح المتوقع من بيع المخزون
          </span>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {products
              .reduce((sum, p) => sum + (p.retailPrice - p.purchasePrice) * p.currentStock, 0)
              .toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">د.ل</span>
          </div>
          <span className="text-[10px] text-slate-400">الفرق بين سعر البيع والتكلفة</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث: اسم القطعة، التصنيف، الرقم OEM، رقم بديل..."
            className="w-full rounded-lg border border-slate-300 bg-white pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        {/* User Custom Classification Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
        >
          <option value="all">جميع التصنيفات والتسميات ({userCustomCategories.length})</option>
          {userCustomCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Stock Filter */}
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as any)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
        >
          <option value="all">جميع حالات المخزون</option>
          <option value="low">منخفض المخزون فقط</option>
          <option value="out">القطع النافدة (0 قطع)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="p-3">اسم القطعة</th>
                <th className="p-3">التصنيف (حسب تسميتك)</th>
                <th className="p-3 font-mono">الرقم OEM / الرمز</th>
                <th className="p-3">السيارات المتوافقة</th>
                <th className="p-3 text-center">الموقع بالرف</th>
                <th className="p-3 text-left">سعر الشراء</th>
                <th className="p-3 text-left">سعر البيع</th>
                <th className="p-3 text-center">الكمية في المخزون</th>
                <th className="p-3 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    لا توجد قطع غيار مسجلة أو مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minimumStock && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.alternateNumbers && p.alternateNumbers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[10px] text-slate-400">بدائل:</span>
                            {p.alternateNumbers.slice(0, 2).map((alt, i) => (
                              <span
                                key={i}
                                className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1 rounded border border-slate-200"
                              >
                                {alt}
                              </span>
                            ))}
                            {p.alternateNumbers.length > 2 && (
                              <span className="text-[10px] text-slate-400">
                                +{p.alternateNumbers.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200">
                          <Tag className="h-3 w-3 text-blue-600" />
                          {p.category || 'عام'}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="text-slate-900 font-bold">{p.oemNumber || '-'}</div>
                        <div className="text-[10px] text-slate-400">{p.sku}</div>
                      </td>
                      <td className="p-3">
                        {p.compatibilities && p.compatibilities.length > 0 ? (
                          <button
                            onClick={() => setSelectedProductDetails(p)}
                            className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"
                          >
                            <Car className="h-3.5 w-3.5" />
                            <span>
                              {p.compatibilities[0].make} {p.compatibilities[0].model}
                            </span>
                            {p.compatibilities.length > 1 && (
                              <span className="text-[10px] text-slate-400">
                                +{p.compatibilities.length - 1}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-[10px] font-mono text-slate-700 border border-slate-200">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {p.shelfLocation || '-'}
                        </span>
                      </td>
                      <td className="p-3 text-left font-mono text-slate-600 tabular-nums">
                        {p.purchasePrice.toFixed(2)} د.ل
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-900 tabular-nums">
                        {p.retailPrice.toFixed(2)} د.ل
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block rounded px-2.5 py-0.5 font-mono font-bold text-xs border ${
                            isOut
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {p.currentStock} قطعة
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedProductDetails(p)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="تفاصيل القطعة والسيارات المتوافقة"
                          >
                            <Car className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="flex items-center gap-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2 py-1 text-[11px] font-bold text-slate-700 transition"
                            title="تعديل القطعة والكمية في المخزون"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>تعديل</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl p-6 text-slate-900 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? `تعديل القطعة: ${editingProduct.name}` : 'إضافة قطعة غيار جديدة للمخزن'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Row 1: Part Name & Custom User Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
                    اسم القطعة <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: طقم فحمات فرامل أمامي كامري"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
                    التصنيف / التسمية الخاصة بك (كتابة حرة):
                  </label>
                  <input
                    type="text"
                    list="user-custom-categories-list"
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    placeholder="اكتب تصنيفك بحرية (مثل: فرامل، كوري، ياباني أصلي، فلاتر...)"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <datalist id="user-custom-categories-list">
                    {userCustomCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  {userCustomCategories.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="text-[10px] text-slate-400">تسمياتك السابقة:</span>
                      {userCustomCategories.slice(0, 6).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormCustomCategory(cat)}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border transition ${
                            formCustomCategory === cat
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Highlighted Stock Quantity & Prices Section */}
              <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-blue-600" />
                    <span>الكمية في المخزون والأسعار</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-700">
                    إجمالي تكلفة الكمية: {(formStockQuantity * formPurchasePrice).toFixed(2)} د.ل | إجمالي بيعها: {(formStockQuantity * formRetailPrice).toFixed(2)} د.ل
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* STOCK QUANTITY - PROMINENT */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-emerald-800 mb-1 font-bold">
                      الكمية في المخزون <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formStockQuantity}
                      onChange={(e) => setFormStockQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-lg border-2 border-emerald-500 bg-white p-2 font-mono text-sm font-bold text-emerald-700 text-center focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">
                      سعر الشراء (التكلفة):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formPurchasePrice}
                      onChange={(e) => setFormPurchasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">
                      سعر البيع (قطاعي):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formRetailPrice}
                      onChange={(e) => setFormRetailPrice(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-blue-700 font-bold focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      سعر الجملة (اختياري):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formWholesalePrice}
                      onChange={(e) => setFormWholesalePrice(parseFloat(e.target.value) || 0)}
                      placeholder="نفس القطاعي إن ترك فارغاً"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">
                      الحد الأدنى للتنبيه:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Optional Codes & Shelf */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    الرقم الأصلي OEM (اختياري):
                  </label>
                  <input
                    type="text"
                    value={formOem}
                    onChange={(e) => setFormOem(e.target.value)}
                    placeholder="04465-33450"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-blue-700 font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    رمز الصنف SKU (اختياري):
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="تلقائي إن ترك فارغاً"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    موقع الرف بالمخزن:
                  </label>
                  <input
                    type="text"
                    value={formShelfLocation}
                    onChange={(e) => setFormShelfLocation(e.target.value)}
                    placeholder="مثال: رف A-1"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    الباركود Barcode:
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="622123456789"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Alternate Numbers */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <label className="block text-slate-700 font-semibold">
                  أرقام بديلة لنفس القطعة (اختياري):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={alternateInput}
                    onChange={(e) => setAlternateInput(e.target.value)}
                    placeholder="أدخل رقم بديل واضغط إضافة (مثل: 04465-42160)"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAlternate}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-2 font-semibold text-slate-700"
                  >
                    إضافة رقم بديل
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {alternateList.map((alt) => (
                    <span
                      key={alt}
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-800 border border-slate-200"
                    >
                      <span>{alt}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlternate(alt)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Row 5: Vehicle Compatibility */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <label className="block text-slate-700 font-semibold">
                  السيارات المتوافقة (اختياري):
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={compatMake}
                    onChange={(e) => setCompatMake(e.target.value)}
                    placeholder="الشركة (مثال: تويوتا)"
                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={compatModel}
                    onChange={(e) => setCompatModel(e.target.value)}
                    placeholder="الموديل (مثال: كامري)"
                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={compatYears}
                    onChange={(e) => setCompatYears(e.target.value)}
                    placeholder="السنوات (2007–2017)"
                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={compatEngine}
                    onChange={(e) => setCompatEngine(e.target.value)}
                    placeholder="المحرك (2.4L)"
                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCompatibility}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  + إضافة سيارة متوافقة
                </button>

                <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
                  {compatList.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded bg-slate-50 p-2 text-xs border border-slate-200"
                    >
                      <span className="font-semibold text-slate-800">
                        {c.make} {c.model} · {c.yearRange || c.years} {c.engine ? `(${c.engine})` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompatibility(c.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2 text-xs font-bold text-white transition shadow-xs"
                >
                  {editingProduct ? 'حفظ التعديلات والكمية' : 'إضافة القطعة إلى المخزن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedProductDetails.name}</h3>
                <span className="text-xs text-blue-700 font-mono font-bold">
                  OEM: {selectedProductDetails.oemNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">التصنيف / التسمية:</span>
                <div className="font-bold text-slate-800">{selectedProductDetails.category || 'عام'}</div>
              </div>
              <div>
                <span className="text-slate-500">رمز SKU:</span>
                <div className="font-mono font-bold text-slate-800">{selectedProductDetails.sku}</div>
              </div>
              <div>
                <span className="text-slate-500">سعر البيع قطاعي:</span>
                <div className="font-mono font-bold text-blue-700 tabular-nums">
                  {selectedProductDetails.retailPrice.toFixed(2)} د.ل
                </div>
              </div>
              <div>
                <span className="text-slate-500">الكمية في المخزون:</span>
                <div className="font-mono font-bold text-emerald-700 tabular-nums">
                  {selectedProductDetails.currentStock} قطعة
                </div>
              </div>
              <div>
                <span className="text-slate-500">موقع الرف:</span>
                <div className="font-mono font-bold text-slate-800">{selectedProductDetails.shelfLocation}</div>
              </div>
              <div>
                <span className="text-slate-500">الباركود:</span>
                <div className="font-mono font-bold text-slate-800">{selectedProductDetails.barcode || 'غير محدد'}</div>
              </div>
            </div>

            {/* Alternates */}
            {selectedProductDetails.alternateNumbers && selectedProductDetails.alternateNumbers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-1.5">الأرقام البديلة لنفس القطعة:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProductDetails.alternateNumbers.map((a) => (
                    <span
                      key={a}
                      className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 border border-slate-200"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Compatibility list */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-1.5">السيارات المتوافقة مع هذه القطعة:</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedProductDetails.compatibilities && selectedProductDetails.compatibilities.length > 0 ? (
                  selectedProductDetails.compatibilities.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg bg-blue-50/50 border border-blue-200 p-2 text-xs"
                    >
                      <div className="font-bold text-slate-900">
                        {c.make} {c.model}
                      </div>
                      <div className="text-slate-600 font-mono">
                        {c.yearRange || c.years} {c.engine ? `· ${c.engine}` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">لا توجد سيارات محددة بعد</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
