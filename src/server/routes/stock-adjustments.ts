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
    const id = `adj-${Date.now()}`;
    const product = memoryStore.products.find(p => p.name.toLowerCase().includes(body.productName.toLowerCase()));
    const productId = product?.id || memoryStore.products[0]?.id || 'prod-101';

    const newAdj = {
      id,
      productId,
      adjustmentQty: Number(body.qtyDiff),
      reason: body.reason,
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

    // Also update product stock
    if (product) {
      product.stock = Math.max(0, product.stock + Number(body.qtyDiff));
    }

    return {
      success: true,
      message: 'Penyesuaian stok berhasil disimpan',
      data: {
        id,
        productName: body.productName,
        reason: body.reason,
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
