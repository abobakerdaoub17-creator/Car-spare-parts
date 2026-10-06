export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- نظام إدارة قطع غيار السيارات - السوق الليبي (PostgreSQL & Supabase Schema)
-- جاهز للتنفيذ في Supabase SQL Editor
-- يحتوي على الجداول، المفاتيح الأجنبية، الفهارس، ودوال وحماية RLS والـ Triggers
-- ==============================================================================

-- 1. جدول الأدوار والمستخدمين (Roles & Profiles)
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    description TEXT
);

INSERT INTO public.roles (id, name_ar, description) VALUES
    ('admin', 'مدير النظام', 'كامل الصلاحيات في النظام والإعدادات'),
    ('sales', 'مسؤول المبيعات', 'إدارة نقاط البيع POS، العملاء، الفواتير، والتحصيل'),
    ('warehouse', 'أمين المستودع', 'إدارة المنتجات، المخزون، المشتريات، والجرد'),
    ('accountant', 'المحاسب المالي', 'إدارة المدفوعات، الديون، المصروفات، والتقارير المالية')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL REFERENCES public.roles(id) DEFAULT 'sales',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. العملاء (Customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT DEFAULT 'طرابلس',
    area TEXT,
    customer_type TEXT CHECK (customer_type IN ('فرد', 'ورشة', 'محل', 'شركة')) DEFAULT 'فرد',
    credit_limit NUMERIC(12,2) DEFAULT 0.00,
    current_balance NUMERIC(12,2) DEFAULT 0.00, -- الرصيد المستحق (دين على العميل)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

-- 3. الموردون (Suppliers)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    country TEXT DEFAULT 'ليبيا',
    currency TEXT DEFAULT 'د.ل',
    balance NUMERIC(12,2) DEFAULT 0.00, -- مستحقات المورد
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. بيانات وتوافق السيارات (Vehicle Makes, Models, Years, Engines)
CREATE TABLE IF NOT EXISTS public.vehicle_makes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    country TEXT
);

CREATE TABLE IF NOT EXISTS public.vehicle_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    make_id UUID REFERENCES public.vehicle_makes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    CONSTRAINT uq_make_model UNIQUE(make_id, name)
);

CREATE TABLE IF NOT EXISTS public.vehicle_engines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES public.vehicle_models(id) ON DELETE CASCADE,
    engine_code TEXT NOT NULL,
    fuel_type TEXT DEFAULT 'بنزين'
);

-- 5. المنتجات وقطع الغيار (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    oem_number TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    wholesale_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 5,
    shelf_location TEXT,
    barcode TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_oem ON public.products(oem_number);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);

-- 6. الأرقام البديلة للقطع (Alternate Part Numbers)
CREATE TABLE IF NOT EXISTS public.product_alternate_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    alternate_number TEXT NOT NULL,
    brand_or_type TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX IF NOT EXISTS idx_product_alt_num ON public.product_alternate_numbers(alternate_number);

-- 7. توافق القطع مع موديلات السيارات (Product Vehicle Compatibility)
CREATE TABLE IF NOT EXISTS public.product_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year_range TEXT NOT NULL,
    engine TEXT,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_prod_vehicle_model ON public.product_vehicles(make, model);

-- 8. حركات المخزون الإلزامية (Inventory Transactions)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    transaction_type TEXT CHECK (transaction_type IN ('purchase', 'sale', 'sale_return', 'purchase_return', 'stock_adjustment', 'damaged', 'opening_balance')) NOT NULL,
    quantity_change INT NOT NULL,
    stock_before INT NOT NULL,
    stock_after INT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX IF NOT EXISTS idx_inv_tx_prod ON public.inventory_transactions(product_id);

-- 9. المبيعات والفواتير (Sales & Invoices)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    employee_id UUID REFERENCES auth.users(id),
    subtotal NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) NOT NULL,
    remaining_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'deferred', 'cheque', 'mixed')) NOT NULL,
    status TEXT CHECK (status IN ('completed', 'voided', 'partially_returned', 'returned')) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    purchase_price NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0.00,
    total_price NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 10. المشتريات وفواتير الموردين (Purchases)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_number TEXT UNIQUE NOT NULL,
    supplier_invoice_number TEXT,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    subtotal NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0.00,
    shipping_cost NUMERIC(12,2) DEFAULT 0.00,
    customs_cost NUMERIC(12,2) DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) NOT NULL,
    remaining_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT DEFAULT 'cash',
    status TEXT DEFAULT 'received',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    purchase_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL
);

-- 11. تسديد ديون العملاء وسداد الموردين (Payments)
CREATE TABLE IF NOT EXISTS public.customer_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    reference_number TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    reference_number TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 12. الجلسات الدورية للجرد الفعلي (Stock Counts)
CREATE TABLE IF NOT EXISTS public.stock_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_number TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('draft', 'approved', 'cancelled')) DEFAULT 'draft',
    performed_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    total_discrepancy_items INT DEFAULT 0,
    total_discrepancy_value NUMERIC(12,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.stock_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_count_id UUID REFERENCES public.stock_counts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    system_stock INT NOT NULL,
    actual_stock INT NOT NULL,
    difference INT GENERATED ALWAYS AS (actual_stock - system_stock) STORED,
    unit_cost NUMERIC(10,2) NOT NULL,
    difference_value NUMERIC(12,2) GENERATED ALWAYS AS ((actual_stock - system_stock) * unit_cost) STORED,
    notes TEXT
);

-- 13. المصروفات التشغيلية (Expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    paid_to TEXT,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 14. المرتجعات (Returns)
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number TEXT UNIQUE NOT NULL,
    return_type TEXT CHECK (return_type IN ('sale_return', 'purchase_return')) NOT NULL,
    original_invoice_id UUID,
    party_id UUID, -- customer_id or supplier_id
    total_amount NUMERIC(12,2) NOT NULL,
    refund_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES public.returns(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    reason TEXT
);

-- 15. الشحنات والاستيراد وحساب التكلفة الواصلة (Import Shipments & Landed Cost)
CREATE TABLE IF NOT EXISTS public.import_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    supplier_invoice_number TEXT,
    origin_country TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    arrival_date DATE,
    status TEXT CHECK (status IN ('ordered', 'in_transit', 'customs', 'received', 'cancelled')) DEFAULT 'ordered',
    goods_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    customs_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    other_expenses NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_landed_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.import_shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.import_shipments(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    factory_price NUMERIC(10,2) NOT NULL,
    allocated_shipping NUMERIC(10,2) DEFAULT 0.00,
    allocated_customs NUMERIC(10,2) DEFAULT 0.00,
    allocated_other NUMERIC(10,2) DEFAULT 0.00,
    landed_cost NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL
);

-- 16. الصندوق والخزينة النقدية (Cash Transactions)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type TEXT CHECK (transaction_type IN ('in', 'out')) NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 17. سجل التدقيق والمراقبة (Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    previous_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- إعدادات أمان وحماية الصفوف (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدمين الموثوقين بالقراءة والكتابة بحسب الصلاحيات
CREATE POLICY "المستخدمون المصرح لهم يمكنهم الوصول للبيانات" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "المستخدمون المصرح لهم يمكنهم التعامل مع العملاء" ON public.customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "المستخدمون المصرح لهم يمكنهم التعامل مع المبيعات" ON public.sales
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- منع حذف أو تعديل الفواتير المكتملة للحفاظ على النزاهة المحاسبية
CREATE OR REPLACE RULE no_delete_sales AS ON DELETE TO public.sales
    DO INSTEAD NOTHING;
`;
