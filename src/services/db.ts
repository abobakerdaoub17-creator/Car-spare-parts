import {
  AppUser,
  Customer,
  Supplier,
  VehicleMake,
  VehicleModel,
  Product,
  Sale,
  SalePaymentSplit,
  Purchase,
  InventoryTransaction,
  StockCount,
  CustomerPayment,
  SupplierPayment,
  Expense,
  ReturnRecord,
  ImportShipment,
  CashTransaction,
  CashDrawerSummary,
  AuditLog,
  ShopSettings,
  SyncQueueItem,
  HybridSyncStatus,
} from '../types';
import { getSupabase } from './supabaseClient';

const STORAGE_KEYS = {
  SHOP_SETTINGS: 'almadar_shop_settings_v1',
  PRODUCTS: 'almadar_products_v1',
  CUSTOMERS: 'almadar_customers_v1',
  SUPPLIERS: 'almadar_suppliers_v1',
  SALES: 'almadar_sales_v1',
  PURCHASES: 'almadar_purchases_v1',
  INVENTORY_TX: 'almadar_inventory_tx_v1',
  STOCK_COUNTS: 'almadar_stock_counts_v1',
  CUSTOMER_PAYMENTS: 'almadar_customer_payments_v1',
  SUPPLIER_PAYMENTS: 'almadar_supplier_payments_v1',
  EXPENSES: 'almadar_expenses_v1',
  RETURNS: 'almadar_returns_v1',
  SHIPMENTS: 'almadar_shipments_v1',
  CASH_TX: 'almadar_cash_tx_v1',
  AUDIT_LOGS: 'almadar_audit_logs_v1',
  VEHICLE_MAKES: 'almadar_vehicle_makes_v1',
  VEHICLE_MODELS: 'almadar_vehicle_models_v1',
  INITIALIZED: 'almadar_db_initialized_v1',
  PENDING_SYNC: 'almadar_pending_sync_v1',
  SIMULATED_OFFLINE: 'almadar_simulated_offline_v1',
  LAST_SYNC_TIME: 'almadar_last_sync_time_v1',
};

// Initial Vehicle Makes & Models popular in Libya
export const INITIAL_VEHICLE_MAKES: VehicleMake[] = [
  { id: 'make-1', name: 'تويوتا (Toyota)', country: 'اليابان' },
  { id: 'make-2', name: 'هيونداي (Hyundai)', country: 'كوريا الجنوبية' },
  { id: 'make-3', name: 'كيا (Kia)', country: 'كوريا الجنوبية' },
  { id: 'make-4', name: 'نيسان (Nissan)', country: 'اليابان' },
  { id: 'make-5', name: 'مرسيدس (Mercedes-Benz)', country: 'ألمانيا' },
  { id: 'make-6', name: 'ميتسوبيشي (Mitsubishi)', country: 'اليابان' },
];

export const INITIAL_VEHICLE_MODELS: VehicleModel[] = [
  { id: 'mod-1', makeId: 'make-1', makeName: 'تويوتا', name: 'كامري (Camry)' },
  { id: 'mod-2', makeId: 'make-1', makeName: 'تويوتا', name: 'كورولا (Corolla)' },
  { id: 'mod-3', makeId: 'make-1', makeName: 'تويوتا', name: 'هايلوكس (Hilux)' },
  { id: 'mod-4', makeId: 'make-1', makeName: 'تويوتا', name: 'لاند كروزر (Land Cruiser)' },
  { id: 'mod-5', makeId: 'make-1', makeName: 'تويوتا', name: 'راف 4 (RAV4)' },
  { id: 'mod-6', makeId: 'make-2', makeName: 'هيونداي', name: 'إلنترا (Elantra)' },
  { id: 'mod-7', makeId: 'make-2', makeName: 'هيونداي', name: 'توسان (Tucson)' },
  { id: 'mod-8', makeId: 'make-2', makeName: 'هيونداي', name: 'أكسنت (Accent)' },
  { id: 'mod-9', makeId: 'make-2', makeName: 'هيونداي', name: 'سنتافي (Santa Fe)' },
  { id: 'mod-10', makeId: 'make-3', makeName: 'كيا', name: 'سبورتاج (Sportage)' },
  { id: 'mod-11', makeId: 'make-3', makeName: 'كيا', name: 'سيراتو (Cerato)' },
  { id: 'mod-12', makeId: 'make-3', makeName: 'كيا', name: 'أوبتيما (Optima / K5)' },
  { id: 'mod-13', makeId: 'make-4', makeName: 'نيسان', name: 'صني (Sunny)' },
  { id: 'mod-14', makeId: 'make-4', makeName: 'نيسان', name: 'باترول (Patrol)' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'ورشة الفلاح للميكانيكا الحديثة',
    phone: '091-2345678',
    address: 'شارع المصانع قرب جزيرة الفرناج',
    city: 'طرابلس',
    area: 'عين زارة',
    customerType: 'ورشة',
    creditLimit: 5000,
    currentBalance: 850,
    notes: 'حساب ورشة مفتوح، سداد أسبوعي الخميس',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-09-25T12:00:00Z',
  },
  {
    id: 'cust-2',
    name: 'محل القدس لقطع الغيار',
    phone: '092-8765432',
    address: 'طريق الهواري الرئيسي',
    city: 'بنغازي',
    area: 'الفويهات',
    customerType: 'محل',
    creditLimit: 12000,
    currentBalance: 2400,
    notes: 'شراء بالجملة، تحويل مصرفي عبر المصرف التجاري الوطني',
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-09-26T14:30:00Z',
  },
  {
    id: 'cust-3',
    name: 'شركة الوفاق للنقل والشحن',
    phone: '091-9988776',
    address: 'المنطقة الصناعية بالقرب من الميناء',
    city: 'مصراتة',
    area: 'طريق الجزيرة',
    customerType: 'شركة',
    creditLimit: 25000,
    currentBalance: 4200,
    notes: 'أسطول سيارات هايلوكس ولاند كروزر',
    createdAt: '2026-08-15T09:30:00Z',
    updatedAt: '2026-09-20T16:00:00Z',
  },
  {
    id: 'cust-4',
    name: 'الحاج عمر الورفلي',
    phone: '092-1122334',
    address: 'قرب جامع القرقني',
    city: 'طرابلس',
    area: 'سوق الجمعة',
    customerType: 'فرد',
    creditLimit: 1000,
    currentBalance: 0,
    notes: 'زبون دائم ومميز نقداً',
    createdAt: '2026-09-01T15:00:00Z',
    updatedAt: '2026-09-27T08:00:00Z',
  },
  {
    id: 'cust-5',
    name: 'مركز الأندلس لفحص وصيانة السيارات',
    phone: '094-5544332',
    address: 'المدخل الشرقي للمدينة',
    city: 'الزاوية',
    area: 'جوددائم',
    customerType: 'ورشة',
    creditLimit: 6000,
    currentBalance: 1150,
    notes: 'طلب متكرر لفحمات الفرامل والبواجي وفلاتر الزيت',
    createdAt: '2026-09-05T10:15:00Z',
    updatedAt: '2026-09-24T18:00:00Z',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-1',
    name: 'شركة الخليج الكبرى لقطع غيار السيارات',
    phone: '091-7766554',
    address: 'شارع بن عاشور',
    country: 'ليبيا',
    currency: 'د.ل',
    balance: 5500,
    notes: 'وكيل معتمد لمنتجات 555 و CTR اليابانية والكورية',
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'supp-2',
    name: 'مؤسسة النجم الذهبي للتجارة العامة',
    phone: '+971-4-2233445',
    address: 'منطقة ديرة - شارع عمر بن الخطاب',
    country: 'الإمارات',
    currency: 'د.ل',
    balance: 14200,
    notes: 'استيراد قطع تويوتا ونيسان أصلية وكالة',
    createdAt: '2026-07-15T09:00:00Z',
    updatedAt: '2026-09-22T11:00:00Z',
  },
  {
    id: 'supp-3',
    name: 'شركة الأناضول أوتو بارتس (Anadolu Auto)',
    phone: '+90-212-5566778',
    address: 'أكسراي - المنطقة الصناعية إكيتيلي',
    country: 'تركيا',
    currency: 'د.ل',
    balance: 8900,
    notes: 'استيراد فلاتر وشمعات إشعال ومساعدين تركية وأوروبية',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-09-24T15:00:00Z',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'طقم تيل فرامل أمامي (فحمات فرامل)',
    sku: 'BP-TY-04465',
    oemNumber: '04465-33450',
    alternateNumbers: ['04465-33470', '04465-06100', 'D1212-8331', 'AN-715K', 'SP2075'],
    alternateList: [
      { id: 'alt-1', productId: 'prod-1', partNumber: '04465-33470', brandOrType: 'OEM البديل' },
      { id: 'alt-2', productId: 'prod-1', partNumber: 'AN-715K', brandOrType: 'Akebono' },
      { id: 'alt-3', productId: 'prod-1', partNumber: 'SP2075', brandOrType: 'Hi-Q Sangsin' },
      { id: 'alt-4', productId: 'prod-1', partNumber: 'D1212-8331', brandOrType: 'FMSI' },
    ],
    brand: 'Toyota Genuine',
    category: 'نظام الفرامل',
    description: 'تيل فرامل أصلي وكالة بجودة سيراميك هادئة، مقاوم للحرارة العالية ويمنع التآكل السريع لأسطوانة الفرامل.',
    purchasePrice: 120.0,
    retailPrice: 175.0,
    wholesalePrice: 155.0,
    currentStock: 18,
    minimumStock: 6,
    shelfLocation: 'A-01-B',
    barcode: '694123450001',
    compatibilities: [
      { id: 'c-1', productId: 'prod-1', make: 'تويوتا', model: 'كامري (Camry)', yearRange: '2007–2017', engine: '2.4L / 2.5L' },
      { id: 'c-2', productId: 'prod-1', make: 'تويوتا', model: 'راف 4 (RAV4)', yearRange: '2006–2012', engine: '2.4L 2AZ-FE' },
    ],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'مساعد أمامي يمين (ممتص صدمات)',
    sku: 'SH-HY-54651',
    oemNumber: '54651-3X250',
    alternateNumbers: ['54651-3X000', '338022', 'G54181', 'KYB-338022'],
    alternateList: [
      { id: 'alt-5', productId: 'prod-2', partNumber: '338022', brandOrType: 'KYB Excel-G' },
      { id: 'alt-6', productId: 'prod-2', partNumber: 'G54181', brandOrType: 'Monroe' },
    ],
    brand: 'CTR',
    category: 'نظام التعليق والتوجيه',
    description: 'مساعد هيدروليكي غازي أمامي يمين ذو ثبات ممتاز على الطرق المعبدة والوعرة.',
    purchasePrice: 140.0,
    retailPrice: 210.0,
    wholesalePrice: 185.0,
    currentStock: 7,
    minimumStock: 4,
    shelfLocation: 'B-04-C',
    barcode: '694123450002',
    compatibilities: [
      { id: 'c-3', productId: 'prod-2', make: 'هيونداي', model: 'إلنترا (Elantra)', yearRange: '2011–2016', engine: '1.6L / 1.8L' },
      { id: 'c-4', productId: 'prod-2', make: 'كيا', model: 'سيراتو (Cerato)', yearRange: '2013–2018', engine: '1.6L Gamma' },
    ],
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-09-22T11:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'شمعات إشعال إيريديوم (طقم 4 بواجي)',
    sku: 'SP-NGK-ILFR6T',
    oemNumber: '90919-01210',
    alternateNumbers: ['SK20R11', 'ILFR6T11', 'IK20TT', 'FR7DII33X'],
    alternateList: [
      { id: 'alt-7', productId: 'prod-3', partNumber: 'SK20R11', brandOrType: 'Denso Iridium' },
      { id: 'alt-8', productId: 'prod-3', partNumber: 'IK20TT', brandOrType: 'Denso Twin Tip' },
      { id: 'alt-9', productId: 'prod-3', partNumber: 'FR7DII33X', brandOrType: 'Bosch Double Iridium' },
    ],
    brand: 'Denso',
    category: 'الكهرباء والإشعال',
    description: 'شمعات احتراق برأس إيريديوم لشرارة قوية واستهلاك اقتصادي للبنزين وعمر افتراضي يصل إلى 100 ألف كم.',
    purchasePrice: 65.0,
    retailPrice: 95.0,
    wholesalePrice: 80.0,
    currentStock: 34,
    minimumStock: 10,
    shelfLocation: 'C-02-A',
    barcode: '694123450003',
    compatibilities: [
      { id: 'c-5', productId: 'prod-3', make: 'تويوتا', model: 'كامري (Camry)', yearRange: '2003–2015', engine: '2.4L / 3.5L' },
      { id: 'c-6', productId: 'prod-3', make: 'تويوتا', model: 'كورولا (Corolla)', yearRange: '2008–2019', engine: '1.6L / 1.8L Dual VVT-i' },
      { id: 'c-7', productId: 'prod-3', make: 'تويوتا', model: 'هايلوكس (Hilux)', yearRange: '2005–2020', engine: '2.7L 2TR-FE' },
    ],
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-09-24T14:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'فلتر زيت محرك أصلي (تويوتا)',
    sku: 'OF-TY-04152',
    oemNumber: '04152-YZZA1',
    alternateNumbers: ['04152-31090', 'HU7019z', 'W68/3', 'CH10358'],
    alternateList: [
      { id: 'alt-10', productId: 'prod-4', partNumber: '04152-31090', brandOrType: 'OEM البديل' },
      { id: 'alt-11', productId: 'prod-4', partNumber: 'HU7019z', brandOrType: 'Mann-Filter' },
    ],
    brand: 'Toyota Genuine',
    category: 'الفلاتر والسوائل',
    description: 'فلتر زيت أصلي مزود بصمام مانع للرجوع لضمان تزييت فوري عند تشغيل المحرك.',
    purchasePrice: 14.0,
    retailPrice: 25.0,
    wholesalePrice: 20.0,
    currentStock: 4, // low stock trigger
    minimumStock: 15,
    shelfLocation: 'D-01-A',
    barcode: '694123450004',
    compatibilities: [
      { id: 'c-8', productId: 'prod-4', make: 'تويوتا', model: 'كامري (Camry)', yearRange: '2010–2023', engine: '2.5L / 3.5L' },
      { id: 'c-9', productId: 'prod-4', make: 'تويوتا', model: 'لاند كروزر (Land Cruiser)', yearRange: '2008–2021', engine: '4.6L / 5.7L V8' },
      { id: 'c-10', productId: 'prod-4', make: 'تويوتا', model: 'راف 4 (RAV4)', yearRange: '2013–2022', engine: '2.5L' },
    ],
    createdAt: '2026-08-12T09:00:00Z',
    updatedAt: '2026-09-25T11:00:00Z',
  },
  {
    id: 'prod-5',
    name: 'مضخة ماء تبريد المحرك (وتر بمب)',
    sku: 'WP-HY-25100',
    oemNumber: '25100-2B000',
    alternateNumbers: ['25100-2B700', 'GWHY-47A', 'VKPC95874', 'PA10048'],
    alternateList: [
      { id: 'alt-12', productId: 'prod-5', partNumber: 'GWHY-47A', brandOrType: 'GMB Japan' },
      { id: 'alt-13', productId: 'prod-5', partNumber: 'VKPC95874', brandOrType: 'SKF' },
    ],
    brand: 'GMB',
    category: 'نظام التبريد والتكييف',
    description: 'مضخة تبريد ذات ريش معدنية عالية الكفاءة مع حشية أصلية لمنع تسريب ماء التبريد.',
    purchasePrice: 85.0,
    retailPrice: 135.0,
    wholesalePrice: 115.0,
    currentStock: 12,
    minimumStock: 3,
    shelfLocation: 'B-02-D',
    barcode: '694123450005',
    compatibilities: [
      { id: 'c-11', productId: 'prod-5', make: 'هيونداي', model: 'إلنترا (Elantra)', yearRange: '2007–2016', engine: '1.6L Gamma' },
      { id: 'c-12', productId: 'prod-5', make: 'هيونداي', model: 'أكسنت (Accent)', yearRange: '2011–2019', engine: '1.4L / 1.6L' },
      { id: 'c-13', productId: 'prod-5', make: 'كيا', model: 'سيراتو (Cerato)', yearRange: '2009–2017', engine: '1.6L Gamma' },
    ],
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-09-21T15:00:00Z',
  },
  {
    id: 'prod-6',
    name: 'جوزة مقص أمامي سفلي (ركبة مقص)',
    sku: 'BJ-555-SB3842',
    oemNumber: '43330-09610',
    alternateNumbers: ['43330-09620', 'SB-3842', 'CB-T029', 'JBJ7538'],
    alternateList: [
      { id: 'alt-14', productId: 'prod-6', partNumber: 'SB-3842', brandOrType: '555 Sankei Japan' },
      { id: 'alt-15', productId: 'prod-6', partNumber: 'CB-T029', brandOrType: 'CTR Korea' },
    ],
    brand: '555',
    category: 'نظام التعليق والتوجيه',
    description: 'جوزة مقص مصنوعة في اليابان من الفولاذ المقاوم للصدمات والجهد العالي.',
    purchasePrice: 45.0,
    retailPrice: 75.0,
    wholesalePrice: 60.0,
    currentStock: 22,
    minimumStock: 8,
    shelfLocation: 'B-01-A',
    barcode: '694123450006',
    compatibilities: [
      { id: 'c-14', productId: 'prod-6', make: 'تويوتا', model: 'هايلوكس (Hilux)', yearRange: '2005–2015', engine: '2.5L / 2.7L / 3.0L 4WD' },
    ],
    createdAt: '2026-08-18T10:00:00Z',
    updatedAt: '2026-09-23T16:00:00Z',
  },
  {
    id: 'prod-7',
    name: 'طرمبة بنزين كاملة بالقلب والفلتر',
    sku: 'FP-BOSCH-0580',
    oemNumber: '17040-95F0B',
    alternateNumbers: ['0580453477', 'DFP-0106', 'KR0234P'],
    alternateList: [
      { id: 'alt-16', productId: 'prod-7', partNumber: '0580453477', brandOrType: 'Bosch Germany' },
      { id: 'alt-17', productId: 'prod-7', partNumber: 'DFP-0106', brandOrType: 'Denso' },
    ],
    brand: 'Bosch',
    category: 'المحرك والوقود',
    description: 'طلمبة ضخ وقود كهربائية متكاملة توفر ضغطاً ثابتاً 3.5 بار لمنع تقطيع المحرك وضعف العزم.',
    purchasePrice: 110.0,
    retailPrice: 170.0,
    wholesalePrice: 145.0,
    currentStock: 2, // low stock trigger
    minimumStock: 5,
    shelfLocation: 'C-05-B',
    barcode: '694123450007',
    compatibilities: [
      { id: 'c-18', productId: 'prod-7', make: 'نيسان', model: 'صني (Sunny)', yearRange: '2007–2018', engine: '1.5L / 1.6L HR15' },
    ],
    createdAt: '2026-08-20T14:00:00Z',
    updatedAt: '2026-09-25T17:00:00Z',
  },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-101',
    invoiceNumber: 'INV-2026-0001',
    customerId: 'cust-1',
    customerName: 'ورشة الفلاح للميكانيكا الحديثة',
    customerPhone: '091-2345678',
    employeeId: 'usr-admin',
    employeeName: 'أبوبكر داؤوب (المدير)',
    date: '2026-09-26T11:30:00Z',
    subtotal: 510.0,
    discount: 10.0,
    tax: 0,
    totalAmount: 500.0,
    paidAmount: 300.0,
    remainingAmount: 200.0,
    paymentMethod: 'mixed',
    payments: [
      { method: 'cash', amount: 200.0, notes: 'نقدي مقبوض' },
      { method: 'bank_transfer', amount: 100.0, referenceNumber: 'TX-98712', notes: 'تحويل عبر تطبيق وهب / سداد' },
      { method: 'deferred', amount: 200.0, notes: 'آجل على حساب الورشة' },
    ],
    status: 'completed',
    notes: 'تم تسليم القطع للميكانيكي طارق',
    items: [
      {
        id: 'si-1',
        saleId: 'sale-101',
        productId: 'prod-1',
        productName: 'طقم تيل فرامل أمامي (فحمات فرامل)',
        sku: 'BP-TY-04465',
        oemNumber: '04465-33450',
        brand: 'Toyota Genuine',
        quantity: 2,
        unitPrice: 175.0,
        purchasePrice: 120.0,
        discount: 10.0,
        totalPrice: 340.0,
      },
      {
        id: 'si-2',
        saleId: 'sale-101',
        productId: 'prod-7',
        productName: 'طرمبة بنزين كاملة بالقلب والفلتر',
        sku: 'FP-BOSCH-0580',
        oemNumber: '17040-95F0B',
        brand: 'Bosch',
        quantity: 1,
        unitPrice: 170.0,
        purchasePrice: 110.0,
        discount: 0,
        totalPrice: 170.0,
      },
    ],
    createdAt: '2026-09-26T11:30:00Z',
  },
  {
    id: 'sale-102',
    invoiceNumber: 'INV-2026-0002',
    customerId: 'cust-4',
    customerName: 'الحاج عمر الورفلي',
    customerPhone: '092-1122334',
    employeeId: 'usr-sales',
    employeeName: 'محمد الترهوني (مبيعات)',
    date: '2026-09-27T08:15:00Z',
    subtotal: 190.0,
    discount: 0,
    tax: 0,
    totalAmount: 190.0,
    paidAmount: 190.0,
    remainingAmount: 0,
    paymentMethod: 'cash',
    payments: [{ method: 'cash', amount: 190.0, notes: 'نقدي بالكامل' }],
    status: 'completed',
    notes: 'بواجي تويوتا أصلي مع خصم خاص',
    items: [
      {
        id: 'si-3',
        saleId: 'sale-102',
        productId: 'prod-3',
        productName: 'شمعات إشعال إيريديوم (طقم 4 بواجي)',
        sku: 'SP-NGK-ILFR6T',
        oemNumber: '90919-01210',
        brand: 'Denso',
        quantity: 2,
        unitPrice: 95.0,
        purchasePrice: 65.0,
        discount: 0,
        totalPrice: 190.0,
      },
    ],
    createdAt: '2026-09-27T08:15:00Z',
  },
];

export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'purch-1',
    purchaseNumber: 'PO-2026-001',
    supplierInvoiceNumber: 'INV-GLF-902',
    supplierId: 'supp-1',
    supplierName: 'شركة الخليج الكبرى لقطع غيار السيارات',
    date: '2026-09-18T10:00:00Z',
    subtotal: 3500.0,
    discount: 100.0,
    shippingCost: 50.0,
    customsCost: 0,
    totalAmount: 3450.0,
    paidAmount: 2000.0,
    remainingAmount: 1450.0,
    paymentMethod: 'cash',
    status: 'received',
    notes: 'استلام شحنة تيل فرامل ومساعدين وجوزات مقص',
    items: [
      {
        id: 'pi-1',
        purchaseId: 'purch-1',
        productId: 'prod-1',
        productName: 'طقم تيل فرامل أمامي (فحمات فرامل)',
        sku: 'BP-TY-04465',
        quantity: 15,
        purchasePrice: 120.0,
        totalPrice: 1800.0,
      },
      {
        id: 'pi-2',
        purchaseId: 'purch-1',
        productId: 'prod-6',
        productName: 'جوزة مقص أمامي سفلي (ركبة مقص)',
        sku: 'BJ-555-SB3842',
        quantity: 20,
        purchasePrice: 45.0,
        totalPrice: 900.0,
      },
    ],
    createdAt: '2026-09-18T10:00:00Z',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    category: 'كهرباء وإنارة',
    amount: 120.0,
    date: '2026-09-20T10:00:00Z',
    paidTo: 'الشركة العامة للكهرباء',
    paymentMethod: 'cash',
    notes: 'فاتورة كهرباء المحل لشهر أغسطس',
    userId: 'usr-admin',
    userName: 'أبوبكر داؤوب',
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'exp-2',
    category: 'نقل ومحروقات',
    amount: 60.0,
    date: '2026-09-25T14:30:00Z',
    paidTo: 'سيارة نقل البضائع',
    paymentMethod: 'cash',
    notes: 'نقل كراتين قطع الغيار من مستودع تاجوراء',
    userId: 'usr-sales',
    userName: 'محمد الترهوني',
    createdAt: '2026-09-25T14:30:00Z',
  },
];

export const INITIAL_IMPORT_SHIPMENTS: ImportShipment[] = [
  {
    id: 'ship-1',
    shipmentNumber: 'IMP-2026-TR01',
    supplierId: 'supp-3',
    supplierName: 'شركة الأناضول أوتو بارتس (Anadolu Auto)',
    supplierInvoiceNumber: 'TR-ANADOLU-4402',
    originCountry: 'تركيا',
    purchaseDate: '2026-08-25',
    arrivalDate: '2026-09-15',
    status: 'received',
    goodsCost: 15000.0,
    shippingCost: 1800.0,
    customsCost: 950.0,
    otherExpenses: 350.0,
    totalLandedCost: 18100.0,
    notes: 'حاوية قطع غيار سيارات أوروبية وكورية - وصلت عبر ميناء مصراتة',
    items: [
      {
        id: 'si-item-1',
        shipmentId: 'ship-1',
        productId: 'prod-2',
        productName: 'مساعد أمامي يمين (ممتص صدمات)',
        sku: 'SH-HY-54651',
        quantity: 50,
        factoryPrice: 115.0,
        allocatedShipping: 13.8,
        allocatedCustoms: 7.3,
        allocatedOther: 2.7,
        landedCost: 138.8,
        totalCost: 6940.0,
      },
    ],
    createdAt: '2026-08-25T10:00:00Z',
  },
];

export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [
  {
    id: 'ctx-1',
    type: 'in',
    category: 'رصيد افتتاحي',
    amount: 2500.0,
    description: 'رصيد عهدة درج الصندوق الافتتاحي',
    date: '2026-09-26T08:00:00Z',
    userId: 'usr-admin',
    userName: 'أبوبكر داؤوب',
    createdAt: '2026-09-26T08:00:00Z',
  },
  {
    id: 'ctx-2',
    type: 'in',
    category: 'مبيعات نقدية',
    amount: 200.0,
    referenceType: 'sale',
    referenceId: 'sale-101',
    description: 'دفعة نقدية لفاتورة INV-2026-0001 (ورشة الفلاح)',
    date: '2026-09-26T11:30:00Z',
    userId: 'usr-admin',
    userName: 'أبوبكر داؤوب',
    createdAt: '2026-09-26T11:30:00Z',
  },
  {
    id: 'ctx-3',
    type: 'in',
    category: 'مبيعات نقدية',
    amount: 190.0,
    referenceType: 'sale',
    referenceId: 'sale-102',
    description: 'مبيعات نقدية فاتورة INV-2026-0002 (الحاج عمر)',
    date: '2026-09-27T08:15:00Z',
    userId: 'usr-sales',
    userName: 'محمد الترهوني',
    createdAt: '2026-09-27T08:15:00Z',
  },
  {
    id: 'ctx-4',
    type: 'out',
    category: 'مصروفات',
    amount: 60.0,
    referenceType: 'expense',
    referenceId: 'exp-2',
    description: 'مصروف نقل ومحروقات',
    date: '2026-09-25T14:30:00Z',
    userId: 'usr-sales',
    userName: 'محمد الترهوني',
    createdAt: '2026-09-25T14:30:00Z',
  },
];

export const INITIAL_INVENTORY_TX: InventoryTransaction[] = [
  {
    id: 'itx-1',
    productId: 'prod-1',
    productName: 'طقم تيل فرامل أمامي (فحمات فرامل)',
    sku: 'BP-TY-04465',
    type: 'purchase',
    quantityChange: 15,
    stockBefore: 5,
    stockAfter: 20,
    referenceType: 'purchase',
    referenceId: 'purch-1',
    notes: 'شراء وتوريد من شركة الخليج',
    userId: 'usr-warehouse',
    userName: 'عبد السلام القماطي',
    date: '2026-09-18T10:00:00Z',
  },
  {
    id: 'itx-2',
    productId: 'prod-1',
    productName: 'طقم تيل فرامل أمامي (فحمات فرامل)',
    sku: 'BP-TY-04465',
    type: 'sale',
    quantityChange: -2,
    stockBefore: 20,
    stockAfter: 18,
    referenceType: 'sale',
    referenceId: 'sale-101',
    notes: 'بيع فاتورة INV-2026-0001 لورشة الفلاح',
    userId: 'usr-admin',
    userName: 'أبوبكر داؤوب',
    date: '2026-09-26T11:30:00Z',
  },
  {
    id: 'itx-3',
    productId: 'prod-7',
    productName: 'طرمبة بنزين كاملة بالقلب والفلتر',
    sku: 'FP-BOSCH-0580',
    type: 'sale',
    quantityChange: -1,
    stockBefore: 3,
    stockAfter: 2,
    referenceType: 'sale',
    referenceId: 'sale-101',
    notes: 'بيع فاتورة INV-2026-0001',
    userId: 'usr-admin',
    userName: 'أبوبكر داؤوب',
    date: '2026-09-26T11:30:00Z',
  },
  {
    id: 'itx-4',
    productId: 'prod-3',
    productName: 'شمعات إشعال إيريديوم (طقم 4 بواجي)',
    sku: 'SP-NGK-ILFR6T',
    type: 'sale',
    quantityChange: -2,
    stockBefore: 36,
    stockAfter: 34,
    referenceType: 'sale',
    referenceId: 'sale-102',
    notes: 'بيع فاتورة INV-2026-0002 للحاج عمر الورفلي',
    userId: 'usr-sales',
    userName: 'محمد الترهوني',
    date: '2026-09-27T08:15:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'usr-admin',
    userName: 'أبوبكر داؤوب',
    userRole: 'admin',
    action: 'تهيئة النظام',
    entityType: 'System',
    entityId: 'SYS-INIT',
    timestamp: '2026-09-20T08:00:00Z',
    details: 'تم بدء تشغيل منظومة المدار لقطع غيار السيارات وتوليد قواعد البيانات',
  },
  {
    id: 'log-2',
    userId: 'usr-admin',
    userName: 'أبوبكر داؤوب',
    userRole: 'admin',
    action: 'إنشاء فاتورة مبيعات',
    entityType: 'Sale',
    entityId: 'INV-2026-0001',
    timestamp: '2026-09-26T11:30:00Z',
    details: 'إصدار فاتورة بمبلغ 500.00 د.ل (نقدي: 200 د.ل، تحويل: 100 د.ل، آجل: 200 د.ل)',
  },
];

// In-Memory & LocalStorage Engine
class LocalDbService {
  private products: Product[] = [];
  private customers: Customer[] = [];
  private suppliers: Supplier[] = [];
  private sales: Sale[] = [];
  private purchases: Purchase[] = [];
  private inventoryTx: InventoryTransaction[] = [];
  private stockCounts: StockCount[] = [];
  private customerPayments: CustomerPayment[] = [];
  private supplierPayments: SupplierPayment[] = [];
  private expenses: Expense[] = [];
  private returns: ReturnRecord[] = [];
  private shipments: ImportShipment[] = [];
  private cashTx: CashTransaction[] = [];
  private auditLogs: AuditLog[] = [];
  private vehicleMakes: VehicleMake[] = [];
  private vehicleModels: VehicleModel[] = [];
  private pendingSyncQueue: SyncQueueItem[] = [];
  private simulatedOffline: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      this.products = [...INITIAL_PRODUCTS];
      this.customers = [...INITIAL_CUSTOMERS];
      this.suppliers = [...INITIAL_SUPPLIERS];
      this.sales = [...INITIAL_SALES];
      this.purchases = [...INITIAL_PURCHASES];
      this.inventoryTx = [...INITIAL_INVENTORY_TX];
      this.expenses = [...INITIAL_EXPENSES];
      this.shipments = [...INITIAL_IMPORT_SHIPMENTS];
      this.cashTx = [...INITIAL_CASH_TRANSACTIONS];
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
      this.vehicleMakes = [...INITIAL_VEHICLE_MAKES];
      this.vehicleModels = [...INITIAL_VEHICLE_MODELS];
      this.pendingSyncQueue = [];
      this.simulatedOffline = false;
      this.persistAll();
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } else {
      this.loadAll();
    }
  }

  private loadAll() {
    this.products = this.getItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.customers = this.getItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    this.suppliers = this.getItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    this.sales = this.getItem(STORAGE_KEYS.SALES, INITIAL_SALES);
    this.purchases = this.getItem(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
    this.inventoryTx = this.getItem(STORAGE_KEYS.INVENTORY_TX, INITIAL_INVENTORY_TX);
    this.stockCounts = this.getItem(STORAGE_KEYS.STOCK_COUNTS, []);
    this.customerPayments = this.getItem(STORAGE_KEYS.CUSTOMER_PAYMENTS, []);
    this.supplierPayments = this.getItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, []);
    this.expenses = this.getItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    this.returns = this.getItem(STORAGE_KEYS.RETURNS, []);
    this.shipments = this.getItem(STORAGE_KEYS.SHIPMENTS, INITIAL_IMPORT_SHIPMENTS);
    this.cashTx = this.getItem(STORAGE_KEYS.CASH_TX, INITIAL_CASH_TRANSACTIONS);
    this.auditLogs = this.getItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    this.vehicleMakes = this.getItem(STORAGE_KEYS.VEHICLE_MAKES, INITIAL_VEHICLE_MAKES);
    this.vehicleModels = this.getItem(STORAGE_KEYS.VEHICLE_MODELS, INITIAL_VEHICLE_MODELS);
    this.pendingSyncQueue = this.getItem(STORAGE_KEYS.PENDING_SYNC, []);
    this.simulatedOffline = localStorage.getItem(STORAGE_KEYS.SIMULATED_OFFLINE) === 'true';
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Failed to load ${key}`, e);
      return fallback;
    }
  }

  private persist(key: string, data: any) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to persist ${key}`, e);
    }
  }

  public persistAll() {
    this.persist(STORAGE_KEYS.PRODUCTS, this.products);
    this.persist(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.persist(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    this.persist(STORAGE_KEYS.SALES, this.sales);
    this.persist(STORAGE_KEYS.PURCHASES, this.purchases);
    this.persist(STORAGE_KEYS.INVENTORY_TX, this.inventoryTx);
    this.persist(STORAGE_KEYS.STOCK_COUNTS, this.stockCounts);
    this.persist(STORAGE_KEYS.CUSTOMER_PAYMENTS, this.customerPayments);
    this.persist(STORAGE_KEYS.SUPPLIER_PAYMENTS, this.supplierPayments);
    this.persist(STORAGE_KEYS.EXPENSES, this.expenses);
    this.persist(STORAGE_KEYS.RETURNS, this.returns);
    this.persist(STORAGE_KEYS.SHIPMENTS, this.shipments);
    this.persist(STORAGE_KEYS.CASH_TX, this.cashTx);
    this.persist(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    this.persist(STORAGE_KEYS.VEHICLE_MAKES, this.vehicleMakes);
    this.persist(STORAGE_KEYS.VEHICLE_MODELS, this.vehicleModels);
  }

  public logAudit(user: AppUser, action: string, entityType: string, entityId: string, details: string, prev?: any, next?: any) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
      details,
      previousData: prev ? JSON.stringify(prev) : undefined,
      newData: next ? JSON.stringify(next) : undefined,
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    this.persist(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // =================== PRODUCTS ===================
  public getProducts(): Product[] {
    return [...this.products];
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  public searchProducts(query: string, vehicleFilter?: { make?: string; model?: string }): Product[] {
    const q = query.trim().toLowerCase();
    return this.products.filter((p) => {
      // Vehicle compatibility check
      if (vehicleFilter?.make && vehicleFilter.make !== '') {
        const matchesMake = p.compatibilities?.some((c) =>
          c.make.toLowerCase().includes(vehicleFilter.make!.toLowerCase())
        );
        if (!matchesMake) return false;
      }
      if (vehicleFilter?.model && vehicleFilter.model !== '') {
        const matchesModel = p.compatibilities?.some((c) =>
          c.model.toLowerCase().includes(vehicleFilter.model!.toLowerCase())
        );
        if (!matchesModel) return false;
      }

      if (!q) return true;

      // Match name, SKU, OEM, Barcode, Brand
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.sku.toLowerCase().includes(q)) return true;
      if (p.oemNumber.toLowerCase().includes(q)) return true;
      if (p.barcode?.toLowerCase().includes(q)) return true;
      if (p.brand.toLowerCase().includes(q)) return true;
      if (p.category.toLowerCase().includes(q)) return true;

      // Match Alternate Numbers
      if (p.alternateNumbers && p.alternateNumbers.some((alt) => alt.toLowerCase().includes(q))) {
        return true;
      }
      return false;
    });
  }

  /**
   * Rule #1: Inventory cannot be edited directly from the product form!
   * Adding a product starts currentStock at 0 or specified initial stock via an opening_balance transaction.
   */
  public addProduct(productData: Omit<Product, 'id' | 'currentStock' | 'createdAt' | 'updatedAt'>, initialStock: number, user: AppUser): Product {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
      currentStock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products.unshift(newProduct);

    if (initialStock > 0) {
      this.recordInventoryTransaction({
        productId: id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'opening_balance',
        quantityChange: initialStock,
        referenceType: 'manual',
        referenceId: 'INITIAL_STOCK',
        notes: 'رصيد افتتاحي للمنتج عند الإدخال لأول مرة',
        userId: user.id,
        userName: user.name,
      });
    }

    this.persist(STORAGE_KEYS.PRODUCTS, this.products);
    this.logAudit(user, 'إضافة منتج جديد', 'Product', id, `إضافة القطعة ${newProduct.name} - SKU: ${newProduct.sku}`);
    return this.getProductById(id)!;
  }

  public updateProduct(
    id: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt'>>,
    user: AppUser
  ): Product {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('المنتج غير موجود');

    const prev = this.products[index];
    const targetStock =
      updates.currentStock !== undefined ? updates.currentStock : prev.currentStock;
    const stockDiff = targetStock - prev.currentStock;

    const updated: Product = {
      ...prev,
      ...updates,
      currentStock: prev.currentStock,
      updatedAt: new Date().toISOString(),
    };

    this.products[index] = updated;

    if (stockDiff !== 0) {
      this.recordInventoryTransaction({
        productId: id,
        productName: updated.name,
        sku: updated.sku,
        type: 'stock_adjustment',
        quantityChange: stockDiff,
        referenceType: 'manual',
        referenceId: 'EDIT_PRODUCT',
        notes: `تعديل الكمية في المخزون من بطاقة الصنف (${prev.currentStock} ← ${targetStock})`,
        userId: user.id,
        userName: user.name,
      });
    }

    this.persist(STORAGE_KEYS.PRODUCTS, this.products);
    this.logAudit(user, 'تعديل بيانات منتج', 'Product', id, `تعديل بيانات ${updated.name}`, prev, this.getProductById(id));
    return this.getProductById(id)!;
  }

  // =================== INVENTORY TRANSACTIONS ===================
  public getInventoryTransactions(productId?: string): InventoryTransaction[] {
    if (productId) {
      return this.inventoryTx.filter((tx) => tx.productId === productId);
    }
    return [...this.inventoryTx];
  }

  /**
   * Rule #2: All stock changes MUST occur through Inventory Transactions!
   */
  public recordInventoryTransaction(params: {
    productId: string;
    productName: string;
    sku: string;
    type: InventoryTransaction['type'];
    quantityChange: number;
    referenceType: InventoryTransaction['referenceType'];
    referenceId: string;
    notes?: string;
    userId: string;
    userName: string;
  }): InventoryTransaction {
    const product = this.products.find((p) => p.id === params.productId);
    if (!product) throw new Error('المنتج غير موجود لتسجيل حركة المخزون');

    const stockBefore = product.currentStock;
    const stockAfter = stockBefore + params.quantityChange;

    if (stockAfter < 0 && params.type === 'sale') {
      // In POS or sales we can warn or throw
      console.warn(`تنبيه: المخزون سينخفض لما دون الصفر (${stockAfter})`);
    }

    product.currentStock = stockAfter;
    product.updatedAt = new Date().toISOString();

    const tx: InventoryTransaction = {
      id: `itx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: params.productId,
      productName: params.productName,
      sku: params.sku,
      type: params.type,
      quantityChange: params.quantityChange,
      stockBefore,
      stockAfter,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      notes: params.notes,
      userId: params.userId,
      userName: params.userName,
      date: new Date().toISOString(),
    };

    this.inventoryTx.unshift(tx);
    this.persist(STORAGE_KEYS.PRODUCTS, this.products);
    this.persist(STORAGE_KEYS.INVENTORY_TX, this.inventoryTx);

    return tx;
  }

  // =================== SALES & POS ===================
  public getSales(): Sale[] {
    return [...this.sales];
  }

  public getSaleById(id: string): Sale | undefined {
    return this.sales.find((s) => s.id === id);
  }

  /**
   * Complete POS checkout with split payments, automated stock decrement, and customer debt calculation
   */
  public createSale(params: {
    customerId: string;
    customerName: string;
    customerPhone?: string;
    items: Array<{
      productId: string;
      productName: string;
      sku: string;
      oemNumber: string;
      brand: string;
      quantity: number;
      unitPrice: number;
      purchasePrice: number;
      discount: number;
    }>;
    discount: number;
    payments: SalePaymentSplit[];
    notes?: string;
    user: AppUser;
  }): Sale {
    if (params.items.length === 0) {
      throw new Error('لا يمكن إنشاء فاتورة فارغة بدون أصناف');
    }

    // Verify stock availability
    for (const item of params.items) {
      const prod = this.getProductById(item.productId);
      if (!prod) throw new Error(`المنتج ${item.productName} غير متوفر في النظام`);
      if (prod.currentStock < item.quantity) {
        throw new Error(`الكمية المطلوبة من (${prod.name}) غير متوفرة. المتوفر في المستودع: ${prod.currentStock}`);
      }
    }

    const subtotal = params.items.reduce(
      (sum, i) => sum + (i.unitPrice * i.quantity - i.discount),
      0
    );
    const totalAmount = Math.max(0, subtotal - (params.discount || 0));

    // Calculate paid amount and deferred amount
    let paidAmount = 0;
    let deferredAmount = 0;
    let cashPaid = 0;

    for (const p of params.payments) {
      if (p.method === 'deferred') {
        deferredAmount += p.amount;
      } else {
        paidAmount += p.amount;
        if (p.method === 'cash') {
          cashPaid += p.amount;
        }
      }
    }

    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    // Check credit limit if there is deferred debt
    if (remainingAmount > 0) {
      const customer = this.getCustomerById(params.customerId);
      if (customer) {
        if (customer.creditLimit > 0 && customer.currentBalance + remainingAmount > customer.creditLimit) {
          throw new Error(
            `تجاوز الحد الائتماني للعميل (${customer.name})! الرصيد الحالي: ${customer.currentBalance} د.ل + المطلوب: ${remainingAmount} د.ل أكبر من الحد الائتماني: ${customer.creditLimit} د.ل`
          );
        }
      }
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.sales.length + 1).padStart(4, '0')}`;
    const saleId = `sale-${Date.now()}`;

    let mainPaymentMethod: Sale['paymentMethod'] = 'cash';
    if (params.payments.length > 1) {
      mainPaymentMethod = 'mixed';
    } else if (params.payments.length === 1) {
      mainPaymentMethod = params.payments[0].method;
    }

    const saleItems = params.items.map((i, idx) => ({
      id: `si-${saleId}-${idx}`,
      saleId,
      productId: i.productId,
      productName: i.productName,
      sku: i.sku,
      oemNumber: i.oemNumber,
      brand: i.brand,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      purchasePrice: i.purchasePrice,
      discount: i.discount,
      totalPrice: i.unitPrice * i.quantity - i.discount,
    }));

    const sale: Sale = {
      id: saleId,
      invoiceNumber,
      customerId: params.customerId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      employeeId: params.user.id,
      employeeName: params.user.name,
      date: new Date().toISOString(),
      subtotal,
      discount: params.discount || 0,
      tax: 0,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentMethod: mainPaymentMethod,
      payments: params.payments,
      status: 'completed',
      notes: params.notes,
      items: saleItems,
      createdAt: new Date().toISOString(),
    };

    // 1. Save Sale
    this.sales.unshift(sale);

    // 2. Reduce stock with inventory transactions
    for (const item of sale.items) {
      this.recordInventoryTransaction({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        type: 'sale',
        quantityChange: -item.quantity,
        referenceType: 'sale',
        referenceId: sale.id,
        notes: `مبيعات فاتورة رقم ${sale.invoiceNumber} للعميل ${sale.customerName}`,
        userId: params.user.id,
        userName: params.user.name,
      });
    }

    // 3. Update customer balance (Rule #3)
    if (remainingAmount > 0) {
      this.adjustCustomerBalance(
        params.customerId,
        remainingAmount,
        `رصيد آجل من فاتورة مبيعات ${sale.invoiceNumber}`,
        params.user
      );
    }

    // 4. Record cash drawer entry if cash was paid
    if (cashPaid > 0) {
      this.recordCashTransaction({
        type: 'in',
        category: 'مبيعات نقدية',
        amount: cashPaid,
        referenceType: 'sale',
        referenceId: sale.id,
        description: `تحصيل نقدي فاتورة ${sale.invoiceNumber} (${sale.customerName})`,
        userId: params.user.id,
        userName: params.user.name,
      });
    }

    this.persist(STORAGE_KEYS.SALES, this.sales);
    this.logAudit(
      params.user,
      'إصدار فاتورة مبيعات',
      'Sale',
      sale.id,
      `فاتورة ${sale.invoiceNumber} بقيمة إجمالية ${sale.totalAmount} د.ل للعميل ${sale.customerName}`
    );
    this.enqueuePendingSync('إصدار فاتورة مبيعات', 'Sale', sale.id, {
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      totalAmount: sale.totalAmount,
    });

    return sale;
  }

  /**
   * Edit an existing Sale Invoice with full reconciliation of Inventory, Customer Debt, and Cash Drawer
   */
  public updateSale(
    saleId: string,
    params: {
      customerId: string;
      customerName: string;
      customerPhone?: string;
      items: Array<{
        productId: string;
        productName: string;
        sku: string;
        oemNumber: string;
        brand: string;
        quantity: number;
        unitPrice: number;
        purchasePrice: number;
        discount: number;
      }>;
      discount: number;
      payments: SalePaymentSplit[];
      notes?: string;
      user: AppUser;
    }
  ): Sale {
    const saleIndex = this.sales.findIndex((s) => s.id === saleId);
    if (saleIndex === -1) throw new Error('الفاتورة غير موجودة');

    const existingSale = this.sales[saleIndex];
    if (existingSale.status === 'voided') {
      throw new Error('لا يمكن تعديل فاتورة ملغاة');
    }

    if (params.items.length === 0) {
      throw new Error('لا يمكن حفظ فاتورة فارغة بدون أصناف');
    }

    // 1. Verify stock availability accounting for quantities already in existingSale
    for (const item of params.items) {
      const prod = this.getProductById(item.productId);
      if (!prod) throw new Error(`المنتج ${item.productName} غير متوفر في النظام`);
      const oldItem = existingSale.items.find((oi) => oi.productId === item.productId);
      const oldQty = oldItem ? oldItem.quantity : 0;
      const availableWithOld = prod.currentStock + oldQty;
      if (item.quantity > availableWithOld) {
        throw new Error(
          `الكمية المطلوبة من (${prod.name}) غير متوفرة. المتوفر حالياً مع احتساب كمية الفاتورة السابقة: ${availableWithOld}`
        );
      }
    }

    const subtotal = params.items.reduce(
      (sum, i) => sum + (i.unitPrice * i.quantity - i.discount),
      0
    );
    const totalAmount = Math.max(0, subtotal - (params.discount || 0));

    let paidAmount = 0;
    let cashPaid = 0;

    for (const p of params.payments) {
      if (p.method !== 'deferred') {
        paidAmount += p.amount;
        if (p.method === 'cash') {
          cashPaid += p.amount;
        }
      }
    }

    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    // 2. Check credit limit if there is deferred debt
    if (remainingAmount > 0) {
      const customer = this.getCustomerById(params.customerId);
      if (customer && customer.creditLimit > 0) {
        const oldRemainingForThisCustomer =
          existingSale.customerId === params.customerId ? existingSale.remainingAmount : 0;
        const projectedBalance =
          customer.currentBalance - oldRemainingForThisCustomer + remainingAmount;
        if (projectedBalance > customer.creditLimit) {
          throw new Error(
            `تجاوز الحد الائتماني للعميل (${customer.name})! الرصيد المتوقع بعد التعديل: ${projectedBalance} د.ل أكبر من الحد الائتماني: ${customer.creditLimit} د.ل`
          );
        }
      }
    }

    // 3. Reconcile Inventory Transactions
    // 3a. Items removed from invoice -> return to stock
    for (const oldItem of existingSale.items) {
      const stillExists = params.items.some((ni) => ni.productId === oldItem.productId);
      if (!stillExists) {
        this.recordInventoryTransaction({
          productId: oldItem.productId,
          productName: oldItem.productName,
          sku: oldItem.sku,
          type: 'sale_return',
          quantityChange: oldItem.quantity,
          referenceType: 'sale',
          referenceId: existingSale.id,
          notes: `إرجاع صنف محذوف عند تعديل فاتورة ${existingSale.invoiceNumber}`,
          userId: params.user.id,
          userName: params.user.name,
        });
      }
    }

    // 3b. Items modified or newly added
    for (const newItem of params.items) {
      const oldItem = existingSale.items.find((oi) => oi.productId === newItem.productId);
      const oldQty = oldItem ? oldItem.quantity : 0;
      const qtyDiff = oldQty - newItem.quantity; // positive = return to stock, negative = deduct from stock
      if (qtyDiff !== 0) {
        this.recordInventoryTransaction({
          productId: newItem.productId,
          productName: newItem.productName,
          sku: newItem.sku,
          type: qtyDiff > 0 ? 'sale_return' : 'sale',
          quantityChange: qtyDiff,
          referenceType: 'sale',
          referenceId: existingSale.id,
          notes: `تعديل كمية صنف في فاتورة ${existingSale.invoiceNumber} (${oldQty} ← ${newItem.quantity})`,
          userId: params.user.id,
          userName: params.user.name,
        });
      }
    }

    // 4. Reconcile Customer Balance
    if (existingSale.customerId === params.customerId) {
      const debtDiff = remainingAmount - existingSale.remainingAmount;
      if (Math.abs(debtDiff) > 0.001) {
        this.adjustCustomerBalance(
          params.customerId,
          debtDiff,
          `فرق مديونية نتيجة تعديل الفاتورة ${existingSale.invoiceNumber}`,
          params.user
        );
      }
    } else {
      if (existingSale.remainingAmount > 0) {
        this.adjustCustomerBalance(
          existingSale.customerId,
          -existingSale.remainingAmount,
          `إلغاء مديونية فاتورة معدلة انتقلت لعميل آخر ${existingSale.invoiceNumber}`,
          params.user
        );
      }
      if (remainingAmount > 0) {
        this.adjustCustomerBalance(
          params.customerId,
          remainingAmount,
          `رصيد آجل من فاتورة معدلة ${existingSale.invoiceNumber}`,
          params.user
        );
      }
    }

    // 5. Reconcile Cash Drawer
    const oldCashPaid = existingSale.payments
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount, 0);
    const cashDiff = cashPaid - oldCashPaid;

    if (cashDiff > 0.001) {
      this.recordCashTransaction({
        type: 'in',
        category: 'مبيعات نقدية',
        amount: cashDiff,
        referenceType: 'sale',
        referenceId: existingSale.id,
        description: `فرق نقدي مقبوض من تعديل فاتورة ${existingSale.invoiceNumber} (${params.customerName})`,
        userId: params.user.id,
        userName: params.user.name,
      });
    } else if (cashDiff < -0.001) {
      this.recordCashTransaction({
        type: 'out',
        category: 'مرتجع نقدي',
        amount: Math.abs(cashDiff),
        referenceType: 'sale',
        referenceId: existingSale.id,
        description: `رد فرق نقدي من تعديل فاتورة ${existingSale.invoiceNumber} (${params.customerName})`,
        userId: params.user.id,
        userName: params.user.name,
      });
    }

    let mainPaymentMethod: Sale['paymentMethod'] = 'cash';
    if (params.payments.length > 1) {
      mainPaymentMethod = 'mixed';
    } else if (params.payments.length === 1) {
      mainPaymentMethod = params.payments[0].method;
    }

    const updatedItems = params.items.map((i, idx) => ({
      id: `si-${existingSale.id}-${idx}-${Date.now()}`,
      saleId: existingSale.id,
      productId: i.productId,
      productName: i.productName,
      sku: i.sku,
      oemNumber: i.oemNumber,
      brand: i.brand,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      purchasePrice: i.purchasePrice,
      discount: i.discount,
      totalPrice: i.unitPrice * i.quantity - i.discount,
    }));

    const updatedSale: Sale = {
      ...existingSale,
      customerId: params.customerId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      subtotal,
      discount: params.discount || 0,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentMethod: mainPaymentMethod,
      payments: params.payments,
      notes: params.notes,
      items: updatedItems,
    };

    this.sales[saleIndex] = updatedSale;
    this.persist(STORAGE_KEYS.SALES, this.sales);
    this.logAudit(
      params.user,
      'تعديل فاتورة مبيعات',
      'Sale',
      updatedSale.id,
      `تعديل الفاتورة ${updatedSale.invoiceNumber} - الإجمالي الجديد: ${updatedSale.totalAmount} د.ل (${updatedSale.customerName})`
    );
    this.enqueuePendingSync('تعديل فاتورة مبيعات', 'Sale', updatedSale.id, {
      invoiceNumber: updatedSale.invoiceNumber,
      customerName: updatedSale.customerName,
      totalAmount: updatedSale.totalAmount,
    });

    return updatedSale;
  }

  /**
   * Rule #5: Cancel / Void sale instead of hard delete
   */
  public voidSale(saleId: string, reason: string, user: AppUser): Sale {
    const sale = this.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('الفاتورة غير موجودة');
    if (sale.status === 'voided') throw new Error('الفاتورة ملغاة مسبقاً');

    // Revert inventory transactions
    for (const item of sale.items) {
      this.recordInventoryTransaction({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        type: 'sale_return',
        quantityChange: item.quantity,
        referenceType: 'sale',
        referenceId: sale.id,
        notes: `إلغاء فاتورة ${sale.invoiceNumber} - استرجاع للمخزون (السبب: ${reason})`,
        userId: user.id,
        userName: user.name,
      });
    }

    // Revert customer balance if there was debt
    if (sale.remainingAmount > 0) {
      this.adjustCustomerBalance(
        sale.customerId,
        -sale.remainingAmount,
        `إلغاء مديونية الفاتورة الملغاة ${sale.invoiceNumber}`,
        user
      );
    }

    // Revert cash transaction if cash was paid
    const cashPaid = sale.payments
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount, 0);

    if (cashPaid > 0) {
      this.recordCashTransaction({
        type: 'out',
        category: 'مرتجع نقدي',
        amount: cashPaid,
        referenceType: 'sale',
        referenceId: sale.id,
        description: `رد مبالغ نقدية لإلغاء فاتورة ${sale.invoiceNumber}`,
        userId: user.id,
        userName: user.name,
      });
    }

    sale.status = 'voided';
    sale.notes = `${sale.notes || ''} [تم الإلغاء بواسطة ${user.name}: ${reason}]`;

    this.persist(STORAGE_KEYS.SALES, this.sales);
    this.logAudit(user, 'إلغاء فاتورة مبيعات', 'Sale', sale.id, `إلغاء الفاتورة ${sale.invoiceNumber}. السبب: ${reason}`);

    return sale;
  }

  // =================== PURCHASES ===================
  public getPurchases(): Purchase[] {
    return [...this.purchases];
  }

  public createPurchase(params: {
    supplierId: string;
    supplierName: string;
    supplierInvoiceNumber: string;
    date?: string;
    items: Array<{
      productId: string;
      productName: string;
      sku: string;
      quantity: number;
      purchasePrice: number;
    }>;
    discount: number;
    shippingCost?: number;
    customsCost?: number;
    paidAmount: number;
    cashPaid?: number;
    bankPaid?: number;
    paymentMethod: 'cash' | 'bank_transfer' | 'deferred' | 'mixed';
    notes?: string;
    user: AppUser;
  }): Purchase {
    if (params.items.length === 0) throw new Error('لا توجد أصناف في فاتورة المشتريات');

    const subtotal = params.items.reduce((s, i) => s + i.purchasePrice * i.quantity, 0);
    const shipping = params.shippingCost || 0;
    const customs = params.customsCost || 0;
    const totalAmount = Math.max(0, subtotal - (params.discount || 0) + shipping + customs);
    const cashAmount =
      params.cashPaid !== undefined
        ? params.cashPaid
        : params.paymentMethod === 'cash'
        ? params.paidAmount
        : 0;
    const bankAmount =
      params.bankPaid !== undefined
        ? params.bankPaid
        : params.paymentMethod === 'bank_transfer'
        ? params.paidAmount
        : 0;
    const totalPaid = params.paidAmount !== undefined ? params.paidAmount : cashAmount + bankAmount;
    const remainingAmount = Math.max(0, totalAmount - totalPaid);

    const purchaseNumber = `PO-${new Date().getFullYear()}-${String(this.purchases.length + 1).padStart(3, '0')}`;
    const purchaseId = `purch-${Date.now()}`;

    const purchaseItems = params.items.map((i, idx) => ({
      id: `pi-${purchaseId}-${idx}`,
      purchaseId,
      productId: i.productId,
      productName: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      purchasePrice: i.purchasePrice,
      totalPrice: i.quantity * i.purchasePrice,
    }));

    const purchase: Purchase = {
      id: purchaseId,
      purchaseNumber,
      supplierInvoiceNumber: params.supplierInvoiceNumber,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      date: params.date || new Date().toISOString(),
      subtotal,
      discount: params.discount || 0,
      shippingCost: shipping,
      customsCost: customs,
      totalAmount,
      paidAmount: totalPaid,
      cashPaid: cashAmount,
      bankPaid: bankAmount,
      remainingAmount,
      paymentMethod: params.paymentMethod,
      status: 'received',
      notes: params.notes,
      items: purchaseItems,
      createdAt: new Date().toISOString(),
    };

    this.purchases.unshift(purchase);

    // Increase stock automatically via inventory transactions
    for (const item of purchase.items) {
      this.recordInventoryTransaction({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        type: 'purchase',
        quantityChange: item.quantity,
        referenceType: 'purchase',
        referenceId: purchase.id,
        notes: `توريد مشتريات أمر شراء ${purchase.purchaseNumber} من ${purchase.supplierName}`,
        userId: params.user.id,
        userName: params.user.name,
      });

      // Update product's purchase price to latest purchase price
      const prod = this.getProductById(item.productId);
      if (prod && prod.purchasePrice !== item.purchasePrice) {
        prod.purchasePrice = item.purchasePrice;
        prod.updatedAt = new Date().toISOString();
      }
    }

    // Update supplier balance (Rule #4)
    if (remainingAmount > 0) {
      this.adjustSupplierBalance(
        params.supplierId,
        remainingAmount,
        `مستحقات شراء فاتورة ${purchase.purchaseNumber}`,
        params.user
      );
    }

    // Record cash drawer entry if cash was paid
    if (cashAmount > 0) {
      this.recordCashTransaction({
        type: 'out',
        category: 'سداد مورد',
        amount: cashAmount,
        referenceType: 'purchase',
        referenceId: purchase.id,
        description: `دفعة نقدية لشراء بضاعة فاتورة ${purchase.purchaseNumber} (${purchase.supplierName})`,
        userId: params.user.id,
        userName: params.user.name,
      });
    }

    this.persist(STORAGE_KEYS.PURCHASES, this.purchases);
    this.logAudit(
      params.user,
      'تسجيل فاتورة مشتريات',
      'Purchase',
      purchase.id,
      `فاتورة توريد ${purchase.purchaseNumber} بقيمة ${purchase.totalAmount} د.ل من ${purchase.supplierName}`
    );
    this.enqueuePendingSync('تسجيل فاتورة مشتريات', 'Purchase', purchase.id, {
      purchaseNumber: purchase.purchaseNumber,
      supplierName: purchase.supplierName,
      totalAmount: purchase.totalAmount,
    });

    return purchase;
  }

  public updatePurchase(
    purchaseId: string,
    params: {
      supplierId: string;
      supplierName: string;
      supplierInvoiceNumber: string;
      date?: string;
      items: Array<{
        productId: string;
        productName: string;
        sku: string;
        quantity: number;
        purchasePrice: number;
      }>;
      discount: number;
      shippingCost?: number;
      customsCost?: number;
      paidAmount: number;
      cashPaid?: number;
      bankPaid?: number;
      paymentMethod: 'cash' | 'bank_transfer' | 'deferred' | 'mixed';
      notes?: string;
      user: AppUser;
    }
  ): Purchase {
    const pIndex = this.purchases.findIndex((p) => p.id === purchaseId);
    if (pIndex === -1) throw new Error('فاتورة المشتريات غير موجودة');
    const existing = this.purchases[pIndex];

    if (params.items.length === 0) throw new Error('لا توجد أصناف في فاتورة المشتريات');

    const subtotal = params.items.reduce((s, i) => s + i.purchasePrice * i.quantity, 0);
    const shipping = params.shippingCost || 0;
    const customs = params.customsCost || 0;
    const totalAmount = Math.max(0, subtotal - (params.discount || 0) + shipping + customs);

    const cashAmount =
      params.cashPaid !== undefined
        ? params.cashPaid
        : params.paymentMethod === 'cash'
        ? params.paidAmount
        : 0;
    const bankAmount =
      params.bankPaid !== undefined
        ? params.bankPaid
        : params.paymentMethod === 'bank_transfer'
        ? params.paidAmount
        : 0;
    const totalPaid = params.paidAmount !== undefined ? params.paidAmount : cashAmount + bankAmount;
    const remainingAmount = Math.max(0, totalAmount - totalPaid);

    // 1. Reconcile Inventory
    for (const oldItem of existing.items) {
      const stillIn = params.items.some((ni) => ni.productId === oldItem.productId);
      if (!stillIn) {
        this.recordInventoryTransaction({
          productId: oldItem.productId,
          productName: oldItem.productName,
          sku: oldItem.sku,
          type: 'purchase_return',
          quantityChange: -oldItem.quantity,
          referenceType: 'purchase',
          referenceId: existing.id,
          notes: `حذف صنف عند تعديل فاتورة شراء ${existing.purchaseNumber}`,
          userId: params.user.id,
          userName: params.user.name,
        });
      }
    }

    for (const newItem of params.items) {
      const oldItem = existing.items.find((oi) => oi.productId === newItem.productId);
      const oldQty = oldItem ? oldItem.quantity : 0;
      const diff = newItem.quantity - oldQty;
      if (diff !== 0) {
        this.recordInventoryTransaction({
          productId: newItem.productId,
          productName: newItem.productName,
          sku: newItem.sku,
          type: diff > 0 ? 'purchase' : 'purchase_return',
          quantityChange: diff,
          referenceType: 'purchase',
          referenceId: existing.id,
          notes: `تعديل كمية توريد في فاتورة شراء ${existing.purchaseNumber} (${oldQty} ← ${newItem.quantity})`,
          userId: params.user.id,
          userName: params.user.name,
        });
      }
      const prod = this.getProductById(newItem.productId);
      if (prod && prod.purchasePrice !== newItem.purchasePrice) {
        prod.purchasePrice = newItem.purchasePrice;
        prod.updatedAt = new Date().toISOString();
      }
    }

    // 2. Reconcile Supplier Balance
    if (existing.supplierId === params.supplierId) {
      const debtDiff = remainingAmount - existing.remainingAmount;
      if (Math.abs(debtDiff) > 0.001) {
        this.adjustSupplierBalance(
          params.supplierId,
          debtDiff,
          `فرق مستحقات من تعديل فاتورة شراء ${existing.purchaseNumber}`,
          params.user
        );
      }
    } else {
      if (existing.remainingAmount > 0) {
        this.adjustSupplierBalance(
          existing.supplierId,
          -existing.remainingAmount,
          `إلغاء مستحقات فاتورة شراء معدلة ${existing.purchaseNumber}`,
          params.user
        );
      }
      if (remainingAmount > 0) {
        this.adjustSupplierBalance(
          params.supplierId,
          remainingAmount,
          `مستحقات فاتورة شراء معدلة ${existing.purchaseNumber}`,
          params.user
        );
      }
    }

    // 3. Reconcile Cash Drawer
    const oldCash =
      existing.cashPaid !== undefined
        ? existing.cashPaid
        : existing.paymentMethod === 'cash'
        ? existing.paidAmount
        : 0;
    const cashDiff = cashAmount - oldCash;
    if (cashDiff > 0.001) {
      this.recordCashTransaction({
        type: 'out',
        category: 'سداد مورد',
        amount: cashDiff,
        referenceType: 'purchase',
        referenceId: existing.id,
        description: `فرق دفعة نقدية من تعديل فاتورة شراء ${existing.purchaseNumber}`,
        userId: params.user.id,
        userName: params.user.name,
      });
    } else if (cashDiff < -0.001) {
      this.recordCashTransaction({
        type: 'in',
        category: 'إيداع',
        amount: Math.abs(cashDiff),
        referenceType: 'purchase',
        referenceId: existing.id,
        description: `استرداد فرق نقدي من تعديل فاتورة شراء ${existing.purchaseNumber}`,
        userId: params.user.id,
        userName: params.user.name,
      });
    }

    const updatedItems = params.items.map((i, idx) => ({
      id: `pi-${existing.id}-${idx}-${Date.now()}`,
      purchaseId: existing.id,
      productId: i.productId,
      productName: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      purchasePrice: i.purchasePrice,
      totalPrice: i.quantity * i.purchasePrice,
    }));

    const updatedPurchase: Purchase = {
      ...existing,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      supplierInvoiceNumber: params.supplierInvoiceNumber,
      date: params.date || existing.date,
      subtotal,
      discount: params.discount || 0,
      shippingCost: shipping,
      customsCost: customs,
      totalAmount,
      paidAmount: totalPaid,
      cashPaid: cashAmount,
      bankPaid: bankAmount,
      remainingAmount,
      paymentMethod: params.paymentMethod,
      notes: params.notes,
      items: updatedItems,
    };

    this.purchases[pIndex] = updatedPurchase;
    this.persist(STORAGE_KEYS.PURCHASES, this.purchases);
    this.logAudit(
      params.user,
      'تعديل فاتورة مشتريات',
      'Purchase',
      updatedPurchase.id,
      `تعديل فاتورة شراء ${updatedPurchase.purchaseNumber} - الإجمالي الجديد: ${updatedPurchase.totalAmount} د.ل`
    );

    return updatedPurchase;
  }

  // =================== CUSTOMERS & DEBT PAYMENTS ===================
  public getCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  public addCustomer(data: Omit<Customer, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>, user: AppUser): Customer {
    const id = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...data,
      id,
      currentBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.customers.push(newCustomer);
    this.persist(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.logAudit(user, 'إضافة عميل', 'Customer', id, `إضافة العميل: ${newCustomer.name} (${newCustomer.customerType})`);
    return newCustomer;
  }

  public updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'currentBalance' | 'createdAt'>>, user: AppUser): Customer {
    const cust = this.customers.find((c) => c.id === id);
    if (!cust) throw new Error('العميل غير موجود');
    const prev = { ...cust };
    Object.assign(cust, updates, { updatedAt: new Date().toISOString() });
    this.persist(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.logAudit(user, 'تعديل بيانات عميل', 'Customer', id, `تعديل بيانات ${cust.name}`, prev, cust);
    return cust;
  }

  /**
   * Rule #3: Customer balance changes through invoices, payments, and returns ONLY.
   */
  public adjustCustomerBalance(customerId: string, delta: number, reason: string, user: AppUser) {
    const cust = this.customers.find((c) => c.id === customerId);
    if (!cust) return;
    const oldBalance = cust.currentBalance;
    cust.currentBalance = Math.round((cust.currentBalance + delta) * 100) / 100;
    cust.updatedAt = new Date().toISOString();
    this.persist(STORAGE_KEYS.CUSTOMERS, this.customers);
    this.logAudit(
      user,
      'تحديث رصيد عميل',
      'Customer',
      customerId,
      `${reason}: الرصيد السابق ${oldBalance} د.ل -> الجديد ${cust.currentBalance} د.ل (التغير: ${delta > 0 ? '+' : ''}${delta})`
    );
  }

  public getCustomerPayments(customerId?: string): CustomerPayment[] {
    if (customerId) {
      return this.customerPayments.filter((p) => p.customerId === customerId);
    }
    return [...this.customerPayments];
  }

  public recordCustomerPayment(params: {
    customerId: string;
    amount: number;
    paymentMethod: CustomerPayment['paymentMethod'];
    referenceNumber?: string;
    notes?: string;
    user: AppUser;
  }): CustomerPayment {
    const cust = this.getCustomerById(params.customerId);
    if (!cust) throw new Error('العميل غير موجود');
    if (params.amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

    const payment: CustomerPayment = {
      id: `cpay-${Date.now()}`,
      customerId: params.customerId,
      customerName: cust.name,
      amount: params.amount,
      date: new Date().toISOString(),
      paymentMethod: params.paymentMethod,
      referenceNumber: params.referenceNumber,
      notes: params.notes,
      userId: params.user.id,
      userName: params.user.name,
      createdAt: new Date().toISOString(),
    };

    this.customerPayments.unshift(payment);

    // Reduce debt
    this.adjustCustomerBalance(
      params.customerId,
      -params.amount,
      `تسديد دفعة مالية (${params.paymentMethod}) برقم وصل ${payment.id}`,
      params.user
    );

    // If paid cash, add to cash drawer
    if (params.paymentMethod === 'cash') {
      this.recordCashTransaction({
        type: 'in',
        category: 'تحصيل عميل',
        amount: params.amount,
        referenceType: 'customer_payment',
        referenceId: payment.id,
        description: `سداد دين من العميل ${cust.name}`,
        userId: params.user.id,
        userName: params.user.name,
      });
    }

    this.persist(STORAGE_KEYS.CUSTOMER_PAYMENTS, this.customerPayments);
    this.logAudit(
      params.user,
      'تسديد دين عميل',
      'CustomerPayment',
      payment.id,
      `استلام دفعة بقيمة ${payment.amount} د.ل من العميل ${cust.name}`
    );
    this.enqueuePendingSync('تسديد دين عميل', 'CustomerPayment', payment.id, {
      customerName: cust.name,
      amount: payment.amount,
      method: payment.paymentMethod,
    });

    return payment;
  }

  // =================== SUPPLIERS & SUPPLIER PAYMENTS ===================
  public getSuppliers(): Supplier[] {
    return [...this.suppliers];
  }

  public getSupplierById(id: string): Supplier | undefined {
    return this.suppliers.find((s) => s.id === id);
  }

  public addSupplier(data: Omit<Supplier, 'id' | 'balance' | 'createdAt' | 'updatedAt'>, user: AppUser): Supplier {
    const id = `supp-${Date.now()}`;
    const newSupplier: Supplier = {
      ...data,
      id,
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.suppliers.push(newSupplier);
    this.persist(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    this.logAudit(user, 'إضافة مورد جديد', 'Supplier', id, `إضافة المورد ${newSupplier.name}`);
    return newSupplier;
  }

  public updateSupplier(id: string, updates: Partial<Omit<Supplier, 'id' | 'balance' | 'createdAt'>>, user: AppUser): Supplier {
    const supp = this.suppliers.find((s) => s.id === id);
    if (!supp) throw new Error('المورد غير موجود');
    const prev = { ...supp };
    Object.assign(supp, updates, { updatedAt: new Date().toISOString() });
    this.persist(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    this.logAudit(user, 'تعديل بيانات مورد', 'Supplier', id, `تعديل المورد ${supp.name}`, prev, supp);
    return supp;
  }

  /**
   * Rule #4: Supplier balance changes through purchases, payments, and returns ONLY.
   */
  public adjustSupplierBalance(supplierId: string, delta: number, reason: string, user: AppUser) {
    const supp = this.suppliers.find((s) => s.id === supplierId);
    if (!supp) return;
    const oldBalance = supp.balance;
    supp.balance = Math.round((supp.balance + delta) * 100) / 100;
    supp.updatedAt = new Date().toISOString();
    this.persist(STORAGE_KEYS.SUPPLIERS, this.suppliers);
    this.logAudit(
      user,
      'تحديث رصيد مورد',
      'Supplier',
      supplierId,
      `${reason}: الرصيد السابق ${oldBalance} د.ل -> الجديد ${supp.balance} د.ل (التغير: ${delta > 0 ? '+' : ''}${delta})`
    );
  }

  public getSupplierPayments(supplierId?: string): SupplierPayment[] {
    if (supplierId) {
      return this.supplierPayments.filter((p) => p.supplierId === supplierId);
    }
    return [...this.supplierPayments];
  }

  public recordSupplierPayment(params: {
    supplierId: string;
    amount: number;
    paymentMethod: SupplierPayment['paymentMethod'];
    referenceNumber?: string;
    notes?: string;
    user: AppUser;
  }): SupplierPayment {
    const supp = this.getSupplierById(params.supplierId);
    if (!supp) throw new Error('المورد غير موجود');
    if (params.amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

    const payment: SupplierPayment = {
      id: `spay-${Date.now()}`,
      supplierId: params.supplierId,
      supplierName: supp.name,
      amount: params.amount,
      date: new Date().toISOString(),
      paymentMethod: params.paymentMethod,
      referenceNumber: params.referenceNumber,
      notes: params.notes,
      userId: params.user.id,
      userName: params.user.name,
      createdAt: new Date().toISOString(),
    };

    this.supplierPayments.unshift(payment);

    // Reduce debt we owe to supplier
    this.adjustSupplierBalance(
      params.supplierId,
      -params.amount,
      `سداد دفعة للمورد (${params.paymentMethod}) وصل رقم ${payment.id}`,
      params.user
    );

    // If paid in cash, record in drawer
    if (params.paymentMethod === 'cash') {
      this.recordCashTransaction({
        type: 'out',
        category: 'سداد مورد',
        amount: params.amount,
        referenceType: 'supplier_payment',
        referenceId: payment.id,
        description: `سداد نقدي للمورد ${supp.name}`,
        userId: params.user.id,
        userName: params.user.name,
      });
    }

    this.persist(STORAGE_KEYS.SUPPLIER_PAYMENTS, this.supplierPayments);
    this.logAudit(
      params.user,
      'سداد دفعة لمورد',
      'SupplierPayment',
      payment.id,
      `سداد دفعة بقيمة ${payment.amount} د.ل للمورد ${supp.name}`
    );
    this.enqueuePendingSync('سداد دفعة لمورد', 'SupplierPayment', payment.id, {
      supplierName: supp.name,
      amount: payment.amount,
      method: payment.paymentMethod,
    });

    return payment;
  }

  // =================== RETURNS ===================
  public getReturns(): ReturnRecord[] {
    return [...this.returns];
  }

  public createSaleReturn(params: {
    originalInvoiceId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      reason: string;
    }>;
    refundMethod: 'cash' | 'balance_credit';
    notes?: string;
    user: AppUser;
  }): ReturnRecord {
    const sale = this.getSaleById(params.originalInvoiceId);
    if (!sale) throw new Error('فاتورة المبيعات الأصلية غير موجودة');

    const returnNumber = `RET-SL-${Date.now().toString().slice(-6)}`;
    const returnId = `ret-${Date.now()}`;

    let totalAmount = 0;
    const returnItems = params.items.map((i, idx) => {
      const prod = this.getProductById(i.productId);
      const lineTotal = i.quantity * i.unitPrice;
      totalAmount += lineTotal;
      return {
        id: `ri-${returnId}-${idx}`,
        returnId,
        productId: i.productId,
        productName: prod ? prod.name : 'منتج غير معروف',
        sku: prod ? prod.sku : '',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: lineTotal,
        reason: i.reason,
      };
    });

    const returnRecord: ReturnRecord = {
      id: returnId,
      returnNumber,
      type: 'sale_return',
      originalInvoiceId: sale.id,
      originalInvoiceNumber: sale.invoiceNumber,
      partyId: sale.customerId,
      partyName: sale.customerName,
      date: new Date().toISOString(),
      totalAmount,
      refundMethod: params.refundMethod,
      items: returnItems,
      notes: params.notes,
      userId: params.user.id,
      userName: params.user.name,
      createdAt: new Date().toISOString(),
    };

    this.returns.unshift(returnRecord);

    // 1. Return stock back to inventory
    for (const item of returnItems) {
      this.recordInventoryTransaction({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        type: 'sale_return',
        quantityChange: item.quantity,
        referenceType: 'return',
        referenceId: returnRecord.id,
        notes: `مرتجع مبيعات فاتورة ${sale.invoiceNumber} - السبب: ${item.reason}`,
        userId: params.user.id,
        userName: params.user.name,
      });
    }

    // 2. Adjust customer balance or pay cash
    if (params.refundMethod === 'balance_credit') {
      this.adjustCustomerBalance(
        sale.customerId,
        -totalAmount,
        `خصم قيمة مرتجع مبيعات ${returnRecord.returnNumber}`,
        params.user
      );
    } else {
      // Cash refund from drawer
      this.recordCashTransaction({
        type: 'out',
        category: 'مرتجع نقدي',
        amount: totalAmount,
        referenceType: 'return',
        referenceId: returnRecord.id,
        description: `صرف نقدي لمرتجع مبيعات ${returnRecord.returnNumber} (${sale.customerName})`,
        userId: params.user.id,
        userName: params.user.name,
      });
    }

    this.persist(STORAGE_KEYS.RETURNS, this.returns);
    this.logAudit(
      params.user,
      'تسجيل مرتجع مبيعات',
      'Return',
      returnRecord.id,
      `مرتجع مبيعات ${returnRecord.returnNumber} بقيمة ${totalAmount} د.ل للفاتورة ${sale.invoiceNumber}`
    );
    this.enqueuePendingSync('تسجيل مرتجع مبيعات', 'ReturnRecord', returnRecord.id, {
      returnNumber: returnRecord.returnNumber,
      totalRefund: totalAmount,
    });

    return returnRecord;
  }

  // =================== STOCK COUNT (الجرد) ===================
  public getStockCounts(): StockCount[] {
    return [...this.stockCounts];
  }

  public createStockCount(user: AppUser, notes?: string): StockCount {
    const sessionNumber = `SC-${new Date().getFullYear()}-${String(this.stockCounts.length + 1).padStart(3, '0')}`;
    const id = `sc-${Date.now()}`;

    const items = this.products.map((p) => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      oemNumber: p.oemNumber,
      shelfLocation: p.shelfLocation,
      systemStock: p.currentStock,
      actualStock: p.currentStock, // starts matching, user edits
      difference: 0,
      unitCost: p.purchasePrice,
      differenceValue: 0,
      notes: '',
    }));

    const count: StockCount = {
      id,
      sessionNumber,
      date: new Date().toISOString(),
      status: 'draft',
      performedBy: user.name,
      totalDiscrepancyItems: 0,
      totalDiscrepancyValue: 0,
      notes,
      items,
      createdAt: new Date().toISOString(),
    };

    this.stockCounts.unshift(count);
    this.persist(STORAGE_KEYS.STOCK_COUNTS, this.stockCounts);
    this.logAudit(user, 'إنشاء جلسة جرد', 'StockCount', id, `بدء جلسة جرد جديدة ${sessionNumber}`);
    return count;
  }

  public updateStockCountItems(
    countId: string,
    items: StockCount['items'],
    user: AppUser
  ): StockCount {
    const count = this.stockCounts.find((c) => c.id === countId);
    if (!count) throw new Error('جلسة الجرد غير موجودة');
    if (count.status === 'approved') throw new Error('لا يمكن تعديل جلسة جرد تم اعتمادها');

    let discrepancyItems = 0;
    let discrepancyValue = 0;

    const updatedItems = items.map((i) => {
      const diff = i.actualStock - i.systemStock;
      const diffVal = diff * i.unitCost;
      if (diff !== 0) {
        discrepancyItems += Math.abs(diff);
        discrepancyValue += diffVal;
      }
      return {
        ...i,
        difference: diff,
        differenceValue: diffVal,
      };
    });

    count.items = updatedItems;
    count.totalDiscrepancyItems = discrepancyItems;
    count.totalDiscrepancyValue = discrepancyValue;

    this.persist(STORAGE_KEYS.STOCK_COUNTS, this.stockCounts);
    return count;
  }

  /**
   * Only Manager/Admin can approve stock count and post adjustments
   */
  public approveStockCount(countId: string, user: AppUser): StockCount {
    if (user.role !== 'admin' && user.role !== 'warehouse') {
      throw new Error('صلاحية اعتماد الجرد مخصصة للمدير أو مسؤول المستودع فقط');
    }

    const count = this.stockCounts.find((c) => c.id === countId);
    if (!count) throw new Error('جلسة الجرد غير موجودة');
    if (count.status === 'approved') throw new Error('الجلسة معتمدة بالفعل');

    // Post stock adjustment transactions for any difference
    for (const item of count.items) {
      if (item.difference !== 0) {
        this.recordInventoryTransaction({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          type: 'stock_adjustment',
          quantityChange: item.difference,
          referenceType: 'stock_count',
          referenceId: count.id,
          notes: `تسوية جرد دوري جلسة ${count.sessionNumber} (فارق: ${item.difference > 0 ? '+' : ''}${item.difference})`,
          userId: user.id,
          userName: user.name,
        });
      }
    }

    count.status = 'approved';
    count.approvedBy = user.name;

    this.persist(STORAGE_KEYS.STOCK_COUNTS, this.stockCounts);
    this.logAudit(
      user,
      'اعتماد جلسة جرد وتسوية المخزون',
      'StockCount',
      count.id,
      `اعتماد الجرد ${count.sessionNumber}. إجمالي الفروقات: ${count.totalDiscrepancyItems} قطعة بقيمة ${count.totalDiscrepancyValue} د.ل`
    );

    return count;
  }

  // =================== CASH MANAGEMENT ===================
  public getCashTransactions(): CashTransaction[] {
    return [...this.cashTx];
  }

  public recordCashTransaction(data: Omit<CashTransaction, 'id' | 'createdAt' | 'date'> & { date?: string }): CashTransaction {
    const tx: CashTransaction = {
      id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...data,
      date: data.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.cashTx.unshift(tx);
    this.persist(STORAGE_KEYS.CASH_TX, this.cashTx);
    return tx;
  }

  public getCashSummary(): CashDrawerSummary {
    let opening = 0;
    let totalIn = 0;
    let totalOut = 0;

    for (const tx of this.cashTx) {
      if (tx.category === 'رصيد افتتاحي') {
        opening += tx.amount;
      } else if (tx.type === 'in') {
        totalIn += tx.amount;
      } else if (tx.type === 'out') {
        totalOut += tx.amount;
      }
    }

    return {
      openingBalance: opening,
      totalCashIn: totalIn,
      totalCashOut: totalOut,
      expectedCurrentCash: opening + totalIn - totalOut,
    };
  }

  // =================== EXPENSES ===================
  public getExpenses(): Expense[] {
    return [...this.expenses];
  }

  public addExpense(params: Omit<Expense, 'id' | 'createdAt'>, user: AppUser): Expense {
    if (params.amount <= 0) throw new Error('قيمة المصروف يجب أن تكون أكبر من صفر');

    const exp: Expense = {
      id: `exp-${Date.now()}`,
      ...params,
      createdAt: new Date().toISOString(),
    };

    this.expenses.unshift(exp);

    // If paid by cash, deduct from cash transactions
    if (params.paymentMethod === 'cash') {
      this.recordCashTransaction({
        type: 'out',
        category: 'مصروفات',
        amount: params.amount,
        referenceType: 'expense',
        referenceId: exp.id,
        description: `صرف مصاريف: ${params.category} - ${params.notes || ''}`,
        userId: user.id,
        userName: user.name,
      });
    }

    this.persist(STORAGE_KEYS.EXPENSES, this.expenses);
    this.logAudit(user, 'تسجيل مصروف', 'Expense', exp.id, `تسجيل مصروف ${exp.category} بقيمة ${exp.amount} د.ل`);
    return exp;
  }

  // =================== IMPORT SHIPMENTS & LANDED COST ===================
  public getImportShipments(): ImportShipment[] {
    return [...this.shipments];
  }

  public createImportShipment(data: Omit<ImportShipment, 'id' | 'createdAt' | 'totalLandedCost'>, user: AppUser): ImportShipment {
    const totalExtraCosts = (data.shippingCost || 0) + (data.customsCost || 0) + (data.otherExpenses || 0);
    const totalGoods = data.goodsCost || 1;
    const totalLandedCost = totalGoods + totalExtraCosts;

    // Allocate landed costs proportionally to each item
    const allocatedItems = data.items.map((i) => {
      const itemRatio = (i.factoryPrice * i.quantity) / totalGoods;
      const allocShip = (data.shippingCost * itemRatio) / i.quantity;
      const allocCust = (data.customsCost * itemRatio) / i.quantity;
      const allocOth = (data.otherExpenses * itemRatio) / i.quantity;
      const unitLandedCost = i.factoryPrice + allocShip + allocCust + allocOth;

      return {
        ...i,
        allocatedShipping: Math.round(allocShip * 100) / 100,
        allocatedCustoms: Math.round(allocCust * 100) / 100,
        allocatedOther: Math.round(allocOth * 100) / 100,
        landedCost: Math.round(unitLandedCost * 100) / 100,
        totalCost: Math.round(unitLandedCost * i.quantity * 100) / 100,
      };
    });

    const shipment: ImportShipment = {
      id: `ship-${Date.now()}`,
      ...data,
      totalLandedCost,
      items: allocatedItems,
      createdAt: new Date().toISOString(),
    };

    this.shipments.unshift(shipment);
    this.persist(STORAGE_KEYS.SHIPMENTS, this.shipments);
    this.logAudit(
      user,
      'إنشاء شحنة استيراد',
      'ImportShipment',
      shipment.id,
      `شحنة استيراد ${shipment.shipmentNumber} من ${shipment.originCountry} بتكلفة إجمالية ${shipment.totalLandedCost} د.ل`
    );

    return shipment;
  }

  // =================== VEHICLES ===================
  public getVehicleMakes(): VehicleMake[] {
    return [...this.vehicleMakes];
  }

  public getVehicleModels(makeId?: string): VehicleModel[] {
    if (makeId) {
      return this.vehicleModels.filter((m) => m.makeId === makeId);
    }
    return [...this.vehicleModels];
  }

  public addVehicleMake(name: string, country?: string): VehicleMake {
    const make: VehicleMake = {
      id: `make-${Date.now()}`,
      name,
      country,
    };
    this.vehicleMakes.push(make);
    this.persist(STORAGE_KEYS.VEHICLE_MAKES, this.vehicleMakes);
    return make;
  }

  public addVehicleModel(makeId: string, makeName: string, name: string): VehicleModel {
    const model: VehicleModel = {
      id: `mod-${Date.now()}`,
      makeId,
      makeName,
      name,
    };
    this.vehicleModels.push(model);
    this.persist(STORAGE_KEYS.VEHICLE_MODELS, this.vehicleModels);
    return model;
  }

  // =================== AUDIT LOGS ===================
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // =================== SHOP SETTINGS ===================
  public getShopSettings(): ShopSettings {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOP_SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback to default
      }
    }
    return {
      shopName: 'محل السلام لقطع غيار السيارات',
      phone: '091-2345678',
      address: 'شارع الصناعية - قرب جزيرة الفرناج',
      city: 'طرابلس',
      commercialReg: 'LY-2024-88910',
      invoiceFooter: 'القطع الكهربائية لا ترد ولا تستبدل بعد التركيب · القطع الميكانيكية تستبدل خلال 3 أيام مع إحضار الفاتورة وحالتها الأصلية',
      currency: 'د.ل',
      defaultPrintFormat: 'thermal',
    };
  }

  public updateShopSettings(settings: ShopSettings, user: AppUser): ShopSettings {
    localStorage.setItem(STORAGE_KEYS.SHOP_SETTINGS, JSON.stringify(settings));
    this.logAudit(user, 'تحديث إعدادات المحل', 'ShopSettings', 'shop-1', `تحديث بيانات المحل: ${settings.shopName}`);
    this.enqueuePendingSync('تحديث إعدادات المحل', 'ShopSettings', 'shop-1', settings);
    return settings;
  }

  // =================== HYBRID OFFLINE & SYNC ENGINE ===================
  public enqueuePendingSync(action: string, entityType: string, entityId: string, data?: any) {
    const item: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    this.pendingSyncQueue.unshift(item);
    if (this.pendingSyncQueue.length > 200) {
      this.pendingSyncQueue = this.pendingSyncQueue.slice(0, 200);
    }
    this.persist(STORAGE_KEYS.PENDING_SYNC, this.pendingSyncQueue);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('almadar_sync_change', { detail: { count: this.getPendingSyncCount() } }));
    }
  }

  public getPendingSyncQueue(): SyncQueueItem[] {
    return [...this.pendingSyncQueue];
  }

  public getPendingSyncCount(): number {
    return this.pendingSyncQueue.filter((q) => q.status === 'pending' || q.status === 'failed').length;
  }

  public clearSyncedItems() {
    this.pendingSyncQueue = this.pendingSyncQueue.filter((q) => q.status !== 'synced');
    this.persist(STORAGE_KEYS.PENDING_SYNC, this.pendingSyncQueue);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('almadar_sync_change', { detail: { count: this.getPendingSyncCount() } }));
    }
  }

  public isSimulatedOffline(): boolean {
    return this.simulatedOffline;
  }

  public toggleSimulatedOffline(): boolean {
    this.simulatedOffline = !this.simulatedOffline;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SIMULATED_OFFLINE, this.simulatedOffline ? 'true' : 'false');
      window.dispatchEvent(
        new CustomEvent('almadar_connectivity_change', { detail: { isSimulatedOffline: this.simulatedOffline } })
      );
    }
    return this.simulatedOffline;
  }

  public getHybridSyncStatus(): HybridSyncStatus {
    const isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const isOnline = isBrowserOnline && !this.simulatedOffline;
    const pendingCount = this.getPendingSyncCount();
    const lastSync = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME) : null;
    const totalRecords =
      this.products.length +
      this.sales.length +
      this.purchases.length +
      this.customers.length +
      this.suppliers.length +
      this.inventoryTx.length +
      this.cashTx.length +
      this.expenses.length;

    let syncEngineStatus: HybridSyncStatus['syncEngineStatus'] = 'idle';
    if (!isOnline) {
      syncEngineStatus = 'offline';
    } else if (pendingCount > 0) {
      syncEngineStatus = 'idle';
    }

    return {
      isOnline,
      isSimulatedOffline: this.simulatedOffline,
      pendingCount,
      lastSyncTime: lastSync,
      totalLocalRecords: totalRecords,
      syncEngineStatus,
    };
  }

  public async triggerSync(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    const isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (this.simulatedOffline || !isBrowserOnline) {
      return {
        success: false,
        syncedCount: 0,
        message: 'النظام حالياً في وضع عدم الاتصال (Offline) - البيانات محفوظة محلياً بالكامل ومستقرة',
      };
    }

    const pending = this.pendingSyncQueue.filter((q) => q.status === 'pending' || q.status === 'failed');
    if (pending.length === 0) {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, now);
      return {
        success: true,
        syncedCount: 0,
        message: 'جميع الحركات المحلية متزامنة مع السحابة المركزية ولا توجد عمليات معلقة',
      };
    }

    // Process pending items
    for (const item of pending) {
      item.status = 'syncing';
    }
    this.persist(STORAGE_KEYS.PENDING_SYNC, this.pendingSyncQueue);

    // Simulated network transmission / remote sync
    await new Promise((r) => setTimeout(r, 650));

    for (const item of pending) {
      item.status = 'synced';
    }
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, now);
    this.persist(STORAGE_KEYS.PENDING_SYNC, this.pendingSyncQueue);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('almadar_sync_change', { detail: { count: 0 } }));
    }

    return {
      success: true,
      syncedCount: pending.length,
      message: `تمت مزامنة (${pending.length}) حركة محلية بنجاح مع الخادم السحابي`,
    };
  }

  public exportDatabaseBackup(): string {
    const backup = {
      app: 'Almadar Auto Parts ERP - Libya',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shopSettings: this.getShopSettings(),
      products: this.products,
      customers: this.customers,
      suppliers: this.suppliers,
      sales: this.sales,
      purchases: this.purchases,
      inventoryTx: this.inventoryTx,
      stockCounts: this.stockCounts,
      customerPayments: this.customerPayments,
      supplierPayments: this.supplierPayments,
      expenses: this.expenses,
      returns: this.returns,
      shipments: this.shipments,
      cashTx: this.cashTx,
      auditLogs: this.auditLogs,
      vehicleMakes: this.vehicleMakes,
      vehicleModels: this.vehicleModels,
    };
    return JSON.stringify(backup, null, 2);
  }

  public importDatabaseBackup(backupJson: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(backupJson);
      if (!data.products && !data.sales) {
        return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو تالف' };
      }

      if (Array.isArray(data.products)) this.products = data.products;
      if (Array.isArray(data.customers)) this.customers = data.customers;
      if (Array.isArray(data.suppliers)) this.suppliers = data.suppliers;
      if (Array.isArray(data.sales)) this.sales = data.sales;
      if (Array.isArray(data.purchases)) this.purchases = data.purchases;
      if (Array.isArray(data.inventoryTx)) this.inventoryTx = data.inventoryTx;
      if (Array.isArray(data.stockCounts)) this.stockCounts = data.stockCounts;
      if (Array.isArray(data.customerPayments)) this.customerPayments = data.customerPayments;
      if (Array.isArray(data.supplierPayments)) this.supplierPayments = data.supplierPayments;
      if (Array.isArray(data.expenses)) this.expenses = data.expenses;
      if (Array.isArray(data.returns)) this.returns = data.returns;
      if (Array.isArray(data.shipments)) this.shipments = data.shipments;
      if (Array.isArray(data.cashTx)) this.cashTx = data.cashTx;
      if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
      if (Array.isArray(data.vehicleMakes)) this.vehicleMakes = data.vehicleMakes;
      if (Array.isArray(data.vehicleModels)) this.vehicleModels = data.vehicleModels;

      if (data.shopSettings) {
        localStorage.setItem(STORAGE_KEYS.SHOP_SETTINGS, JSON.stringify(data.shopSettings));
      }

      this.persistAll();
      return { success: true, message: 'تم استرجاع النسخة الاحتياطية بنجاح وتحديث كافة السجلات' };
    } catch (err: any) {
      return { success: false, message: err.message || 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية' };
    }
  }

  // =================== RESET / SEED / CLEAR ALL DATA ===================
  public resetToDemoData() {
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    localStorage.removeItem(STORAGE_KEYS.SHOP_SETTINGS);
    this.init();
  }

  public clearAllData(options?: { keepCatalogAndParties?: boolean }, user?: AppUser) {
    if (options?.keepCatalogAndParties) {
      this.products = this.products.map((p) => ({
        ...p,
        currentStock: 0,
        updatedAt: new Date().toISOString(),
      }));
      this.customers = this.customers.map((c) => ({
        ...c,
        currentBalance: 0,
        updatedAt: new Date().toISOString(),
      }));
      this.suppliers = this.suppliers.map((s) => ({
        ...s,
        balance: 0,
        updatedAt: new Date().toISOString(),
      }));
    } else {
      this.products = [];
      this.customers = [];
      this.suppliers = [];
      this.vehicleMakes = [];
      this.vehicleModels = [];
    }

    this.sales = [];
    this.purchases = [];
    this.inventoryTx = [];
    this.stockCounts = [];
    this.customerPayments = [];
    this.supplierPayments = [];
    this.expenses = [];
    this.returns = [];
    this.shipments = [];
    this.cashTx = [];
    this.auditLogs = [];
    this.pendingSyncQueue = [];

    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    this.persistAll();
    this.persist(STORAGE_KEYS.PENDING_SYNC, this.pendingSyncQueue);

    if (user) {
      this.logAudit(
        user,
        'حذف جميع البيانات (تصفير النظام)',
        'System',
        'CLEAR-ALL',
        options?.keepCatalogAndParties
          ? 'تم حذف جميع الفواتير والحركات المالية وتصفير الأرصدة مع الإبقاء على دليل الأصناف والعملاء'
          : 'تم حذف جميع بيانات المنظومة بالكامل (الأصناف، الفواتير، العملاء، الموردين، والحركات المالية)'
      );
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('almadar_sync_change', { detail: { count: 0 } }));
    }
  }
}

export const db = new LocalDbService();
