import React, { useEffect, useState } from 'react';
import { decodePrintPayload, PrintPayload } from '../../utils/printHelper';
import { db } from '../../services/db';
import { Printer, X } from 'lucide-react';

export const StandalonePrintView: React.FC = () => {
  const [payload, setPayload] = useState<PrintPayload | null>(null);
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  useEffect(() => {
    const decoded = decodePrintPayload(window.location.hash);
    if (decoded) {
      setPayload(decoded);
      if (decoded.format) {
        setPrintFormat(decoded.format);
      }
    }
  }, []);

  // Automatically trigger browser print dialog once loaded
  useEffect(() => {
    if (!payload) return;
    const timer = setTimeout(() => {
      window.focus();
      window.print();
    }, 250);
    return () => clearTimeout(timer);
  }, [payload, printFormat]);

  if (!payload) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-3 shadow-sm">
          <p className="text-sm font-bold text-slate-800">جاري تجهيز صفحة الطباعة...</p>
          <button
            onClick={() => window.close()}
            className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  if (payload.type === 'report') {
    return (
      <div dir="rtl" className="min-h-screen bg-white text-slate-900 font-sans">
        <div className="no-print sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-slate-900 text-white px-6 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <Printer className="h-5 w-5 text-blue-400" />
            <span className="font-bold text-sm">{payload.title || 'طباعة التقرير'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white transition"
            >
              <Printer className="h-4 w-4" />
              <span>طباعة الآن</span>
            </button>
            <button
              onClick={() => window.close()}
              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition"
            >
              <X className="h-4 w-4" />
              <span>إغلاق</span>
            </button>
          </div>
        </div>

        <div
          className="p-6 max-w-5xl mx-auto"
          dangerouslySetInnerHTML={{ __html: payload.reportHtml || '' }}
        />
      </div>
    );
  }

  const sale = payload.sale!;
  const shopSettings = payload.shopSettings || db.getShopSettings();

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 print:bg-white text-slate-900 font-sans">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="no-print sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 text-white px-6 py-3 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-blue-400" />
            <span className="font-bold text-sm">طباعة الفاتورة #{sale.invoiceNumber}</span>
          </div>

          <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs border border-slate-700">
            <button
              onClick={() => setPrintFormat('thermal')}
              className={`rounded-md px-3 py-1 font-semibold transition ${
                printFormat === 'thermal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              إيصال حراري (80mm)
            </button>
            <button
              onClick={() => setPrintFormat('a4')}
              className={`rounded-md px-3 py-1 font-semibold transition ${
                printFormat === 'a4'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              فاتورة رسمية قياس A4
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white transition shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>طباعة الآن (Ctrl+P)</span>
          </button>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition"
          >
            <X className="h-4 w-4" />
            <span>إغلاق النافذة</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Content */}
      <div className="p-6 print:p-0 flex justify-center">
        {printFormat === 'thermal' ? (
          <div className="w-[340px] bg-white text-black p-4 font-mono text-xs rounded shadow-md border border-slate-300 print:w-full print:max-w-[320px] print:border-none print:shadow-none print:p-0">
            <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3 font-sans">
              <h1 className="text-base font-bold tracking-tight text-black">{shopSettings.shopName}</h1>
              <p className="text-[11px] text-gray-700">
                {shopSettings.address} · {shopSettings.city}
              </p>
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
                      <div className="text-[9px] text-gray-500 font-mono">OEM: {item.oemNumber}</div>
                    </td>
                    <td className="py-1 text-center font-bold font-mono">{item.quantity}</td>
                    <td className="py-1 text-left font-mono">{item.unitPrice.toFixed(2)}</td>
                    <td className="py-1 text-left font-bold font-mono">
                      {item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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

            <div className="text-center text-[10px] text-gray-600 border-t border-dashed border-gray-400 pt-2 font-sans leading-relaxed">
              <p className="font-semibold">{shopSettings.invoiceFooter}</p>
              <p className="text-[9px] text-gray-400 mt-1">
                شكراً لتعاملكم معنا · نظام إدارة قطع الغيار
              </p>
            </div>
          </div>
        ) : (
          <div className="w-[700px] bg-white text-slate-900 p-8 rounded shadow-lg border border-slate-300 print:w-full print:border-none print:shadow-none print:p-0">
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {shopSettings.shopName}
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  تجارة واستيراد قطع غيار السيارات بالجملة والقطاعي
                </p>
                <p className="text-xs text-slate-600">
                  {shopSettings.address} · {shopSettings.city}
                </p>
                <p className="text-xs text-slate-600">هاتف: {shopSettings.phone}</p>
                {shopSettings.commercialReg && (
                  <p className="text-xs text-slate-500 font-mono">
                    سجل تجاري: {shopSettings.commercialReg}
                  </p>
                )}
              </div>
              <div className="text-left bg-slate-50 p-3 rounded-lg border border-slate-200">
                <h2 className="text-base font-bold text-blue-800">فاتورة مبيعات</h2>
                <div className="text-xs space-y-1 mt-1 text-slate-700">
                  <p>
                    رقم الفاتورة:{' '}
                    <span className="font-mono font-bold text-slate-900">{sale.invoiceNumber}</span>
                  </p>
                  <p>
                    التاريخ:{' '}
                    <span className="font-mono">
                      {new Date(sale.date).toLocaleDateString('ar-LY')}
                    </span>
                  </p>
                  <p>
                    الوقت:{' '}
                    <span className="font-mono">
                      {new Date(sale.date).toLocaleTimeString('ar-LY')}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 rounded-lg p-3 mb-6 bg-slate-50/50">
              <div>
                <h4 className="font-bold text-slate-700 mb-1">بيانات العميل:</h4>
                <p className="text-sm font-bold text-slate-900">{sale.customerName}</p>
                {sale.customerPhone && (
                  <p className="text-slate-600 mt-0.5">الهاتف: {sale.customerPhone}</p>
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-700 mb-1">تفاصيل الفاتورة:</h4>
                <p>
                  <span className="text-slate-500">الموظف المسؤول:</span> {sale.employeeName}
                </p>
                <p>
                  <span className="text-slate-500">حالة الفاتورة:</span>{' '}
                  {sale.status === 'completed' ? 'معتمدة ومكتملة' : 'ملغاة'}
                </p>
              </div>
            </div>

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
                    <td className="p-2.5 text-left font-mono font-bold">
                      {item.totalPrice.toFixed(2)} د.ل
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-6 items-start">
              <div className="text-xs text-slate-600 border border-slate-200 rounded-lg p-3 bg-slate-50">
                <h4 className="font-bold text-slate-800 mb-1">طرق الدفع والشروط:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {sale.payments.map((p, i) => (
                    <li key={i}>
                      {p.method === 'cash'
                        ? 'نقدي'
                        : p.method === 'bank_transfer'
                        ? 'تحويل مصرفي'
                        : 'آجل'}
                      : <strong>{p.amount.toFixed(2)} د.ل</strong>{' '}
                      {p.referenceNumber ? `(مرجع: ${p.referenceNumber})` : ''}
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
  );
};
