import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { suppliers, purchaseOrders } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { memoryStore } from '../db/store.js';

export const supplierRoutes = new Elysia({ prefix: '/suppliers' })
  .get('/', async () => {
    try {
      const data = await db.select().from(suppliers);
      if (data.length > 0) return { success: true, data };
    } catch (e: any) {
      console.warn('DB suppliers error, using memoryStore:', e.message);
    }
    return { success: true, data: memoryStore.suppliers };
  })
  .get('/po', async () => {
    try {
      const pos = await db.select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        supplierId: purchaseOrders.supplierId,
        supplierName: suppliers.name,
        totalAmount: purchaseOrders.totalAmount,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        createdAt: purchaseOrders.createdAt
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id));

      if (pos.length > 0) {
        return {
          success: true,
          data: pos.map(p => ({
            ...p,
            totalAmount: Number(p.totalAmount),
            date: new Date(p.createdAt).toISOString().slice(0, 10)
          }))
        };
      }
    } catch (e: any) {
      console.warn('DB PO error, using memoryStore:', e.message);
    }

    const supMap = new Map(memoryStore.suppliers.map(s => [s.id, s.name]));
    const data = memoryStore.purchaseOrders.map(p => ({
      ...p,
      supplierName: supMap.get(p.supplierId) || 'Supplier Grosir',
      totalAmount: Number(p.totalAmount),
      date: new Date(p.createdAt).toISOString().slice(0, 10)
    }));

    return { success: true, data };
  })
  .post('/po', async ({ body }: { body: any }) => {
    const id = `po-${Date.now()}`;
    const poNumber = `PO-${new Date().toISOString().slice(0, 7).replace('-', '')}-00${memoryStore.purchaseOrders.length + 1}`;
    
    // Find or create supplier
    let supplier = memoryStore.suppliers.find(s => s.name.toLowerCase() === body.supplierName.toLowerCase());
    let supplierId = supplier?.id || `sup-${Date.now()}`;
    if (!supplier) {
      supplier = { id: supplierId, name: body.supplierName, phone: '', email: '', address: '' };
      memoryStore.suppliers.push(supplier);
      try {
        await db.insert(suppliers).values(supplier).onConflictDoNothing();
      } catch (e) {}
    }

    const newPO = {
      id,
      poNumber,
      supplierId,
      totalAmount: body.totalAmount.toString(),
      status: 'PENDING',
      notes: body.notes || '',
      items: body.items || [],
      createdAt: new Date()
    };

    try {
      await db.insert(purchaseOrders).values(newPO);
    } catch (e: any) {
      console.warn('DB insert PO error, saved to memoryStore:', e.message);
    }

    memoryStore.purchaseOrders.unshift(newPO);

    return {
      success: true,
      message: 'PO berhasil dibuat',
      data: {
        ...newPO,
        supplierName: body.supplierName,
        totalAmount: Number(newPO.totalAmount),
        date: newPO.createdAt.toISOString().slice(0, 10)
      }
    };
  }, {
    body: t.Object({
      supplierName: t.String(),
      totalAmount: t.Number(),
      notes: t.Optional(t.String()),
      items: t.Optional(t.Array(t.Any()))
    })
  });
