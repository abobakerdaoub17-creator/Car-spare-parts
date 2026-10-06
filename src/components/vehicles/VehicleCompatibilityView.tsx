import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { VehicleMake, VehicleModel, Product } from '../../types';
import { Car, Search, Plus, Package, X, MapPin } from 'lucide-react';

export const VehicleCompatibilityView: React.FC = () => {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>('make-1'); // Toyota
  const [selectedModel, setSelectedModel] = useState<string>('كامري (Camry)');
  const [selectedYear, setSelectedYear] = useState<string>('2010');
  const [selectedEngine, setSelectedEngine] = useState<string>('2.4L');

  // Add make / model modal
  const [newMakeName, setNewMakeName] = useState('');
  const [newMakeCountry, setNewMakeCountry] = useState('اليابان');
  const [newModelName, setNewModelName] = useState('');
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  useEffect(() => {
    setMakes(db.getVehicleMakes());
    setModels(db.getVehicleModels());
  }, []);

  const currentMakeObj = makes.find((m) => m.id === selectedMake);
  const modelsForSelectedMake = models.filter((m) => m.makeId === selectedMake);

  // Find all compatible products matching the chosen vehicle
  const allProducts = db.getProducts();
  const matchedProducts = allProducts.filter((p) => {
    if (!p.compatibilities) return false;
    return p.compatibilities.some((c) => {
      const makeMatches = currentMakeObj?.name.toLowerCase().includes(c.make.toLowerCase()) || c.make.toLowerCase().includes('تويوتا');
      const modelMatches = selectedModel ? c.model.toLowerCase().includes(selectedModel.split(' ')[0].toLowerCase()) : true;
      return makeMatches && modelMatches;
    });
  });

  const handleAddMakeAndModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMakeName.trim() || !newModelName.trim()) return;

    let targetMake = makes.find((m) => m.name.toLowerCase() === newMakeName.toLowerCase());
    if (!targetMake) {
      targetMake = db.addVehicleMake(newMakeName, newMakeCountry);
    }

    db.addVehicleModel(targetMake.id, targetMake.name, newModelName);
    setMakes(db.getVehicleMakes());
    setModels(db.getVehicleModels());
    setSelectedMake(targetMake.id);
    setSelectedModel(newModelName);
    setNewMakeName('');
    setNewModelName('');
    setShowAddVehicleModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            البحث عن القطع بتوافق السيارات (Vehicle Fitment)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            اختر: الشركة المصنعة ← الموديل ← سنة الصنع ← سعة المحرك لعرض القطع المطابقة فوراً
          </p>
        </div>

        <button
          onClick={() => setShowAddVehicleModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة شركة وموديل سيارة</span>
        </button>
      </div>

      {/* Dynamic 4-Level Selector Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900">تحديد مواصفات السيارة:</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Step 1: Make */}
          <div>
            <label className="block text-slate-700 mb-1 font-semibold">1. الشركة المصنعة (Make):</label>
            <select
              value={selectedMake}
              onChange={(e) => {
                setSelectedMake(e.target.value);
                const firstMod = models.find((m) => m.makeId === e.target.value);
                if (firstMod) setSelectedModel(firstMod.name);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 font-semibold focus:border-blue-600 focus:outline-none"
            >
              {makes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Model */}
          <div>
            <label className="block text-slate-700 mb-1 font-semibold">2. الموديل (Model):</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 font-semibold focus:border-blue-600 focus:outline-none"
            >
              {modelsForSelectedMake.map((mod) => (
                <option key={mod.id} value={mod.name}>
                  {mod.name}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Year */}
          <div>
            <label className="block text-slate-700 mb-1 font-semibold">3. سنة الصنع (Year):</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 font-semibold focus:border-blue-600 focus:outline-none font-mono"
            >
              {['2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Step 4: Engine */}
          <div>
            <label className="block text-slate-700 mb-1 font-semibold">4. المحرك (Engine):</label>
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 font-semibold focus:border-blue-600 focus:outline-none font-mono"
            >
              <option value="2.4L">2.4L 4-Cyl</option>
              <option value="2.5L">2.5L 4-Cyl</option>
              <option value="3.5L">3.5L V6</option>
              <option value="2.0L">2.0L 4-Cyl</option>
              <option value="1.6L">1.6L 4-Cyl</option>
              <option value="4.0L">4.0L V6</option>
              <option value="4.6L">4.6L V8</option>
            </select>
          </div>
        </div>

        {/* Selected vehicle banner */}
        <div className="rounded-lg bg-blue-50/60 p-3 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-blue-950 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              القطع المتوافقة مع: {currentMakeObj?.name} {selectedModel} ({selectedYear}) {selectedEngine}
            </span>
          </div>
          <span className="font-bold font-mono text-blue-700 bg-white px-2.5 py-1 rounded border border-blue-200">
            {matchedProducts.length} قطعة متوافقة متوفرة
          </span>
        </div>
      </div>

      {/* Results Products Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900">قائمة القطع المتوافقة المطابقة:</h3>

        {matchedProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Car className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">لم يتم العثور على قطع متوافقة مع هذا الموديل حالياً</p>
            <p className="text-xs text-slate-400 mt-1">
              يمكنك ربط أي قطعة جديدة بهذا الموديل من خلال صفحة &quot;قطع الغيار والمخزون&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {matchedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700 font-mono border border-slate-200">
                      {product.brand}
                    </span>
                    <span className="font-mono text-slate-500 font-semibold">{product.category}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-1">{product.name}</h4>

                  <div className="mt-2 space-y-1 text-xs text-slate-500 font-mono">
                    <div>OEM: <strong className="text-blue-700">{product.oemNumber}</strong></div>
                    <div>SKU: {product.sku}</div>
                    {product.alternateNumbers && product.alternateNumbers.length > 0 && (
                      <div className="text-[10px] text-slate-600 truncate">
                        أرقام بديلة: {product.alternateNumbers.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                      {product.retailPrice.toFixed(0)} <span className="text-xs font-normal text-slate-500 font-sans">د.ل</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      موقع الرف: {product.shelfLocation}
                    </span>
                  </div>

                  <span className={`rounded px-2 py-0.5 text-xs font-bold font-mono ${
                    product.currentStock <= 0
                      ? 'bg-red-50 text-red-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {product.currentStock <= 0 ? 'نافد' : `${product.currentStock} متوفر`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD MAKE AND MODEL MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">إضافة شركة أو موديل سيارة جديد</h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMakeAndModel} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">اسم الشركة المصنعة (Make) *:</label>
                <input
                  type="text"
                  required
                  value={newMakeName}
                  onChange={(e) => setNewMakeName(e.target.value)}
                  placeholder="مثال: ميتسوبيشي، هوندا، مازدا..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">بلد الشركة المصنعة:</label>
                <input
                  type="text"
                  value={newMakeCountry}
                  onChange={(e) => setNewMakeCountry(e.target.value)}
                  placeholder="اليابان / كوريا / ألمانيا / أمريكا..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">اسم الموديل (Model) *:</label>
                <input
                  type="text"
                  required
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="مثال: باجيرو (Pajero)، لانسر (Lancer)..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-xs transition"
                >
                  حفظ السيارة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
