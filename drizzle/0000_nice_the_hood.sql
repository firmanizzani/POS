CREATE TABLE "cashier_shifts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"clock_in" timestamp DEFAULT now() NOT NULL,
	"clock_out" timestamp,
	"starting_cash" numeric(12, 2) NOT NULL,
	"expected_cash" numeric(12, 2),
	"actual_cash" numeric(12, 2),
	"notes" text,
	"status" varchar(20) DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "held_carts" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"cashier_id" text NOT NULL,
	"cart_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"member_code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"phone" varchar(30) NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"tier" varchar(20) DEFAULT 'bronze' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "members_member_code_unique" UNIQUE("member_code"),
	CONSTRAINT "members_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"barcode" varchar(100) NOT NULL,
	"sku" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"category_id" text,
	"cost_price" numeric(12, 2) NOT NULL,
	"sell_price" numeric(12, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"unit" varchar(20) DEFAULT 'pcs' NOT NULL,
	"image_url" text,
	"min_stock_alert" integer DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_barcode_unique" UNIQUE("barcode"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "promos" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(12, 2) NOT NULL,
	"min_purchase" numeric(12, 2) DEFAULT '0',
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "promos_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"supplier_id" text NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"items" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "stock_adjustments" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"adjustment_qty" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"notes" text,
	"adjusted_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text
);
--> statement-breakpoint
CREATE TABLE "transaction_items" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"cost_price" numeric(12, 2) NOT NULL,
	"sell_price" numeric(12, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"cashier_id" text NOT NULL,
	"shift_id" text,
	"member_id" text,
	"promo_id" text,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) NOT NULL,
	"change_amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(20) DEFAULT 'cash' NOT NULL,
	"earned_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" varchar(20) DEFAULT 'cashier' NOT NULL,
	"pin_code" varchar(6),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cashier_shifts" ADD CONSTRAINT "cashier_shifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "held_carts" ADD CONSTRAINT "held_carts_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_adjusted_by_users_id_fk" FOREIGN KEY ("adjusted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_shift_id_cashier_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."cashier_shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_promo_id_promos_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id") ON DELETE no action ON UPDATE no action;