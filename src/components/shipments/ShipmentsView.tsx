import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { ImportShipment, Supplier, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Container,
  Plus,
  Search,
  Calculator,
  X,
  Eye,
} from 'lucide-react';

export const ShipmentsView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [shipments, setShipments] = useState<ImportShipment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ImportShipment | null>(null);

  // Form State
  const [shipmentNumber, setShipmentNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [originCountry, setOriginCountry] = useState('تركيا');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [shippingCost, setShippingCost] = useState<number>(2000);
  const [customsCost, setCustomsCost] = useState<number>(1000);
  const [otherExpenses, setOtherExpenses] = useState<number>(500);

  // Items in shipment
  const [items, setItems] = useState<
    Array<{
      productId: string;
      productName: string;
      sku: string;
      quantity: number;
      factoryPrice: number;
    }>
  >([]);

  const [selectedProdId, setSelectedProdId] = useState('');
  const [addQty, setAddQty] = useState<number>(50);
  const [addFactoryPrice, setAddFactoryPrice] = useState<number>(100);

  useEffect(() => {
    setShipments(db.getImportShipments());
    const supps = db.getSuppliers();
    setSuppliers(supps);
    if (supps.length > 0) setSupplierId(supps[0].id);
    const prods = db.getProducts();
    setProducts(prods);
    if (prods.length > 0) {
      setSelectedProdId(prods[0].id);
      setAddFactoryPrice(prods[0].purchasePrice);
    }
  }, []);

  const handleRefresh = () => {
    setShipments(db.getImportShipments());
    refreshAlerts();
  };

  const handleAddItemToShipment = () => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;

    setItems([
      ...items,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: addQty,
        factoryPrice: addFactoryPrice,
      },
    ]);
  };

  const totalGoodsCost = items.reduce((sum, i) => sum + i.quantity * i.factoryPrice, 0);
  const totalExtra = shippingCost + customsCost + otherExpenses;
  const grandTotalCost = totalGoodsCost + totalExtra;

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (items.length === 0) {
      showToast('يرجى إضافة أصناف للحاوية / الشحنة', 'warning');
      return;
    }

    const supp = suppliers.find((s) => s.id === supplierId);
    if (!supp) return;

    try {
      const shipNum = shipmentNumber.trim() || `IMP-${Date.now().toString().slice(-6)}`;
      const shipment = db.createImportShipment(
        {
          shipmentNumber: shipNum,
          supplierId: supp.id,
          supplierName: supp.name,
          supplierInvoiceNumber,
          originCountry,
          purchaseDate,
          status: 'received',
          goodsCost: totalGoodsCost,
          shippingCost,
          customsCost,
          otherExpenses,
          notes: 'حاوية استيراد وتخليص جمركي بميناء مصراتة / طرابلس',
          items: items.map((i, idx) => ({
            id: `si-${Date.now()}-${idx}`,
            shipmentId: '',
            productId: i.productId,
            productName: i.productName,
            sku: i.sku,
            quantity: i.quantity,
            factoryPrice: i.factoryPrice,
            allocatedShipping: 0,
            allocatedCustoms: 0,
            allocatedOther: 0,
            landedCost: 0,
            totalCost: 0,
          })),
        },
        user
      );

      showToast(`تم إنشاء شحنة الاستيراد ${shipment.shipmentNumber} وحساب التكلفة الواصلة Landed Cost آلياً`, 'success');
      setShowAddModal(false);
      setItems([]);
      setShipmentNumber('');
      handleRefresh();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ الشحنة', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Container className="h-5 w-5 text-blue-600" />
            الشحنات والحاويات والاستيراد (Landed Cost Engine)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            حساب التكلفة الواصلة الحقيقية للقطعة: (سعر المصنع + نصيب الشحن + التخليص الجمركي + المصاريف الإضافية)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة شحنة استيراد وحاوية جديدة</span>
        </button>
      </div>

      {/* Shipments Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {shipments.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 font-mono border border-slate-200">
                    {s.originCountry}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1 font-mono">{s.shipmentNumber}</h3>
                  <p className="text-xs text-slate-500">{s.supplierName}</p>
                </div>

                <div className="text-left font-mono">
                  <span className="text-[10px] text-slate-400 block">إجمالي التكلفة الواصلة:</span>
                  <span className="text-base font-bold text-blue-700 tabular-nums">
                    {s.totalLandedCost.toLocaleString()} د.ل
                  </span>
                </div>
              </div>

              {/* Cost allocation breakdown */}
              <div className="mt-3 rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>تكلفة البضاعة الأصلية:</span>
                  <span className="font-mono text-slate-900 tabular-nums">{s.goodsCost.toLocaleString()} د.ل</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>مصاريف الشحن البحري/الجوي:</span>
                  <span className="font-mono text-slate-900 tabular-nums">{s.shippingCost.toLocaleString()} د.ل</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>الجمارك والتخليص:</span>
                  <span className="font-mono text-slate-900 tabular-nums">{s.customsCost.toLocaleString()} د.ل</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>مصاريف إضافية ونقل داخلي:</span>
                  <span className="font-mono text-slate-900 tabular-nums">{s.otherExpenses.toLocaleString()} د.ل</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500">{s.items.length} أصناف بالحاوية</span>
              <button
                onClick={() => setSelectedShipment(s)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>عرض التكلفة الواصلة للقطع</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Shipment Details & Landed Cost Breakdown Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Container className="h-5 w-5 text-blue-600" />
                  تفاصيل شحنة الاستيراد: {selectedShipment.shipmentNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  المورد: {selectedShipment.supplierName} ({selectedShipment.originCountry}) — تاريخ الشراء:{' '}
                  {selectedShipment.purchaseDate}
                </p>
              </div>

              <button
                onClick={() => setSelectedShipment(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">سعر المصنع الكلي:</span>
                <strong className="text-slate-900 font-mono tabular-nums">{selectedShipment.goodsCost.toLocaleString()} د.ل</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">إجمالي مصاريف الشحن:</span>
                <strong className="text-slate-900 font-mono tabular-nums">{selectedShipment.shippingCost.toLocaleString()} د.ل</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">التخليص الجمركي:</span>
                <strong className="text-slate-900 font-mono tabular-nums">{selectedShipment.customsCost.toLocaleString()} د.ل</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">إجمالي التكلفة الواصلة:</span>
                <strong className="text-blue-700 font-mono tabular-nums text-sm">
                  {selectedShipment.totalLandedCost.toLocaleString()} د.ل
                </strong>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">اسم القطعة</th>
                    <th className="p-3 font-mono">SKU</th>
                    <th className="p-3 text-center">الكمية</th>
                    <th className="p-3 text-left">سعر المصنع</th>
                    <th className="p-3 text-left">نصيب الشحن/قطعة</th>
                    <th className="p-3 text-left">نصيب الجمارك/قطعة</th>
                    <th className="p-3 text-left bg-blue-50/50 text-blue-900">التكلفة الواصلة (Landed Cost)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedShipment.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-bold text-slate-900">{item.productName}</td>
                      <td className="p-3 font-mono text-slate-500">{item.sku}</td>
                      <td className="p-3 text-center font-mono font-bold tabular-nums text-slate-900">{item.quantity}</td>
                      <td className="p-3 text-left font-mono tabular-nums text-slate-700">{item.factoryPrice.toFixed(2)} د.ل</td>
                      <td className="p-3 text-left font-mono tabular-nums text-slate-600">
                        {item.allocatedShipping.toFixed(2)} د.ل
                      </td>
                      <td className="p-3 text-left font-mono tabular-nums text-slate-600">
                        {item.allocatedCustoms.toFixed(2)} د.ل
                      </td>
                      <td className="p-3 text-left font-mono font-bold tabular-nums text-blue-700 bg-blue-50/30">
                        {item.landedCost.toFixed(2)} د.ل
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedShipment(null)}
                className="rounded-lg bg-slate-800 hover:bg-slate-900 px-4 py-1.5 text-xs font-bold text-white transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Shipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Container className="h-5 w-5 text-blue-600" />
                إضافة شحنة استيراد وحاوية جديدة
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">المورد الخارجي:</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">رقم الشحنة / البوليصة:</label>
                  <input
                    type="text"
                    value={shipmentNumber}
                    onChange={(e) => setShipmentNumber(e.target.value)}
                    placeholder="IMP-TR-2026..."
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">بلد الشحن:</label>
                  <select
                    value={originCountry}
                    onChange={(e) => setOriginCountry(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="تركيا">تركيا (إسطنبول)</option>
                    <option value="الإمارات">الإمارات (دبي)</option>
                    <option value="الصين">الصين (قوانغتشو)</option>
                    <option value="ألمانيا">ألمانيا</option>
                    <option value="إيطاليا">إيطاليا</option>
                  </select>
                </div>
              </div>

              {/* Extra Costs Fields */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">تكلفة الشحن البحري / الجوي:</label>
                  <input
                    type="number"
                    min="0"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">رسوم التخليص الجمركي:</label>
                  <input
                    type="number"
                    min="0"
                    value={customsCost}
                    onChange={(e) => setCustomsCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">مصاريف تفريغ ونقل داخلي:</label>
                  <input
                    type="number"
                    min="0"
                    value={otherExpenses}
                    onChange={(e) => setOtherExpenses(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Add item to container */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                <div className="font-bold text-slate-900">القطع المحملة بالحاوية:</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedProdId}
                      onChange={(e) => {
                        setSelectedProdId(e.target.value);
                        const p = products.find((prod) => prod.id === e.target.value);
                        if (p) setAddFactoryPrice(p.purchasePrice);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.brand})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      value={addQty}
                      onChange={(e) => setAddQty(parseInt(e.target.value) || 1)}
                      placeholder="الكمية"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={addFactoryPrice}
                      onChange={(e) => setAddFactoryPrice(parseFloat(e.target.value) || 0)}
                      placeholder="سعر المصنع"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddItemToShipment}
                      className="rounded-lg bg-blue-600 px-3 font-bold text-white hover:bg-blue-700 transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 overflow-hidden mt-2 bg-white">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-2">الصنف</th>
                        <th className="p-2 text-center">الكمية</th>
                        <th className="p-2 text-left">سعر المصنع</th>
                        <th className="p-2 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((i, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-semibold text-slate-900">{i.productName}</td>
                          <td className="p-2 text-center font-mono tabular-nums">{i.quantity}</td>
                          <td className="p-2 text-left font-mono tabular-nums">{i.factoryPrice.toFixed(2)} د.ل</td>
                          <td className="p-2 text-left font-mono font-bold tabular-nums text-slate-900">
                            {(i.quantity * i.factoryPrice).toFixed(2)} د.ل
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
                <span className="text-blue-900 font-medium">التكلفة الكلية المتوقعة (بضاعة + شحن + جمارك):</span>
                <span className="font-mono text-base font-bold text-blue-700 tabular-nums">
                  {grandTotalCost.toFixed(2)} د.ل
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-xs"
                >
                  حفظ الشحنة وحساب التكلفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
