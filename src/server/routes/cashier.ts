import { Elysia, t } from 'elysia';
import { memoryStore } from '../db/store.js';

export const cashierRoutes = new Elysia({ prefix: '/cashier' })
  // Get all shift audit records
  .get('/shifts', () => {
    return {
      success: true,
      data: memoryStore.shifts
    };
  })

  // Shift Management: Clock-In (Kas Awal)
  .post('/shift/clock-in', ({ body }: { body: any }) => {
    const cashier = memoryStore.users.find(u => u.id === body.cashierId) || { name: 'Ahmad Kasir' };
    const newShift = {
      id: `shift-${Date.now()}`,
      userId: body.cashierId,
      cashierName: cashier.name,
      clockIn: new Date().toISOString(),
      clockOut: null,
      startingCash: Number(body.startingCash),
      salesCash: 0,
      expectedCash: Number(body.startingCash),
      actualCash: null,
      difference: null,
      notes: body.notes || 'Shift Aktif',
      status: 'open'
    };

    memoryStore.shifts.unshift(newShift);

    return {
      success: true,
      message: 'Clock-In Kasir Berhasil',
      data: newShift
    };
  }, {
    body: t.Object({
      cashierId: t.String(),
      startingCash: t.Number(),
      notes: t.Optional(t.String())
    })
  })

  // Shift Management: Clock-Out (Rekap Laci)
  .post('/shift/clock-out', ({ body }: { body: any }) => {
    const shift = memoryStore.shifts.find(s => s.id === body.shiftId) || memoryStore.shifts[0];
    const clockOutTime = new Date().toISOString();
    const startingCash = Number(body.startingCash ?? shift?.startingCash ?? 200000);
    const totalSalesCash = Number(body.totalSalesCash ?? shift?.salesCash ?? 0);
    const expectedCash = startingCash + totalSalesCash;
    const actualCash = Number(body.actualCash);
    const difference = actualCash - expectedCash;

    if (shift) {
      shift.clockOut = clockOutTime;
      shift.startingCash = startingCash;
      shift.salesCash = totalSalesCash;
      shift.expectedCash = expectedCash;
      shift.actualCash = actualCash;
      shift.difference = difference;
      shift.status = 'closed';
      if (body.notes) shift.notes = body.notes;
    }

    return {
      success: true,
      message: 'Clock-Out Kasir Berhasil',
      data: {
        shiftId: body.shiftId,
        clockOut: clockOutTime,
        startingCash,
        totalSalesCash,
        expectedCash,
        actualCash,
        difference,
        status: 'closed'
      }
    };
  }, {
    body: t.Object({
      shiftId: t.String(),
      startingCash: t.Optional(t.Number()),
      totalSalesCash: t.Optional(t.Number()),
      actualCash: t.Number(),
      notes: t.Optional(t.String())
    })
  })

  // Hold Cart
  .post('/cart/hold', ({ body }: { body: any }) => {
    return {
      success: true,
      message: 'Keranjang berhasil disimpan (Hold)',
      holdId: `hold-${Date.now()}`
    };
  }, {
    body: t.Object({
      label: t.String(),
      items: t.Array(t.Any()),
      memberId: t.Optional(t.String())
    })
  })

  // Checkout Transaction
  .post('/checkout', ({ body }: { body: any }) => {
    const invoiceNumber = `INV-${Date.now()}`;
    return {
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: {
        invoiceNumber,
        grandTotal: body.grandTotal,
        paidAmount: body.paidAmount,
        changeAmount: body.paidAmount - body.grandTotal,
        paymentMethod: body.paymentMethod,
        timestamp: new Date().toISOString(),
        items: body.items
      }
    };
  }, {
    body: t.Object({
      shiftId: t.String(),
      cashierId: t.String(),
      items: t.Array(t.Object({
        id: t.String(),
        name: t.String(),
        sellPrice: t.Number(),
        quantity: t.Number(),
        subtotal: t.Number()
      })),
      subtotal: t.Number(),
      discountTotal: t.Number(),
      grandTotal: t.Number(),
      paidAmount: t.Number(),
      paymentMethod: t.String(),
      memberId: t.Optional(t.String())
    })
  });
