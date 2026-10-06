import React, { useState, useRef } from 'react';
import { useHybridSync } from '../../hooks/useHybridSync';
import { db } from '../../services/db';
import { useNotifications } from '../../context/NotificationContext';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  Database,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  HardDrive,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface HybridSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HybridSyncModal: React.FC<HybridSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    isOnline,
    isSimulatedOffline,
    pendingCount,
    lastSyncTime,
    totalLocalRecords,
    pendingQueue,
    isSyncing,
    toggleOfflineMode,
    syncNow,
    clearCompleted,
    refresh,
  } = useHybridSync();

  const { showToast } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    try {
      const res = await syncNow();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'warning');
      }
    } catch (e: any) {
      showToast(e.message || 'فشلت المزامنة', 'error');
    }
  };

  const handleToggleOffline = () => {
    const isOffline = toggleOfflineMode();
    if (isOffline) {
      showToast('تم تفعيل وضع عدم الاتصال (Offline) - النظام يعمل الآن محلياً بالكامل', 'info');
    } else {
      showToast('تم تفعيل الوضع المتصل (Online) واستئناف المزامنة التلقائية', 'success');
    }
  };

  const handleExportBackup = () => {
    try {
      const json = db.exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `almadar-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('تم تصدير النسخة الاحتياطية بنجاح إلى ملف JSON', 'success');
    } catch (e: any) {
      showToast('فشل تصدير النسخة الاحتياطية', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = db.importDatabaseBackup(content);
        if (res.success) {
          showToast(res.message, 'success');
          refresh();
        } else {
          showToast(res.message, 'error');
        }
      } catch (err: any) {
        showToast('فشل قراءة ملف النسخة الاحتياطية', 'error');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                مركز المزامنة الهجين (Hybrid Offline & Sync Center)
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                نظام هجين ذكي يعمل بسرعة 100% بدون إنترنت مع مزامنة سحابية تلقائية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Smart Hybrid Explanation Banner */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <Zap className="h-4 w-4 text-blue-600" />
            <span>لماذا يعتبر النظام الهجين (Offline-First) هو الأذكى لمحلات قطع الغيار؟</span>
          </div>
          <p className="text-blue-800/80 leading-relaxed text-[11px]">
            في حال انقطاع شبكة الإنترنت أو تذبذبها، تستمر عمليات البيع والباركود وإصدار الفواتير وسندات القبض والجرد
            محلياً بسرعة فائقة (زمن استجابة 0ms). يتم تسجيل العمليات في طابور المزامنة الذكي وتُرفع تلقائياً للسحابة فور
            عودة الاتصال دون أي تدخل يدوي!
          </p>
        </div>

        {/* Connectivity Status & Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">حالة الاتصال والشبكة:</span>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <strong className={`text-sm ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isOnline ? 'متصل بالإنترنت (Online)' : 'غير متصل (Offline Mode)'}
                </strong>
              </div>
              <p className="text-slate-500 text-[11px] mt-1">
                {isOnline
                  ? 'المزامنة السحابية اللحظية مفعلة وجاهزة لنقل البيانات'
                  : 'المنظومة تعمل محلياً بكامل طاقتها ويتم حفظ السجلات في جهازك'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-600">اختبار العمل دون إنترنت:</span>
              <button
                onClick={handleToggleOffline}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  isSimulatedOffline
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {isSimulatedOffline ? 'إيقاف المحاكاة (عودة للاتصال)' : 'محاكاة انقطاع الإنترنت'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-slate-500 block text-[11px] font-semibold">طابور المزامنة المعلقة:</span>
              <div className="mt-1 flex items-baseline gap-2">
                <strong className="text-2xl font-bold font-mono text-slate-900">{pendingCount}</strong>
                <span className="text-slate-500">عملية بانتظار المزامنة السحابية</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  آخر مزامنة ناجحة:{' '}
                  {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString('ar-LY') : 'لم تتم بعد'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                إجمالي السجلات المحلية: {totalLocalRecords}
              </span>
              <button
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 font-bold text-[11px] transition shadow-xs"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'جارِ المزامنة...' : 'مزامنة الآن'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync Queue List */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="h-4 w-4 text-blue-600" />
              سجل طابور المزامنة الأخير ({pendingQueue.length})
            </span>
            {pendingQueue.some((q) => q.status === 'synced') && (
              <button
                onClick={clearCompleted}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline"
              >
                تنظيف المكتمل
              </button>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
            {pendingQueue.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1 opacity-80" />
                لا توجد عمليات معلقة. جميع الحركات مسجلة ومتزامنة.
              </div>
            ) : (
              pendingQueue.slice(0, 15).map((item) => (
                <div key={item.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50/70 transition">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.status === 'synced'
                          ? 'bg-emerald-500'
                          : item.status === 'syncing'
                          ? 'bg-blue-500 animate-spin'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <strong className="text-slate-900 text-xs font-semibold">{item.action}</strong>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {item.entityType} #{item.entityId} — {new Date(item.timestamp).toLocaleTimeString('ar-LY')}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      item.status === 'synced'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'syncing'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.status === 'synced' ? 'تمت المزامنة' : item.status === 'syncing' ? 'مزامنة...' : 'محفوظ محلياً'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Local Backup Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <HardDrive className="h-4 w-4 text-blue-600" />
              <span>النسخ الاحتياطي اليدوي والمستقل (JSON Backup)</span>
            </div>
            <span className="text-[10px] text-slate-400">حفظ نسخة على فلاش ميموري أو القرص الصلب</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span>تصدير نسخة احتياطية (.json)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition shadow-2xs disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5 text-emerald-600" />
              <span>{importing ? 'جارِ الاسترجاع...' : 'استرجاع من ملف احتياطي'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-1.5 text-xs font-bold text-white transition shadow-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
