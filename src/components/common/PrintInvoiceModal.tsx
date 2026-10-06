import React, { useEffect } from 'react';
import { Sale } from '../../types';
import { db } from '../../services/db';
import { triggerPrintInvoice } from '../../utils/printHelper';
import { Printer, X } from 'lucide-react';

interface PrintInvoiceModalProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ sale, isOpen, onClose }) => {
  const shopSettings = db.getShopSettings();
  const [printFormat, setPrintFormat] = React.useState<'thermal' | 'a4'>(shopSettings.defaultPrintFormat || 'thermal');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        triggerPrintInvoice(sale, shopSettings, printFormat);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sale, shopSettings, printFormat]);

  if (!isOpen) return null;

  const handlePrint = () => {
    triggerPrintInvoice(sale, shopSettings, printFormat);
  };

  return (
    <div className="printable-modal-root fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-2xs">
      <div className="printable-modal-card relative flex max-h-[95dvh] w-full max-w-3xl flex-col rounded-xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-3 sm:p-4 bg-slate-50 no-print">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">معاينة وطباعة الفاتورة #{sale.invoiceNumber}</h3>
            <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-[11px] sm:text-xs">
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`rounded-md px-2.5 sm:px-3 py-1 font-semibold transition ${
                  printFormat === 'thermal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                إيصال حراري (80mm)
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`rounded-md px-2.5 sm:px-3 py-1 font-semibold transition ${
                  printFormat === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                فاتورة رسمية قياس A4
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 sm:px-4 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>طباعة (Ctrl+P)</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div className="printable-modal-body flex-1 overflow-auto p-3 sm:p-6 flex justify-center bg-slate-100/70">
          {printFormat === 'thermal' ? (
            /* THERMAL RECEIPT (80mm standard in spare parts shops) */
            <div className="w-[340px] bg-white text-black p-4 font-mono text-xs rounded shadow-md border border-slate-300 print:w-full print:border-none print:shadow-none print:p-0">
              <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3 font-sans">
                <h1 className="text-base font-bold tracking-tight text-black">{shopSettings.shopName}</h1>
                <p className="text-[11px] text-gray-700">{shopSettings.address} · {shopSettings.city}</p>
                <p className="text-[11px] text-gray-700">هاتف: {shopSettings.phone}</p>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-2 mb-2 font-sans">
                <div className="flex justify-between">
                  <span className="text-gray-600">رقم الفاتورة:</span>
                  <span className="font-bold font-mono">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">التاريخ:</span>
                  <span>{new Date(sale.date).toLocaleString('ar-LY')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">العميل:</span>
                  <span className="font-bold">{sale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">البائع:</span>
                  <span>{sale.employeeName}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-right text-[11px] mb-2 border-b border-dashed border-gray-400 pb-2 font-sans">
                <thead>
                  <tr className="border-b border-gray-300 text-gray-700">
                    <th className="pb-1 text-right">الصنف</th>
                    <th className="pb-1 text-center">الكمية</th>
                    <th className="pb-1 text-left">السعر</th>
                    <th className="pb-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1 text-right">
                        <div className="font-semibold">{item.productName}</div>
                        <div className="text-[9px] text-gray-500 font-mono">
                          OEM: {item.oemNumber}
                        </div>
                      </td>
                      <td className="py-1 text-center font-bold font-mono">{item.quantity}</td>
                      <td className="py-1 text-left font-mono">{item.unitPrice.toFixed(2)}</td>
                      <td className="py-1 text-left font-bold font-mono">{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-2 mb-2 font-sans">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono">{sale.subtotal.toFixed(2)} د.ل</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>الخصم:</span>
                    <span className="font-mono">-{sale.discount.toFixed(2)} د.ل</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200">
                  <span>الإجمالي:</span>
                  <span className="font-mono">{sale.totalAmount.toFixed(2)} د.ل</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>المدفوع:</span>
                  <span className="font-mono">{sale.paidAmount.toFixed(2)} د.ل</span>
                </div>
                {sale.remainingAmount > 0 && (
                  <div className="flex justify-between text-red-700 font-bold bg-red-50 p-1 rounded">
                    <span>المتبقي (آجل مضاف للرصيد):</span>
                    <span className="font-mono">{sale.remainingAmount.toFixed(2)} د.ل</span>
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="text-[10px] space-y-0.5 mb-3 text-gray-600 font-sans">
                <div className="font-bold text-gray-800">طريقة الدفع:</div>
                {sale.payments.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {p.method === 'cash'
                        ? 'نقدي'
                        : p.method === 'bank_transfer'
                        ? `تحويل مصرفي ${p.referenceNumber ? `(${p.referenceNumber})` : ''}`
                        : 'آجل على الحساب'}
                    </span>
                    <span className="font-mono">{p.amount.toFixed(2)} د.ل</span>
                  </div>
                ))}
              </div>

              {/* Footer Policy */}
              <div className="text-center text-[10px] text-gray-600 border-t border-dashed border-gray-400 pt-2 font-sans leading-relaxed">
                <p className="font-semibold">{shopSettings.invoiceFooter}</p>
                <p className="text-[9px] text-gray-400 mt-1">شكراً لتعاملكم معنا · نظام إدارة قطع الغيار</p>
              </div>
            </div>
          ) : (
            /* OFFICIAL A4 INVOICE */
            <div className="w-[700px] bg-white text-slate-900 p-8 rounded shadow-lg border border-slate-300 print:w-full print:border-none print:shadow-none print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {shopSettings.shopName}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">تجارة واستيراد قطع غيار السيارات بالجملة والقطاعي</p>
                  <p className="text-xs text-slate-600">{shopSettings.address} · {shopSettings.city}</p>
                  <p className="text-xs text-slate-600">هاتف: {shopSettings.phone}</p>
                  {shopSettings.commercialReg && (
                    <p className="text-xs text-slate-500 font-mono">سجل تجاري: {shopSettings.commercialReg}</p>
                  )}
                </div>
                <div className="text-left bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h2 className="text-base font-bold text-blue-800">فاتورة مبيعات</h2>
                  <div className="text-xs space-y-1 mt-1 text-slate-700">
                    <p>رقم الفاتورة: <span className="font-mono font-bold text-slate-900">{sale.invoiceNumber}</span></p>
                    <p>التاريخ: <span className="font-mono">{new Date(sale.date).toLocaleDateString('ar-LY')}</span></p>
                    <p>الوقت: <span className="font-mono">{new Date(sale.date).toLocaleTimeString('ar-LY')}</span></p>
                  </div>
                </div>
              </div>

              {/* Customer & Employee metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 rounded-lg p-3 mb-6 bg-slate-50/50">
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">بيانات العميل:</h4>
                  <p className="text-sm font-bold text-slate-900">{sale.customerName}</p>
                  {sale.customerPhone && <p className="text-slate-600 mt-0.5">الهاتف: {sale.customerPhone}</p>}
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-1">تفاصيل الفاتورة:</h4>
                  <p><span className="text-slate-500">الموظف المسؤول:</span> {sale.employeeName}</p>
                  <p><span className="text-slate-500">حالة الفاتورة:</span> {sale.status === 'completed' ? 'معتمدة ومكتملة' : 'ملغاة'}</p>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-right text-xs mb-6 border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">الصنف والبيان</th>
                    <th className="p-2.5">رقم القطعة OEM</th>
                    <th className="p-2.5">الماركة</th>
                    <th className="p-2.5 text-center">الكمية</th>
                    <th className="p-2.5 text-left">السعر الإفرادي</th>
                    <th className="p-2.5 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2.5 font-mono">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                      <td className="p-2.5 font-mono text-slate-600">{item.oemNumber}</td>
                      <td className="p-2.5">{item.brand}</td>
                      <td className="p-2.5 text-center font-bold font-mono">{item.quantity}</td>
                      <td className="p-2.5 text-left font-mono">{item.unitPrice.toFixed(2)} د.ل</td>
                      <td className="p-2.5 text-left font-mono font-bold">{item.totalPrice.toFixed(2)} د.ل</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Notes */}
              <div className="grid grid-cols-2 gap-6 items-start">
                <div className="text-xs text-slate-600 border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <h4 className="font-bold text-slate-800 mb-1">طرق الدفع والشروط:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {sale.payments.map((p, i) => (
                      <li key={i}>
                        {p.method === 'cash' ? 'نقدي' : p.method === 'bank_transfer' ? 'تحويل مصرفي' : 'آجل'}:{' '}
                        <strong>{p.amount.toFixed(2)} د.ل</strong> {p.referenceNumber ? `(مرجع: ${p.referenceNumber})` : ''}
                      </li>
                    ))}
                  </ul>
                  {sale.notes && <p className="mt-2 text-slate-700 italic">ملاحظات: {sale.notes}</p>}
                </div>

                <div className="space-y-1 text-xs text-right bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono">{sale.subtotal.toFixed(2)} د.ل</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>الخصم:</span>
                      <span className="font-mono">-{sale.discount.toFixed(2)} د.ل</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-300">
                    <span>الإجمالي المستحق:</span>
                    <span className="font-mono text-blue-700">{sale.totalAmount.toFixed(2)} د.ل</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-mono">{sale.paidAmount.toFixed(2)} د.ل</span>
                  </div>
                  {sale.remainingAmount > 0 && (
                    <div className="flex justify-between text-red-700 font-bold pt-1 bg-red-50 p-1.5 rounded">
                      <span>المتبقي (دين على العميل):</span>
                      <span className="font-mono">{sale.remainingAmount.toFixed(2)} د.ل</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
