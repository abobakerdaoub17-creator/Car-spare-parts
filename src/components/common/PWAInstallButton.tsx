import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed as a standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="تثبيت التطبيق على الجهاز للعمل بدون إنترنت مثل البرامج المكتبية"
        className="flex items-center gap-1.5 rounded-lg bg-blue-700/80 hover:bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white transition shadow-xs active:scale-95 border border-blue-500/30"
      >
        <Download className="h-3.5 w-3.5 animate-bounce" />
        <span className="hidden sm:inline">تثبيت المنظومة (PWA)</span>
        <span className="sm:hidden">تثبيت</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-700/80 hover:bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white transition shadow-xs border border-blue-500/30"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">تثبيت على آيفون / آيباد</span>
          <span className="sm:hidden">تثبيت</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  تثبيت المنظومة على iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>لتشغيل المنظومة كتطبيق مستقل وبدون إنترنت على نظام iOS:</p>
                <div className="space-y-2 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                      1
                    </span>
                    <span className="flex items-center gap-1">
                      اضغط على زر المشاركة <Share className="h-3.5 w-3.5 inline text-blue-600" /> في شريط متصفح سفاري
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                      2
                    </span>
                    <span className="flex items-center gap-1">
                      انزل لأسفل واختر <PlusSquare className="h-3.5 w-3.5 inline text-blue-600" />{' '}
                      <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                      3
                    </span>
                    <span>اضغط على إضافة (Add) في الزاوية العلوية</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
