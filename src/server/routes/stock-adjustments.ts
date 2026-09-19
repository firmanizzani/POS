import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { stockAdjustments, products, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { memoryStore } from '../db/store.js';

export const stockAdjustmentRoutes = new Elysia({ prefix: '/stock-adjustments' })
  .get('/', async () => {
    try {
      const list = await db.select({
        id: stockAdjustments.id,
        productId: stockAdjustments.productId,
        productName: products.name,
        adjustmentQty: stockAdjustments.adjustmentQty,
        reason: stockAdjustments.reason,
        notes: stockAdjustments.notes,
        adjustedBy: users.name,
        createdAt: stockAdjustments.createdAt
      })
      .from(stockAdjustments)
      .leftJoin(products, eq(stockAdjustments.productId, products.id))
      .leftJoin(users, eq(stockAdjustments.adjustedBy, users.id));

      if (list.length > 0) {
        return {
          success: true,
          data: list.map(a => ({
            id: a.id,
            productName: a.productName || 'Produk',
            reason: a.reason,
            qtyDiff: a.adjustmentQty,
            adjustedBy: a.adjustedBy || 'Admin',
            date: new Date(a.createdAt).toISOString().slice(0, 10)
          }))
        };
      }
    } catch (e: any) {
      console.warn('DB stock adjustments error, fallback to memoryStore:', e.message);
    }

    const prodMap = new Map(memoryStore.products.map(p => [p.id, p.name]));
    const userMap = new Map(memoryStore.users.map(u => [u.id, u.name]));

    const data = memoryStore.stockAdjustments.map(a => ({
      id: a.id,
      productName: prodMap.get(a.productId) || memoryStore.products.find(p => p.name.toLowerCase().includes(a.productId.toLowerCase()))?.name || a.productId,
      reason: a.reason,
      qtyDiff: a.adjustmentQty,
      adjustedBy: userMap.get(a.adjustedBy) || 'Admin',
      date: new Date(a.createdAt).toISOString().slice(0, 10)
    }));

    return { success: true, data };
  })
  .post('/', async ({ body }: { body: any }) => {
    // Sequential ID +1
    let maxAdjNum = 0;
    const dbAdjs = await db.select({ id: stockAdjustments.id }).from(stockAdjustments).catch(() => []);
    const allAdjIds = [...dbAdjs.map(a => a.id), ...memoryStore.stockAdjustments.map(a => a.id)];
    const numAdjIds = allAdjIds.map(id => parseInt(id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    if (numAdjIds.length > 0) maxAdjNum = Math.max(...numAdjIds);
    const nextAdjNum = maxAdjNum + 1;
    const id = `adj-${nextAdjNum}`;

    // Match product by name (case-insensitive partial match)
    const product = memoryStore.products.find(p =>
      p.name.toLowerCase().includes(body.productName.toLowerCase())
    );
    const productId = product?.id || memoryStore.products[0]?.id || 'prod-101';

    // Validate reason
    const VALID_REASONS = ['DAMAGED', 'EXPIRED', 'LOST', 'AUDIT_CORRECTION'];
    const reason = VALID_REASONS.includes(body.reason?.toUpperCase())
      ? body.reason.toUpperCase()
      : 'DAMAGED';

    const newAdj = {
      id,
      productId,
      adjustmentQty: Number(body.qtyDiff),
      reason,
      notes: body.notes || '',
      adjustedBy: 'user-admin-1',
      createdAt: new Date()
    };

    try {
      await db.insert(stockAdjustments).values(newAdj);
    } catch (e: any) {
      console.warn('DB insert stock adjustment error:', e.message);
    }

    memoryStore.stockAdjustments.unshift(newAdj);

    // Update product stock in memoryStore
    if (product) {
      product.stock = Math.max(0, product.stock + Number(body.qtyDiff));
    }

    // Update product stock in DB
    try {
      if (product?.id) {
        const dbProd = await db.select({ stock: products.stock }).from(products).where(eq(products.id, product.id));
        if (dbProd.length > 0) {
          const newStock = Math.max(0, dbProd[0].stock + Number(body.qtyDiff));
          await db.update(products).set({ stock: newStock }).where(eq(products.id, product.id));
        }
      }
    } catch (e: any) {
      console.warn('DB update product stock error:', e.message);
    }

    return {
      success: true,
      message: 'Penyesuaian stok berhasil disimpan',
      data: {
        id,
        productName: product?.name || body.productName,
        reason,
        qtyDiff: Number(body.qtyDiff),
        adjustedBy: 'Admin',
        date: newPODateString(newAdj.createdAt)
      }
    };
  }, {
    body: t.Object({
      productName: t.String(),
      reason: t.String(),
      qtyDiff: t.Number(),
      notes: t.Optional(t.String())
    })
  });

function newPODateString(date: Date) {
  return date.toISOString().slice(0, 10);
}
