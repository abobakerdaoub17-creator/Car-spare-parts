import React from 'react';
import { useHybridSync } from '../../hooks/useHybridSync';
import { WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  onOpenSyncModal?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onOpenSyncModal }) => {
  const { isOnline, pendingCount } = useHybridSync();

  if (isOnline) return null;

  return (
    <div
      onClick={onOpenSyncModal}
      role="button"
      tabIndex={0}
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2.5 rounded-xl border border-amber-300/40 bg-amber-600 text-white px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-xs cursor-pointer hover:bg-amber-700 transition active:scale-95"
      title="اضغط لفتح مركز المزامنة الهجين"
    >
      <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
      <WifiOff className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">وضع العمل دون إنترنت نشط — الحركات والمبيعات محفوظة محلياً 100%</span>
      <span className="sm:hidden">وضع دون إنترنت</span>
      {pendingCount > 0 && (
        <span className="rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-mono font-bold">
          {pendingCount} معلق
        </span>
      )}
    </div>
  );
};
