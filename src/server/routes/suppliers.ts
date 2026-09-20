import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { suppliers, purchaseOrders } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const supplierRoutes = new Elysia({ prefix: '/suppliers' })
  .get('/', async () => {
    try {
      const data = await db.select().from(suppliers);
      return { success: true, data };
    } catch (e: any) {
      console.error('DB suppliers error:', e.message);
      return { success: false, message: 'Gagal mengambil supplier: ' + e.message, data: [] };
    }
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

      return {
        success: true,
        data: pos.map(p => ({
          ...p,
          totalAmount: Number(p.totalAmount),
          date: new Date(p.createdAt).toISOString().slice(0, 10)
        }))
      };
    } catch (e: any) {
      console.error('DB PO error:', e.message);
      return { success: false, message: 'Gagal mengambil PO: ' + e.message, data: [] };
    }
  })
  .post('/po', async ({ body }: { body: any }) => {
    let maxPoNum = 0;
    const dbPos = await db.select({ id: purchaseOrders.id }).from(purchaseOrders).catch(() => []);
    const numPoIds = dbPos.map(p => parseInt(p.id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
    if (numPoIds.length > 0) maxPoNum = Math.max(...numPoIds);
    const nextPoNum = maxPoNum + 1;

    const id = `po-${nextPoNum}`;
    const poNumber = `PO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${nextPoNum.toString().padStart(3, '0')}`;
    
    let supplierId: string | undefined = undefined;
    const existingSups = await db.select().from(suppliers).catch(() => []);
    let supplier = existingSups.find(s => s.name.toLowerCase() === body.supplierName.toLowerCase());

    if (!supplier) {
      let maxSupNum = 0;
      const numSupIds = existingSups.map(s => parseInt(s.id.replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n));
      if (numSupIds.length > 0) maxSupNum = Math.max(...numSupIds);
      supplierId = `sup-${maxSupNum + 1}`;

      const newSup = { id: supplierId, name: body.supplierName, phone: '', email: '', address: '' };
      try {
        await db.insert(suppliers).values(newSup);
      } catch (e) {}
    } else {
      supplierId = supplier.id;
    }

    const newPO = {
      id,
      poNumber,
      supplierId: supplierId || 'sup-1',
      totalAmount: body.totalAmount.toString(),
      status: 'PENDING',
      notes: body.notes || '',
      items: body.items || [],
      createdAt: new Date()
    };

    try {
      await db.insert(purchaseOrders).values(newPO);
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
    } catch (e: any) {
      console.error('DB insert PO error:', e.message);
      return { success: false, message: 'Gagal membuat PO: ' + e.message };
    }
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

    try {
      await db.update(purchaseOrders)
        .set({ status })
        .where(eq(purchaseOrders.id, id));

      return {
        success: true,
        message: 'Status PO berhasil diperbarui',
        data: { id, status }
      };
    } catch (e: any) {
      console.error('DB update PO status error:', e.message);
      return { success: false, message: 'Gagal memperbarui status PO: ' + e.message };
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({ status: t.String() })
  });
