import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { stockAdjustments, products, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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
    } catch (e: any) {
      console.error('DB stock adjustments error:', e.message);
      return { success: false, message: 'Gagal mengambil penyesuaian stok: ' + e.message, data: [] };
    }
  })
  .post('/', async ({ body }: { body: any }) => {
    let maxAdjNum = 0;
    const dbAdjs = await db.select({ id: stockAdjustments.id }).from(stockAdjustments).catch(() => []);
    const numAdjIds = dbAdjs.map(a => parseInt(a.id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    if (numAdjIds.length > 0) maxAdjNum = Math.max(...numAdjIds);
    const nextAdjNum = maxAdjNum + 1;
    const id = `adj-${nextAdjNum}`;

    const dbProds = await db.select().from(products).catch(() => []);
    const product = dbProds.find(p => p.name.toLowerCase().includes(body.productName.toLowerCase()));
    const productId = product?.id || dbProds[0]?.id || 'prod-101';

    const VALID_REASONS = ['DAMAGED', 'EXPIRED', 'LOST', 'AUDIT_CORRECTION'];
    const reason = VALID_REASONS.includes(body.reason?.toUpperCase())
      ? body.reason.toUpperCase()
      : 'DAMAGED';

    const dbUsers = await db.select({ id: users.id }).from(users).catch(() => []);
    const adminUser = dbUsers.find(u => u.role === 'admin') || dbUsers[0];
    const userId = adminUser?.id || 'user-admin-1';

    const newAdj = {
      id,
      productId,
      adjustmentQty: Number(body.qtyDiff),
      reason,
      notes: body.notes || '',
      adjustedBy: userId,
      createdAt: new Date()
    };

    try {
      await db.insert(stockAdjustments).values(newAdj);
      if (product?.id) {
        const newStock = Math.max(0, product.stock + Number(body.qtyDiff));
        await db.update(products).set({ stock: newStock }).where(eq(products.id, product.id));
      }
      return {
        success: true,
        message: 'Penyesuaian stok berhasil disimpan',
        data: {
          id,
          productName: product?.name || body.productName,
          reason,
          qtyDiff: Number(body.qtyDiff),
          adjustedBy: adminUser?.name || 'Admin',
          date: newAdj.createdAt.toISOString().slice(0, 10)
        }
      };
    } catch (e: any) {
      console.error('DB insert stock adjustment error:', e.message);
      return { success: false, message: 'Gagal menyimpan penyesuaian stok: ' + e.message };
    }
  }, {
    body: t.Object({
      productName: t.String(),
      reason: t.String(),
      qtyDiff: t.Number(),
      notes: t.Optional(t.String())
    })
  });
