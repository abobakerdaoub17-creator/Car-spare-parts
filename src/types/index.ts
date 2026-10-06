export type UserRole = 'admin' | 'sales' | 'warehouse' | 'accountant';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

export type CustomerType = 'فرد' | 'ورشة' | 'محل' | 'شركة';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  customerType: CustomerType;
  creditLimit: number;
  currentBalance: number; // positive means customer owes money (debt)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  country: string; // e.g., ليبيا, تركيا, الصين, الإمارات, ألمانيا
  currency: string; // د.ل or USD or EUR
  balance: number; // positive means we owe supplier
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleMake {
  id: string;
  name: string; // e.g. تويوتا, هيونداي, كيا, نيسان, مرسيدس
  country?: string;
}

export interface VehicleModel {
  id: string;
  makeId: string;
  makeName: string;
  name: string; // e.g. كامري, إلنترا, سبورتاج, صني
}

export interface VehicleYear {
  id: string;
  modelId: string;
  yearStart: number;
  yearEnd: number;
}

export interface VehicleEngine {
  id: string;
  modelId: string;
  engineCode: string; // e.g. 2.4L 2AZ-FE, 1.6L Gamma, 2.0L CRDi
  fuelType?: 'بنزين' | 'ديزل' | 'هايبرد';
}

export interface ProductVehicleCompatibility {
  id: string;
  productId: string;
  make: string;
  model: string;
  yearRange: string;
  years?: string;
  engine: string;
  notes?: string;
}

export interface AlternateNumber {
  id: string;
  productId: string;
  partNumber: string;
  brandOrType: string; // e.g., Denso, Bosch, CTR, 555, Valeo, OEM البديل
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  oemNumber: string;
  alternateNumbers: string[]; // for fast search
  alternateList?: AlternateNumber[];
  brand: string; // e.g. Toyota Genuine, Denso, Bosch, 555, CTR, Valeo, Brembo
  category: string; // e.g. نظام الفرامل, المحرك, نظام التعليق, الكهرباء, الفلاتر, الزيوت
  description?: string;
  image?: string;
  purchasePrice: number;
  retailPrice: number;
  wholesalePrice: number;
  currentStock: number;
  minimumStock: number;
  shelfLocation: string; // e.g. A-12-3, رف المحركات 4
  barcode: string;
  notes?: string;
  compatibilities?: ProductVehicleCompatibility[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'deferred' | 'cheque' | 'mixed';

export interface SalePaymentSplit {
  method: 'cash' | 'bank_transfer' | 'deferred' | 'cheque';
  amount: number;
  referenceNumber?: string;
  notes?: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  sku: string;
  oemNumber: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number; // for profit tracking
  discount: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  employeeId: string;
  employeeName: string;
  date: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number; // added to customer debt if > 0
  paymentMethod: PaymentMethod;
  payments: SalePaymentSplit[];
  status: 'completed' | 'voided' | 'partially_returned' | 'returned';
  notes?: string;
  items: SaleItem[];
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  totalPrice: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  subtotal: number;
  discount: number;
  shippingCost?: number;
  customsCost?: number;
  otherCost?: number;
  totalAmount: number;
  paidAmount: number;
  cashPaid?: number;
  bankPaid?: number;
  remainingAmount: number; // added to supplier debt if > 0
  paymentMethod: 'cash' | 'bank_transfer' | 'deferred' | 'mixed';
  referenceNumber?: string;
  status: 'received' | 'voided' | 'partial_return';
  notes?: string;
  items: PurchaseItem[];
  createdAt: string;
}

export type InventoryTransactionType =
  | 'purchase'
  | 'sale'
  | 'sale_return'
  | 'purchase_return'
  | 'stock_adjustment'
  | 'damaged'
  | 'opening_balance';

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: InventoryTransactionType;
  quantityChange: number; // e.g. +10, -2
  stockBefore: number;
  stockAfter: number;
  referenceType: 'sale' | 'purchase' | 'return' | 'stock_count' | 'manual';
  referenceId: string;
  notes?: string;
  userId: string;
  userName: string;
  date: string;
  timestamp?: string;
}

export interface StockCountItem {
  productId: string;
  productName: string;
  sku: string;
  oemNumber: string;
  shelfLocation: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  unitCost: number;
  differenceValue: number;
  notes?: string;
}

export interface StockCount {
  id: string;
  sessionNumber: string;
  date: string;
  status: 'draft' | 'approved' | 'cancelled';
  performedBy: string;
  approvedBy?: string;
  totalDiscrepancyItems: number;
  totalDiscrepancyValue: number;
  notes?: string;
  items: StockCountItem[];
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'other';
  referenceNumber?: string;
  notes?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'other';
  referenceNumber?: string;
  notes?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'كهرباء وإنارة'
  | 'إيجار المحل'
  | 'نقل ومحروقات'
  | 'صيانة ومعدات'
  | 'شحن وتخليص'
  | 'ضيافة ونظافة'
  | 'رواتب وحوافز'
  | 'مصروفات بنكية'
  | 'أخرى';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paidTo: string;
  paymentMethod: 'cash' | 'bank_transfer';
  notes?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  type: 'sale_return' | 'purchase_return';
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  partyId: string; // customerId or supplierId
  partyName: string;
  customerName?: string;
  date: string;
  totalAmount: number;
  totalRefundAmount?: number;
  refundMethod: 'cash' | 'balance_credit';
  items: ReturnItem[];
  notes?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface ImportShipmentItem {
  id: string;
  shipmentId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  factoryPrice: number; // سعر المصنع للقطعة
  allocatedShipping: number; // حصة القطعة من الشحن
  allocatedCustoms: number; // حصة القطعة من الجمارك
  allocatedOther: number; // مصاريف إضافية
  landedCost: number; // التكلفة النهائية بعد الوصول
  totalCost: number;
}

export interface ImportShipment {
  id: string;
  shipmentNumber: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber: string;
  originCountry: string; // دبي, تركيا, الصين, إيطاليا
  purchaseDate: string;
  arrivalDate?: string;
  status: 'ordered' | 'in_transit' | 'customs' | 'received' | 'cancelled';
  goodsCost: number;
  shippingCost: number;
  customsCost: number;
  otherExpenses: number;
  totalLandedCost: number;
  items: ImportShipmentItem[];
  notes?: string;
  createdAt: string;
}

export interface CashTransaction {
  id: string;
  type: 'in' | 'out';
  category: 'مبيعات نقدية' | 'تحصيل عميل' | 'سداد مورد' | 'مصروفات' | 'مرتجع نقدي' | 'رصيد افتتاحي' | 'سحب أرباح' | 'إيداع';
  amount: number;
  referenceType?: 'sale' | 'purchase' | 'customer_payment' | 'supplier_payment' | 'expense' | 'return' | 'manual';
  referenceId?: string;
  description: string;
  date: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface CashDrawerSummary {
  openingBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  expectedCurrentCash: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entity?: string;
  entityId: string;
  timestamp: string;
  details: string;
  previousData?: string;
  newData?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  timestamp: string;
  read: boolean;
  linkTab?: string;
}

export interface ShopSettings {
  shopName: string;
  phone: string;
  address: string;
  city: string;
  commercialReg: string;
  invoiceFooter: string;
  currency: string;
  defaultPrintFormat: 'thermal' | 'a4';
}

export interface SyncQueueItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  data?: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  errorMessage?: string;
}

export interface HybridSyncStatus {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  totalLocalRecords: number;
  syncEngineStatus: 'idle' | 'syncing' | 'offline' | 'error';
}
