import { pgTable, text, integer, numeric, timestamp, varchar, boolean, jsonb } from 'drizzle-orm/pg-core';

// 1. Users / Employees
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: varchar('role', { length: 20 }).notNull().default('cashier'), // 'admin' | 'cashier'
  pinCode: varchar('pin_code', { length: 6 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Cashier Shifts
export const cashierShifts = pgTable('cashier_shifts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  clockIn: timestamp('clock_in').defaultNow().notNull(),
  clockOut: timestamp('clock_out'),
  startingCash: numeric('starting_cash', { precision: 12, scale: 2 }).notNull(),
  expectedCash: numeric('expected_cash', { precision: 12, scale: 2 }),
  actualCash: numeric('actual_cash', { precision: 12, scale: 2 }),
  notes: text('notes'),
  status: varchar('status', { length: 20 }).notNull().default('open'), // 'open' | 'closed'
});

// 3. Categories & Master Products
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  barcode: varchar('barcode', { length: 100 }).notNull().unique(),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull(),
  sellPrice: numeric('sell_price', { precision: 12, scale: 2 }).notNull(),
  stock: integer('stock').notNull().default(0),
  unit: varchar('unit', { length: 20 }).notNull().default('pcs'),
  imageUrl: text('image_url'),
  minStockAlert: integer('min_stock_alert').notNull().default(5),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Suppliers & Purchase Orders (PO)
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: text('id').primaryKey(),
  poNumber: varchar('po_number', { length: 50 }).notNull().unique(),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'received' | 'cancelled'
  notes: text('notes'),
  items: jsonb('items').notNull(), // Array of { productId, qty, costPrice }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Stock Opname & Adjustment
export const stockAdjustments = pgTable('stock_adjustments', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  adjustmentQty: integer('adjustment_qty').notNull(), // positive or negative
  reason: varchar('reason', { length: 50 }).notNull(), // 'damaged' | 'expired' | 'lost' | 'audit_correction'
  notes: text('notes'),
  adjustedBy: text('adjusted_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Members & Points
export const members = pgTable('members', {
  id: text('id').primaryKey(),
  memberCode: varchar('member_code', { length: 50 }).notNull().unique(),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 30 }).notNull().unique(),
  points: integer('points').notNull().default(0),
  tier: varchar('tier', { length: 20 }).notNull().default('bronze'), // 'bronze' | 'silver' | 'gold'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Promos & Discounts
export const promos = pgTable('promos', {
  id: text('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  title: text('title').notNull(),
  discountType: varchar('discount_type', { length: 20 }).notNull(), // 'percentage' | 'fixed'
  discountValue: numeric('discount_value', { precision: 12, scale: 2 }).notNull(),
  minPurchase: numeric('min_purchase', { precision: 12, scale: 2 }).default('0'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

// 8. Transactions & Cart Hold
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  cashierId: text('cashier_id').notNull().references(() => users.id),
  shiftId: text('shift_id').references(() => cashierShifts.id),
  memberId: text('member_id').references(() => members.id),
  promoId: text('promo_id').references(() => promos.id),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  discountTotal: numeric('discount_total', { precision: 12, scale: 2 }).notNull().default('0'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull(),
  changeAmount: numeric('change_amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull().default('cash'), // 'cash' | 'qris' | 'debit'
  earnedPoints: integer('earned_points').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactionItems = pgTable('transaction_items', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id),
  productId: text('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).notNull(),
  sellPrice: numeric('sell_price', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
});

export const heldCarts = pgTable('held_carts', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  cashierId: text('cashier_id').notNull().references(() => users.id),
  cartData: jsonb('cart_data').notNull(), // items, member, promo
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
