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
    // Cari angka terbesar dari ID PO yang ada
    let maxPoNum = 0;
    const dbPos = await db.select({ id: purchaseOrders.id }).from(purchaseOrders).catch(() => []);
    const allPoIds = [...dbPos.map(p => p.id), ...memoryStore.purchaseOrders.map(p => p.id)];
    const numPoIds = allPoIds.map(id => parseInt(id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    if (numPoIds.length > 0) maxPoNum = Math.max(...numPoIds);
    const nextPoNum = maxPoNum + 1;

    const id = `po-${nextPoNum}`;
    const poNumber = `PO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${nextPoNum.toString().padStart(3, '0')}`;
    
    // Find or create supplier
    let supplier = memoryStore.suppliers.find(s => s.name.toLowerCase() === body.supplierName.toLowerCase());
    let supplierId = supplier?.id;
    if (!supplierId) {
      let maxSupNum = 0;
      const dbSups = await db.select({ id: suppliers.id }).from(suppliers).catch(() => []);
      const allSupIds = [...dbSups.map(s => s.id), ...memoryStore.suppliers.map(s => s.id)];
      const numSupIds = allSupIds.map(id => parseInt(id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
      if (numSupIds.length > 0) maxSupNum = Math.max(...numSupIds);
      supplierId = `sup-${maxSupNum + 1}`;
    }

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
  })
  .patch('/po/:id/status', async ({ params, body }: { params: { id: string }, body: { status: string } }) => {
    const { id } = params;
    const { status } = body;

    const targetPo = memoryStore.purchaseOrders.find(p => p.id === id);
    if (targetPo) {
      targetPo.status = status;
    }

    try {
      await db.update(purchaseOrders)
        .set({ status })
        .where(eq(purchaseOrders.id, id));
    } catch (e: any) {
      console.warn('DB update PO status error:', e.message);
    }

    return {
      success: true,
      message: 'Status PO berhasil diperbarui',
      data: { id, status }
    };
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({ status: t.String() })
  });
