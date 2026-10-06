import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { ShopSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Store,
  Printer,
  RotateCcw,
  Save,
  CheckCircle2,
  Building,
  Trash2,
  AlertTriangle,
  Download,
  X,
  Database,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, refreshAlerts } = useNotifications();

  const [settings, setSettings] = useState<ShopSettings>({
    shopName: '',
    phone: '',
    address: '',
    city: '',
    commercialReg: '',
    invoiceFooter: '',
    currency: 'د.ل',
    defaultPrintFormat: 'thermal',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modals for Delete All Data & Restore Demo Data
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [keepCatalogAndParties, setKeepCatalogAndParties] = useState(false);
  const [showRestoreDemoModal, setShowRestoreDemoModal] = useState(false);

  useEffect(() => {
    setSettings(db.getShopSettings());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.shopName.trim()) {
      showToast('يرجى كتابة اسم المحل', 'warning');
      return;
    }

    if (user) {
      db.updateShopSettings(settings, user);
      setSavedSuccess(true);
      showToast('تم حفظ إعدادات المحل بنجاح', 'success');
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleDownloadBackupBeforeClear = () => {
    const json = db.exportDatabaseBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `almadar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل نسخة احتياطية من البيانات الحالية بنجاح', 'info');
  };

  const handleConfirmClearAllData = () => {
    db.clearAllData({ keepCatalogAndParties }, user || undefined);
    setShowClearAllModal(false);
    refreshAlerts();
    showToast(
      keepCatalogAndParties
        ? 'تم حذف جميع الفواتير والحركات المالية وتصفير الأرصدة بنجاح'
        : 'تم حذف جميع بيانات المنظومة بالكامل وتصفير النظام بنجاح',
      'success'
    );
    setTimeout(() => window.location.reload(), 500);
  };

  const handleConfirmResetDemoData = () => {
    db.resetToDemoData();
    setShowRestoreDemoModal(false);
    refreshAlerts();
    showToast('تمت استعادة البيانات التجريبية الافتراضية بنجاح', 'success');
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">إعدادات المحل والنظام</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تخصيص اسم المحل، بيانات الفاتورة، خيارات الطباعة، وإدارة أو حذف بيانات النظام.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Shop Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="h-4 w-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">بيانات المحل وهوية الفاتورة</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1.5 font-semibold">
                اسم المحل / الشركة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                placeholder="مثال: محل السلام لقطع غيار السيارات"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">يظهر في أعلى الفاتورة وشريط النظام</span>
            </div>

            <div>
              <label className="block text-slate-700 mb-1.5 font-semibold">
                رقم الهاتف / الواتساب
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="091-2345678"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">للتواصل المطبوع على الفاتورة</span>
            </div>

            <div>
              <label className="block text-slate-700 mb-1.5 font-semibold">
                المدينة
              </label>
              <input
                type="text"
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                placeholder="طرابلس / بنغازي / مصراتة / الزاوية..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1.5 font-semibold">
                العنوان التفصيلي
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="مثال: شارع الصناعية - قرب جزيرة الفرناج"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1.5 font-semibold">
                رقم السجل التجاري / الترخيص (اختياري)
              </label>
              <input
                type="text"
                value={settings.commercialReg}
                onChange={(e) => setSettings({ ...settings, commercialReg: e.target.value })}
                placeholder="LY-2024-88910"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1.5 font-semibold">
                العملة المعتمدة
              </label>
              <input
                type="text"
                disabled
                value="الدينار الليبي (د.ل)"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">مثبتة تلقائياً للسوق المحلي الليبي</span>
            </div>
          </div>
        </div>

        {/* Invoice & Printing Policy */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Printer className="h-4 w-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">خيارات الطباعة وسياسة الإرجاع</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1.5 font-semibold">
                نوع الطابعة الافتراضية للفواتير
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setSettings({ ...settings, defaultPrintFormat: 'thermal' })}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition ${
                    settings.defaultPrintFormat === 'thermal'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="printFormat"
                    checked={settings.defaultPrintFormat === 'thermal'}
                    onChange={() => setSettings({ ...settings, defaultPrintFormat: 'thermal' })}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <span className="font-bold block text-sm">طابعة فواتير حرارية (Thermal 80mm)</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      طابعات الإيصالات الصغيرة القياسية لمحلات قطع الغيار، سريعة وموفرة للورق.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setSettings({ ...settings, defaultPrintFormat: 'a4' })}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition ${
                    settings.defaultPrintFormat === 'a4'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="printFormat"
                    checked={settings.defaultPrintFormat === 'a4'}
                    onChange={() => setSettings({ ...settings, defaultPrintFormat: 'a4' })}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <span className="font-bold block text-sm">فاتورة رسمية كاملة (قياس A4)</span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      مناسبة لفواتير الجملة، الورش، والشركات مع تفاصيل السند والاعتماد.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1.5 font-semibold">
                شروط الإرجاع والملاحظات أسفل الفاتورة
              </label>
              <textarea
                rows={3}
                value={settings.invoiceFooter}
                onChange={(e) => setSettings({ ...settings, invoiceFooter: e.target.value })}
                placeholder="اكتب الشروط التي تطبع أسفل كل فاتورة..."
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none leading-relaxed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                تظهر في أسفل إيصال البيع المطبوع للعميل.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white transition shadow-sm active:scale-95"
            >
              <Save className="h-4 w-4" />
              <span>حفظ إعدادات المحل</span>
            </button>

            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" />
                تم الحفظ بنجاح
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Danger Zone: Delete All Data & Reset System */}
      <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-red-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-red-600" />
            <h3 className="font-bold text-sm text-red-900">
              إدارة قاعدة البيانات وتصفير المنظومة (حذف جميع البيانات)
            </h3>
          </div>
          <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
            منطقة حساسة
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          يمكنك من هنا حذف جميع البيانات الحالية للبدء في العمل الفعلي بالمحل على منظومة فارغة تماماً (بدون أصناف أو فواتير تجريبية)، أو استعادة البيانات التجريبية في أي وقت.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Delete All Data Button */}
          <button
            type="button"
            onClick={() => {
              setKeepCatalogAndParties(false);
              setShowClearAllModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-xs active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
            <span>حذف جميع البيانات (تصفير شامل للنظام)</span>
          </button>

          {/* Restore Demo Data Button */}
          <button
            type="button"
            onClick={() => setShowRestoreDemoModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            <span>استعادة البيانات التجريبية الافتراضية</span>
          </button>
        </div>
      </div>

      {/* CONFIRM DELETE ALL DATA MODAL */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-lg rounded-xl border border-red-200 bg-white shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="text-base font-bold">تأكيد حذف جميع بيانات المنظومة</h3>
              </div>
              <button
                onClick={() => setShowClearAllModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800">
                اختر نوع الحذف الذي ترغب في تنفيذه:
              </p>

              <div className="space-y-2">
                <label
                  onClick={() => setKeepCatalogAndParties(false)}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition ${
                    !keepCatalogAndParties
                      ? 'border-red-600 bg-red-50/60 text-red-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearMode"
                    checked={!keepCatalogAndParties}
                    onChange={() => setKeepCatalogAndParties(false)}
                    className="mt-0.5 text-red-600"
                  />
                  <div>
                    <span className="font-bold block">
                      حذف جميع البيانات بالكامل (تصفير شامل 100%)
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      يمسح جميع الأصناف، فواتير المبيعات والمشتريات، العملاء، الموردين، حركات الصندوق، والمخزون للبدء من الصفر.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setKeepCatalogAndParties(true)}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition ${
                    keepCatalogAndParties
                      ? 'border-amber-600 bg-amber-50/60 text-amber-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearMode"
                    checked={keepCatalogAndParties}
                    onChange={() => setKeepCatalogAndParties(true)}
                    className="mt-0.5 text-amber-600"
                  />
                  <div>
                    <span className="font-bold block">
                      حذف جميع الفواتير والحركات المالية فقط (مع بقاء أسماء الأصناف والعملاء)
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      يمسح كافة الفواتير والحركات ويصفر الأرصدة والمخزون، مع الاحتفاظ ببطاقات الأصناف والعملاء والموردين.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 p-3">
                <span className="text-[11px] font-semibold text-slate-700">
                  هل ترغب في حفظ نسخة احتياطية على جهازك قبل الحذف؟
                </span>
                <button
                  type="button"
                  onClick={handleDownloadBackupBeforeClear}
                  className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>تحميل نسخة احتياطية</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllData}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition"
              >
                <Trash2 className="h-4 w-4" />
                <span>تأكيد حذف البيانات الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESTORE DEMO DATA MODAL */}
      {showRestoreDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-blue-600" />
                <span>استعادة البيانات التجريبية</span>
              </h3>
              <button
                onClick={() => setShowRestoreDemoModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من رغبتك في إعادة ضبط النظام إلى البيانات التجريبية الافتراضية؟ سيتم استعادة كافة الأصناف والعملاء والفواتير النموذجية.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRestoreDemoModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmResetDemoData}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition"
              >
                <RotateCcw className="h-4 w-4" />
                <span>تأكيد الاستعادة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
