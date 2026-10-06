import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/db';
import { Product } from '../../types';
import { Search, X, Package, ArrowLeft } from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setResults(db.getProducts().slice(0, 8));
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults(db.getProducts().slice(0, 8));
    } else {
      setResults(db.searchProducts(query));
    }
  }, [query]);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-2xs">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col text-slate-900 max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-200 px-4 py-3 bg-slate-50">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم القطعة، رقم OEM، رقم بديل، ماركة، باركود..."
            className="flex-1 bg-transparent px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="mr-2 rounded-md bg-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-300 font-medium"
          >
            إغلاق (Esc)
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              لم يتم العثور على قطع تطابق بحثك: &quot;{query}&quot;
            </div>
          ) : (
            results.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
                className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 hover:border-blue-500 hover:bg-blue-50/40 transition cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                        {product.name}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 font-bold">
                        {product.brand}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1 font-mono">
                      <span>OEM: <strong>{product.oemNumber}</strong></span>
                      {product.alternateNumbers && product.alternateNumbers.length > 0 && (
                        <span>بدائل: {product.alternateNumbers.slice(0, 2).join(', ')}</span>
                      )}
                      <span>رف: {product.shelfLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div className="font-mono text-base font-bold text-slate-900 tabular-nums">
                    {product.retailPrice.toFixed(0)} <span className="text-xs font-normal text-slate-500 font-sans">د.ل</span>
                  </div>
                  <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                    product.currentStock <= 0
                      ? 'bg-red-50 text-red-600'
                      : product.currentStock <= product.minimumStock
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {product.currentStock <= 0 ? 'نافد' : `${product.currentStock} بالمخزن`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
