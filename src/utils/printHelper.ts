import { Sale, ShopSettings } from '../types';

export interface PrintPayload {
  type: 'invoice' | 'report';
  sale?: Sale;
  shopSettings?: ShopSettings;
  format?: 'thermal' | 'a4';
  title?: string;
  reportHtml?: string;
}

export function encodePrintPayload(payload: PrintPayload): string {
  try {
    const json = JSON.stringify(payload);
    return encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
  } catch (e) {
    console.error('Failed to encode print payload', e);
    return '';
  }
}

export function decodePrintPayload(hash: string): PrintPayload | null {
  try {
    const prefix = '#printData=';
    const idx = hash.indexOf(prefix);
    if (idx === -1) return null;
    const encoded = hash.slice(idx + prefix.length);
    const json = decodeURIComponent(escape(atob(decodeURIComponent(encoded))));
    return JSON.parse(json) as PrintPayload;
  } catch (e) {
    console.error('Failed to decode print payload', e);
    return null;
  }
}

export function buildInvoicePrintHtml(
  sale: Sale,
  shopSettings: ShopSettings,
  format: 'thermal' | 'a4'
): string {
  const dateFormatted = new Date(sale.date).toLocaleString('ar-LY');
  const dateOnly = new Date(sale.date).toLocaleDateString('ar-LY');
  const timeOnly = new Date(sale.date).toLocaleTimeString('ar-LY');

  if (format === 'thermal') {
    const itemsRows = sale.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 4px 0; text-align: right;">
            <div style="font-weight: 700;">${item.productName}</div>
            <div style="font-size: 9px; color: #555; font-family: monospace;">OEM: ${item.oemNumber}</div>
          </td>
          <td style="padding: 4px 0; text-align: center; font-weight: 700; font-family: monospace;">${item.quantity}</td>
          <td style="padding: 4px 0; text-align: left; font-family: monospace;">${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 4px 0; text-align: left; font-weight: 700; font-family: monospace;">${item.totalPrice.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const paymentsRows = sale.payments
      .map((p) => {
        const label =
          p.method === 'cash'
            ? 'نقدي'
            : p.method === 'bank_transfer'
            ? `تحويل مصرفي ${p.referenceNumber ? `(${p.referenceNumber})` : ''}`
            : 'آجل على الحساب';
        return `
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>${label}</span>
            <span style="font-family: monospace;">${p.amount.toFixed(2)} د.ل</span>
          </div>
        `;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>فاتورة #${sale.invoiceNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 4mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      margin: 0;
      padding: 8px;
      background: #fff;
      color: #000;
      font-size: 12px;
    }
    .receipt {
      width: 100%;
      max-width: 320px;
      margin: 0 auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div style="text-align: center; border-bottom: 1px dashed #888; padding-bottom: 10px; margin-bottom: 10px;">
      <h1 style="font-size: 16px; font-weight: 700; margin: 0 0 4px 0;">${shopSettings.shopName}</h1>
      <p style="font-size: 11px; color: #333; margin: 2px 0;">${shopSettings.address} · ${shopSettings.city}</p>
      <p style="font-size: 11px; color: #333; margin: 2px 0;">هاتف: ${shopSettings.phone}</p>
    </div>

    <div style="font-size: 11px; border-bottom: 1px dashed #888; padding-bottom: 8px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
        <span style="color: #555;">رقم الفاتورة:</span>
        <span style="font-weight: 700; font-family: monospace;">${sale.invoiceNumber}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
        <span style="color: #555;">التاريخ:</span>
        <span>${dateFormatted}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
        <span style="color: #555;">العميل:</span>
        <span style="font-weight: 700;">${sale.customerName}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #555;">البائع:</span>
        <span>${sale.employeeName}</span>
      </div>
    </div>

    <table style="font-size: 11px; border-bottom: 1px dashed #888; margin-bottom: 8px;">
      <thead>
        <tr style="border-bottom: 1px solid #ccc; color: #333;">
          <th style="padding-bottom: 4px; text-align: right;">الصنف</th>
          <th style="padding-bottom: 4px; text-align: center;">الكمية</th>
          <th style="padding-bottom: 4px; text-align: left;">السعر</th>
          <th style="padding-bottom: 4px; text-align: left;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div style="font-size: 11px; border-bottom: 1px dashed #888; padding-bottom: 8px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
        <span>المجموع الفرعي:</span>
        <span style="font-family: monospace;">${sale.subtotal.toFixed(2)} د.ل</span>
      </div>
      ${
        sale.discount > 0
          ? `<div style="display: flex; justify-content: space-between; color: #dc2626; margin-bottom: 3px;">
              <span>الخصم:</span>
              <span style="font-family: monospace;">-${sale.discount.toFixed(2)} د.ل</span>
            </div>`
          : ''
      }
      <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; padding-top: 4px; border-top: 1px solid #ddd; margin-bottom: 3px;">
        <span>الإجمالي:</span>
        <span style="font-family: monospace;">${sale.totalAmount.toFixed(2)} د.ل</span>
      </div>
      <div style="display: flex; justify-content: space-between; color: #065f46; font-weight: 600;">
        <span>المدفوع:</span>
        <span style="font-family: monospace;">${sale.paidAmount.toFixed(2)} د.ل</span>
      </div>
      ${
        sale.remainingAmount > 0
          ? `<div style="display: flex; justify-content: space-between; color: #b91c1c; font-weight: 700; margin-top: 4px; padding: 3px; background: #fef2f2; border-radius: 4px;">
              <span>المتبقي (آجل مضاف للرصيد):</span>
              <span style="font-family: monospace;">${sale.remainingAmount.toFixed(2)} د.ل</span>
            </div>`
          : ''
      }
    </div>

    <div style="font-size: 10px; color: #444; margin-bottom: 10px;">
      <div style="font-weight: 700; color: #111; margin-bottom: 2px;">طريقة الدفع:</div>
      ${paymentsRows}
    </div>

    <div style="text-align: center; font-size: 10px; color: #555; border-top: 1px dashed #888; padding-top: 8px; line-height: 1.5;">
      <p style="font-weight: 600; margin: 0;">${shopSettings.invoiceFooter}</p>
      <p style="font-size: 9px; color: #888; margin: 4px 0 0 0;">شكراً لتعاملكم معنا · نظام إدارة قطع الغيار</p>
    </div>
  </div>
</body>
</html>`;
  }

  // OFFICIAL A4 INVOICE
  const a4Rows = sale.items
    .map(
      (item, idx) => `
      <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 8px; font-weight: 700; color: #0f172a;">${item.productName}</td>
        <td style="padding: 8px; font-family: monospace; color: #475569;">${item.oemNumber}</td>
        <td style="padding: 8px;">${item.brand}</td>
        <td style="padding: 8px; text-align: center; font-weight: 700; font-family: monospace;">${item.quantity}</td>
        <td style="padding: 8px; text-align: left; font-family: monospace;">${item.unitPrice.toFixed(2)} د.ل</td>
        <td style="padding: 8px; text-align: left; font-weight: 700; font-family: monospace;">${item.totalPrice.toFixed(2)} د.ل</td>
      </tr>
    `
    )
    .join('');

  const a4Payments = sale.payments
    .map((p) => {
      const methodLabel =
        p.method === 'cash' ? 'نقدي' : p.method === 'bank_transfer' ? 'تحويل مصرفي' : 'آجل';
      return `<li style="margin-bottom: 4px;">${methodLabel}: <strong>${p.amount.toFixed(2)} د.ل</strong> ${
        p.referenceNumber ? `(مرجع: ${p.referenceNumber})` : ''
      }</li>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>فاتورة مبيعات #${sale.invoiceNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Tahoma, Arial, sans-serif;
      direction: rtl;
      margin: 0;
      padding: 16px;
      background: #fff;
      color: #0f172a;
      font-size: 12px;
    }
    .page {
      max-width: 720px;
      margin: 0 auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
  </style>
</head>
<body>
  <div class="page">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 14px; margin-bottom: 20px;">
      <div>
        <h1 style="font-size: 22px; font-weight: 700; margin: 0; color: #0f172a;">${shopSettings.shopName}</h1>
        <p style="margin: 4px 0 2px 0; color: #475569;">تجارة واستيراد قطع غيار السيارات بالجملة والقطاعي</p>
        <p style="margin: 2px 0; color: #475569;">${shopSettings.address} · ${shopSettings.city}</p>
        <p style="margin: 2px 0; color: #475569;">هاتف: ${shopSettings.phone}</p>
        ${
          shopSettings.commercialReg
            ? `<p style="margin: 2px 0; color: #64748b; font-family: monospace;">سجل تجاري: ${shopSettings.commercialReg}</p>`
            : ''
        }
      </div>
      <div style="text-align: left; background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="font-size: 15px; font-weight: 700; color: #1e40af; margin: 0 0 6px 0;">فاتورة مبيعات</h2>
        <div style="font-size: 12px; color: #334155;">
          <p style="margin: 2px 0;">رقم الفاتورة: <strong style="font-family: monospace; color: #0f172a;">${sale.invoiceNumber}</strong></p>
          <p style="margin: 2px 0;">التاريخ: <span style="font-family: monospace;">${dateOnly}</span></p>
          <p style="margin: 2px 0;">الوقت: <span style="font-family: monospace;">${timeOnly}</span></p>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; background: #f8fafc;">
      <div>
        <h4 style="font-weight: 700; color: #334155; margin: 0 0 4px 0;">بيانات العميل:</h4>
        <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">${sale.customerName}</p>
        ${
          sale.customerPhone
            ? `<p style="color: #475569; margin: 4px 0 0 0;">الهاتف: ${sale.customerPhone}</p>`
            : ''
        }
      </div>
      <div>
        <h4 style="font-weight: 700; color: #334155; margin: 0 0 4px 0;">تفاصيل الفاتورة:</h4>
        <p style="margin: 2px 0;"><span style="color: #64748b;">الموظف المسؤول:</span> ${sale.employeeName}</p>
        <p style="margin: 2px 0;"><span style="color: #64748b;">حالة الفاتورة:</span> ${
          sale.status === 'completed' ? 'معتمدة ومكتملة' : 'ملغاة'
        }</p>
      </div>
    </div>

    <table style="margin-bottom: 20px;">
      <thead>
        <tr style="background: #1e293b; color: #ffffff;">
          <th style="padding: 8px; text-align: right;">#</th>
          <th style="padding: 8px; text-align: right;">الصنف والبيان</th>
          <th style="padding: 8px; text-align: right;">رقم القطعة OEM</th>
          <th style="padding: 8px; text-align: right;">الماركة</th>
          <th style="padding: 8px; text-align: center;">الكمية</th>
          <th style="padding: 8px; text-align: left;">السعر الإفرادي</th>
          <th style="padding: 8px; text-align: left;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${a4Rows}
      </tbody>
    </table>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;">
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc;">
        <h4 style="font-weight: 700; color: #1e293b; margin: 0 0 6px 0;">طرق الدفع والشروط:</h4>
        <ul style="margin: 0; padding-right: 18px;">
          ${a4Payments}
        </ul>
        ${
          sale.notes
            ? `<p style="margin: 8px 0 0 0; color: #334155; font-style: italic;">ملاحظات: ${sale.notes}</p>`
            : ''
        }
      </div>

      <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; color: #475569; margin-bottom: 4px;">
          <span>المجموع الفرعي:</span>
          <span style="font-family: monospace;">${sale.subtotal.toFixed(2)} د.ل</span>
        </div>
        ${
          sale.discount > 0
            ? `<div style="display: flex; justify-content: space-between; color: #dc2626; margin-bottom: 4px;">
                <span>الخصم:</span>
                <span style="font-family: monospace;">-${sale.discount.toFixed(2)} د.ل</span>
              </div>`
            : ''
        }
        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 16px; color: #0f172a; padding-top: 8px; border-top: 1px solid #cbd5e1; margin-bottom: 4px;">
          <span>الإجمالي المستحق:</span>
          <span style="font-family: monospace; color: #1d4ed8;">${sale.totalAmount.toFixed(2)} د.ل</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #047857; font-weight: 600;">
          <span>المبلغ المدفوع:</span>
          <span style="font-family: monospace;">${sale.paidAmount.toFixed(2)} د.ل</span>
        </div>
        ${
          sale.remainingAmount > 0
            ? `<div style="display: flex; justify-content: space-between; color: #b91c1c; font-weight: 700; margin-top: 6px; padding: 6px; background: #fef2f2; border-radius: 6px;">
                <span>المتبقي (دين على العميل):</span>
                <span style="font-family: monospace;">${sale.remainingAmount.toFixed(2)} د.ل</span>
              </div>`
            : ''
        }
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Prints an invoice reliably across normal tabs, PWAs, and sandboxed preview iframes.
 */
export function triggerPrintInvoice(
  sale: Sale,
  shopSettings: ShopSettings,
  format: 'thermal' | 'a4'
): void {
  const html = buildInvoicePrintHtml(sale, shopSettings, format);

  let printDialogOpened = false;
  const markOpened = () => {
    printDialogOpened = true;
  };

  window.addEventListener('beforeprint', markOpened, { once: true });

  // 1. Try printing via a dedicated hidden iframe (cleanest output)
  try {
    let iframe = document.getElementById('almadar-print-iframe') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'almadar-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc && iframe.contentWindow) {
      doc.open();
      doc.write(html);
      doc.close();

      iframe.contentWindow.addEventListener('beforeprint', markOpened, { once: true });
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  } catch (err) {
    console.warn('Iframe print fallback:', err);
  }

  // 2. If hidden iframe print didn't fire beforeprint, try main window.print()
  if (!printDialogOpened) {
    try {
      document.body.classList.add('printing-invoice-modal');
      window.print();
    } catch (err) {
      console.warn('Window print error:', err);
    } finally {
      setTimeout(() => {
        document.body.classList.remove('printing-invoice-modal');
      }, 500);
    }
  }

  window.removeEventListener('beforeprint', markOpened);

  // 3. If beforeprint STILL did not fire, the app is inside a sandboxed iframe without 'allow-modals'.
  // Escape the sandbox by opening the standalone print route in a new tab via an anchor click!
  if (!printDialogOpened) {
    const encoded = encodePrintPayload({
      type: 'invoice',
      sale,
      shopSettings,
      format,
    });
    const printUrl = `${window.location.origin}${window.location.pathname}?printMode=invoice#printData=${encoded}`;
    const a = document.createElement('a');
    a.href = printUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Prints the current page/report reliably across normal tabs and sandboxed preview iframes.
 */
export function triggerPrintReport(title: string, reportContainerHtml?: string): void {
  let printDialogOpened = false;
  const markOpened = () => {
    printDialogOpened = true;
  };

  window.addEventListener('beforeprint', markOpened, { once: true });

  try {
    window.print();
  } catch (err) {
    console.warn('Window print error:', err);
  }

  window.removeEventListener('beforeprint', markOpened);

  if (!printDialogOpened) {
    const encoded = encodePrintPayload({
      type: 'report',
      title,
      reportHtml: reportContainerHtml || '',
    });
    const printUrl = `${window.location.origin}${window.location.pathname}?printMode=report#printData=${encoded}`;
    const a = document.createElement('a');
    a.href = printUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
