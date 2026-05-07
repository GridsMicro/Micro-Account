CREATE SCHEMA "public";
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY,
	"code" varchar(20) NOT NULL CONSTRAINT "accounts_code_key" UNIQUE,
	"name" varchar(255) NOT NULL,
	"category" varchar(50),
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "activity_log" (
	"id" serial PRIMARY KEY,
	"user_id" integer,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" inet,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY,
	"asset_number" varchar CONSTRAINT "assets_asset_number_key" UNIQUE,
	"name" varchar,
	"category" varchar,
	"description" varchar,
	"acquisition_date" varchar,
	"acquisition_cost" double precision,
	"current_value" double precision,
	"depreciation_method" varchar,
	"useful_life_years" integer,
	"accumulated_depreciation" double precision,
	"location" varchar,
	"status" varchar,
	"notes" varchar
);
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY,
	"timestamp" varchar,
	"user" varchar,
	"action" varchar,
	"detail" varchar
);
CREATE TABLE "bank_accounts" (
	"id" serial PRIMARY KEY,
	"bank_name" varchar,
	"account_number" varchar,
	"account_name" varchar,
	"branch" varchar,
	"is_default" boolean
);
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY,
	"product_id" integer,
	"user_id" integer,
	"qty" integer,
	"status" varchar,
	"booked_at" varchar,
	"expiry_at" varchar
);
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY,
	"name" varchar CONSTRAINT "categories_name_key" UNIQUE,
	"description" varchar,
	"type" varchar
);
CREATE TABLE "chart_of_accounts" (
	"id" integer PRIMARY KEY,
	"account_code" varchar(10) NOT NULL CONSTRAINT "chart_of_accounts_account_code_key" UNIQUE,
	"account_name_th" varchar(255) NOT NULL,
	"account_name_en" varchar(255),
	"account_type" varchar(20) NOT NULL,
	"account_category" varchar(50),
	"parent_id" integer,
	"is_active" boolean DEFAULT true,
	"is_contra" boolean DEFAULT false,
	"description" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"plan_type" varchar(50) DEFAULT 'FREE' NOT NULL,
	"max_users" integer DEFAULT 1 NOT NULL,
	"subscription_status" varchar(50) DEFAULT 'Active' NOT NULL,
	"expiry_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "company" (
	"id" serial PRIMARY KEY,
	"name" varchar,
	"tax_id" varchar,
	"address" varchar,
	"phone" varchar,
	"email" varchar,
	"logo_base64" varchar,
	"vat_rate" double precision,
	"withholding_tax_rate" double precision,
	"corporate_tax_rate" double precision,
	"tax_exemption_years" integer,
	"tax_reduction_years" integer,
	"tax_exemption_start_year" integer,
	"currency" varchar,
	"inv_prefix" varchar,
	"rec_prefix" varchar,
	"pay_prefix" varchar,
	"exp_prefix" varchar,
	"quo_prefix" varchar,
	"smtp_server" varchar,
	"smtp_port" integer,
	"smtp_user" varchar,
	"smtp_pass" varchar,
	"smtp_use_tls" boolean,
	"email_sender" varchar,
	"is_setup" boolean,
	"google_service_account_json" varchar,
	"google_authorized_email" varchar,
	"last_google_sync" varchar
);
CREATE TABLE "company_module_settings" (
	"company_id" integer,
	"module_id" varchar(100),
	"is_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_by" integer,
	CONSTRAINT "company_module_settings_pkey" PRIMARY KEY("company_id","module_id")
);
CREATE TABLE "company_settings" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"address" text,
	"tax_id" varchar(50),
	"phone" varchar(50),
	"email" varchar(255),
	"logo_url" text,
	"website" varchar(255),
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"bank_name" varchar(255),
	"bank_account_name" varchar(255),
	"bank_account_number" varchar(100),
	"bank_branch" varchar(255),
	"vat_rate" numeric(5, 2) DEFAULT '7.00',
	"withholding_tax_rate" numeric(5, 2) DEFAULT '3.00',
	"is_vat_registered" boolean DEFAULT true,
	"currency" varchar(10) DEFAULT 'THB',
	"invoice_prefix" varchar(20) DEFAULT 'INV',
	"quotation_prefix" varchar(20) DEFAULT 'QT',
	"google_client_id" varchar(255),
	"google_client_secret" varchar(255),
	"google_refresh_token" text,
	"google_redirect_uri" varchar(255) DEFAULT 'https://developers.google.com/oauthplayground',
	"google_drive_enabled" boolean DEFAULT false
);
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY,
	"name" varchar NOT NULL,
	"type" varchar,
	"tax_id" varchar,
	"address" varchar,
	"phone" varchar,
	"email" varchar,
	"contact_person" varchar,
	"is_active" boolean,
	"contact_type" varchar(20)
);
CREATE TABLE "document_patterns" (
	"id" serial PRIMARY KEY,
	"document_type" varchar(20) NOT NULL CONSTRAINT "document_patterns_document_type_key" UNIQUE,
	"prefix" varchar(20) NOT NULL,
	"include_year" boolean DEFAULT true,
	"include_month" boolean DEFAULT true,
	"separator" varchar(5) DEFAULT '-',
	"digits" integer DEFAULT 4,
	"last_number" integer DEFAULT 0,
	"current_pattern" varchar(50),
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY,
	"expense_number" varchar CONSTRAINT "expenses_expense_number_key" UNIQUE,
	"category" varchar,
	"description" varchar,
	"amount" double precision,
	"vat_amount" double precision,
	"withholding_tax_amount" double precision,
	"net_amount" double precision,
	"expense_date" date,
	"vendor" varchar,
	"wht_type" varchar,
	"payment_method" varchar,
	"receipt_base64" varchar,
	"tax_deductible" boolean,
	"notes" varchar,
	"status" varchar(50) DEFAULT 'paid',
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"tax_invoice_no" varchar(100),
	"tax_invoice_date" date,
	"contact_id" integer,
	"classification" varchar(20) DEFAULT 'OPEX' NOT NULL,
	"receipt_url" text,
	"receipt_file_name" varchar(255),
	"receipt_mime_type" varchar(100)
);
CREATE TABLE "group_permissions" (
	"id" serial PRIMARY KEY,
	"group_id" integer NOT NULL UNIQUE,
	"module" varchar(50) NOT NULL UNIQUE,
	"can_create" boolean DEFAULT false,
	"can_read" boolean DEFAULT false,
	"can_update" boolean DEFAULT false,
	"can_delete" boolean DEFAULT false,
	"can_export" boolean DEFAULT false,
	"can_manage" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "group_permissions_group_id_module_key" UNIQUE("group_id","module")
);
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"permissions" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_system" boolean DEFAULT false,
	"color" varchar(7) DEFAULT '#6366f1',
	"created_by" integer,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY,
	"invoice_id" integer,
	"product_id" integer,
	"quantity" integer,
	"unit_price" double precision,
	"discount_percent" double precision,
	"total_price" double precision,
	"description" varchar
);
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY,
	"invoice_number" varchar CONSTRAINT "invoices_invoice_number_key" UNIQUE,
	"customer_id" integer,
	"user_id" integer,
	"total_amount" double precision,
	"vat_amount" double precision,
	"discount_amount" double precision,
	"net_amount" double precision,
	"status" varchar,
	"created_at" timestamp,
	"due_date" varchar,
	"notes" varchar,
	"contact_id" integer,
	"rd_submission_id" varchar(255),
	"rd_status" varchar(50),
	"rd_submitted_at" timestamp with time zone,
	"rd_error_message" text,
	"issue_date" date,
	"quotation_id" integer
);
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY,
	"entry_date" date,
	"reference_no" varchar(50),
	"account_name" varchar(255),
	"description" text,
	"debit" numeric(15, 2) DEFAULT '0',
	"credit" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"receipt_url" text,
	"journal_type" varchar(20) DEFAULT 'general',
	"reference_type" varchar(50),
	"reference_id" integer,
	"debit_account_id" integer,
	"credit_account_id" integer,
	"amount" numeric(15, 2),
	"vat_rate" numeric(5, 2) DEFAULT '0',
	"vat_amount" numeric(15, 2) DEFAULT '0',
	"withholding_rate" numeric(5, 2) DEFAULT '0',
	"withholding_amount" numeric(15, 2) DEFAULT '0',
	"fiscal_year" integer,
	"fiscal_month" integer,
	"document_number" varchar(50),
	"notes" text
);
CREATE TABLE "payment_vouchers" (
	"id" serial PRIMARY KEY,
	"voucher_no" varchar(50),
	"issue_date" date,
	"payee_name" varchar(255),
	"amount" numeric(15, 2),
	"payment_method" varchar(100),
	"description" text,
	"status" varchar(50),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"receipt_url" text,
	"rd_submission_id" varchar(255),
	"rd_status" varchar(50),
	"rd_submitted_at" timestamp with time zone,
	"rd_error_message" text,
	"expense_id" integer,
	"vendor_id" integer
);
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY,
	"payment_number" varchar CONSTRAINT "payments_payment_number_key" UNIQUE,
	"invoice_id" integer,
	"customer_id" integer,
	"amount" double precision,
	"withholding_tax_amount" double precision,
	"net_amount" double precision,
	"payment_date" varchar,
	"payment_method" varchar,
	"reference_number" varchar,
	"receipt_number" varchar,
	"receipt_issued" boolean,
	"proof_of_payment_base64" varchar,
	"notes" varchar
);
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL CONSTRAINT "product_categories_name_key" UNIQUE,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "products" (
	"id" serial PRIMARY KEY,
	"sku" varchar CONSTRAINT "products_sku_key" UNIQUE,
	"name" varchar,
	"description" varchar,
	"price" double precision,
	"stock_qty" integer,
	"unit" varchar,
	"category_id" integer,
	"type" varchar DEFAULT 'physical',
	"sku_number" varchar(100) CONSTRAINT "products_sku_number_key" UNIQUE,
	"source_info" text,
	"storage_location" text,
	"product_notes" text,
	"stock_quantity" integer DEFAULT 0,
	"category_name" varchar(255),
	"cost_price" numeric(15, 2) DEFAULT '0'
);
CREATE TABLE "quotation_items" (
	"id" serial PRIMARY KEY,
	"quotation_id" integer,
	"product_id" integer,
	"quantity" integer,
	"unit_price" double precision,
	"discount_percent" double precision,
	"total_price" double precision,
	"description" varchar
);
CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY,
	"quotation_number" varchar CONSTRAINT "quotations_quotation_number_key" UNIQUE,
	"customer_id" integer,
	"user_id" integer,
	"total_amount" double precision,
	"vat_amount" double precision,
	"discount_amount" double precision,
	"net_amount" double precision,
	"status" varchar,
	"created_at" varchar,
	"expiry_date" varchar,
	"notes" varchar,
	"contact_id" integer
);
CREATE TABLE "receipts" (
	"id" serial PRIMARY KEY,
	"receipt_number" varchar CONSTRAINT "receipts_receipt_number_key" UNIQUE,
	"payment_id" integer,
	"customer_id" integer,
	"amount" double precision,
	"vat_amount" double precision,
	"withholding_tax_amount" double precision,
	"net_amount" double precision,
	"issued_date" varchar,
	"notes" varchar
);
CREATE TABLE "recurring_invoice_items" (
	"id" serial PRIMARY KEY,
	"recurring_invoice_id" integer,
	"product_id" integer,
	"quantity" integer,
	"unit_price" double precision,
	"discount_percent" double precision,
	"total_price" double precision,
	"description" varchar
);
CREATE TABLE "recurring_invoices" (
	"id" serial PRIMARY KEY,
	"customer_id" integer,
	"frequency" varchar,
	"start_date" varchar,
	"next_billing_date" varchar,
	"last_generated_date" varchar,
	"status" varchar,
	"total_amount" double precision,
	"vat_amount" double precision,
	"net_amount" double precision,
	"notes" varchar,
	"auto_send_email" boolean,
	"billing_day" integer,
	"due_day" integer DEFAULT 17,
	"wht_rate" numeric(5, 2) DEFAULT '3.00',
	"last_billed_at" timestamp
);
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY,
	"title" varchar(255) NOT NULL,
	"description" text,
	"due_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"type" varchar(50) DEFAULT 'manual',
	"related_id" integer,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "services" (
	"id" serial PRIMARY KEY,
	"service_code" varchar(50) NOT NULL CONSTRAINT "services_service_code_key" UNIQUE,
	"name" varchar(255) NOT NULL,
	"description" text,
	"service_type" varchar(50) DEFAULT 'service',
	"unit_price" numeric(15, 2) DEFAULT '0',
	"is_wht_applicable" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "user_groups" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL UNIQUE,
	"group_id" integer NOT NULL UNIQUE,
	"assigned_by" integer,
	"assigned_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "user_groups_user_id_group_id_key" UNIQUE("user_id","group_id")
);
CREATE TABLE "users" (
	"id" integer DEFAULT nextval('users_id_seq1'::regclass),
	"email" varchar(255) NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"password" varchar(255) NOT NULL,
	"name" varchar(255),
	"role" varchar(50) DEFAULT 'User',
	"status" varchar(20) DEFAULT 'Active',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"company_id" integer,
	"group_id" integer,
	CONSTRAINT "users_pkey1" PRIMARY KEY("id")
);
CREATE TABLE "users_backup_1773898881424" (
	"id" serial,
	"username" varchar CONSTRAINT "users_username_key" UNIQUE,
	"password_hash" varchar,
	"role" varchar,
	CONSTRAINT "users_pkey" PRIMARY KEY("id")
);
CREATE TABLE "wht_records" (
	"id" serial PRIMARY KEY,
	"ref_id" varchar,
	"ref_type" varchar,
	"payer" varchar,
	"payee" varchar,
	"payee_tax_id" varchar,
	"income_type" varchar,
	"income_description" varchar,
	"gross_amount" double precision,
	"wht_rate" double precision,
	"wht_amount" double precision,
	"net_amount" double precision,
	"payment_date" varchar,
	"submitted" boolean,
	"submit_period" varchar,
	"form_type" varchar,
	"notes" varchar
);
CREATE UNIQUE INDEX "accounts_code_key" ON "accounts" ("code");
CREATE UNIQUE INDEX "accounts_pkey" ON "accounts" ("id");
CREATE UNIQUE INDEX "activity_log_pkey" ON "activity_log" ("id");
CREATE UNIQUE INDEX "assets_asset_number_key" ON "assets" ("asset_number");
CREATE UNIQUE INDEX "assets_pkey" ON "assets" ("id");
CREATE UNIQUE INDEX "audit_logs_pkey" ON "audit_logs" ("id");
CREATE UNIQUE INDEX "bank_accounts_pkey" ON "bank_accounts" ("id");
CREATE UNIQUE INDEX "bookings_pkey" ON "bookings" ("id");
CREATE UNIQUE INDEX "categories_name_key" ON "categories" ("name");
CREATE UNIQUE INDEX "categories_pkey" ON "categories" ("id");
CREATE UNIQUE INDEX "chart_of_accounts_account_code_key" ON "chart_of_accounts" ("account_code");
CREATE UNIQUE INDEX "chart_of_accounts_pkey" ON "chart_of_accounts" ("id");
CREATE UNIQUE INDEX "companies_pkey" ON "companies" ("id");
CREATE UNIQUE INDEX "company_pkey" ON "company" ("id");
CREATE UNIQUE INDEX "company_module_settings_pkey" ON "company_module_settings" ("company_id","module_id");
CREATE UNIQUE INDEX "company_settings_pkey" ON "company_settings" ("id");
CREATE UNIQUE INDEX "contacts_pkey" ON "contacts" ("id");
CREATE UNIQUE INDEX "document_patterns_document_type_key" ON "document_patterns" ("document_type");
CREATE UNIQUE INDEX "document_patterns_pkey" ON "document_patterns" ("id");
CREATE UNIQUE INDEX "expenses_expense_number_key" ON "expenses" ("expense_number");
CREATE UNIQUE INDEX "expenses_pkey" ON "expenses" ("id");
CREATE INDEX "idx_expenses_category" ON "expenses" ("category");
CREATE INDEX "idx_expenses_date" ON "expenses" ("expense_date");
CREATE INDEX "idx_expenses_status" ON "expenses" ("status");
CREATE UNIQUE INDEX "group_permissions_group_id_module_key" ON "group_permissions" ("group_id","module");
CREATE UNIQUE INDEX "group_permissions_pkey" ON "group_permissions" ("id");
CREATE UNIQUE INDEX "groups_pkey" ON "groups" ("id");
CREATE INDEX "idx_groups_name" ON "groups" ("name");
CREATE UNIQUE INDEX "invoice_items_pkey" ON "invoice_items" ("id");
CREATE INDEX "idx_invoices_rd_submission" ON "invoices" ("rd_submission_id");
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices" ("invoice_number");
CREATE UNIQUE INDEX "invoices_pkey" ON "invoices" ("id");
CREATE INDEX "idx_journal_entries_credit_account_id" ON "journal_entries" ("credit_account_id");
CREATE INDEX "idx_journal_entries_debit_account_id" ON "journal_entries" ("debit_account_id");
CREATE INDEX "idx_journal_entries_document_number" ON "journal_entries" ("document_number");
CREATE INDEX "idx_journal_entries_fiscal_year_month" ON "journal_entries" ("fiscal_year","fiscal_month");
CREATE INDEX "idx_journal_entries_reference_type_id" ON "journal_entries" ("reference_type","reference_id");
CREATE INDEX "idx_journal_ref" ON "journal_entries" ("reference_type","reference_id");
CREATE INDEX "idx_journal_reference" ON "journal_entries" ("reference_type","reference_id");
CREATE UNIQUE INDEX "journal_entries_pkey" ON "journal_entries" ("id");
CREATE INDEX "idx_vouchers_expense" ON "payment_vouchers" ("expense_id");
CREATE INDEX "idx_vouchers_expense_id" ON "payment_vouchers" ("expense_id");
CREATE INDEX "idx_vouchers_rd_submission" ON "payment_vouchers" ("rd_submission_id");
CREATE INDEX "idx_vouchers_vendor_id" ON "payment_vouchers" ("vendor_id");
CREATE UNIQUE INDEX "payment_vouchers_pkey" ON "payment_vouchers" ("id");
CREATE INDEX "idx_payments_invoice" ON "payments" ("invoice_id");
CREATE INDEX "idx_payments_invoice_id" ON "payments" ("invoice_id");
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments" ("payment_number");
CREATE UNIQUE INDEX "payments_pkey" ON "payments" ("id");
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories" ("name");
CREATE UNIQUE INDEX "product_categories_pkey" ON "product_categories" ("id");
CREATE INDEX "idx_products_cost_price" ON "products" ("cost_price");
CREATE UNIQUE INDEX "products_pkey" ON "products" ("id");
CREATE UNIQUE INDEX "products_sku_key" ON "products" ("sku");
CREATE UNIQUE INDEX "products_sku_number_key" ON "products" ("sku_number");
CREATE UNIQUE INDEX "quotation_items_pkey" ON "quotation_items" ("id");
CREATE UNIQUE INDEX "quotations_pkey" ON "quotations" ("id");
CREATE UNIQUE INDEX "quotations_quotation_number_key" ON "quotations" ("quotation_number");
CREATE UNIQUE INDEX "receipts_pkey" ON "receipts" ("id");
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts" ("receipt_number");
CREATE UNIQUE INDEX "recurring_invoice_items_pkey" ON "recurring_invoice_items" ("id");
CREATE UNIQUE INDEX "recurring_invoices_pkey" ON "recurring_invoices" ("id");
CREATE UNIQUE INDEX "reminders_pkey" ON "reminders" ("id");
CREATE UNIQUE INDEX "services_pkey" ON "services" ("id");
CREATE UNIQUE INDEX "services_service_code_key" ON "services" ("service_code");
CREATE UNIQUE INDEX "user_groups_pkey" ON "user_groups" ("id");
CREATE UNIQUE INDEX "user_groups_user_id_group_id_key" ON "user_groups" ("user_id","group_id");
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "users_pkey1" ON "users" ("id");
CREATE UNIQUE INDEX "users_pkey" ON "users_backup_1773898881424" ("id");
CREATE UNIQUE INDEX "users_username_key" ON "users_backup_1773898881424" ("username");
CREATE UNIQUE INDEX "wht_records_pkey" ON "wht_records" ("id");
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_backup_1773898881424"("id");
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts"("id");
ALTER TABLE "company_module_settings" ADD CONSTRAINT "company_module_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;
ALTER TABLE "company_module_settings" ADD CONSTRAINT "company_module_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE;
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contacts"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_backup_1773898881424"("id");
ALTER TABLE "payment_vouchers" ADD CONSTRAINT "payment_vouchers_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id");
ALTER TABLE "payment_vouchers" ADD CONSTRAINT "payment_vouchers_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "contacts"("id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contacts"("id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id");
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contacts"("id");
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users_backup_1773898881424"("id");
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contacts"("id");
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id");
ALTER TABLE "recurring_invoice_items" ADD CONSTRAINT "recurring_invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");
ALTER TABLE "recurring_invoice_items" ADD CONSTRAINT "recurring_invoice_items_recurring_invoice_id_fkey" FOREIGN KEY ("recurring_invoice_id") REFERENCES "recurring_invoices"("id");
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contacts"("id");
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE;
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "fk_group" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL;